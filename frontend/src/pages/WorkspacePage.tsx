import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  ExternalLink,
  Eye,
  Link as LinkIcon,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  X,
} from 'lucide-react'

type WorkspaceStatus = 'todo' | 'in_progress' | 'waiting' | 'ready' | 'completed' | 'blocked'
type WorkspaceSourceType = 'workflow_generated' | 'manual'
type WorkspaceTab = 'today' | 'upcoming' | 'ready' | 'blocked' | 'completed' | 'all'
type WorkspaceGroupBy = 'client' | 'date' | 'source' | 'status'

type WorkspaceTask = {
  id: string
  title: string
  description?: string | null
  client_id?: string | null
  client_name?: string | null
  category?: string | null
  status: WorkspaceStatus
  priority?: string | null
  due_date?: string | null
  source_type: WorkspaceSourceType
  source_workflow_run_id?: string | null
  source_engine_name?: string | null
  source_plan_type?: string | null
  related_content_plan_id?: string | null
  related_content_plan_item_id?: string | null
  planned_action_id?: string | null
  planned_topic?: string | null
  planned_content_format?: string | null
  planned_platforms?: string[]
  planned_publish_date?: string | null
  content_objective?: string | null
  generated_script?: string | null
  generated_caption?: string | null
  plan_context?: Record<string, unknown>
  completed_by_user_id?: string | null
  completed_at?: string | null
  last_updated_by_user_id?: string | null
  raw_file_url?: string | null
  edited_file_url?: string | null
  drive_folder_url?: string | null
  published_post_url?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  checklist: WorkspaceChecklistItem[]
  comments: WorkspaceComment[]
  attachments: WorkspaceAttachment[]
  activity: WorkspaceActivity[]
}

type WorkspaceChecklistItem = {
  id: string
  task_id: string
  title: string
  sort_order: number
  step_type: string
  is_required: boolean
  is_completed: boolean
  completed_by_user_id?: string | null
  completed_at?: string | null
  notes?: string | null
  attachment_url?: string | null
}

type WorkspaceComment = {
  id: string
  task_id: string
  body: string
  author_user_id: string
  created_at: string
}

type WorkspaceAttachment = {
  id: string
  task_id: string
  link_type: string
  label: string
  url: string
  added_by_user_id: string
  created_at: string
}

type WorkspaceActivity = {
  id: string
  task_id: string
  actor_user_id: string
  action: string
  message: string
  created_at: string
}

type DashboardSummary = {
  totalToday: number
  completedToday: number
  ready: number
  blocked: number
  overdue: number
}

type WorkspaceFilters = {
  client: string
  status: string
  category: string
  sourceType: string
  platform: string
  dueDate: string
}

type ManualTaskInput = {
  title: string
  description: string
  client_name: string
  category: string
  priority: string
  due_date: string
  platform: string
  notes: string
}

type AttachmentInput = {
  link_type: string
  label: string
  url: string
}

type ChecklistPatch = {
  is_completed?: boolean
  notes?: string
  attachment_url?: string
}

const currentUserId = 'internal_preview_user'
const storageKey = 'vip-team-workspace-mvp'
const workspaceAccessDeniedMessage = 'You are signed in, but you do not have access to the Team Workspace. Ask an admin to add your email to workspace team members.'

const statusOptions: Array<{ value: WorkspaceStatus; label: string }> = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
]

