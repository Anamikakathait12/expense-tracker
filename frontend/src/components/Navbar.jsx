import { NavLink, useNavigate } from "react-router-dom";
import {
  ChartNoAxesCombined,
  House,
  LogOut,
  PiggyBank,
  Plus,
  ReceiptText,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useQuickAdd } from "../context/QuickAddContext";
import getErrorMessage from "../utils/getErrorMessage";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Home", icon: House, end: true },
  { to: "/transactions", label: "Transactions", icon: ReceiptText },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavigationLink({ item, compact = false }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={compact ? "mobile-tab" : "sidebar-link"}
      aria-label={compact ? item.label : undefined}
    >
      <Icon aria-hidden="true" size={20} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { openAdd } = useQuickAdd();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const initial = user?.username?.trim()?.charAt(0)?.toUpperCase() || "?";

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logout();
      navigate("/");
    } catch (err) {
      setLogoutError(getErrorMessage(err));
    }
  };

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-greeting">
          <span className="mobile-greeting-label">Welcome back</span>
          <strong>Hi, {user?.username}</strong>
        </div>
        <NavLink className="avatar-link" to="/settings" aria-label="Open settings">
          {initial}
        </NavLink>
      </header>

      <aside className="app-sidebar">
        <NavLink className="sidebar-brand" to="/dashboard">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span>Expense Tracker</span>
        </NavLink>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => <NavigationLink key={item.to} item={item} />)}
        </nav>

        <div className="sidebar-account">
          <div className="sidebar-user">
            <span className="avatar-circle" aria-hidden="true">{initial}</span>
            <span className="sidebar-user-name">{user?.username}</span>
          </div>
          {logoutError && <p className="sidebar-error" role="alert">{logoutError}</p>}
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <nav className="mobile-tabbar" aria-label="Mobile navigation">
        <NavigationLink item={navItems[0]} compact />
        <NavigationLink item={navItems[1]} compact />
        <button
          type="button"
          className="mobile-add-button"
          onClick={openAdd}
          aria-label="Add transaction"
        >
          <Plus size={25} aria-hidden="true" />
        </button>
        <NavigationLink item={navItems[2]} compact />
        <NavigationLink item={navItems[3]} compact />
      </nav>

      <div className="desktop-content-header">
        <span className="desktop-page-greeting">Your finances at a glance</span>
        <button className="btn btn-primary app-add-button" onClick={openAdd}>
          <Plus size={18} aria-hidden="true" />
          Add transaction
        </button>
      </div>
    </>
  );
}
