import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <span className="brand">Expense Tracker</span>

      <div className="nav-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/transactions">Transactions</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
        <NavLink to="/budgets">Budgets</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </div>

      <div className="nav-user">
        <span className="muted">{user.username}</span>
        <button className="btn btn-outline btn-sm" onClick={logout}>Log out</button>
      </div>
    </nav>
  );
}