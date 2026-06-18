import { createContext, useContext, useEffect, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  Gauge,
  HeartPulse,
  Library,
  LayoutDashboard,
  Lock,
  LogOut,
  PlayCircle,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Workflow,
  XCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { LandingPage } from './pages/LandingPage'
import { ToolsPage } from './pages/ToolsPage'
import { SignInPage } from './components/ui/sign-in-flow-1'
import './App.css'

declare const __SUPABASE_URL__: string | undefined
declare const __SUPABASE_ANON_KEY__: string | undefined

type Client = {
  id: string
  client_name: string
  client_slug?: string
  industry?: string | null
  location?: string | null
  active?: boolean | null
}

type EngineRun = {
  id: string
  client_id: string
  engine_name: string
  mode?: string | null
  status: string
  started_at?: string | null
  completed_at?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown> | null
}

type EngineCategory = 'Platform Intelligence' | 'Context Intelligence' | 'Combination / Planning / Strategy' | 'Competitor'

type DailyRun = {
  id: string
  client_id: string
  run_date?: string | null
  status: string
  summary?: string | null
  critical_failure?: boolean | null
  started_at?: string | null
  completed_at?: string | null
  engines_completed?: EngineResult[] | null
  engines_failed?: EngineResult[] | null
  metadata?: Record<string, unknown> | null
}

type EngineResult = {
  engine?: string | null
  status?: string | null
  child_execution_id?: string | null
  error?: string | null
  completed_at?: string | null
  failed_at?: string | null
  critical?: boolean | null
}

type IntelligenceOutput = {
  id: string
  client_id: string
  engine_name: string
  source_platform: string
  report_date: string
  summary?: string | null
  key_insights?: unknown
  recommendations?: unknown
  next_actions?: unknown
  confidence_score?: number | null
  input_sources?: Record<string, unknown> | null
  created_at?: string | null
}

type Metric = {
  id: string
  client_id: string
  engine_name: string
  source_platform: string
  metric_date: string
  metric_name: string
  metric_value?: number | null
  dimensions?: Record<string, unknown> | null
  created_at?: string | null
}

type ContentPlan = {
  id: string
  client_id: string
  plan_type?: string | null
  plan_status?: string | null
  plan_start_date?: string | null
  plan_end_date?: string | null
  strategy_summary?: string | null
  source_engines?: string[] | string | null
  created_at?: string | null
  updated_at?: string | null
}

type ContentItem = {
  id: string
  client_id?: string
  content_plan_id?: string | null
  planned_date?: string | null
  platform?: string | null
  content_format?: string | null
  topic?: string | null
  content_angle?: string | null
  caption_direction?: string | null
  creative_brief?: string | null
  suggested_cta?: string | null
  caption?: string | null
  hashtags?: string[] | string | null
  full_script?: string | null
  voiceover_script?: string | null
  scene_by_scene_script?: string | null
  on_screen_text?: string | null
  visual_direction?: string | null
  design_instructions?: string | null
  video_editing_notes?: string | null
  thumbnail_direction?: string | null
  posting_time_recommendation?: string | null
  production_notes?: string | null
  source_engines?: string[] | string | null
  source_reason?: string | null
  priority_score?: number | null
  status?: string | null
  approval_status?: string | null
  is_adaptive_addition?: boolean | null
  adaptation_reason?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ContentPlanUpdate = {
  id: string
  content_plan_id?: string | null
  client_id: string
  update_type?: string | null
  update_reason?: string | null
  affected_dates?: unknown
  added_items?: unknown
  source_engine?: string | null
  created_at?: string | null
}

type AppData = {
  clients: Client[]
  engineRuns: EngineRun[]
  dailyRuns: DailyRun[]
  outputs: IntelligenceOutput[]
  metrics: Metric[]
  plans: ContentPlan[]
  items: ContentItem[]
  updates: ContentPlanUpdate[]
  errors: string[]
  loading: boolean
  reload: () => void
}

type QueryError = { message: string }
type QueryResult<T> = { data: T[] | null; error: QueryError | null }
type QueryBuilder<T> = PromiseLike<QueryResult<T>> & {
  eq: (column: string, value: unknown) => QueryBuilder<T>
  in: (column: string, values: unknown[]) => QueryBuilder<T>
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder<T>
  limit: (count: number) => QueryBuilder<T>
}

const supabaseUrl = __SUPABASE_URL__ || import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = __SUPABASE_ANON_KEY__ || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)
const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/engine-outputs', label: 'Engine Outputs', icon: Library },
  { to: '/approvals', label: 'Approval Queue', icon: ClipboardCheck },
  { to: '/calendar', label: '30-Day Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/strategy', label: 'Strategy Report', icon: FileText },
  { to: '/logs', label: 'Workflow Logs', icon: Workflow },
  { to: '/controls', label: 'Manual Controls', icon: Settings2 },
]

const engineCatalog: Array<{ engine: string; category: EngineCategory }> = [
  { engine: 'facebook_intelligence', category: 'Platform Intelligence' },
  { engine: 'instagram_intelligence', category: 'Platform Intelligence' },
  { engine: 'youtube_intelligence', category: 'Platform Intelligence' },
  { engine: 'special_days_intelligence', category: 'Context Intelligence' },
  { engine: 'demographics_intelligence', category: 'Context Intelligence' },
  { engine: 'local_area_intelligence', category: 'Context Intelligence' },
  { engine: 'trends_intelligence', category: 'Context Intelligence' },
  { engine: 'best_practices_intelligence', category: 'Context Intelligence' },
  { engine: 'content_performance', category: 'Combination / Planning / Strategy' },
  { engine: 'thirty_day_content_plan', category: 'Combination / Planning / Strategy' },
  { engine: 'daily_content_production', category: 'Combination / Planning / Strategy' },
  { engine: 'adaptive_plan_update', category: 'Combination / Planning / Strategy' },
  { engine: 'social_media_strategy', category: 'Combination / Planning / Strategy' },
  { engine: 'competitor_intelligence', category: 'Competitor' },
]

const libraryEngines = engineCatalog.map((entry) => entry.engine)

