import { Link } from "react-router-dom";
import DemoButton from "../components/DemoButton";
import { useAuth } from "../context/AuthContext";

const features = [
  {
    icon: "🔐",
    title: "Secure login",
    description: "JWT in an httpOnly cookie, with bcrypt password hashing.",
  },
  {
    icon: "↕️",
    title: "Transactions, your way",
    description: "Filter, search, sort and paginate every transaction.",
  },
  {
    icon: "🎯",
    title: "Monthly budgets",
    description: "Stay on track with clear 80% and 100% warnings.",
  },
  {
    icon: "📊",
    title: "Useful analytics",
    description: "Category donut, 6/12-month trend, daily spend and top expenses.",
  },
  {
    icon: "🎨",
    title: "Custom categories",
    description: "Create categories and choose their colours.",
  },
  {
    icon: "🧪",
    title: "Private demo sandbox",
    description: "Every visitor gets isolated sample data to explore safely.",
  },
];

const technologies = [
  "React",
  "Vite",
  "Recharts",
  "Node",
  "Express",
  "MongoDB Atlas",
  "JWT",
  "Zod",
];

export default function Landing() {
  const { demoExpired } = useAuth();

  return (
    <div className="landing">
      <header className="landing-header">
        <Link className="landing-brand" to="/" aria-label="Expense Tracker home">
          Expense Tracker
        </Link>
        <nav className="landing-nav" aria-label="Account">
          <Link to="/login">Log in</Link>
          <Link className="btn landing-signup" to="/register">Sign up</Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">A clearer view of your money</p>
            <h1 id="landing-title">Know where your money goes.</h1>
            <p className="landing-description">
              Track spending, plan monthly budgets and understand your habits with
              a simple, insightful expense tracker.
            </p>
            {demoExpired && (
              <p className="demo-expired-notice" role="status">
                Your demo session has ended. Everything resets automatically. Start a new one anytime.
              </p>
            )}
            <div className="landing-actions">
              <DemoButton label="View live demo" className="btn landing-primary" />
              <Link className="btn btn-outline landing-secondary" to="/login">Log in</Link>
            </div>
            <p className="landing-demo-note">
              No sign-up needed. You get a private sandbox with sample data. Add,
              edit or delete anything. It resets automatically after a short time.
            </p>
          </div>
          {/* Screenshot placeholder: add product screenshots here when available. */}
          <div className="landing-screenshot-placeholder" aria-label="Screenshot placeholder">
            <span>Product screenshots coming soon</span>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="features-title">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Made for everyday decisions</p>
            <h2 id="features-title">Everything you need to stay in control</h2>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-engineering" aria-labelledby="built-title">
          <p className="landing-eyebrow">Under the hood</p>
          <h2 id="built-title">How it&apos;s built</h2>
          <ul className="tech-chips" aria-label="Technology stack">
            {technologies.map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
          <ul className="engineering-highlights">
            <li>Analytics use MongoDB aggregation pipelines with compound indexes.</li>
            <li>Money is stored as integer paise to avoid floating-point errors.</li>
            <li>Dates are grouped in the user&apos;s timezone.</li>
          </ul>
        </section>
      </main>

      <footer className="landing-footer">
        <span>Project in progress</span>
        <a
          href="https://github.com/Anamikakathait12/expense-tracker"
          target="_blank"
          rel="noopener noreferrer"
        >
          View on GitHub
        </a>
      </footer>
    </div>
  );
}
