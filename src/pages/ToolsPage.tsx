import { BentoGrid, type BentoItem } from '@/components/ui/bento-grid'
import { Clock, HeartPulse, LineChart } from 'lucide-react'

const tools: BentoItem[] = [
  {
    title: 'VIP',
    meta: 'Vertical Intelligence Platform',
    description:
      'AI-powered social media intelligence, planning, analytics, and workflow automation for healthcare brands.',
    icon: <HeartPulse className="w-4 h-4 text-emerald-500" />,
    status: 'Built',
    tags: ['AI', 'Automation', 'Healthcare', 'Social Media'],
    cta: 'Open Tool →',
    href: '/tools/vip',
    colSpan: 2,
    hasPersistentHover: true,
  },
  {
    title: 'Acquisition Agent',
    meta: 'Coming soon',
    description: 'Pipeline intelligence and acquisition workflows for future Antaryami AI releases.',
    icon: <LineChart className="w-4 h-4 text-gray-400" />,
    status: 'Coming soon',
    tags: ['Growth', 'Research'],
    cta: 'Coming soon',
  },
  {
    title: 'Reports Agent',
    meta: 'Coming soon',
    description: 'Executive-ready reporting and insight synthesis for future Antaryami AI releases.',
    icon: <Clock className="w-4 h-4 text-gray-400" />,
    status: 'Coming soon',
    tags: ['Reports', 'Analytics'],
    cta: 'Coming soon',
  },
]

export function ToolsPage() {
  return (
    <main className="tools-page">
      <section className="tools-page__header">
        <p className="tools-page__eyebrow">Antaryami AI</p>
        <h1>Antaryami AI Tools</h1>
        <p>Intelligent systems for business growth, automation, and decision support.</p>
      </section>

      <BentoGrid items={tools} />
    </main>
  )
}
