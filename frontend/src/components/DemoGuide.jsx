import { useState } from "react";
import { Link } from "react-router-dom";

const DISMISS_KEY = "expense-tracker-demo-guide-dismissed";

function wasDismissed() {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "true";
  } catch {
    return false;
  }
}

export default function DemoGuide() {
  const [visible, setVisible] = useState(() => !wasDismissed());

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // Keep the guide dismissible when browser storage is unavailable.
    }
  };

  if (!visible) return null;

  return (
    <section className="demo-guide" aria-labelledby="demo-guide-title">
      <div className="demo-guide-heading">
        <h2 id="demo-guide-title">Things to try in this demo</h2>
        <button
          type="button"
          className="icon-btn demo-guide-dismiss"
          onClick={dismiss}
          aria-label="Dismiss demo guide"
        >
          ×
        </button>
      </div>
      <ol>
        <li>Add an expense on the <Link to="/transactions">Transactions</Link> page.</li>
        <li>
          Watch the <Link to="/dashboard">Dashboard</Link> and <Link to="/analytics">Analytics</Link> update.
        </li>
        <li>
          Open <Link to="/budgets">Budgets</Link> and click back one month to see green, yellow and red bars.
        </li>
        <li>
          Try search, filters and sorting on <Link to="/transactions">Transactions</Link>.
        </li>
        <li>Change the currency in <Link to="/settings">Settings</Link>.</li>
      </ol>
    </section>
  );
}
