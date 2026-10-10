import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { QuickAddProvider } from "../context/QuickAddContext";
import getErrorMessage from "../utils/getErrorMessage";

function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [demoNow, setDemoNow] = useState(0);

  useEffect(() => {
    if (!user?.isDemo) return undefined;
    const initialTick = window.setTimeout(() => setDemoNow(Date.now()), 0);
    const interval = window.setInterval(() => setDemoNow(Date.now()), 30_000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, [user?.isDemo]);

  const expiresAt = user?.isDemo ? new Date(user.expiresAt).getTime() : NaN;
  const minutesLeft = Number.isFinite(expiresAt) ? Math.max(0, Math.ceil((expiresAt - demoNow) / 60_000)) : null;
  const resetCountdown = minutesLeft === null
    ? null
    : `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;

  const exitDemo = async () => {
    setError("");
    try {
      await logout();
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className={`app-shell${user?.isDemo ? " has-demo-banner" : ""}`}>
      {user?.isDemo && (
        <div className="demo-banner">
          <span>
            You&apos;re exploring a private demo sandbox.
            {resetCountdown !== null && ` Sandbox resets in ${resetCountdown}.`}
          </span>
          <button className="demo-banner-exit" onClick={exitDemo}>Exit demo</button>
        </div>
      )}
      <Navbar />
      <main className="app-main">
        {error && <div className="error app-shell-error" role="alert">{error}</div>}
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function Layout() {
  return (
    <QuickAddProvider>
      <AppShell />
    </QuickAddProvider>
  );
}
