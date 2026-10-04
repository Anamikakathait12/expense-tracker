import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 24 }}>
      <h1>Hello, {user.username}</h1>
      <p className="muted">{user.email}</p>
      <button className="btn" onClick={logout}>Log out</button>
    </div>
  );
}