const tabs: Array<{ value: WorkspaceTab; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ready', label: 'Ready to Publish' },
  { value: 'blocked', label: 'Blocked / Waiting' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All Tasks' },
]

const groupOptions: Array<{ value: WorkspaceGroupBy; label: string }> = [
  { value: 'client', label: 'Client' },
  { value: 'date', label: 'Planned date' },
  { value: 'source', label: 'Source plan' },
  { value: 'status', label: 'Status' },
]

const attachmentTypes = [
  'raw_video',
  'edited_video',
  'final_drive',
  'thumbnail',
  'instagram_post',
  'facebook_post',
  'youtube',
  'blog',
  'other',
]

const initialFilters: WorkspaceFilters = {
  client: '',
  status: '',
  category: '',
  sourceType: '',
  platform: '',
  dueDate: '',
}

export function WorkspacePage({ session }: { session: Session | null }) {
  const [tasks, setTasks] = useState<WorkspaceTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<WorkspaceFilters>(initialFilters)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('today')
  const [groupBy, setGroupBy] = useState<WorkspaceGroupBy>('client')
  const [apiMode, setApiMode] = useState<'api' | 'local'>('api')
  const [loadError, setLoadError] = useState('')
  const accessToken = session?.access_token || ''

  useEffect(() => {
    async function loadWorkspace() {
      setLoading(true)
      try {
        if (!accessToken && !import.meta.env.DEV) {
          throw new Error('Workspace session is missing. Sign in again to load API data.')
        }
        const response = await fetch('/api/workspace/tasks', {
          headers: workspaceAuthHeaders(accessToken),
        })
        if (response.status === 403) throw new Error(workspaceAccessDeniedMessage)
        if (!response.ok) throw new Error('Workspace API unavailable')
        const payload = await response.json() as { tasks: WorkspaceTask[] }
        setTasks(normalizeTasks(payload.tasks || []))
        setApiMode('api')
        setLoadError('')
      } catch (error) {
        if (import.meta.env.DEV) {
          setTasks(readLocalTasks())
          setApiMode('local')
          setLoadError('')
        } else {
          setTasks([])
          setApiMode('api')
          setLoadError(error instanceof Error ? error.message : 'Workspace API is unavailable. Ask an admin to check the production API configuration.')
        }
      } finally {
        setLoading(false)
      }
    }

    void loadWorkspace()
  }, [accessToken])

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null
  const filterOptions = useMemo(() => buildFilterOptions(tasks), [tasks])
  const summary = useMemo(() => buildSummary(tasks), [tasks])
  const visibleTasks = useMemo(() => filterTasks(tasks, filters, query, activeTab), [tasks, filters, query, activeTab])
  const groupedTasks = useMemo(() => groupTasks(visibleTasks, groupBy), [visibleTasks, groupBy])
  const tabCounts = useMemo(() => buildTabCounts(tasks), [tasks])

  async function createManualTask(input: ManualTaskInput) {
    const created = await workspaceRequest<{ task: WorkspaceTask }>('/api/workspace/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...input, source_type: 'manual' }),
    }, accessToken, () => {
      const now = new Date().toISOString()
      return {
        task: {
          id: crypto.randomUUID(),
          title: input.title,
          description: input.description,
          client_name: input.client_name,
          category: input.category,
          status: 'todo',
          priority: input.priority,
          due_date: input.due_date,
          source_type: 'manual',
          planned_platforms: input.platform ? [input.platform] : [],
          notes: input.notes,
          created_at: now,
          updated_at: now,
          checklist: [],
          comments: [],
          attachments: [],
          activity: [activity('Task created manually', 'task_created')],
        },
      }
    })
    const next = [normalizeTask(created.task), ...tasks]
    setTasks(next)
    writeLocalTasks(next)
    setShowCreate(false)
    setSelectedTaskId(created.task.id)
  }

  async function updateStatus(taskId: string, status: WorkspaceStatus) {
    const updated = await workspaceRequest<{ task: WorkspaceTask }>(`/api/workspace/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, current_user_id: currentUserId }),
    }, accessToken, () => {
      const now = new Date().toISOString()
      const task = tasks.find((item) => item.id === taskId)
      if (!task) throw new Error('Task not found')
      return {
        task: {
          ...task,
          status,
          updated_at: now,
          last_updated_by_user_id: currentUserId,
          completed_by_user_id: status === 'completed' ? currentUserId : task.completed_by_user_id,
          completed_at: status === 'completed' ? now : task.completed_at,
          activity: [activity(`Status changed to ${labelForStatus(status)}`, 'status_changed'), ...task.activity],
        },
      }
    })
    replaceTask(updated.task)
  }

  async function updateChecklistItem(taskId: string, item: WorkspaceChecklistItem, patch: ChecklistPatch) {
    const nextCompleted = patch.is_completed ?? item.is_completed
    const updated = await workspaceRequest<{ item: WorkspaceChecklistItem; activity?: WorkspaceActivity }>(
      `/api/workspace/tasks/${taskId}/checklist/${item.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          is_completed: nextCompleted,
          notes: patch.notes ?? item.notes,
          attachment_url: patch.attachment_url ?? item.attachment_url,
          current_user_id: currentUserId,
        }),
      },
      accessToken,
      () => ({
        item: {
          ...item,
          ...patch,
          is_completed: nextCompleted,
          completed_by_user_id: nextCompleted ? currentUserId : null,
          completed_at: nextCompleted ? new Date().toISOString() : null,
        },
        activity: activity(`${item.title} ${nextCompleted ? 'completed' : 'updated'}`, 'checklist_updated'),
      }),
    )
    setTasks((current) => {
      const next = current.map((task) => {
        if (task.id !== taskId) return task
        return {
          ...task,
          updated_at: new Date().toISOString(),
          checklist: task.checklist.map((check) => check.id === item.id ? updated.item : check),
          activity: updated.activity ? [updated.activity, ...task.activity] : task.activity,
        }
      })
      writeLocalTasks(next)
      return next
    })
  }

  async function addComment(taskId: string, body: string) {
    const result = await workspaceRequest<{ comment: WorkspaceComment; activity?: WorkspaceActivity }>(
      `/api/workspace/tasks/${taskId}/comments`,
      { method: 'POST', body: JSON.stringify({ body, current_user_id: currentUserId }) },
      accessToken,
      () => ({
        comment: { id: crypto.randomUUID(), task_id: taskId, body, author_user_id: currentUserId, created_at: new Date().toISOString() },
        activity: activity('Comment added', 'comment_added'),
      }),
    )
    setTasks((current) => {
      const next = current.map((task) => task.id === taskId ? {
        ...task,
        comments: [result.comment, ...task.comments],
        activity: result.activity ? [result.activity, ...task.activity] : task.activity,
      } : task)
      writeLocalTasks(next)
      return next
    })
  }

  async function addAttachment(taskId: string, input: AttachmentInput) {
    const result = await workspaceRequest<{ attachment: WorkspaceAttachment; task?: WorkspaceTask; activity?: WorkspaceActivity }>(
      `/api/workspace/tasks/${taskId}/attachments`,
      { method: 'POST', body: JSON.stringify({ ...input, current_user_id: currentUserId }) },
      accessToken,
      () => ({
        attachment: {
          id: crypto.randomUUID(),
          task_id: taskId,
          link_type: input.link_type,
          label: input.label,
          url: input.url,
          added_by_user_id: currentUserId,
          created_at: new Date().toISOString(),
        },
        activity: activity(`${input.label} link added`, 'attachment_added'),
      }),
    )
    setTasks((current) => {
      const next = current.map((task) => {
        if (task.id !== taskId) return task
        return {
          ...normalizeTask(result.task || task),
          attachments: [result.attachment, ...task.attachments],
          activity: result.activity ? [result.activity, ...task.activity] : task.activity,
        }
      })
      writeLocalTasks(next)
      return next
    })
  }

  function replaceTask(task: WorkspaceTask) {
    setTasks((current) => {
      const next = current.map((item) => item.id === task.id ? normalizeTask(task) : item)
      writeLocalTasks(next)
      return next
    })
  }

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Team Workspace</p>
          <h1>Daily execution board</h1>
        </div>
        <button className="workspace-primary-button" type="button" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          New task
        </button>
      </div>

      {apiMode === 'local' && (
        <div className="workspace-notice">
          <AlertTriangle size={16} />
          Local preview is using browser storage because the workspace API is not available.
        </div>
      )}

      {loadError && (
        <div className="workspace-notice workspace-notice--error">
          <AlertTriangle size={16} />
          {loadError}
        </div>
      )}

      <DashboardCards summary={summary} />

      <div className="workspace-tabs" role="tablist" aria-label="Workspace task sections">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.value}
            className={activeTab === tab.value ? 'workspace-tab workspace-tab--active' : 'workspace-tab'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
            <span>{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      <div className="workspace-toolbar">
        <label className="workspace-search">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client, topic, title, platform, category" />
        </label>
        <FilterSelect label="Client" value={filters.client} options={filterOptions.clients} onChange={(value) => setFilters({ ...filters, client: value })} />
        <FilterSelect label="Status" value={filters.status} options={statusOptions.map((item) => item.value)} onChange={(value) => setFilters({ ...filters, status: value })} format={labelForStatus} />
        <FilterSelect label="Category" value={filters.category} options={filterOptions.categories} onChange={(value) => setFilters({ ...filters, category: value })} />
        <FilterSelect label="Source" value={filters.sourceType} options={filterOptions.sources} onChange={(value) => setFilters({ ...filters, sourceType: value })} format={sourceLabelFromFilter} />
        <FilterSelect label="Platform" value={filters.platform} options={filterOptions.platforms} onChange={(value) => setFilters({ ...filters, platform: value })} />
        <FilterSelect label="Group by" value={groupBy} options={groupOptions.map((option) => option.value)} onChange={(value) => setGroupBy(value as WorkspaceGroupBy)} format={(value) => groupOptions.find((option) => option.value === value)?.label || humanize(value)} />
        <label className="workspace-filter">
          <span>Due date</span>
          <input type="date" value={filters.dueDate} onChange={(event) => setFilters({ ...filters, dueDate: event.target.value })} />
        </label>
      </div>

      <div className="workspace-task-list">
        {loading ? (
          <div className="workspace-empty">Loading workspace tasks...</div>
        ) : visibleTasks.length === 0 ? (
          <EmptyState tab={activeTab} onCreate={() => setShowCreate(true)} />
        ) : groupedTasks.map((group) => (
          <section className="workspace-task-group" key={group.label}>
            <div className="workspace-task-group-header">
              <h2>{group.label}</h2>
              <span>{group.tasks.length} tasks</span>
            </div>
            <div className="workspace-task-group-list">
              {group.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpen={() => setSelectedTaskId(task.id)}
                  onStatusChange={(status) => updateStatus(task.id, status)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onStatusChange={(status) => updateStatus(selectedTask.id, status)}
          onChecklistUpdate={(item, patch) => updateChecklistItem(selectedTask.id, item, patch)}
          onComment={(body) => addComment(selectedTask.id, body)}
          onAttachment={(input) => addAttachment(selectedTask.id, input)}
        />
      )}

      {showCreate && <ManualTaskModal onClose={() => setShowCreate(false)} onCreate={createManualTask} />}
    </section>
  )
}

function DashboardCards({ summary }: { summary: DashboardSummary }) {
  const cards = [
    ['Tasks planned today', summary.totalToday, CalendarDays],
    ['Completed today', summary.completedToday, Check],
    ['Ready to publish', summary.ready, CheckCircle2],
    ['Blocked', summary.blocked, AlertTriangle],
    ['Overdue', summary.overdue, Clock3],
  ] as const

  return (
    <div className="workspace-summary-grid">
      {cards.map(([label, value, Icon]) => (
        <div className="workspace-summary-card" key={label}>
          <Icon size={18} />
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}

function TaskCard({ task, onOpen, onStatusChange }: { task: WorkspaceTask; onOpen: () => void; onStatusChange: (status: WorkspaceStatus) => void }) {
  const progress = checklistProgress(task)
  const source = sourceLabel(task)

  return (
    <article className="workspace-task-card">
      <div className="workspace-task-main">
        <div className="workspace-card-title-row">
          <span className={`workspace-source-label workspace-source-label--${source.key}`}>{source.label}</span>
          <span className={`workspace-priority workspace-priority--${String(task.priority || 'medium').toLowerCase()}`}>{task.priority || 'medium'}</span>
        </div>
        <h2>{task.planned_topic || task.title}</h2>
        <p>{task.client_name || 'No client'} - {task.title}</p>
        <div className="workspace-task-meta">
          <span>{task.planned_content_format || task.category || 'task'}</span>
          <span>{formatPlatforms(task.planned_platforms)}</span>
          <span>{taskDateLabel(task)}</span>
          <span>{task.category || 'general'}</span>
        </div>
      </div>
      <div className="workspace-task-side">
        <span className={`workspace-status workspace-status--${task.status}`}>{labelForStatus(task.status)}</span>
        <span>{progress.done}/{progress.total} checklist</span>
        <span>Updated {formatDateTime(task.updated_at)}</span>
        {task.completed_at && <span>Completed by {task.completed_by_user_id || 'team'} - {formatDateTime(task.completed_at)}</span>}
        <div className="workspace-card-actions">
          <button type="button" onClick={() => onStatusChange('in_progress')}>In progress</button>
          <button type="button" onClick={() => onStatusChange('ready')}>Ready</button>
          <button type="button" onClick={() => onStatusChange('completed')}>Done</button>
          <button type="button" onClick={onOpen}><Eye size={15} /> Details</button>
        </div>
      </div>
    </article>
  )
}

function TaskDetailDrawer({
  task,
  onClose,
  onStatusChange,
  onChecklistUpdate,
  onComment,
  onAttachment,
}: {
  task: WorkspaceTask
  onClose: () => void
  onStatusChange: (status: WorkspaceStatus) => void
  onChecklistUpdate: (item: WorkspaceChecklistItem, patch: ChecklistPatch) => void
  onComment: (body: string) => void
  onAttachment: (input: AttachmentInput) => void
}) {
  const [comment, setComment] = useState('')
  const [attachment, setAttachment] = useState<AttachmentInput>({ link_type: 'raw_video', label: '', url: '' })
  const source = sourceLabel(task)

  return (
    <div className="workspace-drawer-backdrop">
      <aside className="workspace-drawer">
        <div className="workspace-drawer-header">
          <div>
            <p className="eyebrow">{task.client_name || 'Workspace task'}</p>
            <h2>{task.planned_topic || task.title}</h2>
            <div className="workspace-drawer-tags">
              <span className={`workspace-source-label workspace-source-label--${source.key}`}>{source.label}</span>
              <span className={`workspace-status workspace-status--${task.status}`}>{labelForStatus(task.status)}</span>
            </div>
          </div>
          <button className="workspace-icon-button" type="button" onClick={onClose} aria-label="Close task detail"><X size={18} /></button>
        </div>

        <section className="workspace-detail-section">
          <h3>Plan Context</h3>
          <DetailGrid
            rows={[
              ['Source engine', task.source_engine_name || 'None'],
              ['Source plan type', task.source_plan_type || 'Manual'],
              ['Topic/action', task.planned_topic || task.title],
              ['Format', task.planned_content_format || 'None'],
              ['Platforms', formatPlatforms(task.planned_platforms)],
              ['Planned date', task.planned_publish_date || task.due_date || 'None'],
              ['Objective', task.content_objective || 'None'],
            ]}
          />
          {task.generated_script && <TextBlock title="Generated script" body={task.generated_script} />}
          {task.generated_caption && <TextBlock title="Generated caption" body={task.generated_caption} />}
          {task.plan_context && (
            <details className="workspace-advanced-context">
              <summary><ChevronDown size={15} /> Advanced context</summary>
              <pre>{JSON.stringify(task.plan_context, null, 2)}</pre>
            </details>
          )}
        </section>

        <section className="workspace-detail-section">
          <div className="workspace-section-heading">
            <h3>Execution Checklist</h3>
            <label className="workspace-field workspace-status-field">
              <span>Status</span>
              <select value={task.status} onChange={(event) => onStatusChange(event.target.value as WorkspaceStatus)}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <div className="workspace-checklist">
            {task.checklist.length === 0 ? <p>No checklist items yet.</p> : task.checklist.map((item) => (
              <ChecklistRow key={item.id} item={item} onUpdate={(patch) => onChecklistUpdate(item, patch)} />
            ))}
          </div>
        </section>

        <section className="workspace-detail-section">
          <h3>Links / Attachments</h3>
          <div className="workspace-attachment-form">
            <select value={attachment.link_type} onChange={(event) => setAttachment({ ...attachment, link_type: event.target.value })}>
              {attachmentTypes.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
            </select>
            <input value={attachment.label} onChange={(event) => setAttachment({ ...attachment, label: event.target.value })} placeholder="Label" />
            <input value={attachment.url} onChange={(event) => setAttachment({ ...attachment, url: event.target.value })} placeholder="https://..." />
            <button type="button" onClick={() => {
              if (!attachment.url.trim()) return
              onAttachment({ ...attachment, label: attachment.label || humanize(attachment.link_type) })
              setAttachment({ link_type: 'raw_video', label: '', url: '' })
            }}><Paperclip size={16} /> Add</button>
          </div>
          <div className="workspace-link-list">
            {task.attachments.length === 0 ? <p>No links attached yet.</p> : task.attachments.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noreferrer"><LinkIcon size={15} /> {link.label}<ExternalLink size={13} /></a>
            ))}
          </div>
        </section>

        <section className="workspace-detail-section">
          <h3>Comments</h3>
          <div className="workspace-comment-box">
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add an execution note..." />
            <button type="button" onClick={() => {
              if (!comment.trim()) return
              onComment(comment.trim())
              setComment('')
            }}><MessageSquare size={16} /> Comment</button>
          </div>
          <div className="workspace-comment-list">
            {task.comments.length === 0 ? <p>No comments yet.</p> : task.comments.map((item) => (
              <div key={item.id}>
                <strong>{item.author_user_id}</strong>
                <span>{formatDateTime(item.created_at)}</span>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="workspace-detail-section">
          <h3>Activity Log</h3>
          <div className="workspace-activity-list">
            {task.activity.length === 0 ? <p>No activity yet.</p> : task.activity.map((item) => (
              <div key={item.id}>
                <span>{formatDateTime(item.created_at)}</span>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  )
}

function ChecklistRow({ item, onUpdate }: { item: WorkspaceChecklistItem; onUpdate: (patch: ChecklistPatch) => void }) {
  const [notes, setNotes] = useState(item.notes || '')
  const [attachmentUrl, setAttachmentUrl] = useState(item.attachment_url || '')

  return (
    <div className={item.is_completed ? 'workspace-check-item workspace-check-item--done' : 'workspace-check-item'}>
      <button type="button" className="workspace-check-toggle" onClick={() => onUpdate({ is_completed: !item.is_completed })}>
        {item.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>
      <div className="workspace-check-content">
        <strong>{item.title}</strong>
        <span>
          {item.is_completed ? `Completed by ${item.completed_by_user_id || 'team'} - ${formatDateTime(item.completed_at)}` : 'Not completed'}
        </span>
        <div className="workspace-check-edit">
          <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Checklist note" />
          <input value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="Checklist link" />
          <button type="button" onClick={() => onUpdate({ is_completed: item.is_completed, notes, attachment_url: attachmentUrl })}>Save</button>
        </div>
        {item.attachment_url && <a href={item.attachment_url} target="_blank" rel="noreferrer">Open checklist link</a>}
      </div>
    </div>
  )
}

function EmptyState({ tab, onCreate }: { tab: WorkspaceTab; onCreate: () => void }) {
  const copy: Record<WorkspaceTab, [string, string]> = {
    today: ['No tasks today', 'Nothing is due for execution today.'],
    upcoming: ['No upcoming planned content', 'Future workflow tasks will appear here.'],
    ready: ['No ready-to-publish tasks', 'Completed execution items will move here when marked ready.'],
    blocked: ['No blocked tasks', 'Waiting and blocked items will appear here.'],
    completed: ['No completed tasks', 'Completed work will be tracked here.'],
    all: ['No workspace tasks', 'AI-generated and manual work will appear here.'],
  }
  const [title, body] = copy[tab]

  return (
    <div className="workspace-empty">
      <h2>{title}</h2>
      <p>{body}</p>
      <button type="button" onClick={onCreate}>Create manual task</button>
    </div>
  )
}

function ManualTaskModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: ManualTaskInput) => void }) {
  const [input, setInput] = useState<ManualTaskInput>({
    title: '',
    description: '',
    client_name: '',
    category: 'general',
    priority: 'medium',
    due_date: '',
    platform: '',
    notes: '',
  })

  return (
    <div className="workspace-drawer-backdrop">
      <div className="workspace-modal">
        <div className="workspace-drawer-header">
          <h2>Create manual task</h2>
          <button className="workspace-icon-button" type="button" onClick={onClose} aria-label="Close create task"><X size={18} /></button>
        </div>
        <div className="workspace-form-grid">
          <WorkspaceInput label="Title" value={input.title} onChange={(value) => setInput({ ...input, title: value })} />
          <WorkspaceInput label="Client" value={input.client_name} onChange={(value) => setInput({ ...input, client_name: value })} />
          <WorkspaceInput label="Category" value={input.category} onChange={(value) => setInput({ ...input, category: value })} />
          <WorkspaceInput label="Priority" value={input.priority} onChange={(value) => setInput({ ...input, priority: value })} />
          <WorkspaceInput label="Due date" type="date" value={input.due_date} onChange={(value) => setInput({ ...input, due_date: value })} />
          <WorkspaceInput label="Platform" value={input.platform} onChange={(value) => setInput({ ...input, platform: value })} />
        </div>
        <label className="workspace-field">
          <span>Description</span>
          <textarea value={input.description} onChange={(event) => setInput({ ...input, description: event.target.value })} />
        </label>
        <label className="workspace-field">
          <span>Notes</span>
          <textarea value={input.notes} onChange={(event) => setInput({ ...input, notes: event.target.value })} />
        </label>
        <button className="workspace-primary-button" type="button" onClick={() => input.title.trim() && onCreate(input)}>Create task</button>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  format = humanize,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  format?: (value: string) => string
}) {
  return (
    <label className="workspace-filter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => <option key={option} value={option}>{format(option)}</option>)}
      </select>
    </label>
  )
}

function WorkspaceInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="workspace-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function DetailGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="workspace-detail-grid">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function TextBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="workspace-text-block">
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  )
}

function workspaceAuthHeaders(accessToken: string): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

async function workspaceRequest<T>(url: string, init: RequestInit, accessToken: string, fallback: () => T): Promise<T> {
  try {
    const headers = new Headers(init.headers)
    headers.set('Content-Type', 'application/json')
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
    const response = await fetch(url, {
      ...init,
      headers,
    })
    if (response.status === 403) throw new Error(workspaceAccessDeniedMessage)
    if (!response.ok) throw new Error('API request failed')
    return await response.json() as T
  } catch {
    if (import.meta.env.DEV) return fallback()
    throw new Error('Workspace API request failed')
  }
}

function readLocalTasks(): WorkspaceTask[] {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return []
  try {
    return normalizeTasks(JSON.parse(raw) as WorkspaceTask[])
  } catch {
    return []
  }
}

function writeLocalTasks(tasks: WorkspaceTask[]) {
  localStorage.setItem(storageKey, JSON.stringify(tasks))
}

function normalizeTasks(tasks: WorkspaceTask[]) {
  return tasks.map(normalizeTask)
}

function normalizeTask(task: WorkspaceTask): WorkspaceTask {
  return {
    ...task,
    status: normalizeStatus(task.status),
    planned_platforms: Array.isArray(task.planned_platforms) ? task.planned_platforms : [],
    checklist: task.checklist || [],
    comments: task.comments || [],
    attachments: task.attachments || [],
    activity: task.activity || [],
  }
}

function normalizeStatus(status: string): WorkspaceStatus {
  if (status === 'not_started') return 'todo'
  if (status === 'ready_to_publish') return 'ready'
  if (statusOptions.some((option) => option.value === status)) return status as WorkspaceStatus
  return 'todo'
}

function filterTasks(tasks: WorkspaceTask[], filters: WorkspaceFilters, query: string, tab: WorkspaceTab) {
  const normalizedQuery = query.trim().toLowerCase()
  return tasks.filter((task) => {
    if (!matchesTab(task, tab)) return false
    if (filters.client && task.client_name !== filters.client) return false
    if (filters.status && task.status !== filters.status) return false
    if (filters.category && task.category !== filters.category) return false
    if (filters.sourceType && sourceLabel(task).key !== filters.sourceType) return false
    if (filters.platform && !(task.planned_platforms || []).includes(filters.platform)) return false
    if (filters.dueDate && taskDate(task) !== filters.dueDate) return false
    if (!normalizedQuery) return true
    return [
      task.title,
      task.client_name,
      task.planned_topic,
      task.category,
      sourceLabel(task).label,
      ...(task.planned_platforms || []),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
  })
}

function matchesTab(task: WorkspaceTask, tab: WorkspaceTab) {
  const today = todayString()
  const date = taskDate(task)
  if (tab === 'today') return date === today && task.status !== 'completed'
  if (tab === 'upcoming') return Boolean(date && date > today && task.status !== 'completed')
  if (tab === 'ready') return task.status === 'ready'
  if (tab === 'blocked') return task.status === 'blocked' || task.status === 'waiting'
  if (tab === 'completed') return task.status === 'completed'
  return true
}

function buildSummary(tasks: WorkspaceTask[]): DashboardSummary {
  const today = todayString()
  return {
    totalToday: tasks.filter((task) => taskDate(task) === today).length,
    completedToday: tasks.filter((task) => task.completed_at?.slice(0, 10) === today || (task.status === 'completed' && taskDate(task) === today)).length,
    ready: tasks.filter((task) => task.status === 'ready').length,
    blocked: tasks.filter((task) => task.status === 'blocked' || task.status === 'waiting').length,
    overdue: tasks.filter((task) => {
      const date = taskDate(task)
      return Boolean(date && date < today && task.status !== 'completed')
    }).length,
  }
}

function buildTabCounts(tasks: WorkspaceTask[]): Record<WorkspaceTab, number> {
  return {
    today: tasks.filter((task) => matchesTab(task, 'today')).length,
    upcoming: tasks.filter((task) => matchesTab(task, 'upcoming')).length,
    ready: tasks.filter((task) => matchesTab(task, 'ready')).length,
    blocked: tasks.filter((task) => matchesTab(task, 'blocked')).length,
    completed: tasks.filter((task) => matchesTab(task, 'completed')).length,
    all: tasks.length,
  }
}

function buildFilterOptions(tasks: WorkspaceTask[]) {
  return {
    clients: unique(tasks.map((task) => task.client_name).filter(Boolean) as string[]),
    categories: unique(tasks.map((task) => task.category).filter(Boolean) as string[]),
    platforms: unique(tasks.flatMap((task) => task.planned_platforms || [])),
    sources: unique(tasks.map((task) => sourceLabel(task).key)),
  }
}

function groupTasks(tasks: WorkspaceTask[], groupBy: WorkspaceGroupBy) {
  const groups = new Map<string, WorkspaceTask[]>()
  for (const task of [...tasks].sort(compareTasks)) {
    const label = groupLabel(task, groupBy)
    groups.set(label, [...(groups.get(label) || []), task])
  }
  return Array.from(groups.entries()).map(([label, groupTasks]) => ({ label, tasks: groupTasks }))
}

function groupLabel(task: WorkspaceTask, groupBy: WorkspaceGroupBy) {
  if (groupBy === 'client') return task.client_name || 'No client'
  if (groupBy === 'date') return taskDate(task) || 'No planned date'
  if (groupBy === 'source') return sourceLabel(task).label
  return labelForStatus(task.status)
}

function compareTasks(a: WorkspaceTask, b: WorkspaceTask) {
  const dateCompare = (taskDate(a) || '9999-99-99').localeCompare(taskDate(b) || '9999-99-99')
  if (dateCompare !== 0) return dateCompare
  return priorityRank(a.priority) - priorityRank(b.priority)
}

function priorityRank(priority?: string | null) {
  const normalized = String(priority || 'medium').toLowerCase()
  if (normalized === 'high' || normalized === 'urgent') return 0
  if (normalized === 'medium') return 1
  return 2
}

function checklistProgress(task: WorkspaceTask) {
  return {
    total: task.checklist.length,
    done: task.checklist.filter((item) => item.is_completed).length,
  }
}

function sourceLabel(task: WorkspaceTask) {
  if (task.source_type === 'manual') return { key: 'manual', label: 'Manual' }
  if (task.source_plan_type === 'daily_content_plan') return { key: 'daily', label: 'Daily Plan' }
  if (task.source_plan_type === '30_day_content_plan') return { key: 'thirty', label: '30-Day Plan' }
  if (task.source_plan_type === 'adaptive_plan_update') return { key: 'adaptive', label: 'Adaptive Update' }
  if (task.source_plan_type === 'strategy_action_plan') return { key: 'strategy', label: 'Strategy Action' }
  return { key: 'workflow', label: 'Workflow' }
}

function sourceLabelFromFilter(value: string) {
  const labels: Record<string, string> = {
    manual: 'Manual',
    daily: 'Daily Plan',
    thirty: '30-Day Plan',
    adaptive: 'Adaptive Update',
    strategy: 'Strategy Action',
    workflow: 'Workflow',
  }
  return labels[value] || humanize(value)
}

function taskDate(task: WorkspaceTask) {
  return task.planned_publish_date || task.due_date || ''
}

function taskDateLabel(task: WorkspaceTask) {
  const date = taskDate(task)
  return date ? `Due ${date}` : 'No date'
}

function formatPlatforms(platforms?: string[]) {
  return platforms?.length ? platforms.join(', ') : 'No platform'
}

function unique(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))
}

function activity(message: string, action: string): WorkspaceActivity {
  return { id: crypto.randomUUID(), task_id: '', actor_user_id: currentUserId, action, message, created_at: new Date().toISOString() }
}

function humanize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function labelForStatus(status: string) {
  return statusOptions.find((option) => option.value === status)?.label || humanize(status)
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateTime(value?: string | null) {
  if (!value) return 'None'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
