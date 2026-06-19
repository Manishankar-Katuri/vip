import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, HeartPulse, LayoutDashboard, LogIn } from 'lucide-react'
import { SectionWithMockup } from '@/components/ui/section-with-mockup'
import heroImage from '@/assets/hero.png'

const mockupImages = {
  primary: heroImage,
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
        mockupSlot={
          <article
            className="tool-showcase-card tool-showcase-card--vip tool-showcase-card--hero"
            style={{ backgroundImage: `linear-gradient(90deg, rgba(7, 13, 12, 0.9), rgba(7, 13, 12, 0.62), rgba(7, 13, 12, 0.22)), url(${heroImage})` }}
          >
            <div className="tool-showcase-card__content">
              <span className="tool-showcase-card__icon">
                <HeartPulse size={24} />
              </span>
              <span className="tool-showcase-card__kicker">Available now</span>
              <h1>Vertical Intelligence Platform</h1>
              <p>
                Social media intelligence, planning, analytics, and workflow operations for healthcare brands.
              </p>
            </div>
            <div className="tool-action-grid" aria-label="VIP actions">
              <Link className="tool-action-button primary" to="/tools/vip">
                <LogIn size={18} />
                Sign in
                <ArrowRight size={18} />
              </Link>
              <Link className="tool-action-button" to="/dashboard">
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
              <Link className="tool-action-button" to="/analytics">
                <BarChart3 size={18} />
                Analytics
              </Link>
            </div>
          </article>
        }
      />
    </main>
  )
}
