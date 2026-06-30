import { createContext, useContext, useEffect, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import {
  AlertTriangle,
  BarChart3,
  Bookmark,
  Camera,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  Flame,
  Gauge,
  HeartPulse,
  Library,
  LayoutDashboard,
  LogOut,
  MapPin,
  PlayCircle,
  RefreshCw,
  Search,
  Share2,
  Settings2,
  ShieldCheck,
  Stethoscope,
  ThumbsUp,
  TrendingUp,
  Users,
  Video,
  Workflow,
  XCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { LandingPage } from './pages/LandingPage'
import { ToolsPage } from './pages/ToolsPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { Button } from './components/ui/button'
import { SignInPage } from './components/ui/sign-in-flow-1'
import { BadgeDelta } from './components/ui/badge-delta'
import FloatingActionMenu from './components/ui/floating-action-menu'
import { PointsChart } from './components/ui/points-chart'
import type { PointsChartDataPoint } from './components/ui/points-chart'
import { StreakCard } from './components/ui/streak-card'
import type { StreakPeriod } from './components/ui/streak-calendar'
import vipPreviewData from './data/vipPreviewData'
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

type SocialAnalyticsSnapshot = {
  id: string
  client_id: string
  engine_run_id?: string | null
  platform: SocialPlatform
  date_range_start?: string | null
  date_range_end?: string | null
  snapshot_date?: string | null
  profile_metrics?: Record<string, unknown> | null
  audience_metrics?: Record<string, unknown> | null
  engagement_metrics?: Record<string, unknown> | null
  reach_view_metrics?: Record<string, unknown> | null
  content_type_breakdown?: unknown[] | Record<string, unknown> | null
  follower_breakdown?: Record<string, unknown> | null
  top_content?: unknown[] | null
  recent_content?: unknown[] | null
  metric_errors?: unknown[] | null
  source_engine?: string | null
  created_at?: string | null
}

type SocialAnalyticsSummary = {
  id: string
  client_id: string
  platform?: string | null
  summary_date?: string | null
  comparison_label?: string | null
  what_changed?: unknown[] | null
  follower_summary?: string | null
  engagement_summary?: string | null
  views_reach_summary?: string | null
  top_content_summary?: string | null
  recommendations?: unknown[] | null
  source_snapshot_ids?: unknown[] | null
  created_at?: string | null
}

type SocialStreak = {
  id: string
  client_id?: string | null
  client_slug: string
  current_streak: number
  longest_streak: number
  last_post_date?: string | null
  last_checked_date?: string | null
  last_status: 'continued' | 'reset' | 'no_post' | 'scan_failed' | 'unknown' | string
  platforms_posted?: string[] | string | null
  post_count?: number | null
  created_at?: string | null
  updated_at?: string | null
}

type SocialStreakLog = {
  id: string
  client_id?: string | null
  client_slug: string
  scan_date: string
  target_post_date: string
  posted_yesterday: boolean
  platforms_posted?: string[] | string | null
  post_count?: number | null
  status: string
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

type SocialPlatform = 'facebook' | 'instagram' | 'youtube'
type SocialMetricGroup = 'followers' | 'engagement' | 'reach'

type SocialMetricDefinition = {
  group: SocialMetricGroup
  platform: SocialPlatform
  label: string
  names: string[]
  engine: string
}

type MetricMovement = {
  label: string
  platform: SocialPlatform
  value: number | null
  delta: number | null
  state: 'up' | 'down' | 'flat' | 'baseline' | 'unavailable'
  latestDate?: string
  previousDate?: string
  metricNames: string[]
}

type TopContentSummary = {
  platform: string
  title: string
  reason: string
  detail: string
}

type AppData = {
  clients: Client[]
  engineRuns: EngineRun[]
  dailyRuns: DailyRun[]
  outputs: IntelligenceOutput[]
  metrics: Metric[]
  snapshots: SocialAnalyticsSnapshot[]
  analyticsSummaries: SocialAnalyticsSummary[]
  socialStreaks: SocialStreak[]
  socialStreakLogs: SocialStreakLog[]
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
  { to: '/digital', label: 'Digital Growth', icon: Search },
  { to: '/digital/seo', label: 'SEO', icon: TrendingUp },
  { to: '/digital/gbp', label: 'GBP', icon: MapPin },
  { to: '/digital/competitors', label: 'Competitors', icon: Users },
  { to: '/digital/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/digital/website', label: 'Website', icon: Gauge },
  { to: '/digital/content', label: 'Content Gaps', icon: FileText },
  { to: '/workspace', label: 'Team Workspace', icon: ClipboardCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/approvals', label: 'Approval Queue', icon: ClipboardCheck },
  { to: '/calendar', label: '30-Day Calendar', icon: CalendarDays },
  { to: '/strategy', label: 'Strategy Report', icon: FileText },
  { to: '/admin-workflow', label: 'Admin / Workflow Health', icon: Workflow },
  { to: '/controls', label: 'Manual Controls', icon: Settings2 },
]

const advancedNavItems = [
  { to: '/engine-outputs', label: 'Intelligence Library', icon: Library },
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
  { engine: 'doctor_partner_intelligence', category: 'Competitor' },
  { engine: 'google_business_intelligence', category: 'Context Intelligence' },
  { engine: 'website_audit_intelligence', category: 'Context Intelligence' },
  { engine: 'seo_intelligence', category: 'Context Intelligence' },
  { engine: 'local_seo_intelligence', category: 'Context Intelligence' },
  { engine: 'keyword_opportunity_intelligence', category: 'Context Intelligence' },
  { engine: 'content_gap_intelligence', category: 'Context Intelligence' },
  { engine: 'landing_page_conversion_intelligence', category: 'Context Intelligence' },
  { engine: 'campaign_offer_intelligence', category: 'Combination / Planning / Strategy' },
  { engine: 'digital_marketing_strategy', category: 'Combination / Planning / Strategy' },
  { engine: 'digital_marketing_strategy_orchestrator', category: 'Combination / Planning / Strategy' },
]

const libraryEngines = engineCatalog.map((entry) => entry.engine)

const socialMetricDefinitions: SocialMetricDefinition[] = [
  {
    group: 'followers',
    platform: 'facebook',
    label: 'Facebook followers',
    engine: 'facebook_intelligence',
    names: ['facebook_followers_count', 'page_followers', 'page_follows', 'page_follows_unique', 'page_fans', 'fan_count', 'followers_count'],
  },
  {
    group: 'followers',
    platform: 'instagram',
    label: 'Instagram followers',
    engine: 'instagram_intelligence',
    names: ['instagram_followers_count', 'followers_count', 'profile_followers'],
  },
  {
    group: 'followers',
    platform: 'youtube',
    label: 'YouTube subscribers',
    engine: 'youtube_intelligence',
    names: ['youtube_subscribers_count', 'subscriber_count', 'subscribers_count'],
  },
  {
    group: 'engagement',
    platform: 'facebook',
    label: 'Facebook engagement',
    engine: 'facebook_intelligence',
    names: ['total_reactions', 'total_comments', 'total_shares', 'average_engagement_per_post', 'page_post_engagements', 'post_engaged_users'],
  },
  {
    group: 'engagement',
    platform: 'instagram',
    label: 'Instagram interactions',
    engine: 'instagram_intelligence',
    names: ['instagram_total_interactions', 'instagram_total_likes', 'instagram_total_comments', 'instagram_total_shares', 'instagram_total_saves', 'total_interactions', 'likes', 'comments', 'shares', 'saves'],
  },
  {
    group: 'engagement',
    platform: 'youtube',
    label: 'YouTube engagement',
    engine: 'youtube_intelligence',
    names: ['youtube_total_likes', 'youtube_total_comments', 'total_likes', 'total_comments', 'likes', 'comments'],
  },
  {
    group: 'reach',
    platform: 'facebook',
    label: 'Facebook views / reach',
    engine: 'facebook_intelligence',
    names: ['page_views_total', 'facebook_page_views', 'facebook_reach', 'post_impressions', 'post_impressions_unique'],
  },
  {
    group: 'reach',
    platform: 'instagram',
    label: 'Instagram reach',
    engine: 'instagram_intelligence',
    names: ['instagram_total_reach', 'instagram_reach', 'reach', 'impressions', 'views'],
  },
  {
    group: 'reach',
    platform: 'youtube',
    label: 'YouTube views',
    engine: 'youtube_intelligence',
    names: ['youtube_total_recent_views', 'youtube_total_views', 'views', 'view_count', 'total_views'],
  },
]

const emptyData: AppData = {
  clients: [],
  engineRuns: [],
  dailyRuns: [],
  outputs: [],
  metrics: [],
  snapshots: [],
  analyticsSummaries: [],
  socialStreaks: [],
  socialStreakLogs: [],
  plans: [],
  items: [],
  updates: [],
  errors: [],
  loading: false,
  reload: () => undefined,
}

const previewData = vipPreviewData as unknown as Omit<AppData, 'loading' | 'reload'>

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/tools/vip" element={<SignInPage />} />
        <Route path="/login" element={<Navigate to="/tools/vip" replace />} />
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
      <Route
        path="/*"
        element={
          <ProtectedShell session={session}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/digital" element={<DigitalGrowthPage />} />
              <Route path="/digital/:section" element={<DigitalSectionPage />} />
              <Route path="/workspace" element={<WorkspacePage session={session} />} />
              <Route path="/engine-outputs" element={<EngineOutputsPage />} />
              <Route path="/approvals" element={<ApprovalQueue />} />
              <Route path="/content/:itemId" element={<DailyContentDetail />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/strategy" element={<StrategyPage />} />
              <Route path="/admin-workflow" element={<AdminWorkflowHealthPage />} />
              <Route path="/logs" element={<Navigate to="/admin-workflow" replace />} />
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
  const location = useLocation()
  const workspacePreviewAllowed = import.meta.env.DEV && location.pathname.startsWith('/workspace')
  const data = useVipData(supabase, session, selectedClientId, refreshKey)
  const effectiveClientId = selectedClientId || data.clients[0]?.id || ''
  const selectedClient = data.clients.find((client) => client.id === effectiveClientId) || data.clients[0]

  if (!session && hasSupabaseConfig && !workspacePreviewAllowed) {
    return <Navigate to="/tools/vip" replace />
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
        <VipFloatingMenu />
      </div>
    </VipContext.Provider>
  )
}

function VipFloatingMenu() {
  const navigate = useNavigate()
  const menuItems = [...navItems, ...advancedNavItems]

  return (
    <FloatingActionMenu
      options={menuItems.map((item) => ({
        label: item.label,
        Icon: <item.icon className="h-4 w-4" />,
        onClick: () => navigate(item.to),
      }))}
    />
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
    let poll: number | undefined
    let channel: ReturnType<SupabaseClient['channel']> | null = null

    async function load() {
      if (!client || (!session && hasSupabaseConfig)) {
        setState(client ? { ...emptyData, loading: false } : { ...previewData, loading: false })
        return
      }

      setState((current) => ({ ...current, loading: true, errors: [] }))
      const errors: string[] = []

      const clientRows = await loadClients(client, errors)
      const targetClientId = selectedClientId || clientRows[0]?.id || ''

      const [engineRuns, dailyRuns, outputs, metrics, snapshots, analyticsSummaries, socialStreaks, socialStreakLogs, plans, items, updates] = await Promise.all([
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
        safeOptionalSelect<SocialAnalyticsSnapshot>(
          client,
          'social_analytics_snapshots',
          [
            'id',
            'client_id',
            'engine_run_id',
            'platform',
            'date_range_start',
            'date_range_end',
            'snapshot_date',
            'profile_metrics',
            'audience_metrics',
            'engagement_metrics',
            'reach_view_metrics',
            'content_type_breakdown',
            'follower_breakdown',
            'top_content',
            'recent_content',
            'metric_errors',
            'source_engine',
            'created_at',
          ].join(', '),
          (query) => query.eq('client_id', targetClientId).order('created_at', { ascending: false }).limit(120),
          targetClientId,
        ),
        safeOptionalSelect<SocialAnalyticsSummary>(
          client,
          'social_analytics_daily_summaries',
          [
            'id',
            'client_id',
            'platform',
            'summary_date',
            'comparison_label',
            'what_changed',
            'follower_summary',
            'engagement_summary',
            'views_reach_summary',
            'top_content_summary',
            'recommendations',
            'source_snapshot_ids',
            'created_at',
          ].join(', '),
          (query) => query.eq('client_id', targetClientId).order('created_at', { ascending: false }).limit(60),
          targetClientId,
        ),
        safeOptionalSelect<SocialStreak>(
          client,
          'client_social_streaks',
          'id, client_id, client_slug, current_streak, longest_streak, last_post_date, last_checked_date, last_status, platforms_posted, post_count, created_at, updated_at',
          (query) => query.eq('client_id', targetClientId).limit(1),
          targetClientId,
        ),
        safeOptionalSelect<SocialStreakLog>(
          client,
          'client_social_streak_logs',
          'id, client_id, client_slug, scan_date, target_post_date, posted_yesterday, platforms_posted, post_count, status, created_at',
          (query) => query.eq('client_id', targetClientId).order('target_post_date', { ascending: false }).limit(14),
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
          snapshots,
          analyticsSummaries,
          socialStreaks,
          socialStreakLogs,
          plans,
          items,
          updates,
          errors: Array.from(new Set(errors)),
          loading: false,
        })
      }
    }

    load()
    if (client && (!hasSupabaseConfig || session)) {
      poll = window.setInterval(() => void load(), 15000)

      if (session?.access_token) client.realtime.setAuth(session.access_token)
      channel = client
        .channel('vip-dashboard-live-data')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'engine_runs' }, () => void load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_operating_runs' }, () => void load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'intelligence_outputs' }, () => void load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'normalized_metrics' }, () => void load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_plans' }, () => void load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_plan_items' }, () => void load())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_plan_updates' }, () => void load())
        .subscribe()
    }

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', refreshOnFocus)
    window.addEventListener('focus', refreshOnFocus)

    return () => {
      cancelled = true
      if (poll) window.clearInterval(poll)
      if (channel) void client?.removeChannel(channel)
      document.removeEventListener('visibilitychange', refreshOnFocus)
      window.removeEventListener('focus', refreshOnFocus)
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

async function safeOptionalSelect<T>(
  client: SupabaseClient,
  table: string,
  columns: string,
  refine?: (query: QueryBuilder<T>) => QueryBuilder<T>,
  skipWhenMissingId?: string,
): Promise<T[]> {
  if (skipWhenMissingId === '') return []
  let query = client.from(table).select(columns) as unknown as QueryBuilder<T>
  if (refine) query = refine(query)
  const { data, error } = await query
  if (error) return []
  return (data || []) as T[]
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
  const navigate = useNavigate()

  async function signOut() {
    await supabase?.auth.signOut()
    navigate('/tools/vip', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <Link className="brand brand-compact" to="/dashboard" aria-label="Go to dashboard">
          <span className="brand-mark">
            <HeartPulse size={19} />
          </span>
        </Link>
        <div>
          <p className="eyebrow">Healthcare social intelligence</p>
          <h1>Aayu Geriatrics Command Desk</h1>
        </div>
      </div>
      <div className="topbar-actions">
        <StatusBadge value={hasSupabaseConfig ? 'RLS reads enabled' : 'env required'} />
        <select className="client-select" value={selectedClientId} onChange={(event) => onClientChange(event.target.value)} disabled={!clients.length}>
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
        <Button className="icon-button" size="icon" onClick={onRefresh} aria-label="Refresh data">
          <RefreshCw size={17} className={loading ? 'spin' : ''} />
        </Button>
        {session && (
          <Button className="icon-button" size="icon" onClick={signOut} aria-label="Sign out">
            <LogOut size={17} />
          </Button>
        )}
      </div>
    </header>
  )
}

function Dashboard() {
  const data = useVip()
  const productionReady = data.items.filter((item) => item.status === 'production_ready')
  const pendingApprovals = productionReady.filter((item) => !['approved', 'posted'].includes(normalize(item.approval_status))).length
  const tomorrowItem = findTomorrowContent(data.items)
  const topContent = buildTopContent(data.outputs, data.items)
  const followerMetrics = buildMetricGroup(data.metrics, 'followers')
  const engagementMetrics = buildMetricGroup(data.metrics, 'engagement')
  const reachMetrics = buildMetricGroup(data.metrics, 'reach')

  return (
    <Page title="Dashboard" subtitle="Simple social media performance for the latest available run.">
      <section className="social-metric-grid">
        <SocialPostingStreakWidget streak={data.socialStreaks[0]} logs={data.socialStreakLogs} loading={data.loading} />
        <SocialMetricCard icon={Users} label="Followers" rows={followerMetrics} />
        <SocialMetricCard icon={ThumbsUp} label="Engagement" rows={engagementMetrics} />
        <SocialMetricCard icon={Eye} label="Views / Reach" rows={reachMetrics} />
      </section>

      <section className="split-grid">
        <Panel title="Top Content">
          {topContent.length ? (
            <div className="top-content-list">
              {topContent.slice(0, 2).map((item, index) => (
                <article className="insight-row" key={`${item.platform}-${index}`}>
                  <div>
                    <StatusBadge value={item.platform} />
                    <strong>{item.title}</strong>
                    <p>{item.reason}</p>
                  </div>
                  <details>
                    <summary>Know more</summary>
                    <p>{item.detail}</p>
                  </details>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No top content visible" detail="Content performance output has not exposed a safe summary yet." />
          )}
        </Panel>
        <Panel title="Tomorrow's Post" action={<Link to="/approvals">Approval Queue</Link>}>
          {tomorrowItem ? (
            <article className="tomorrow-card">
              <div>
                <StatusBadge value={tomorrowItem.platform || 'platform pending'} />
                <h3>{tomorrowItem.topic || 'Untitled content'}</h3>
                <p>{tomorrowItem.content_format || 'Format pending'}</p>
              </div>
              <StatusBadge value={tomorrowItem.approval_status || tomorrowItem.status || 'pending'} />
              <Link className="text-link" to={`/content/${tomorrowItem.id}`}>Open detail</Link>
            </article>
          ) : (
            <EmptyState title="No post planned for tomorrow" detail="The next production-ready item will appear here when visible through RLS." />
          )}
        </Panel>
      </section>

      <Panel title="Approvals">
        <div className="approval-summary">
          <MetricCard icon={ClipboardCheck} label="Pending approvals" value={String(pendingApprovals)} detail={`${productionReady.length} production-ready item(s).`} tone={pendingApprovals ? 'warning' : 'good'} />
          <Button asChild className="quiet-action">
            <Link to="/approvals">Review queue</Link>
          </Button>
        </div>
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
    <Page title="Intelligence Library" subtitle="Advanced engine summaries and details for operators.">
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
                      className={`engine-card flow-hover-surface ${selectedRow?.engine === row.engine ? 'selected' : ''}`}
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

type DigitalSectionKey = 'seo' | 'gbp' | 'competitors' | 'doctors' | 'website' | 'content' | 'analytics' | 'strategy'

type DigitalSectionConfig = {
  key: DigitalSectionKey
  title: string
  subtitle: string
  engines: string[]
  icon: ComponentType<{ size?: number }>
  primaryFields: string[]
}

const digitalSections: DigitalSectionConfig[] = [
  {
    key: 'seo',
    title: 'SEO',
    subtitle: 'Organic visibility, local search coverage, and keyword opportunities.',
    engines: ['seo_intelligence', 'local_seo_intelligence', 'keyword_opportunity_intelligence'],
    icon: TrendingUp,
    primaryFields: ['seo_health_score', 'recommendations', 'content_plan_inputs'],
  },
  {
    key: 'gbp',
    title: 'Google Business Profile',
    subtitle: 'GBP status and safe next actions while API quota is unavailable.',
    engines: ['google_business_intelligence'],
    icon: MapPin,
    primaryFields: ['setup_requirements', 'reputation_health_score', 'next_actions'],
  },
  {
    key: 'competitors',
    title: 'Geriatric Competitors',
    subtitle: 'Only geriatric, elder-care, senior-care, clinic, or hospital competitors near Aayu.',
    engines: ['competitor_intelligence'],
    icon: Users,
    primaryFields: ['competitors', 'category_filter', 'geography'],
  },
  {
    key: 'doctors',
    title: 'Related Doctors',
    subtitle: 'High-rated nearby specialists for referral, partnership, and care-network planning.',
    engines: ['doctor_partner_intelligence'],
    icon: Stethoscope,
    primaryFields: ['doctors', 'doctors_by_specialty', 'rating_filter'],
  },
  {
    key: 'website',
    title: 'Website',
    subtitle: 'WordPress service signals, PageSpeed findings, landing-page conversion notes.',
    engines: ['website_audit_intelligence', 'landing_page_conversion_intelligence'],
    icon: Gauge,
    primaryFields: ['scores', 'detected_service_terms', 'website_url'],
  },
  {
    key: 'content',
    title: 'Content Gaps',
    subtitle: 'Service topics and patient-education gaps detected from site and content inputs.',
    engines: ['content_gap_intelligence', 'campaign_offer_intelligence'],
    icon: FileText,
    primaryFields: ['content_gap_candidates', 'content_plan_inputs', 'campaign_plan_inputs'],
  },
  {
    key: 'analytics',
    title: 'GA4',
    subtitle: 'Website traffic rows from the configured GA4 property.',
    engines: ['digital_marketing_strategy'],
    icon: BarChart3,
    primaryFields: ['total_users', 'sessions', 'page_views', 'source_medium'],
  },
  {
    key: 'strategy',
    title: 'Digital Strategy',
    subtitle: 'Overall digital marketing readiness, urgent fixes, and growth opportunities.',
    engines: ['digital_marketing_strategy', 'digital_marketing_strategy_orchestrator'],
    icon: Bookmark,
    primaryFields: ['digital_marketing_health_score', 'urgent_fixes', 'top_growth_opportunities'],
  },
]

function DigitalGrowthPage() {
  const data = useVip()
  const cards = digitalSections.map((section) => buildDigitalSectionCard(section, data.outputs, data.engineRuns))
  const readyCount = cards.filter((card) => card.output).length
  const attentionCount = cards.filter((card) => card.status === 'missing' || card.status === 'skipped_quota_unavailable').length

  return (
    <Page title="Digital Growth" subtitle="Focused marketing intelligence from the n8n digital engines.">
      <section className="metric-grid">
        <MetricCard icon={Search} label="Digital pages" value={String(digitalSections.length)} detail="Separate pages for each useful workflow area." />
        <MetricCard icon={CheckCircle2} label="With output" value={String(readyCount)} detail="Latest persisted rows visible to the dashboard." tone={readyCount ? 'good' : undefined} />
        <MetricCard icon={AlertTriangle} label="Needs run/access" value={String(attentionCount)} detail="Includes first-run gaps and intentional GBP skip state." tone={attentionCount ? 'warning' : 'good'} />
        <MetricCard icon={Clock3} label="Freshness" value={cards.some((card) => card.status === 'stale') ? 'Review' : 'Current'} detail="Outputs older than 7 days are marked stale." />
      </section>

      <section className="digital-grid">
        {cards.map((card) => (
          <Link key={card.config.key} className="digital-card flow-hover-surface" to={`/digital/${card.config.key}`}>
            <div className="digital-card__header">
              <span className="digital-card__icon"><card.config.icon size={18} /></span>
              <StatusBadge value={card.status} />
            </div>
            <h3>{card.config.title}</h3>
            <p>{card.summary}</p>
            <div className="digital-card__meta">
              <span>{card.date}</span>
              <span>{card.confidence}</span>
            </div>
          </Link>
        ))}
      </section>
    </Page>
  )
}

function DigitalSectionPage() {
  const { section } = useParams()
  const data = useVip()
  const config = digitalSections.find((entry) => entry.key === section) || digitalSections[0]
  const outputs = config.engines
    .map((engine) => latestEngineOutput(data.outputs, engine))
    .filter((output): output is IntelligenceOutput => Boolean(output))
  const runs = config.engines.map((engine) => latestEngineRun(data.engineRuns, engine)).filter((run): run is EngineRun => Boolean(run))
  const latest = outputs[0]
  const findings = outputs.flatMap((output) => readableList(output.key_insights)).slice(0, 8)
  const recommendations = outputs.flatMap((output) => readableList(output.recommendations)).slice(0, 8)
  const actions = outputs.flatMap((output) => readableList(output.next_actions)).slice(0, 8)

  return (
    <Page title={config.title} subtitle={config.subtitle}>
      <section className="metric-grid">
        <MetricCard icon={config.icon} label="Status" value={latest ? titleize(outputStatus(latest)) : 'Waiting'} detail={latest?.summary || 'No persisted output visible yet. Run this engine once after n8n execution is available.'} tone={latest ? (isBadStatus(outputStatus(latest)) ? 'warning' : 'good') : 'warning'} />
        <MetricCard icon={ShieldCheck} label="Confidence" value={formatConfidence(latest?.confidence_score)} detail={latest ? `Source: ${titleize(latest.source_platform)}` : 'Confidence appears after first successful output.'} />
        <MetricCard icon={Clock3} label="Latest output" value={latest ? formatDate(latest.report_date) : '-'} detail={latest ? formatDateTime(latest.created_at) : 'No date visible.'} />
        <MetricCard icon={Workflow} label="Latest run" value={runs[0]?.status || '-'} detail={runs[0] ? formatDateTime(runs[0].started_at) : 'No engine run visible.'} />
      </section>

      <section className="split-grid">
        <Panel title="Key Findings">
          <ReadableList items={findings} empty="No concise findings visible yet." />
        </Panel>
        <Panel title="Recommended Actions">
          <ReadableList items={actions.length ? actions : recommendations} empty="No next actions visible yet." />
        </Panel>
      </section>

      <Panel title={`${config.title} Details`}>
        {outputs.length ? (
          <div className="digital-detail-stack">
            {outputs.map((output) => (
              <DigitalOutputSummary key={output.id} output={output} fields={config.primaryFields} />
            ))}
          </div>
        ) : (
          <EmptyState title="Waiting for first output" detail="This page is connected to the workflow tables. It will populate after n8n can execute and persist this engine." />
        )}
      </Panel>

      <Panel title="Latest Rows">
        <DataTable
          columns={['Engine', 'Source', 'Status', 'Summary']}
          rows={outputs.map((output) => [
            titleize(output.engine_name),
            titleize(output.source_platform),
            <StatusBadge value={outputStatus(output)} />,
            output.summary || '-',
          ])}
          empty="No persisted rows visible for this page."
        />
      </Panel>
    </Page>
  )
}

function DigitalOutputSummary({ output, fields }: { output: IntelligenceOutput; fields: string[] }) {
  const insightCount = readableList(output.key_insights).length
  const actionCount = readableList(output.next_actions).length

  return (
    <article className="digital-output-card">
      <div className="row-between">
        <div>
          <p className="eyebrow">{titleize(output.engine_name)} / {titleize(output.source_platform)}</p>
          <h3>{output.summary || 'Output summary pending'}</h3>
        </div>
        <StatusBadge value={outputStatus(output)} />
      </div>
      <div className="specific-grid">
        <div className="detail-field">
          <span>Insights</span>
          <p>{insightCount}</p>
        </div>
        <div className="detail-field">
          <span>Actions</span>
          <p>{actionCount}</p>
        </div>
        <div className="detail-field">
          <span>Confidence</span>
          <p>{formatConfidence(output.confidence_score)}</p>
        </div>
        <div className="detail-field">
          <span>Report date</span>
          <p>{formatDate(output.report_date)}</p>
        </div>
      </div>
      <div className="specific-grid">
        {fields.map((field) => (
          <div key={field} className="detail-field">
            <span>{titleize(field)}</span>
            <p>{renderCompactValue(findOutputValue(output, field))}</p>
          </div>
        ))}
      </div>
      <PlacesOutputDetails output={output} />
    </article>
  )
}

function PlacesOutputDetails({ output }: { output: IntelligenceOutput }) {
  if (normalize(output.engine_name) === 'competitor_intelligence') {
    const competitors = placesRowsFromUnknown(findOutputValue(output, 'competitors')).slice(0, 12)
    return (
      <section className="places-output-section">
        <h4>Competitor Profiles</h4>
        <PlacesCardGrid rows={competitors} empty="No competitor profiles were returned in this output." />
      </section>
    )
  }

  if (normalize(output.engine_name) === 'doctor_partner_intelligence') {
    const doctors = placesRowsFromUnknown(findOutputValue(output, 'doctors')).slice(0, 15)
    const doctorsBySpecialty = groupedPlacesRowsFromUnknown(findOutputValue(output, 'doctors_by_specialty'))
    return (
      <section className="places-output-section">
        <h4>Doctor / Provider Shortlist</h4>
        <PlacesCardGrid rows={doctors} empty="No doctor or provider profiles were returned in this output." />
        {doctorsBySpecialty.length > 0 && (
          <div className="places-specialty-grid">
            {doctorsBySpecialty.map((group) => (
              <article key={group.label} className="places-specialty-card">
                <strong>{titleize(group.label)}</strong>
                <ul>
                  {group.rows.slice(0, 6).map((row) => (
                    <li key={`${group.label}-${row.name}`}>{row.name}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </section>
    )
  }

  return null
}

type PlacesRow = {
  name: string
  category?: string
  specialty?: string
  rating?: string
  reviews?: string
  address?: string
  distance?: string
}

function PlacesCardGrid({ rows, empty }: { rows: PlacesRow[]; empty: string }) {
  if (!rows.length) return <EmptyState title={empty} />
  return (
    <div className="places-card-grid">
      {rows.map((row, index) => (
        <article key={`${row.name}-${index}`} className="places-card">
          <div className="places-card__top">
            <strong>{row.name}</strong>
            {(row.rating || row.reviews) && <span>{[row.rating && `${row.rating} stars`, row.reviews && `${row.reviews} reviews`].filter(Boolean).join(' / ')}</span>}
          </div>
          <div className="badge-row">
            {row.specialty && <StatusBadge value={titleize(row.specialty)} />}
            {row.category && <StatusBadge value={titleize(row.category)} />}
            {row.distance && <StatusBadge value={row.distance} />}
          </div>
          {row.address && <p>{row.address}</p>}
        </article>
      ))}
    </div>
  )
}

function ReadableList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <EmptyState title="Nothing visible yet" detail={empty} />
  return (
    <div className="readable-list">
      {items.map((item, index) => (
        <div className="insight-row" key={`${item}-${index}`}>
          <strong>{index + 1}</strong>
          <p>{item}</p>
        </div>
      ))}
    </div>
  )
}

function buildDigitalSectionCard(section: DigitalSectionConfig, outputs: IntelligenceOutput[], runs: EngineRun[]) {
  const output = section.engines.map((engine) => latestEngineOutput(outputs, engine)).find(Boolean)
  const run = section.engines.map((engine) => latestEngineRun(runs, engine)).find(Boolean)
  const status = output ? outputStatus(output) : run?.status || 'missing'
  return {
    config: section,
    output,
    status,
    summary: output?.summary || 'No persisted output yet. Run the engine once to populate this page.',
    date: output ? formatDate(output.report_date) : run ? formatDateTime(run.started_at) : 'No run visible',
    confidence: output ? `${formatConfidence(output.confidence_score)} confidence` : 'Awaiting output',
  }
}

function outputStatus(output: IntelligenceOutput) {
  const fromInput = findOutputValue(output, 'status')
  return String(fromInput || engineAvailability(output))
}

function readableList(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value.map(readableText).filter(Boolean).slice(0, 20)
  if (typeof value === 'string') return value.split(/\n|•|;/).map((item) => item.trim()).filter(Boolean)
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([key, entry]) => `${titleize(key)}: ${renderCompactValue(entry)}`)
  return [String(value)]
}

function readableText(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (!value) return ''
  const object = value as Record<string, unknown>
  return previewText(String(object.summary || object.title || object.name || object.action || object.recommendation || renderCompactValue(object)))
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
        <div className="approval-list-fields">
          <span>{item.platform || 'Platform pending'}</span>
          <span>{item.content_format || 'Format pending'}</span>
          <span>{formatDate(item.planned_date)}</span>
          <span>{item.approval_status || item.status || 'pending'}</span>
        </div>
        <Link className="text-link" to={`/content/${item.id}`}>Open caption and script</Link>
      </div>
    </article>
  )
}

function ActionRail() {
  const actions = ['Approve', 'Reject', 'Request revision', 'Edit draft', 'Mark posted']
  return (
    <div className="action-rail">
      {actions.map((action) => (
        <button key={action} type="button" className="flow-hover-surface" disabled title="backend route required">
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
        <ContentMeta item={item} />
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
  const activePlan =
    data.plans.find((plan) => normalize(plan.plan_type) === 'real_time_workflow_content_plan' && normalize(plan.plan_status) === 'active') ||
    data.plans.find((plan) => normalize(plan.plan_status) === 'active') ||
    data.plans[0]
  const activePlanItems = activePlan ? data.items.filter((item) => item.content_plan_id === activePlan.id) : data.items

  const filtered = activePlanItems.filter((item) => {
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
        <Filter label="Platform" value={platform} values={uniqueOptions(activePlanItems.map((item) => item.platform))} onChange={setPlatform} />
        <Filter label="Status" value={status} values={uniqueOptions(activePlanItems.flatMap((item) => [item.status, item.approval_status]))} onChange={setStatus} />
        <Filter label="Format" value={formatFilter} values={uniqueOptions(activePlanItems.map((item) => item.content_format))} onChange={setFormatFilter} />
      </div>
      <div className="calendar-grid">
        {filtered.length ? filtered.map((item) => <CalendarTile key={item.id} item={item} />) : <EmptyState title="No calendar items match" detail="Adjust filters or wait for content plan generation." />}
      </div>
    </Page>
  )
}

function AnalyticsPage() {
  const data = useVip()
  const [tab, setTab] = useState<'overview' | SocialPlatform | 'content'>('overview')
  const [range, setRange] = useState<'latest' | '7d' | '28d'>('latest')
  const platforms: SocialPlatform[] = ['facebook', 'instagram', 'youtube']
  const analytics = platforms.map((platform) => buildPlatformAnalytics(platform, data.snapshots, data.analyticsSummaries, data.metrics, range))
  const topAcrossPlatforms = analytics.flatMap((entry) => entry.topContent.map((content) => ({ ...content, platform: entry.platform }))).sort((a, b) => b.score - a.score)
  const bestFormat = bestContentFormat(analytics)
  const selectedPlatform = platforms.includes(tab as SocialPlatform) ? analytics.find((entry) => entry.platform === tab) : null
  const availableSnapshots = data.snapshots.length

  return (
    <Page title="Analytics" subtitle="Native-style social media analytics for Aayu Geriatrics.">
      <div className="analytics-toolbar">
        <div className="analytics-tabs" role="tablist" aria-label="Analytics views">
          {[
            ['overview', 'Overview'],
            ['facebook', 'Facebook'],
            ['instagram', 'Instagram'],
            ['youtube', 'YouTube'],
            ['content', 'Content Performance'],
          ].map(([value, label]) => (
            <Button key={value} variant={tab === value ? 'default' : 'ghost'} size="sm" aria-pressed={tab === value} onClick={() => setTab(value as typeof tab)}>
              {label}
            </Button>
          ))}
        </div>
        <label className="filter-control">
          <span>Date range</span>
          <select value={range} onChange={(event) => setRange(event.target.value as typeof range)}>
            <option value="latest">Latest run</option>
            <option value="7d">Last 7 days</option>
            <option value="28d">Last 28 days</option>
          </select>
        </label>
      </div>

      {availableSnapshots === 0 && (
        <div className="notice compact">
          <AlertTriangle size={18} />
          <div>
            <strong>Analytics snapshots not visible yet</strong>
            <p>The page is using normalized_metrics fallback rows. Apply the new snapshot tables and refresh the analytics workflow for full platform-style details.</p>
          </div>
        </div>
      )}

      {tab === 'overview' && (
        <>
          <section className="analytics-hero-grid">
            <AnalyticsMetricTile title="Followers / Subscribers" icon={Users} analytics={analytics} metric="followers" />
            <AnalyticsMetricTile title="Views / Reach" icon={Eye} analytics={analytics} metric="views" />
            <AnalyticsMetricTile title="Interactions" icon={ThumbsUp} analytics={analytics} metric="interactions" />
            <article className="metric-card">
              <TrendingUp size={21} />
              <span>Best content format</span>
              <strong>{bestFormat?.label || 'Not available'}</strong>
              <p>{bestFormat ? `${bestFormat.count} item(s) visible across snapshots.` : 'Not available from API yet.'}</p>
            </article>
          </section>

          <section className="split-grid">
            <Panel title="Movement Trend">
              <PointsChart
                title="Views / reach from available rows"
                data={buildOverviewChartData(data.metrics, analytics)}
                yAxisLabel="Volume"
              />
            </Panel>
            <Panel title="Top Content Across Platforms">
              <ContentRows rows={topAcrossPlatforms.slice(0, 5)} empty="No top content visible from analytics snapshots yet." />
            </Panel>
          </section>

          <Panel title="Recommendation Summary">
            <div className="recommendation-grid">
              {analytics.map((entry) => (
                <article key={entry.platform} className="detail-field">
                  <span>{titleize(entry.platform)}</span>
                  <p>{entry.summary?.recommendations?.length ? renderCompactValue(entry.summary.recommendations[0]) : entry.summary?.top_content_summary || 'Not available from API yet.'}</p>
                </article>
              ))}
            </div>
          </Panel>
        </>
      )}

      {selectedPlatform && <PlatformAnalyticsCard analytics={selectedPlatform} />}

      {tab === 'content' && <ContentPerformanceAnalytics analytics={analytics} />}
    </Page>
  )
}

function StrategyPage() {
  const data = useVip()
  const strategy = latestOutput(data.outputs, 'social_media_strategy')

  return (
    <Page title="Strategy Report" subtitle="Concise direction from the latest social media strategy output.">
      {strategy ? (
        <Panel title={`${titleize(strategy.engine_name)} / ${formatDate(strategy.report_date)}`}>
          <p className="report-summary">{strategy.summary || 'No summary text was provided.'}</p>
          <div className="specific-grid strategy-brief">
            {['platform_priority', 'content_priorities', 'next_actions', 'risks_or_warnings'].map((key) => (
              <div key={key} className="detail-field">
                <span>{titleize(key)}</span>
                <p>{renderCompactValue(findOutputValue(strategy, key))}</p>
              </div>
            ))}
          </div>
          <details className="details-panel">
            <summary>Know more</summary>
            <JsonList title="Key insights" value={strategy.key_insights} />
            <JsonList title="Recommendations" value={strategy.recommendations} />
            <JsonList title="Next actions" value={strategy.next_actions} />
          </details>
        </Panel>
      ) : (
        <EmptyState title="Strategy output not available" detail="The social_media_strategy engine is currently marked as a placeholder in the workflow source." />
      )}
    </Page>
  )
}

function AdminWorkflowHealthPage() {
  const data = useVip()
  const latestDaily = data.dailyRuns[0]
  const latestStrategy = latestOutput(data.outputs, 'social_media_strategy')
  const failedEngines = data.engineRuns.filter((run) => isBadStatus(run.status))
  const healthScore = findOutputValue(latestStrategy, 'strategy_health_score') || latestStrategy?.confidence_score
  const readiness = findOutputValue(latestStrategy, 'readiness_status') || (failedEngines.length ? 'attention' : 'operational')
  const metricErrors = data.dailyRuns.reduce((total, run) => {
    const count = findNestedValue(run.metadata, 'metric_errors_count')
    return total + (typeof count === 'number' ? count : Number(count || 0))
  }, 0)

  return (
    <Page title="Admin / Workflow Health" subtitle="Operational run status, engine health, strategy readiness, and failures.">
      <section className="metric-grid">
        <MetricCard icon={Gauge} label="Strategy health" value={renderCompactValue(healthScore)} detail={latestStrategy?.summary || 'No strategy output visible yet.'} />
        <MetricCard icon={ShieldCheck} label="Readiness" value={renderCompactValue(readiness)} detail={failedEngines.length ? `${failedEngines.length} engine warning(s)` : 'No failed engine runs in the latest window.'} tone={failedEngines.length ? 'warning' : 'good'} />
        <MetricCard icon={Workflow} label="Latest run" value={latestDaily?.status || '-'} detail={latestDaily ? formatDateTime(latestDaily.started_at) : 'No daily operating run visible.'} />
        <MetricCard icon={AlertTriangle} label="Metric errors" value={String(metricErrors)} detail="From daily run metadata when available." tone={metricErrors ? 'warning' : 'good'} />
      </section>

      {latestDaily && (
        <Panel title="Latest Daily Operating Run">
          <dl className="definition-grid">
            <dt>Status</dt>
            <dd><StatusBadge value={latestDaily.status} /></dd>
            <dt>Started</dt>
            <dd>{formatDateTime(latestDaily.started_at)}</dd>
            <dt>Completed</dt>
            <dd>{formatDateTime(latestDaily.completed_at)}</dd>
            <dt>Completed engines</dt>
            <dd>{engineNamesText(latestDaily.engines_completed)}</dd>
            <dt>Failed engines</dt>
            <dd>{engineNamesText(latestDaily.engines_failed)}</dd>
            <dt>Child executions</dt>
            <dd>{childExecutionText(latestDaily)}</dd>
            <dt>Errors</dt>
            <dd>{dailyRunErrorText(latestDaily)}</dd>
          </dl>
        </Panel>
      )}

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
          <button key={control} type="button" className="control-button flow-hover-surface" disabled title="secure backend route required">
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

function SocialPostingStreakWidget({ streak, logs, loading }: { streak?: SocialStreak; logs: SocialStreakLog[]; loading: boolean }) {
  const postedPeriods: StreakPeriod[] = logs
    .filter((log) => log.posted_yesterday && normalize(log.status) !== 'scan_failed')
    .map((log) => ({ periodStart: log.target_post_date, periodEnd: log.target_post_date }))
  const platforms = normalizeStringArray(streak?.platforms_posted)
  const status = normalize(streak?.last_status)
  const statusCopy = streakStatusCopy(status, streak)

  if (loading) {
    return (
      <article className="social-streak-shell is-loading">
        <div className="social-streak-loading-icon">
          <Flame size={22} />
        </div>
        <span>Posting streak</span>
        <strong>Loading</strong>
        <p>Checking the latest persisted scan summary.</p>
      </article>
    )
  }

  if (!streak) {
    return (
      <article className="social-streak-shell">
        <div className="social-streak-loading-icon">
          <Flame size={22} />
        </div>
        <span>Posting streak</span>
        <strong>Not started</strong>
        <p>Based on connected social platform scans.</p>
      </article>
    )
  }

  return (
    <StreakCard
      className={`social-streak-card social-streak-card--${statusCopy.tone}`}
      title="Posting streak"
      actionLabel={statusCopy.label}
      currentStreak={streak.current_streak}
      longestStreak={streak.longest_streak}
      total={streak.post_count || 0}
      streak={postedPeriods}
      showHowItWorks
      howItWorksTitle="Based on connected social platform scans."
      howItWorksItems={[
        'Posting at least once yesterday keeps the streak active.',
        'Manual reruns for the same target date are idempotent.',
        'Failed scans keep the previous streak until activity can be verified.',
      ]}
      onActionClick={() => undefined}
    >
      <div className="social-streak-context">
        <StatusBadge value={statusCopy.label} />
        <p>{statusCopy.detail}</p>
        <small>
          {platforms.length ? platforms.map(titleize).join(', ') : 'No platform activity recorded'}
          {streak.last_checked_date ? ` · Checked ${formatDate(streak.last_checked_date)}` : ''}
        </small>
      </div>
    </StreakCard>
  )
}

function SocialMetricCard({ icon: Icon, label, rows }: { icon: ComponentType<{ size?: number }>; label: string; rows: MetricMovement[] }) {
  return (
    <article className="social-metric-card">
      <div className="social-metric-heading">
        <Icon size={20} />
        <h3>{label}</h3>
      </div>
      <div className="social-metric-rows">
        {rows.map((row) => (
          <div key={row.label} className="social-metric-row">
            <div>
              <span>{row.label}</span>
              <strong>{formatMetricValue(row.value)}</strong>
            </div>
            <TrendBadge movement={row} />
          </div>
        ))}
      </div>
      <p className="metric-context">{metricGroupContext(rows)}</p>
    </article>
  )
}

function streakStatusCopy(status: string, streak?: SocialStreak) {
  if (status === 'continued' && (streak?.current_streak || 0) > 0) {
    return { label: 'Posting streak active', detail: 'Yesterday had at least one connected-platform post.', tone: 'active' }
  }
  if (status === 'reset' || status === 'no_post') {
    return { label: 'No post found yesterday', detail: 'The backend confirmed a successful scan with no previous-day post.', tone: 'reset' }
  }
  if (status === 'scan_failed' || status === 'unknown') {
    return { label: "Could not verify yesterday's posting activity", detail: 'The previous streak is preserved until a successful scan runs.', tone: 'unknown' }
  }
  return { label: 'Posting streak', detail: 'Based on connected social platform scans.', tone: 'neutral' }
}

function TrendBadge({ movement }: { movement: MetricMovement }) {
  const label = movement.state === 'baseline'
    ? 'baseline'
    : movement.state === 'unavailable'
      ? 'unavailable'
      : movement.delta === null
        ? '0'
        : `${movement.delta > 0 ? '+' : ''}${formatMetricValue(movement.delta)}`

  return <span className={`trend-badge ${movement.state}`}>{label}</span>
}

type ContentRow = {
  id: string
  title: string
  subtitle: string
  thumbnail?: string
  permalink?: string
  score: number
  stats: Array<[string, unknown]>
  platform?: SocialPlatform
}

type PlatformAnalytics = {
  platform: SocialPlatform
  snapshot?: SocialAnalyticsSnapshot
  previousSnapshot?: SocialAnalyticsSnapshot
  summary?: SocialAnalyticsSummary
  metrics: Record<string, number | null>
  movements: Record<string, MetricMovement>
  contentTypes: Array<{ label: string; value: number }>
  topContent: ContentRow[]
  recentContent: ContentRow[]
  metricErrors: unknown[]
  comparisonLabel: string
  metricRows: Metric[]
}

function PlatformAnalyticsCard({ analytics }: { analytics: PlatformAnalytics }) {
  const config = platformCardConfig(analytics.platform)
  const kpis = config.kpis.map((entry) => ({
    ...entry,
    value: analytics.metrics[entry.key] ?? null,
    movement: movementForMetric(analytics, entry.key, entry.label),
  }))

  return (
    <>
      <section className="analytics-platform-header">
        <div>
          <p className="eyebrow">{titleize(analytics.platform)} analytics</p>
          <h3>{config.title}</h3>
          <p>{analytics.snapshot ? `Snapshot ${formatDate(analytics.snapshot.snapshot_date || analytics.snapshot.created_at)} / ${analytics.comparisonLabel}` : 'Not available from API yet.'}</p>
        </div>
        <div className="badge-row">
          <StatusBadge value={analytics.snapshot ? 'live analytics' : 'normalized fallback'} />
          {analytics.metricErrors.length > 0 && <StatusBadge value={`${analytics.metricErrors.length} metric warning(s)`} />}
        </div>
      </section>

      <section className="analytics-kpi-grid">
        {kpis.map((kpi) => (
          <article key={kpi.key} className="analytics-stat-card">
            <div className="analytics-stat-top">
              <kpi.icon size={18} />
              <span>{kpi.label}</span>
            </div>
            <strong>{formatAvailability(kpi.value)}</strong>
            <DeltaBadge movement={kpi.movement} />
            <p>{kpi.detail}</p>
          </article>
        ))}
      </section>

      <section className="split-grid">
        <Panel title={config.contentBreakdownTitle}>
          <BreakdownBars rows={analytics.contentTypes} />
        </Panel>
        <Panel title="Know More">
          <div className="explanation-list">
            <ExplanationDetail title="What changed?" value={analytics.summary?.what_changed} />
            <ExplanationDetail title="Followers / subscribers" value={analytics.summary?.follower_summary} />
            <ExplanationDetail title="Interactions" value={analytics.summary?.engagement_summary} />
            <ExplanationDetail title="Views / reach" value={analytics.summary?.views_reach_summary} />
            <ExplanationDetail title="Top content" value={analytics.summary?.top_content_summary} />
          </div>
        </Panel>
      </section>

      <section className="split-grid">
        <Panel title={config.topTitle}>
          <ContentRows rows={analytics.topContent} empty="No top content visible from API yet." />
        </Panel>
        <Panel title={config.recentTitle}>
          <ContentRows rows={analytics.recentContent} empty="No recent posts/media/videos visible from API yet." />
        </Panel>
      </section>

      <details className="details-panel">
        <summary>View metric rows</summary>
        <DataTable
          columns={['Date', 'Metric', 'Value', 'Source']}
          rows={analytics.metricRows.slice(0, 18).map((metric) => [
            formatDate(metric.metric_date),
            titleize(metric.metric_name),
            metric.metric_value ?? '-',
            titleize(metric.engine_name),
          ])}
          empty="No normalized metrics visible for this platform."
        />
      </details>
    </>
  )
}

function AnalyticsMetricTile({
  title,
  icon: Icon,
  analytics,
  metric,
}: {
  title: string
  icon: ComponentType<{ size?: number }>
  analytics: PlatformAnalytics[]
  metric: 'followers' | 'views' | 'interactions'
}) {
  const values = analytics.map((entry) => entry.metrics[metric]).filter((value): value is number => typeof value === 'number')
  const total = values.length ? values.reduce((sum, value) => sum + value, 0) : null
  const deltas = analytics.map((entry) => movementForMetric(entry, metric, title).delta).filter((value): value is number => typeof value === 'number')
  const delta = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) : null
  const movement: MetricMovement = {
    label: title,
    platform: 'facebook',
    value: total,
    delta,
    state: total === null ? 'unavailable' : delta === null ? 'baseline' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
    metricNames: [],
  }

  return (
    <article className="metric-card">
      <Icon size={21} />
      <span>{title}</span>
      <strong>{formatAvailability(total)}</strong>
      <DeltaBadge movement={movement} />
      <p>{values.length ? 'Combined visible platform analytics.' : 'Not available from API yet.'}</p>
    </article>
  )
}

function ContentPerformanceAnalytics({ analytics }: { analytics: PlatformAnalytics[] }) {
  const strongest = strongestPlatform(analytics)
  const weakest = weakestPlatform(analytics)
  const format = bestContentFormat(analytics)
  const allContent = analytics.flatMap((entry) => entry.topContent.map((content) => ({ ...content, platform: entry.platform }))).sort((a, b) => b.score - a.score)

  return (
    <>
      <section className="metric-grid">
        <MetricCard icon={TrendingUp} label="Strongest platform" value={strongest ? titleize(strongest.platform) : 'Not available'} detail={strongest ? `${formatMetricValue(strongest.metrics.interactions)} interactions visible.` : 'Not available from API yet.'} />
        <MetricCard icon={AlertTriangle} label="Weakest platform" value={weakest ? titleize(weakest.platform) : 'Not available'} detail={weakest ? `${formatMetricValue(weakest.metrics.interactions)} interactions visible.` : 'Not available from API yet.'} tone={weakest ? 'warning' : undefined} />
        <MetricCard icon={Camera} label="Best format" value={format?.label || 'Not available'} detail={format ? `${format.count} item(s) in available breakdowns.` : 'Not available from API yet.'} />
        <MetricCard icon={Share2} label="Boost candidates" value={String(allContent.length)} detail="Visible high-performing posts, media, or videos from snapshots." />
      </section>
      <section className="split-grid">
        <Panel title="Boost Candidates">
          <ContentRows rows={allContent.slice(0, 5)} empty="No boost candidates visible yet." />
        </Panel>
        <Panel title="Repurpose / Improve Candidates">
          <div className="recommendation-grid">
            {analytics.map((entry) => (
              <article key={entry.platform} className="detail-field">
                <span>{titleize(entry.platform)}</span>
                <p>{entry.summary?.recommendations?.length ? renderCompactValue(entry.summary.recommendations[0]) : entry.metricErrors.length ? 'Resolve metric warning before repurposing.' : 'Not available from API yet.'}</p>
              </article>
            ))}
          </div>
        </Panel>
      </section>
    </>
  )
}

function DeltaBadge({ movement }: { movement: MetricMovement }) {
  const deltaType = movement.state === 'up' ? 'increase' : movement.state === 'down' ? 'decrease' : 'neutral'
  const value = movement.state === 'unavailable'
    ? 'unavailable'
    : movement.state === 'baseline'
      ? 'baseline'
      : movement.delta === null
        ? '0'
        : `${movement.delta > 0 ? '+' : ''}${formatMetricValue(movement.delta)}`

  return <BadgeDelta variant="solidOutline" deltaType={deltaType} value={value} />
}

function BreakdownBars({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(...rows.map((row) => row.value), 0)
  if (!rows.length) return <EmptyState title="Not available from API yet" detail="Content type breakdown will appear after snapshots are generated." />

  return (
    <div className="breakdown-bars">
      {rows.map((row) => (
        <div key={row.label} className="breakdown-row">
          <span>{row.label}</span>
          <div>
            <i style={{ width: `${max ? Math.max((row.value / max) * 100, 6) : 0}%` }} />
          </div>
          <strong>{formatMetricValue(row.value)}</strong>
        </div>
      ))}
    </div>
  )
}

function ContentRows({ rows, empty }: { rows: ContentRow[]; empty: string }) {
  if (!rows.length) return <EmptyState title={empty} />

  return (
    <div className="content-analytics-list">
      {rows.map((row) => (
        <article key={`${row.platform || 'content'}-${row.id}`} className="content-analytics-row">
          <div className="content-thumb">
            {row.thumbnail ? <img src={row.thumbnail} alt="" /> : <Video size={20} />}
          </div>
          <div>
            <div className="badge-row">
              {row.platform && <StatusBadge value={titleize(row.platform)} />}
              <StatusBadge value={row.subtitle} />
            </div>
            <strong>{row.title}</strong>
            <p>{row.stats.map(([label, value]) => `${label}: ${formatAvailability(numberFromUnknown(value) ?? value)}`).join(' / ')}</p>
            {row.permalink && <a className="text-link" href={row.permalink} target="_blank" rel="noreferrer">Open post</a>}
          </div>
        </article>
      ))}
    </div>
  )
}

function ExplanationDetail({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="explanation-row">
      <summary>{title}</summary>
      <p>{renderCompactValue(value) || 'Not available from API yet.'}</p>
    </details>
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

function buildPlatformAnalytics(
  platform: SocialPlatform,
  snapshots: SocialAnalyticsSnapshot[],
  summaries: SocialAnalyticsSummary[],
  metrics: Metric[],
  range: 'latest' | '7d' | '28d',
): PlatformAnalytics {
  const platformSnapshots = snapshots
    .filter((snapshot) => normalize(snapshot.platform) === platform)
    .filter((snapshot) => snapshotInRange(snapshot, range))
    .sort((a, b) => dateMillis(b.created_at || b.snapshot_date) - dateMillis(a.created_at || a.snapshot_date))
  const snapshot = platformSnapshots[0]
  const previousSnapshot = platformSnapshots[1]
  const metricRows = dataForPlatform(metrics, platform).filter((metric) => metricInRange(metric, range))
  const summary = summaries
    .filter((entry) => normalize(entry.platform || platform) === platform || !entry.platform)
    .sort((a, b) => dateMillis(b.created_at || b.summary_date) - dateMillis(a.created_at || a.summary_date))[0]
  const fallbackMovements = Object.fromEntries(
    socialMetricDefinitions
      .filter((definition) => definition.platform === platform)
      .map((definition) => [metricKeyForGroup(definition.group), buildMetricMovement(metrics, definition)]),
  ) as Record<string, MetricMovement>
  const metricsMap = platformMetricsFromSnapshot(platform, snapshot, fallbackMovements)
  const previousMetrics = platformMetricsFromSnapshot(platform, previousSnapshot, {})
  const movements = Object.fromEntries(
    Object.entries(metricsMap).map(([key, value]) => {
      const previousValue = previousMetrics[key]
      const fallback = fallbackMovements[key]
      const delta = value !== null && typeof previousValue === 'number' ? value - previousValue : fallback?.delta ?? null
      return [
        key,
        {
          label: titleize(key),
          platform,
          value,
          delta,
          state: value === null ? 'unavailable' : delta === null ? 'baseline' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
          metricNames: [],
        },
      ]
    }),
  ) as Record<string, MetricMovement>

  return {
    platform,
    snapshot,
    previousSnapshot,
    summary,
    metrics: metricsMap,
    movements,
    contentTypes: contentTypesFromSnapshot(snapshot),
    topContent: contentRowsFromUnknown(snapshot?.top_content),
    recentContent: contentRowsFromUnknown(snapshot?.recent_content),
    metricErrors: Array.isArray(snapshot?.metric_errors) ? snapshot.metric_errors : [],
    comparisonLabel: summary?.comparison_label || (previousSnapshot ? 'latest vs previous run' : 'latest run baseline'),
    metricRows,
  }
}

function platformMetricsFromSnapshot(
  platform: SocialPlatform,
  snapshot: SocialAnalyticsSnapshot | undefined,
  fallbackMovements: Partial<Record<string, MetricMovement>>,
): Record<string, number | null> {
  const profile = snapshot?.profile_metrics || {}
  const audience = snapshot?.audience_metrics || {}
  const engagement = snapshot?.engagement_metrics || {}
  const reach = snapshot?.reach_view_metrics || {}

  if (platform === 'facebook') {
    return {
      followers: firstNumber([profile, audience], ['followers', 'followers_count', 'page_followers', 'page_fans', 'fan_count']) ?? fallbackMovements.followers?.value ?? null,
      views: firstNumber([reach, profile], ['page_views', 'page_views_total', 'views', 'reach', 'impressions']) ?? fallbackMovements.views?.value ?? null,
      interactions: firstNumber([engagement], ['interactions', 'post_engagements', 'page_post_engagements', 'total_engagement', 'engagement']) ?? fallbackMovements.interactions?.value ?? null,
      reactions: firstNumber([engagement], ['reactions', 'total_reactions']) ?? null,
      comments: firstNumber([engagement], ['comments', 'total_comments']) ?? null,
      shares: firstNumber([engagement], ['shares', 'total_shares']) ?? null,
    }
  }

  if (platform === 'instagram') {
    return {
      followers: firstNumber([profile, audience], ['followers_count', 'followers']) ?? fallbackMovements.followers?.value ?? null,
      follows: firstNumber([profile, audience], ['follows_count', 'follows']) ?? null,
      media: firstNumber([profile], ['media_count', 'media']) ?? null,
      views: firstNumber([reach], ['reach', 'views', 'plays', 'impressions']) ?? fallbackMovements.views?.value ?? null,
      interactions: firstNumber([engagement], ['total_interactions', 'interactions']) ?? fallbackMovements.interactions?.value ?? null,
      likes: firstNumber([engagement], ['likes', 'total_likes']) ?? null,
      comments: firstNumber([engagement], ['comments', 'total_comments']) ?? null,
      saves: firstNumber([engagement], ['saves', 'total_saves']) ?? null,
      shares: firstNumber([engagement], ['shares', 'total_shares']) ?? null,
    }
  }

  return {
    followers: firstNumber([profile, audience], ['subscribers', 'subscriber_count', 'subscribers_count']) ?? fallbackMovements.followers?.value ?? null,
    views: firstNumber([reach, profile], ['views', 'total_views', 'channel_views', 'recent_video_views']) ?? fallbackMovements.views?.value ?? null,
    videos: firstNumber([profile], ['video_count', 'videos']) ?? null,
    interactions: firstNumber([engagement], ['interactions', 'likes_comments', 'engagement']) ?? fallbackMovements.interactions?.value ?? null,
    likes: firstNumber([engagement], ['likes', 'total_likes', 'recent_likes']) ?? null,
    comments: firstNumber([engagement], ['comments', 'total_comments', 'recent_comments']) ?? null,
    watch_time: firstNumber([reach], ['watch_time', 'estimated_minutes_watched']) ?? null,
  }
}

function platformCardConfig(platform: SocialPlatform) {
  const commonIcon = platform === 'youtube' ? Video : platform === 'instagram' ? Camera : BarChart3
  if (platform === 'facebook') {
    return {
      title: 'Facebook / Meta Page Insights',
      contentBreakdownTitle: 'Post Type Breakdown',
      topTitle: 'Top Posts By Engagement',
      recentTitle: 'Recent Posts',
      kpis: [
        { key: 'followers', label: 'Page followers', detail: 'Page fans/followers where API grants access.', icon: Users },
        { key: 'views', label: 'Page views / reach', detail: 'Page views, reach, or impressions from Meta insights.', icon: Eye },
        { key: 'interactions', label: 'Post interactions', detail: 'Reactions, comments, shares, and post engagement.', icon: ThumbsUp },
        { key: 'shares', label: 'Shares', detail: 'Share count from recent posts when available.', icon: Share2 },
      ],
    }
  }
  if (platform === 'instagram') {
    return {
      title: 'Instagram Insights',
      contentBreakdownTitle: 'Reels / Posts / Carousel',
      topTitle: 'Top Media By Interactions',
      recentTitle: 'Recent Media',
      kpis: [
        { key: 'followers', label: 'Followers', detail: 'followers_count from Instagram profile metrics.', icon: Users },
        { key: 'views', label: 'Reach / plays', detail: 'Reach, plays, views, or impressions when available.', icon: Eye },
        { key: 'interactions', label: 'Interactions', detail: 'Likes, comments, saves, shares, and total interactions.', icon: commonIcon },
        { key: 'saves', label: 'Saves', detail: 'Save count from media insights when granted.', icon: Bookmark },
      ],
    }
  }
  return {
    title: 'YouTube Studio Analytics',
    contentBreakdownTitle: 'Video Type Breakdown',
    topTitle: 'Top Videos By Views',
    recentTitle: 'Recent Videos',
    kpis: [
      { key: 'views', label: 'Views', detail: 'Lifetime or recent video views from YouTube API.', icon: Eye },
      { key: 'followers', label: 'Subscribers', detail: 'Subscriber count and movement when available.', icon: Users },
      { key: 'likes', label: 'Likes', detail: 'Recent video likes where available.', icon: ThumbsUp },
      { key: 'comments', label: 'Comments', detail: 'Recent video comments where available.', icon: commonIcon },
    ],
  }
}

function movementForMetric(analytics: PlatformAnalytics, key: string, label: string): MetricMovement {
  return analytics.movements[key] || {
    label,
    platform: analytics.platform,
    value: analytics.metrics[key] ?? null,
    delta: null,
    state: analytics.metrics[key] === null || analytics.metrics[key] === undefined ? 'unavailable' : 'baseline',
    metricNames: [],
  }
}

function contentTypesFromSnapshot(snapshot?: SocialAnalyticsSnapshot) {
  const breakdown = snapshot?.content_type_breakdown
  if (Array.isArray(breakdown)) {
    return breakdown
      .map((entry) => {
        if (typeof entry === 'string') return { label: titleize(entry), value: 1 }
        if (!entry || typeof entry !== 'object') return null
        const object = entry as Record<string, unknown>
        return {
          label: titleize(String(object.type || object.label || object.content_type || object.media_type || 'Unknown')),
          value: numberFromUnknown(object.count ?? object.value ?? object.total) ?? 0,
        }
      })
      .filter((entry): entry is { label: string; value: number } => Boolean(entry && entry.value >= 0))
  }
  if (breakdown && typeof breakdown === 'object') {
    return Object.entries(breakdown).map(([label, value]) => ({ label: titleize(label), value: numberFromUnknown(value) ?? 0 }))
  }
  return []
}

function contentRowsFromUnknown(value: unknown): ContentRow[] {
  const rows = Array.isArray(value) ? value : []
  return rows.map((entry, index) => contentRowFromUnknown(entry, index)).filter((entry): entry is ContentRow => Boolean(entry))
}

function contentRowFromUnknown(value: unknown, index: number): ContentRow | null {
  if (!value || typeof value !== 'object') return null
  const object = value as Record<string, unknown>
  const title = renderCompactValue(object.title || object.message || object.caption || object.name || object.id || `Content ${index + 1}`)
  const type = renderCompactValue(object.media_type || object.media_product_type || object.status_type || object.type || object.duration || 'Content')
  const score =
    firstNumber([object], ['interactions', 'engagement', 'views', 'viewCount', 'view_count', 'reach', 'likes', 'like_count']) ?? 0
  return {
    id: String(object.id || object.post_id || object.videoId || object.video_id || index),
    title: previewText(title),
    subtitle: titleize(type),
    thumbnail: stringFromUnknown(object.thumbnail || object.thumbnail_url || object.full_picture || object.media_url),
    permalink: stringFromUnknown(object.permalink || object.permalink_url || object.url),
    score,
    stats: ([
      ['views', object.views ?? object.viewCount ?? object.view_count ?? object.plays],
      ['interactions', object.interactions ?? object.total_interactions ?? object.engagement],
      ['likes', object.likes ?? object.like_count ?? object.likeCount],
      ['comments', object.comments ?? object.comments_count ?? object.commentCount],
      ['shares', object.shares ?? object.share_count],
      ['saves', object.saves],
    ] as Array<[string, unknown]>).filter(([, entry]) => entry !== undefined && entry !== null),
  }
}

function buildOverviewChartData(metrics: Metric[], analytics: PlatformAnalytics[]): PointsChartDataPoint[] {
  const byDate = new Map<string, number>()
  metrics
    .filter((metric) => ['views', 'reach', 'impressions', 'page_views_total', 'post_impressions', 'youtube_total_views', 'instagram_reach'].some((name) => normalize(metric.metric_name).includes(normalize(name))))
    .filter((metric) => typeof metric.metric_value === 'number' && metric.metric_date)
    .forEach((metric) => {
      byDate.set(metric.metric_date, (byDate.get(metric.metric_date) || 0) + Number(metric.metric_value))
    })

  if (!byDate.size) {
    const total = analytics.map((entry) => entry.metrics.views).filter((value): value is number => typeof value === 'number').reduce((sum, value) => sum + value, 0)
    return total ? [{ date: 'Latest', total, change: 0 }] : []
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => dateMillis(a) - dateMillis(b))
    .slice(-8)
    .map(([date, total], index, rows) => ({ date: formatDate(date).replace(' 2026', ''), total, change: index ? total - rows[index - 1][1] : 0 }))
}

function strongestPlatform(analytics: PlatformAnalytics[]) {
  return analytics
    .filter((entry) => typeof entry.metrics.interactions === 'number')
    .sort((a, b) => Number(b.metrics.interactions) - Number(a.metrics.interactions))[0]
}

function weakestPlatform(analytics: PlatformAnalytics[]) {
  return analytics
    .filter((entry) => typeof entry.metrics.interactions === 'number')
    .sort((a, b) => Number(a.metrics.interactions) - Number(b.metrics.interactions))[0]
}

function bestContentFormat(analytics: PlatformAnalytics[]) {
  const counts = new Map<string, number>()
  analytics.flatMap((entry) => entry.contentTypes).forEach((entry) => counts.set(entry.label, (counts.get(entry.label) || 0) + entry.value))
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))[0]
}

function firstNumber(objects: Array<Record<string, unknown>>, keys: string[]) {
  for (const object of objects) {
    for (const key of keys) {
      const direct = numberFromUnknown(object[key])
      if (direct !== null) return direct
      const nested = findNestedValue(object, key)
      const nestedNumber = numberFromUnknown(nested)
      if (nestedNumber !== null) return nestedNumber
    }
  }
  return null
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const total = Object.values(value as Record<string, unknown>).reduce<number>((sum, entry) => sum + (numberFromUnknown(entry) || 0), 0)
    return total || null
  }
  return null
}

function stringFromUnknown(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function formatAvailability(value: unknown) {
  const numberValue = numberFromUnknown(value)
  if (numberValue !== null) return formatMetricValue(numberValue)
  if (value === null || value === undefined || value === '') return 'Not available'
  return renderCompactValue(value)
}

function metricKeyForGroup(group: SocialMetricGroup) {
  if (group === 'reach') return 'views'
  if (group === 'engagement') return 'interactions'
  return 'followers'
}

function snapshotInRange(snapshot: SocialAnalyticsSnapshot, range: 'latest' | '7d' | '28d') {
  if (range === 'latest') return true
  const days = range === '7d' ? 7 : 28
  const timestamp = dateMillis(snapshot.snapshot_date || snapshot.created_at)
  return timestamp ? Date.now() - timestamp <= days * 24 * 60 * 60 * 1000 : true
}

function metricInRange(metric: Metric, range: 'latest' | '7d' | '28d') {
  if (range === 'latest') return true
  const days = range === '7d' ? 7 : 28
  const timestamp = dateMillis(metric.metric_date || metric.created_at)
  return timestamp ? Date.now() - timestamp <= days * 24 * 60 * 60 * 1000 : true
}

function buildMetricGroup(metrics: Metric[], group: SocialMetricGroup) {
  return socialMetricDefinitions
    .filter((definition) => definition.group === group)
    .map((definition) => buildMetricMovement(metrics, definition))
}

function buildMetricMovement(metrics: Metric[], definition: SocialMetricDefinition): MetricMovement {
  const matching = metrics.filter((metric) => metricMatchesDefinition(metric, definition))
  const dates = Array.from(new Set(matching.map((metric) => metric.metric_date).filter(Boolean))).sort((a, b) => dateMillis(b) - dateMillis(a))
  const latestDate = dates[0]
  const previousDate = dates[1]
  const latestValue = latestDate ? metricSnapshotValue(matching, latestDate) : null
  const previousValue = previousDate ? metricSnapshotValue(matching, previousDate) : null
  const delta = latestValue !== null && previousValue !== null ? latestValue - previousValue : null

  return {
    label: definition.label,
    platform: definition.platform,
    value: latestValue,
    delta,
    state: latestValue === null ? 'unavailable' : previousValue === null ? 'baseline' : delta && delta > 0 ? 'up' : delta && delta < 0 ? 'down' : 'flat',
    latestDate,
    previousDate,
    metricNames: definition.names,
  }
}

function metricMatchesDefinition(metric: Metric, definition: SocialMetricDefinition) {
  const metricName = normalize(metric.metric_name)
  const sourcePlatform = normalize(metric.source_platform)
  return (
    definition.names.some((name) => normalize(name) === metricName) &&
    (normalize(metric.engine_name) === normalize(definition.engine) || sourcePlatform === definition.platform)
  )
}

function metricSnapshotValue(metrics: Metric[], date: string) {
  const latestByName = new Map<string, Metric>()
  metrics
    .filter((metric) => metric.metric_date === date && typeof metric.metric_value === 'number')
    .sort((a, b) => dateMillis(b.created_at) - dateMillis(a.created_at))
    .forEach((metric) => {
      const key = normalize(metric.metric_name)
      if (!latestByName.has(key)) latestByName.set(key, metric)
    })

  const values = Array.from(latestByName.values()).map((metric) => metric.metric_value).filter((value): value is number => typeof value === 'number')
  if (!values.length) return null
  return values.reduce((total, value) => total + value, 0)
}

function dataForPlatform(metrics: Metric[], platform: SocialPlatform) {
  return metrics
    .filter((metric) => analyticsGroupMatch(platform, metric.source_platform, metric.engine_name))
    .sort((a, b) => dateMillis(b.created_at || b.metric_date) - dateMillis(a.created_at || a.metric_date))
}

function formatMetricValue(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: value % 1 === 0 ? 0 : 1 }).format(value)
}

function metricGroupContext(rows: MetricMovement[]) {
  const latest = rows.find((row) => row.latestDate)?.latestDate
  const previous = rows.find((row) => row.previousDate)?.previousDate
  if (latest && previous) return `${formatDate(latest)} vs ${formatDate(previous)}`
  if (latest) return `${formatDate(latest)} baseline`
  return 'No comparable metric rows visible'
}

function findTomorrowContent(items: ContentItem[]) {
  return (
    items.find((item) => isTomorrow(item.planned_date) && normalize(item.status) === 'production_ready') ||
    items.find((item) => isTomorrow(item.planned_date)) ||
    items
      .filter((item) => item.planned_date && dateMillis(item.planned_date) >= startOfTodayMillis())
      .sort((a, b) => dateMillis(a.planned_date) - dateMillis(b.planned_date))[0] ||
    items.find((item) => normalize(item.status) === 'production_ready')
  )
}

function buildTopContent(outputs: IntelligenceOutput[], items: ContentItem[]): TopContentSummary[] {
  const performance = latestEngineOutput(outputs, 'content_performance')
  const candidates = [
    findOutputValue(performance, 'best_content_items'),
    findOutputValue(performance, 'top_content'),
    findOutputValue(performance, 'boost_candidates'),
    findOutputValue(performance, 'top_5_posts'),
  ].flatMap(arrayFromUnknown)

  const fromOutput = candidates.map((candidate) => topContentFromUnknown(candidate)).filter((entry): entry is TopContentSummary => Boolean(entry))
  if (fromOutput.length) return fromOutput

  return items
    .filter((item) => item.source_reason || item.priority_score)
    .slice(0, 2)
    .map((item) => ({
      platform: titleize(item.platform),
      title: item.topic || 'Untitled content',
      reason: item.source_reason || `Priority score ${item.priority_score}`,
      detail: item.caption_direction || item.creative_brief || item.caption || 'No additional detail visible.',
    }))
}

function topContentFromUnknown(value: unknown): TopContentSummary | null {
  if (!value) return null
  if (typeof value === 'string') {
    return { platform: 'Content', title: previewText(value), reason: 'Highlighted by content performance intelligence.', detail: value }
  }

  if (typeof value !== 'object') return null
  const object = value as Record<string, unknown>
  const platform = renderCompactValue(object.platform || object.source_platform || object.channel || 'Content')
  const title = renderCompactValue(object.title || object.topic || object.message || object.post || object.content || 'Top content item')
  const reason = renderCompactValue(object.reason || object.why || object.performance_reason || object.engagement || 'Performed better than nearby content.')
  return {
    platform,
    title: previewText(title),
    reason: previewText(reason),
    detail: renderCompactValue(value),
  }
}

function arrayFromUnknown(value: unknown): unknown[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
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

function startOfTodayMillis() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
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

function normalize(value?: string | null) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_')
}

function titleize(value?: string | null) {
  return String(value || '-').replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function normalizeStringArray(value?: string[] | string | null) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : []
  } catch {
    return String(value).split(',').map((item) => item.trim()).filter(Boolean)
  }
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

function findOutputValue(output: IntelligenceOutput | undefined, key: string) {
  if (!output) return null
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

function placesRowsFromUnknown(value: unknown): PlacesRow[] {
  if (!value) return []
  const rows = Array.isArray(value) ? value : [value]
  return rows.map(placeRowFromUnknown).filter((row): row is PlacesRow => Boolean(row))
}

function groupedPlacesRowsFromUnknown(value: unknown): Array<{ label: string; rows: PlacesRow[] }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.entries(value as Record<string, unknown>)
    .map(([label, rows]) => ({ label, rows: placesRowsFromUnknown(rows) }))
    .filter((group) => group.rows.length > 0)
}

function placeRowFromUnknown(value: unknown): PlacesRow | null {
  if (!value) return null
  if (typeof value === 'string') return { name: value }
  if (typeof value !== 'object') return null

  const object = value as Record<string, unknown>
  const name = renderCompactValue(object.name || object.title || object.place_name || object.business_name || object.provider_name)
  if (!name || name === '-') return null

  return {
    name,
    category: optionalDisplayValue(object.category || object.type || object.primary_type || object.place_type),
    specialty: optionalDisplayValue(object.specialty || object.speciality || object.provider_type),
    rating: optionalDisplayValue(object.rating || object.google_rating),
    reviews: optionalDisplayValue(object.review_count || object.user_ratings_total || object.reviews || object.rating_count),
    address: optionalDisplayValue(object.address || object.formatted_address || object.vicinity || object.location),
    distance: optionalDisplayValue(object.distance || object.distance_km || object.radius || object.geography),
  }
}

function optionalDisplayValue(value: unknown) {
  const rendered = renderCompactValue(value)
  return rendered === '-' ? undefined : rendered
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
