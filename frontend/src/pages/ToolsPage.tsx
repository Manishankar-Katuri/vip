import { Link } from 'react-router-dom'
import { ArrowRight, HeartPulse, LockKeyhole, Sparkles } from 'lucide-react'
import { SectionWithMockup } from '@/components/ui/section-with-mockup'

const mockupImages = {
  primary:
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80',
  secondary:
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
}

export function ToolsPage() {
  return (
    <main className="tools-page">
      <SectionWithMockup
        title={
          <>
            Healthcare intelligence,
            <br />
            ready for action.
          </>
        }
        description="VIP turns social, local, competitor, trend, and content-performance signals into a coordinated operating system for healthcare marketing teams."
        primaryImageSrc={mockupImages.primary}
        secondaryImageSrc={mockupImages.secondary}
      />

      <section className="tools-page__catalog" aria-label="Available tools">
        <Link className="tool-showcase-card tool-showcase-card--vip" to="/tools/vip">
          <span className="tool-showcase-card__icon">
            <HeartPulse size={24} />
          </span>
          <span className="tool-showcase-card__kicker">Available now</span>
          <h1>Vertical Intelligence Platform</h1>
          <p>
            Social media intelligence, planning, analytics, and workflow operations for healthcare brands.
          </p>
          <span className="tool-showcase-card__action">
            Open platform
            <ArrowRight size={18} />
          </span>
        </Link>

        <article className="tool-showcase-card tool-showcase-card--soon">
          <span className="tool-showcase-card__icon">
            <Sparkles size={24} />
          </span>
          <strong>Tools coming soon</strong>
        </article>

        <article className="tool-showcase-card tool-showcase-card--soon">
          <span className="tool-showcase-card__icon">
            <LockKeyhole size={24} />
          </span>
          <strong>Tools coming soon</strong>
        </article>
      </section>
    </main>
  )
}