const emptyData: AppData = {
  clients: [],
  engineRuns: [],
  dailyRuns: [],
  outputs: [],
  metrics: [],
  plans: [],
  items: [],
  updates: [],
  errors: [],
  loading: false,
  reload: () => undefined,
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/vip" element={<SignInPage />} />
        <Route path="/*" element={<AuthenticatedRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}

function AuthenticatedRoutes() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!supabase) {
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  if (authLoading) {
    return <Splash message="Preparing secure dashboard session" />
  }

  return (
    <Routes>
      <Route path="/login" element={<Login session={session} />} />
      <Route
        path="/*"
        element={
          <ProtectedShell session={session}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/engine-outputs" element={<EngineOutputsPage />} />
              <Route path="/approvals" element={<ApprovalQueue />} />
              <Route path="/content/:itemId" element={<DailyContentDetail />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/strategy" element={<StrategyPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/controls" element={<ControlsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ProtectedShell>
        }
      />
    </Routes>
  )
}

function ProtectedShell({ session, children }: { session: Session | null; children: ReactNode }) {
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useVipData(supabase, session, selectedClientId, refreshKey)
  const effectiveClientId = selectedClientId || data.clients[0]?.id || ''
  const selectedClient = data.clients.find((client) => client.id === effectiveClientId) || data.clients[0]

  if (!session && hasSupabaseConfig) {
    return <Navigate to="/login" replace />
  }

  return (
    <VipContext.Provider
      value={{
        ...data,
        selectedClient,
        selectedClientId: selectedClient?.id || effectiveClientId,
        setSelectedClientId,
      }}
    >
      <div className="app-shell">
        <aside className="sidebar">
          <Link className="brand" to="/dashboard">
            <span className="brand-mark">
              <HeartPulse size={21} />
            </span>
            <span>
              <strong>VIP Social</strong>
              <small>Intelligence Ops</small>
            </span>
          </Link>
          <nav className="nav-list">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">
            <StatusBadge value={hasSupabaseConfig ? 'RLS reads enabled' : 'env required'} />
            <small>Aayu Geriatrics context</small>
          </div>
        </aside>
        <main className="main-panel">
          <Topbar
            clients={data.clients}
            selectedClientId={selectedClient?.id || effectiveClientId}
            onClientChange={setSelectedClientId}
            onRefresh={() => setRefreshKey((key) => key + 1)}
            loading={data.loading}
            session={session}
          />
          {!hasSupabaseConfig && <SetupNotice />}
          {hasSupabaseConfig && !data.loading && data.clients.length === 0 && <NoClientNotice errors={data.errors} />}
          {data.errors.length > 0 && <ErrorStrip errors={data.errors} />}
          <div className="page-wrap">{children}</div>
        </main>
      </div>
    </VipContext.Provider>
  )
}

type VipContextShape = AppData & {
  selectedClient?: Client
  selectedClientId?: string
  setSelectedClientId: (id: string) => void
}

const VipContext = createContext<VipContextShape>({
  ...emptyData,
  setSelectedClientId: () => undefined,
})

function useVip() {
  return useContext(VipContext)
}

function useVipData(
  client: SupabaseClient | null,
  session: Session | null,
  selectedClientId: string,
  refreshKey: number,
): AppData {
  const [state, setState] = useState<Omit<AppData, 'reload'>>({ ...emptyData, loading: true })

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!client || (!session && hasSupabaseConfig)) {
        setState({ ...emptyData, loading: false })
        return
      }

      setState((current) => ({ ...current, loading: true, errors: [] }))
      const errors: string[] = []

      const clientRows = await loadClients(client, errors)
      const targetClientId = selectedClientId || clientRows[0]?.id || ''

      const [engineRuns, dailyRuns, outputs, metrics, plans, items, updates] = await Promise.all([
        safeSelect<EngineRun>(
          client,
          'engine_runs',
          'id, client_id, engine_name, mode, status, started_at, completed_at, error_message, metadata',
          errors,
          (query) => query.eq('client_id', targetClientId).order('started_at', { ascending: false }).limit(40),
          targetClientId,
        ),
        safeSelect<DailyRun>(
          client,
          'daily_operating_runs',
          'id, client_id, run_date, status, engines_completed, engines_failed, critical_failure, summary, metadata, started_at, completed_at',
          errors,
          (query) => query.eq('client_id', targetClientId).order('started_at', { ascending: false }).limit(20),
          targetClientId,
        ),
        safeSelect<IntelligenceOutput>(
          client,
          'intelligence_outputs',
          'id, client_id, engine_name, source_platform, report_date, summary, key_insights, recommendations, next_actions, confidence_score, input_sources, created_at',
          errors,
          (query) => query.eq('client_id', targetClientId).in('engine_name', libraryEngines).order('created_at', { ascending: false }).limit(500),
          targetClientId,
        ),
        safeSelect<Metric>(
          client,
          'normalized_metrics',
          'id, client_id, engine_name, source_platform, metric_date, metric_name, metric_value, dimensions, created_at',
          errors,
          (query) => query.eq('client_id', targetClientId).in('engine_name', libraryEngines).order('metric_date', { ascending: false }).limit(800),
          targetClientId,
        ),
        safeSelect<ContentPlan>(
          client,
          'content_plans',
          'id, client_id, plan_type, plan_status, plan_start_date, plan_end_date, source_engines, strategy_summary, created_at, updated_at',
          errors,
          (query) => query.eq('client_id', targetClientId).order('created_at', { ascending: false }).limit(6),
          targetClientId,
        ),
        safeSelect<ContentItem>(
          client,
          'content_plan_items',
          [
            'id',
            'client_id',
            'content_plan_id',
            'planned_date',
            'platform',
            'content_format',
            'topic',
            'content_angle',
            'caption_direction',
            'creative_brief',
            'suggested_cta',
            'source_reason',
            'priority_score',
            'caption',
            'hashtags',
            'source_engines',
            'is_adaptive_addition',
            'adaptation_reason',
            'full_script',
            'voiceover_script',
            'scene_by_scene_script',
            'on_screen_text',
            'visual_direction',
            'design_instructions',
            'video_editing_notes',
            'thumbnail_direction',
            'posting_time_recommendation',
            'production_notes',
            'status',
            'approval_status',
            'created_at',
            'updated_at',
          ].join(', '),
          errors,
          (query) => query.eq('client_id', targetClientId).order('planned_date', { ascending: true }).limit(100),
          targetClientId,
        ),
        safeSelect<ContentPlanUpdate>(
          client,
          'content_plan_updates',
          'id, content_plan_id, client_id, update_type, update_reason, affected_dates, added_items, source_engine, created_at',
          errors,
          (query) => query.eq('client_id', targetClientId).order('created_at', { ascending: false }).limit(50),
          targetClientId,
        ),
      ])

      if (!cancelled) {
        setState({
          clients: clientRows,
          engineRuns,
          dailyRuns,
          outputs,
          metrics,
          plans,
          items,
          updates,
          errors: Array.from(new Set(errors)),
          loading: false,
        })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [client, session, selectedClientId, refreshKey])

  return {
    ...state,
    reload: () => undefined,
  }
}

async function loadClients(client: SupabaseClient, errors: string[]) {
  const memberships = await safeSelect<{ client_id: string }>(
    client,
    'client_users',
    'client_id',
    errors,
    (query) => query.limit(50),
  )

  const ids = memberships.map((row) => row.client_id).filter(Boolean)
  const clientColumns = 'id, client_name, client_slug, industry, location, active'

  if (ids.length > 0) {
    return safeSelect<Client>(
      client,
      'clients',
      clientColumns,
      errors,
      (query) => query.in('id', ids).order('client_name', { ascending: true }),
    )
  }

  return safeSelect<Client>(
    client,
    'clients',
    clientColumns,
    errors,
    (query) => query.eq('active', true).order('client_name', { ascending: true }).limit(25),
  )
}

async function safeSelect<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  errors: string[],
  refine?: (query: QueryBuilder<T>) => QueryBuilder<T>,
  skipWhenMissingId?: string,
): Promise<T[]> {
  if (skipWhenMissingId === '') return []
  let query = client.from(table).select(columns) as unknown as QueryBuilder<T>
  if (refine) query = refine(query)
  const { data, error } = await query
  if (error) {
    errors.push(`${table}: ${error.message}`)
    return []
  }
  return (data || []) as T[]
}

