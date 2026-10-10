import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import getErrorMessage from "../utils/getErrorMessage";

export default function DemoButton({ label = "Try the demo", className = "btn" }) {
  const { startDemo } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setError("");
    setLoading(true);
    try {
      await startDemo();
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="demo-button-wrap">
      <button
        type="button"
        className={className}
        onClick={handleStart}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Starting your demo..." : label}
      </button>
      {loading && (
        <p className="demo-loading-hint muted">
          The server may take up to a minute to wake up. Please keep this page open.
        </p>
      )}
      {error && <div className="error" role="alert">{error}</div>}
    </div>
  );
}
