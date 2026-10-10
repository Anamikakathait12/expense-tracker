import { Link } from "react-router-dom";
import DemoButton from "../components/DemoButton";

export default function DemoEntry() {
  return (
    <main className="auth-page">
      <section className="card demo-entry auth-card">
        <span className="auth-brand-mark" aria-hidden="true">E</span>
        <p className="auth-eyebrow">No account required</p>
        <h1 className="auth-title">Explore the live demo</h1>
        <p className="auth-description">
          Start a private sandbox filled with sample expenses. No account needed.
        </p>
        <DemoButton label="Start demo" className="btn auth-demo-button" />
        <p className="muted auth-footnote"><Link to="/">Back to home</Link></p>
      </section>
    </main>
  );
}