function Login({ session }: { session: Session | null }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/dashboard" replace />

  async function signIn(event: React.FormEvent) {
    event.preventDefault()
    if (!supabase) {
      setMessage('Add Supabase environment variables before sign-in can run.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setMessage(error ? error.message : 'Magic link sent. Check your email to continue.')
    setLoading(false)
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand large">
          <span className="brand-mark">
            <HeartPulse size={24} />
          </span>
          <span>
            <strong>VIP Social Media Intelligence Dashboard</strong>
            <small>Aayu Geriatrics operating console</small>
          </span>
        </div>
        <form onSubmit={signIn} className="login-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="operator@aayu.example"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button type="submit" disabled={loading || !hasSupabaseConfig}>
            <Lock size={17} />
            {loading ? 'Sending link' : 'Send magic link'}
          </button>
        </form>
        {!hasSupabaseConfig && <SetupNotice compact />}
        {message && <p className="form-message">{message}</p>}
      </section>
    </main>
  )
}

function Topbar({
  clients,
  selectedClientId,
  onClientChange,
  onRefresh,
  loading,
  session,
}: {
  clients: Client[]
  selectedClientId: string
  onClientChange: (id: string) => void
  onRefresh: () => void
  loading: boolean
  session: Session | null
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Healthcare social intelligence</p>
        <h1>Aayu Geriatrics Command Desk</h1>
      </div>
      <div className="topbar-actions">
        <select value={selectedClientId} onChange={(event) => onClientChange(event.target.value)} disabled={!clients.length}>
          {clients.length ? (
            clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.client_name}
              </option>
            ))
          ) : (
            <option>Aayu Geriatrics setup pending</option>
          )}
        </select>
        <button className="icon-button" type="button" onClick={onRefresh} aria-label="Refresh data">
          <RefreshCw size={17} className={loading ? 'spin' : ''} />
        </button>
        {session && (
          <button className="icon-button" type="button" onClick={() => supabase?.auth.signOut()} aria-label="Sign out">
            <LogOut size={17} />
          </button>
        )}
      </div>
    </header>
  )
}

function Dashboard() {
  const data = useVip()
  const latestStrategy = latestOutput(data.outputs, 'social_media_strategy')
  const latestDaily = data.dailyRuns[0]
  const failedEngines = data.engineRuns.filter((run) => isBadStatus(run.status))
  const productionReady = data.items.filter((item) => item.status === 'production_ready')
  const pendingApprovals = productionReady.filter((item) => !['approved', 'posted'].includes(normalize(item.approval_status))).length
  const tomorrowItems = data.items.filter((item) => isTomorrow(item.planned_date))
  const platformPriority = inferPlatformPriority(data.outputs, data.metrics)
  const healthScore = latestStrategy?.confidence_score ? Math.round(latestStrategy.confidence_score * 100) : null

  return (
    <Page title="Dashboard" subtitle="Daily readiness, strategy health, and production blockers for the selected client.">
      <section className="metric-grid">
        <MetricCard icon={Gauge} label="Strategy health" value={healthScore === null ? '-' : `${healthScore}%`} detail={latestStrategy?.summary || 'No strategy output visible yet.'} />
        <MetricCard icon={ShieldCheck} label="Readiness" value={failedEngines.length ? 'Attention' : 'Operational'} detail={failedEngines.length ? `${failedEngines.length} engine warning(s)` : 'No failed engine runs in the latest window.'} tone={failedEngines.length ? 'warning' : 'good'} />
        <MetricCard icon={Sparkles} label="Platform priority" value={platformPriority} detail="Derived from recent intelligence outputs and metric volume." />
        <MetricCard icon={ClipboardCheck} label="Pending approvals" value={String(pendingApprovals)} detail={`${productionReady.length} production-ready item(s).`} tone={pendingApprovals ? 'warning' : 'good'} />
      </section>

      <section className="split-grid">
        <Panel title="Tomorrow Content Readiness" action={<Link to="/approvals">Open approvals</Link>}>
          {tomorrowItems.length ? (
            <div className="stack">
              {tomorrowItems.map((item) => (
                <ContentRow key={item.id} item={item} compact />
              ))}
            </div>
          ) : (
            <EmptyState title="No content planned for tomorrow" detail="Daily content generation has not produced tomorrow-ready items visible to this user." />
          )}
        </Panel>
        <Panel title="Latest Daily Operating Run">
          {latestDaily ? (
            <dl className="definition-grid">
              <dt>Status</dt>
              <dd><StatusBadge value={latestDaily.status} /></dd>
              <dt>Started</dt>
              <dd>{formatDateTime(latestDaily.started_at)}</dd>
              <dt>Completed</dt>
              <dd>{formatDateTime(latestDaily.completed_at)}</dd>
              <dt>Failed engines</dt>
              <dd>{engineNamesText(latestDaily.engines_failed)}</dd>
            </dl>
          ) : (
            <EmptyState title="No daily run visible" detail="The active n8n workflow may not have emitted a readable run row yet." />
          )}
        </Panel>
      </section>

      <Panel title="Latest Engine Runs" action={<Link to="/logs">View logs</Link>}>
        <DataTable
          columns={['Engine', 'Status', 'Started', 'Completed', 'Error']}
          rows={data.engineRuns.slice(0, 8).map((run) => [
            titleize(run.engine_name),
            <StatusBadge value={run.status} />,
            formatDateTime(run.started_at),
            formatDateTime(run.completed_at),
            run.error_message || '-',
          ])}
          empty="No engine runs are visible through RLS yet."
        />
      </Panel>
    </Page>
  )
}

