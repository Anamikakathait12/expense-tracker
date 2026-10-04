import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <h1>Hello, {user.username}</h1>
      <p className="muted">Summary cards and charts come in the next step.</p>
    </>
  );
}