function EngineOutputsPage() {
  const data = useVip()
  const [category, setCategory] = useState('all')
  const [engine, setEngine] = useState('all')
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedEngine, setSelectedEngine] = useState<string>(engineCatalog[0].engine)

  const rows = engineCatalog.map((entry) => {
    const output = latestEngineOutput(data.outputs, entry.engine)
    const latestRun = latestEngineRun(data.engineRuns, entry.engine)
    const metrics = metricsForEngine(data.metrics, entry.engine)
    const engineStatus = engineAvailability(output)

    return {
      ...entry,
      output,
      latestRun,
      metrics,
      status: engineStatus,
      searchable: [entry.engine, entry.category, output?.summary, output?.source_platform, latestRun?.status].join(' ').toLowerCase(),
    }
  })

  const visibleRows = rows.filter((row) => {
    return (
      (category === 'all' || row.category === category) &&
      (engine === 'all' || row.engine === engine) &&
      (status === 'all' || row.status === status) &&
      row.searchable.includes(query.toLowerCase())
    )
  })

  const selectedRow = rows.find((row) => row.engine === selectedEngine) || rows[0]
  const categories = Array.from(new Set(engineCatalog.map((entry) => entry.category)))

  return (
    <Page title="Engine Outputs" subtitle="Latest intelligence outputs, run status, and metrics for every engine.">
      <div className="toolbar library-toolbar">
        <Filter label="Category" value={category} values={categories} onChange={setCategory} />
        <Filter label="Engine" value={engine} values={libraryEngines} onChange={setEngine} />
        <Filter label="Status" value={status} values={['available', 'missing', 'stale']} onChange={setStatus} />
        <div className="searchbox">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search engine or summary" />
        </div>
      </div>

      <div className="library-layout">
        <div className="library-list">
          {categories.map((group) => {
            const groupRows = visibleRows.filter((row) => row.category === group)
            if (!groupRows.length) return null
            return (
              <section key={group} className="library-category">
                <h3>{group}</h3>
                <div className="engine-card-grid">
                  {groupRows.map((row) => (
                    <button
                      key={row.engine}
                      type="button"
                      className={`engine-card ${selectedRow?.engine === row.engine ? 'selected' : ''}`}
                      onClick={() => setSelectedEngine(row.engine)}
                    >
                      <div className="row-between">
                        <strong>{titleize(row.engine)}</strong>
                        <StatusBadge value={row.status} />
                      </div>
                      <dl>
                        <dt>Date</dt>
                        <dd>{formatDateTime(row.output?.created_at || row.output?.report_date || row.latestRun?.started_at)}</dd>
                        <dt>Confidence</dt>
                        <dd>{formatConfidence(row.output?.confidence_score)}</dd>
                        <dt>Platform</dt>
                        <dd>{titleize(row.output?.source_platform || platformFromEngine(row.engine))}</dd>
                      </dl>
                      <p>{row.output?.summary || (row.engine === 'competitor_intelligence' ? 'No competitor output exists yet.' : 'No intelligence output visible yet.')}</p>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
          {!visibleRows.length && <EmptyState title="No engine outputs match" detail="Adjust filters or search text." />}
        </div>

        {selectedRow && (
          <EngineDetailPanel
            engine={selectedRow.engine}
            output={selectedRow.output}
            metrics={selectedRow.metrics}
            latestRun={selectedRow.latestRun}
            items={data.items}
            updates={data.updates}
          />
        )}
      </div>
    </Page>
  )
}

function EngineDetailPanel({
  engine,
  output,
  metrics,
  latestRun,
  items,
  updates,
}: {
  engine: string
  output?: IntelligenceOutput
  metrics: Metric[]
  latestRun?: EngineRun
  items: ContentItem[]
  updates: ContentPlanUpdate[]
}) {
  return (
    <aside className="engine-detail-panel">
      <div className="panel-title">
        <div>
          <h3>{titleize(engine)}</h3>
          <p className="muted">{output ? 'Latest intelligence package' : 'Missing output placeholder'}</p>
        </div>
        <StatusBadge value={engineAvailability(output)} />
      </div>

      {output ? (
        <div className="engine-detail-stack">
          <dl className="definition-grid compact">
            <dt>Created</dt>
            <dd>{formatDateTime(output.created_at)}</dd>
            <dt>Report date</dt>
            <dd>{formatDate(output.report_date)}</dd>
            <dt>Confidence</dt>
            <dd>{formatConfidence(output.confidence_score)}</dd>
            <dt>Source platform</dt>
            <dd>{titleize(output.source_platform)}</dd>
            <dt>Latest run</dt>
            <dd>{latestRun ? <StatusBadge value={latestRun.status} /> : '-'}</dd>
          </dl>

          <section>
            <h4>Summary</h4>
            <p className="report-summary">{output.summary || 'No summary provided.'}</p>
          </section>

          <JsonList title="Key insights" value={output.key_insights} />
          <JsonList title="Recommendations" value={output.recommendations} />
          <JsonList title="Next actions" value={output.next_actions} />

          <EngineSpecificSections engine={engine} output={output} metrics={metrics} items={items} updates={updates} />

          <section>
            <h4>Input sources</h4>
            <pre className="safe-json">{compactJsonBlock(sanitizeForDisplay(output.input_sources || {}))}</pre>
          </section>

          <section>
            <h4>Latest normalized metrics</h4>
            <DataTable
              columns={['Date', 'Platform', 'Metric', 'Value']}
              rows={metrics.slice(0, 12).map((metric) => [
                formatDate(metric.metric_date),
                titleize(metric.source_platform),
                titleize(metric.metric_name),
                metric.metric_value ?? '-',
              ])}
              empty="No normalized metrics visible for this engine."
            />
          </section>

          {latestRun && (
            <section>
              <h4>Latest engine run</h4>
              <dl className="definition-grid compact">
                <dt>Status</dt>
                <dd><StatusBadge value={latestRun.status} /></dd>
                <dt>Mode</dt>
                <dd>{latestRun.mode || '-'}</dd>
                <dt>Started</dt>
                <dd>{formatDateTime(latestRun.started_at)}</dd>
                <dt>Completed</dt>
                <dd>{formatDateTime(latestRun.completed_at)}</dd>
                <dt>Error</dt>
                <dd>{latestRun.error_message || '-'}</dd>
              </dl>
            </section>
          )}

          <DataQualityNotes output={output} metrics={metrics} />
        </div>
      ) : (
        <EmptyState
          title={engine === 'competitor_intelligence' ? 'Competitor intelligence skipped' : 'No output visible'}
          detail="This engine has no readable intelligence_outputs row for the selected client yet."
        />
      )}
    </aside>
  )
}

function EngineSpecificSections({
  engine,
  output,
  metrics,
  items,
  updates,
}: {
  engine: string
  output: IntelligenceOutput
  metrics: Metric[]
  items: ContentItem[]
  updates: ContentPlanUpdate[]
}) {
  const sectionsByEngine: Record<string, string[]> = {
    trends_intelligence: ['trend_opportunities', 'topic_clusters', 'platform_trend_strategy'],
    best_practices_intelligence: ['safety_rules', 'platform_best_practices', 'caption_cta_rules', 'posting_frequency_guidance'],
    demographics_intelligence: ['primary_audiences', 'language_strategy', 'platform_strategy'],
    local_area_intelligence: ['local_opportunities', 'language_recommendations', 'trust_recommendations'],
    special_days_intelligence: ['content_opportunities', 'upcoming_events', 'seasonal_opportunities'],
    content_performance: [
      'strongest_platform',
      'weakest_platform',
      'best_formats',
      'best_content_items',
      'boost_candidates',
      'repurpose_candidates',
      'improve_candidates',
      'platform_role_recommendations',
    ],
    social_media_strategy: [
      'strategy_health_score',
      'readiness_status',
      'platform_priority',
      'content_priorities',
      'tomorrow_content_status',
      'risks_or_warnings',
    ],
  }

  const keys = sectionsByEngine[engine] || []
  const matchingItems = items
    .filter((item) => engine === 'daily_content_production' || includesEngine(item.source_engines, engine))
    .slice(0, 8)
  const matchingUpdates = updates
    .filter((update) => engine === 'adaptive_plan_update' || normalize(update.source_engine) === normalize(engine))
    .slice(0, 5)

  return (
    <>
      {keys.length > 0 && (
        <section>
          <h4>{titleize(engine)} details</h4>
          <div className="specific-grid">
            {keys.map((key) => (
              <div key={key} className="detail-field">
                <span>{titleize(key)}</span>
                <p>{renderCompactValue(findOutputValue(output, key))}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {engine === 'daily_content_production' && (
        <section>
          <h4>Latest produced items</h4>
          <DataTable
            columns={['Item ID', 'Topic', 'Platform', 'Caption', 'Approval', 'Posting time']}
            rows={matchingItems.map((item) => [
              shortId(item.id),
              item.topic || '-',
              titleize(item.platform),
              previewText(item.caption),
              item.approval_status || '-',
              item.posting_time_recommendation || '-',
            ])}
            empty="No produced content items visible."
          />
        </section>
      )}

      {engine === 'adaptive_plan_update' && (
        <section>
          <h4>Adaptive updates</h4>
          <DataTable
            columns={['Type', 'Items appended', 'Duplicates skipped', 'Reason', 'Added items']}
            rows={matchingUpdates.map((update) => [
              update.update_type || '-',
              countJsonItems(update.added_items),
              renderCompactValue(findNestedValue(update.added_items, 'duplicates_skipped')),
              update.update_reason || '-',
              renderCompactValue(update.added_items),
            ])}
            empty="No adaptive plan updates visible."
          />
        </section>
      )}

      {metrics.length > 0 && (
        <section>
          <h4>{titleize(engine)} metric notes</h4>
          <p className="muted">{metrics.length} normalized metric row(s) available for this engine.</p>
        </section>
      )}
    </>
  )
}

function DataQualityNotes({ output, metrics }: { output: IntelligenceOutput; metrics: Metric[] }) {
  const notes = findOutputValue(output, 'data_quality_notes') || findOutputValue(output, 'quality_notes')
  return (
    <section>
      <h4>Data quality notes</h4>
      <p className="muted">{notes ? renderCompactValue(notes) : `${metrics.length} metric row(s); no explicit data quality notes provided.`}</p>
    </section>
  )
}

function ApprovalQueue() {
  const data = useVip()
  const [query, setQuery] = useState('')
  const items = data.items
    .filter((item) => item.status === 'production_ready' || ['draft', 'needs_revision', 'rejected'].includes(normalize(item.approval_status)))
    .filter((item) =>
      [
        item.topic,
        item.content_angle,
        item.caption,
        item.caption_direction,
        item.creative_brief,
        item.platform,
        item.content_format,
        item.source_reason,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase()),
    )

  return (
    <Page title="Approval Queue" subtitle="Production-ready drafts awaiting clinical and brand review.">
      <div className="toolbar">
        <div className="searchbox">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topic, platform, caption" />
        </div>
        <StatusBadge value={`${items.length} visible items`} />
      </div>
      <div className="approval-list">
        {items.length ? items.map((item) => <ApprovalCard key={item.id} item={item} />) : <EmptyState title="No approval items visible" detail="Content plan items with production-ready or revision statuses will appear here after RLS permits the read." />}
      </div>
    </Page>
  )
}

function ApprovalCard({ item }: { item: ContentItem }) {
  return (
    <article className="approval-card">
      <div className="approval-main">
        <div className="row-between">
          <div>
            <p className="eyebrow">{formatDate(item.planned_date)} / {item.platform || 'Platform pending'} / {item.content_format || 'Format pending'}</p>
            <h3>{item.topic || 'Untitled content package'}</h3>
          </div>
          <div className="badge-row">
            <StatusBadge value={item.status || 'draft'} />
            <StatusBadge value={item.approval_status || 'approval pending'} />
          </div>
        </div>
        <p className="caption">{item.caption || item.caption_direction || item.creative_brief || 'Caption copy has not been generated yet.'}</p>
        <ContentMeta item={item} />
        <Link className="text-link" to={`/content/${item.id}`}>Open full detail</Link>
      </div>
      <ActionRail />
    </article>
  )
}

function ActionRail() {
  const actions = ['Approve', 'Reject', 'Request revision', 'Edit draft', 'Mark posted']
  return (
    <div className="action-rail">
      {actions.map((action) => (
        <button key={action} type="button" disabled title="backend route required">
          {action}
          <small>backend route required</small>
        </button>
      ))}
    </div>
  )
}

function DailyContentDetail() {
  const { itemId } = useParams()
  const data = useVip()
  const item = data.items.find((entry) => entry.id === itemId)

  if (!item) {
    return <Page title="Daily Content Detail"><EmptyState title="Content item not found" detail="The item may be outside your assigned client access or not loaded yet." /></Page>
  }

  const fields: Array<[string, unknown]> = [
    ['Planned date', formatDate(item.planned_date)],
    ['Platform', item.platform],
    ['Format', item.content_format],
    ['Topic', item.topic],
    ['Content angle', item.content_angle],
    ['Caption direction', item.caption_direction],
    ['Creative brief', item.creative_brief],
    ['Suggested CTA', item.suggested_cta],
    ['Source reason', item.source_reason],
    ['Priority score', item.priority_score],
    ['Adaptive addition', item.is_adaptive_addition ? 'Yes' : 'No'],
    ['Adaptation reason', item.adaptation_reason],
    ['Source engines', Array.isArray(item.source_engines) ? item.source_engines.join(', ') : item.source_engines],
    ['Caption', item.caption],
    ['Hashtags', Array.isArray(item.hashtags) ? item.hashtags.join(' ') : item.hashtags],
    ['Full script', item.full_script],
    ['Voiceover script', item.voiceover_script],
    ['Scene by scene script', item.scene_by_scene_script],
    ['On-screen text', item.on_screen_text],
    ['Visual direction', item.visual_direction],
    ['Design instructions', item.design_instructions],
    ['Video editing notes', item.video_editing_notes],
    ['Thumbnail direction', item.thumbnail_direction],
    ['Posting time recommendation', item.posting_time_recommendation],
    ['Production notes', item.production_notes],
    ['Approval status', item.approval_status],
  ]

  return (
    <Page title="Daily Content Detail" subtitle={item.topic || 'Production package'}>
      <Panel title="Review Package">
        <div className="detail-grid">
          {fields.map(([label, value]) => (
            <div key={label} className="detail-field">
              <span>{label}</span>
              <p>{String(value || '-')}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Approval Actions">
        <ActionRail />
      </Panel>
    </Page>
  )
}

function CalendarPage() {
  const data = useVip()
  const [platform, setPlatform] = useState('all')
  const [status, setStatus] = useState('all')
  const [formatFilter, setFormatFilter] = useState('all')
  const activePlan = data.plans.find((plan) => normalize(plan.plan_status) === 'active') || data.plans[0]

  const filtered = data.items.filter((item) => {
    return (
      (platform === 'all' || normalize(item.platform) === platform) &&
      (status === 'all' || normalize(item.status) === status || normalize(item.approval_status) === status) &&
      (formatFilter === 'all' || normalize(item.content_format) === formatFilter)
    )
  })

  return (
    <Page title="30-Day Calendar" subtitle="Planned, adaptive, production-ready, and superseded content windows.">
      <div className="toolbar">
        <StatusBadge value={activePlanLabel(activePlan)} />
        <Filter label="Platform" value={platform} values={uniqueOptions(data.items.map((item) => item.platform))} onChange={setPlatform} />
        <Filter label="Status" value={status} values={uniqueOptions(data.items.flatMap((item) => [item.status, item.approval_status]))} onChange={setStatus} />
        <Filter label="Format" value={formatFilter} values={uniqueOptions(data.items.map((item) => item.content_format))} onChange={setFormatFilter} />
      </div>
      <div className="calendar-grid">
        {filtered.length ? filtered.map((item) => <CalendarTile key={item.id} item={item} />) : <EmptyState title="No calendar items match" detail="Adjust filters or wait for content plan generation." />}
      </div>
    </Page>
  )
}

function AnalyticsPage() {
  const data = useVip()
  const groups = ['facebook', 'instagram', 'youtube', 'cross-platform']

  return (
    <Page title="Analytics Overview" subtitle="Normalized metrics and intelligence summaries, grouped by platform.">
      <div className="tabs-grid">
        {groups.map((group) => {
          const metrics = data.metrics.filter((metric) => analyticsGroupMatch(group, metric.source_platform, metric.engine_name))
          const outputs = data.outputs.filter((output) => analyticsGroupMatch(group, output.source_platform, output.engine_name))
          return <AnalyticsCard key={group} title={titleize(group)} metrics={metrics} outputs={outputs} />
        })}
      </div>
    </Page>
  )
}

function StrategyPage() {
  const data = useVip()
  const strategy = latestOutput(data.outputs, 'social_media_strategy')

  return (
    <Page title="Strategy Report" subtitle="Latest social media strategy intelligence output.">
      {strategy ? (
        <Panel title={`${titleize(strategy.engine_name)} / ${formatDate(strategy.report_date)}`}>
          <p className="report-summary">{strategy.summary || 'No summary text was provided.'}</p>
          <JsonList title="Key insights" value={strategy.key_insights} />
          <JsonList title="Recommendations" value={strategy.recommendations} />
          <JsonList title="Next actions" value={strategy.next_actions} />
        </Panel>
      ) : (
        <EmptyState title="Strategy output not available" detail="The social_media_strategy engine is currently marked as a placeholder in the workflow source." />
      )}
    </Page>
  )
}

function LogsPage() {
  const data = useVip()

  return (
    <Page title="Workflow Logs" subtitle="Daily operating runs and engine execution status.">
      <Panel title="Daily Operating Runs">
        <DataTable
          columns={['Status', 'Started', 'Completed', 'Completed engines', 'Failed engines', 'Child executions', 'Errors']}
          rows={data.dailyRuns.map((run) => [
            <StatusBadge value={run.status} />,
            formatDateTime(run.started_at),
            formatDateTime(run.completed_at),
            engineNamesText(run.engines_completed),
            engineNamesText(run.engines_failed),
            childExecutionText(run),
            dailyRunErrorText(run),
          ])}
          empty="No daily operating runs visible."
        />
      </Panel>
      <Panel title="Engine Runs">
        <DataTable
          columns={['Engine', 'Mode', 'Status', 'Started', 'Child / metadata', 'Error']}
          rows={data.engineRuns.map((run) => [
            titleize(run.engine_name),
            run.mode || '-',
            <StatusBadge value={run.status} />,
            formatDateTime(run.started_at),
            compactJson(run.metadata),
            run.error_message || '-',
          ])}
          empty="No engine runs visible."
        />
      </Panel>
    </Page>
  )
}

function ControlsPage() {
  const controls = [
    'Run Full Daily Operating Sequence',
    'Run Facebook Intelligence',
    'Run Instagram Intelligence',
    'Run YouTube Intelligence',
    'Run Content Performance',
    'Generate 30-Day Plan',
    'Generate Daily Content',
    'Run Adaptive Update',
    'Run Strategy Orchestrator',
  ]

  return (
    <Page title="Manual Controls" subtitle="Backend-safe controls reserved for authenticated server API routes.">
      <div className="control-grid">
        {controls.map((control) => (
          <button key={control} type="button" className="control-button" disabled title="secure backend route required">
            <PlayCircle size={19} />
            <span>{control}</span>
            <small>config needed</small>
          </button>
        ))}
      </div>
      <Panel title="Security posture">
        <p className="muted">
          n8n workflow IDs are documented for operators, but webhook URLs and credentials are intentionally absent from browser code.
          Approval and run commands should be implemented as authenticated server routes before enabling these controls.
        </p>
      </Panel>
    </Page>
  )
}

function Page({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="page">
      <div className="page-heading">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-title">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: ComponentType<{ size?: number }>; label: string; value: string; detail: string; tone?: 'good' | 'warning' }) {
  return (
    <article className={`metric-card ${tone || ''}`}>
      <Icon size={21} />
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function DataTable({ columns, rows, empty }: { columns: string[]; rows: ReactNode[][]; empty: string }) {
  if (!rows.length) return <EmptyState title={empty} />
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="empty-state">
      <Clock3 size={22} />
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
    </div>
  )
}

function SetupNotice({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? 'notice compact' : 'notice'}>
      <AlertTriangle size={18} />
      <div>
        <strong>Supabase setup required</strong>
        <p>Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` for Replit or local builds. `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are also supported for local Vite workflows.</p>
      </div>
    </div>
  )
}

function NoClientNotice({ errors }: { errors: string[] }) {
  return (
    <div className="notice">
      <ShieldCheck size={18} />
      <div>
        <strong>No assigned clients visible</strong>
        <p>Sign-in is working, but RLS returned no client rows. Confirm the user has a `client_users` assignment for Aayu Geriatrics and that the relevant tables are exposed to the Data API.</p>
        {errors.length > 0 && <small>{errors[0]}</small>}
      </div>
    </div>
  )
}

function ErrorStrip({ errors }: { errors: string[] }) {
  return (
    <div className="error-strip">
      <AlertTriangle size={16} />
      <span>{errors.slice(0, 3).join(' | ')}</span>
    </div>
  )
}

function Splash({ message }: { message: string }) {
  return (
    <main className="splash">
      <RefreshCw className="spin" size={24} />
      <p>{message}</p>
    </main>
  )
}

function StatusBadge({ value }: { value: string }) {
  const normalized = normalize(value)
  const Icon = isBadStatus(normalized) ? XCircle : isGoodStatus(normalized) ? CheckCircle2 : Clock3
  return (
    <span className={`status-badge ${statusTone(normalized)}`}>
      <Icon size={13} />
      {value}
    </span>
  )
}

function ContentRow({ item, compact }: { item: ContentItem; compact?: boolean }) {
  return (
    <article className={compact ? 'content-row compact' : 'content-row'}>
      <div>
        <strong>{item.topic || 'Untitled content'}</strong>
        <p>{item.platform || 'Platform pending'} / {item.content_format || 'Format pending'} / {formatDate(item.planned_date)}</p>
      </div>
      <StatusBadge value={item.approval_status || item.status || 'pending'} />
    </article>
  )
}

function ContentMeta({ item }: { item: ContentItem }) {
  const rows = [
    ['Angle', item.content_angle],
    ['CTA', item.suggested_cta],
    ['Posting', item.posting_time_recommendation],
    ['Visual', item.visual_direction],
    ['Source', item.source_reason],
    ['Adaptive', item.is_adaptive_addition ? item.adaptation_reason || 'Adaptive addition' : ''],
  ].filter(([, value]) => value)

  return (
    <div className="content-meta">
      {rows.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <p>{value}</p>
        </div>
      ))}
    </div>
  )
}

function CalendarTile({ item }: { item: ContentItem }) {
  return (
    <Link className="calendar-tile" to={`/content/${item.id}`}>
      <span>{formatDate(item.planned_date)}</span>
      <strong>{item.topic || 'Untitled'}</strong>
      <p>{item.platform || 'Platform'} / {item.content_format || 'Format'}</p>
      <div className="badge-row">
        <StatusBadge value={item.status || 'planned'} />
        <StatusBadge value={item.approval_status || 'draft'} />
        {item.is_adaptive_addition && <StatusBadge value="adaptive" />}
      </div>
    </Link>
  )
}

function AnalyticsCard({ title, metrics, outputs }: { title: string; metrics: Metric[]; outputs: IntelligenceOutput[] }) {
  const topMetrics = metrics.slice(0, 5)
  return (
    <Panel title={title}>
      <div className="analytics-summary">
        <MetricCard icon={BarChart3} label="Metric rows" value={String(metrics.length)} detail="Normalized metric rows visible through RLS." />
        <MetricCard icon={FileText} label="Reports" value={String(outputs.length)} detail={outputs[0]?.summary || 'No recent intelligence summary visible.'} />
      </div>
      <DataTable
        columns={['Date', 'Metric', 'Value', 'Engine']}
        rows={topMetrics.map((metric) => [
          formatDate(metric.metric_date),
          titleize(metric.metric_name),
          metric.metric_value ?? '-',
          titleize(metric.engine_name),
        ])}
        empty="No metrics visible for this platform."
      />
    </Panel>
  )
}

function JsonList({ title, value }: { title: string; value: unknown }) {
  const items = Array.isArray(value) ? value : value ? [value] : []
  return (
    <div className="json-list">
      <h4>{title}</h4>
      {items.length ? (
        <ul>
          {items.slice(0, 8).map((item, index) => (
            <li key={index}>{typeof item === 'string' ? item : compactJson(item)}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No entries provided.</p>
      )}
    </div>
  )
}

function Filter({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="filter-control">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">All</option>
        {values.map((entry) => <option key={entry} value={entry}>{titleize(entry)}</option>)}
      </select>
    </label>
  )
}

function latestOutput(outputs: IntelligenceOutput[], engineName: string) {
  return outputs.find((output) => normalize(output.engine_name) === normalize(engineName))
}

function latestEngineOutput(outputs: IntelligenceOutput[], engineName: string) {
  return outputs
    .filter((output) => normalize(output.engine_name) === normalize(engineName))
    .sort((a, b) => dateMillis(b.created_at || b.report_date) - dateMillis(a.created_at || a.report_date))[0]
}

function latestEngineRun(runs: EngineRun[], engineName: string) {
  return runs
    .filter((run) => normalize(run.engine_name) === normalize(engineName))
    .sort((a, b) => dateMillis(b.started_at) - dateMillis(a.started_at))[0]
}

function metricsForEngine(metrics: Metric[], engineName: string) {
  return metrics
    .filter((metric) => normalize(metric.engine_name) === normalize(engineName))
    .sort((a, b) => dateMillis(b.created_at || b.metric_date) - dateMillis(a.created_at || a.metric_date))
}

function engineAvailability(output?: IntelligenceOutput) {
  if (!output) return 'missing'
  const timestamp = dateMillis(output.created_at || output.report_date)
  if (!timestamp) return 'available'
  const ageMs = Date.now() - timestamp
  const staleAfterMs = 7 * 24 * 60 * 60 * 1000
  return ageMs > staleAfterMs ? 'stale' : 'available'
}

function dateMillis(value?: string | null) {
  if (!value) return 0
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function analyticsGroupMatch(group: string, platform?: string | null, engineName?: string | null) {
  const normalizedGroup = normalize(group)
  const normalizedPlatform = normalize(platform)
  const normalizedEngine = normalize(engineName)

  if (normalizedGroup === 'cross-platform') {
    return normalizedPlatform === 'cross_platform_content' || normalizedEngine === 'content_performance'
  }

  return normalizedPlatform === normalizedGroup || normalizedEngine === `${normalizedGroup}_intelligence`
}

function activePlanLabel(plan?: ContentPlan) {
  if (!plan) return 'No active plan'
  return plan.plan_type || plan.plan_status || formatDateRange(plan.plan_start_date, plan.plan_end_date)
}

function formatConfidence(value?: number | null) {
  if (value === null || value === undefined) return '-'
  const normalized = value <= 1 ? value * 100 : value
  return `${Math.round(normalized)}%`
}

function platformFromEngine(engine: string) {
  if (engine.startsWith('facebook')) return 'facebook'
  if (engine.startsWith('instagram')) return 'instagram'
  if (engine.startsWith('youtube')) return 'youtube'
  if (engine === 'content_performance') return 'cross_platform_content'
  return 'cross_platform'
}

function inferPlatformPriority(outputs: IntelligenceOutput[], metrics: Metric[]) {
  const fromOutputs = outputs.find((output) => normalize(output.source_platform) && normalize(output.source_platform) !== 'cross-platform')
  if (fromOutputs?.source_platform) return titleize(fromOutputs.source_platform)
  const counts = metrics.reduce<Record<string, number>>((acc, metric) => {
    const key = normalize(metric.source_platform || 'cross-platform')
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  return top ? titleize(top) : 'Facebook'
}

function normalize(value?: string | null) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
}

function titleize(value?: string | null) {
  return String(value || '-').replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function isGoodStatus(value?: string | null) {
  return ['success', 'completed', 'complete', 'ready', 'approved', 'posted', 'active', 'available', 'operational', 'rls_reads_enabled'].includes(normalize(value))
}

function isBadStatus(value?: string | null) {
  return ['failed', 'error', 'rejected', 'needs_attention', 'attention', 'warning', 'blocked'].includes(normalize(value))
}

function statusTone(value: string) {
  if (isGoodStatus(value)) return 'good'
  if (isBadStatus(value)) return 'bad'
  if (['needs_revision', 'draft', 'pending', 'production_ready', 'stale', 'adaptive'].includes(normalize(value))) return 'warn'
  return 'neutral'
}

function formatDate(value?: string | null) {
  if (!value) return '-'
  try {
    return format(parseISO(value), 'dd MMM yyyy')
  } catch {
    return value
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  try {
    return format(parseISO(value), 'dd MMM yyyy, HH:mm')
  } catch {
    return value
  }
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return 'Plan visible'
  if (start && end) return `${formatDate(start)} - ${formatDate(end)}`
  return formatDate(start || end)
}

function isTomorrow(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.toDateString() === tomorrow.toDateString()
}

function compactJson(value: unknown) {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) return '-'
  try {
    return JSON.stringify(value).slice(0, 180)
  } catch {
    return String(value)
  }
}

function compactJsonBlock(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function sanitizeForDisplay(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeForDisplay)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (/(token|secret|api[_-]?key|password|credential|access[_-]?token)/i.test(key)) {
        return [key, '[redacted]']
      }
      return [key, sanitizeForDisplay(entry)]
    }),
  )
}

function findOutputValue(output: IntelligenceOutput, key: string) {
  const sources = [
    output.input_sources,
    output.key_insights,
    output.recommendations,
    output.next_actions,
  ]

  for (const source of sources) {
    const found = findNestedValue(source, key)
    if (found !== undefined && found !== null && found !== '') return sanitizeForDisplay(found)
  }

  return null
}

function findNestedValue(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedValue(item, key)
      if (found !== undefined) return found
    }
    return undefined
  }

  const object = value as Record<string, unknown>
  if (Object.prototype.hasOwnProperty.call(object, key)) return object[key]

  for (const entry of Object.values(object)) {
    const found = findNestedValue(entry, key)
    if (found !== undefined) return found
  }

  return undefined
}

function renderCompactValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  return compactJson(sanitizeForDisplay(value))
}

function includesEngine(value: unknown, engine: string) {
  if (!value) return false
  if (Array.isArray(value)) return value.some((entry) => normalize(String(entry)) === normalize(engine))
  if (typeof value === 'string') return normalize(value).includes(normalize(engine))
  return compactJson(value).includes(engine)
}

function shortId(value?: string | null) {
  return value ? value.slice(0, 8) : '-'
}

function previewText(value?: string | null) {
  if (!value) return '-'
  return value.length > 90 ? `${value.slice(0, 90)}...` : value
}

function countJsonItems(value: unknown) {
  if (Array.isArray(value)) return String(value.length)
  if (value && typeof value === 'object') {
    const appended = findNestedValue(value, 'items_appended') || findNestedValue(value, 'appended_count')
    if (appended !== undefined) return String(appended)
  }
  return value ? '1' : '0'
}

function metadataError(value?: Record<string, unknown> | null) {
  const error = value?.error || value?.errors
  return error ? compactJson(error) : ''
}

function dailyRunErrorText(run: DailyRun) {
  const failed = run.engines_failed || []
  const failedText = failed
    .map((entry) => entry.error || entry.status || entry.engine)
    .filter(Boolean)
    .join(', ')

  return failedText || metadataError(run.metadata) || run.summary || '-'
}

function engineNamesText(value?: EngineResult[] | null) {
  if (!Array.isArray(value) || !value.length) return '-'
  return value.map((entry) => entry.engine || entry.status || compactJson(entry)).filter(Boolean).join(', ')
}

function childExecutionText(run: DailyRun) {
  const entries = [...(run.engines_completed || []), ...(run.engines_failed || [])]
  const ids = entries
    .map((entry) => entry.child_execution_id)
    .filter((id): id is string => Boolean(id))

  return ids.length ? ids.join(', ') : '-'
}

function uniqueOptions(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(normalize).filter(Boolean))).sort()
}

export default App
