import { createElement, useEffect, useState } from "react";
import { Edit2, LogOut, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCategories, deleteCategory } from "../api/categories";
import { useAuth } from "../context/AuthContext";
import ProfileForm from "../components/ProfileForm";
import CategoryForm from "../components/CategoryForm";
import Modal from "../components/Modal";
import categoryIcon from "../utils/categoryIcon";
import getErrorMessage from "../utils/getErrorMessage";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState({ open: false, category: null });

  useEffect(() => {
    let ignore = false;

    getCategories()
      .then((res) => !ignore && setCategories(res.data.categories))
      .catch((err) => !ignore && setError(getErrorMessage(err)));

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const closeModal = () => setModal({ open: false, category: null });

  const handleSaved = () => {
    closeModal();
    setError("");
    setReloadKey((k) => k + 1);
  };

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await logout();
      navigate("/");
    } catch (err) {
      setLogoutError(getErrorMessage(err));
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete the "${c.name}" category?`)) return;
    setError("");
    try {
      await deleteCategory(c._id);
      setReloadKey((k) => k + 1);
    } catch (err) {
      // e.g. "Cannot delete: 12 transaction(s) use this category"
      setError(getErrorMessage(err));
    }
  };

  const renderGroup = (title, type) => {
    const items = (categories || []).filter((c) => c.type === type);
    return (
      <div className="cat-group">
        <h4>{title} ({items.length})</h4>
        {items.length === 0 ? (
          <p className="muted">None yet.</p>
        ) : (
          items.map((c) => (
            <div className="cat-row" key={c._id}>
              <span className="settings-category-name">
                <span
                  className="icon-badge settings-category-badge"
                  style={{ "--category-color": c.color }}
                  aria-hidden="true"
                >
                  {createElement(categoryIcon(c.icon), { size: 17 })}
                </span>
                <span className="settings-category-label">{c.name}</span>
              </span>
              <div className="row-actions">
                <button
                  type="button"
                  className="settings-icon-action"
                  aria-label={`Edit ${c.name} category`}
                  onClick={() => setModal({ open: true, category: c })}
                >
                  <Edit2 size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="settings-icon-action settings-delete-action"
                  aria-label={`Delete ${c.name} category`}
                  onClick={() => handleDelete(c)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <>
      <div className="page-header settings-page-header">
        <h1>Settings</h1>
        <p>Manage your profile and make categories your own.</p>
      </div>

      <section className="panel settings-section settings-profile" aria-labelledby="settings-profile-heading">
        <div className="settings-section-heading">
          <span className="settings-section-mark" aria-hidden="true">01</span>
          <div>
            <p className="settings-eyebrow">Your account</p>
            <h2 id="settings-profile-heading">Profile</h2>
          </div>
        </div>
        <div className="settings-profile-identity">
          <span className="settings-large-avatar" aria-hidden="true">
            {user?.username?.trim()?.charAt(0)?.toUpperCase() || "?"}
          </span>
          <span>
            <strong>{user?.username}</strong>
            <small>{user?.email}</small>
          </span>
        </div>
        <ProfileForm />
      </section>

      <section className="settings-logout-section" aria-label="Sign out">
        {logoutError && <div className="error" role="alert">{logoutError}</div>}
        <button type="button" className="btn btn-outline settings-logout-button" onClick={handleLogout}>
          <LogOut size={17} aria-hidden="true" />
          Log out
        </button>
      </section>

      <section className="panel settings-section settings-categories" aria-labelledby="settings-categories-heading">
        <div className="settings-section-heading">
          <span className="settings-section-mark settings-section-mark-yellow" aria-hidden="true">02</span>
          <div>
            <p className="settings-eyebrow">Organize your money</p>
            <h2 id="settings-categories-heading">Categories</h2>
          </div>
          <button className="btn btn-sm" onClick={() => setModal({ open: true, category: null })}>
            + Add category
          </button>
        </div>

        {error && <div className="error" role="alert">{error}</div>}

        {!categories ? (
          !error && <p className="empty-state settings-loading">Loading categories...</p>
        ) : (
          <div className="cat-columns">
            {renderGroup("Expense", "expense")}
            {renderGroup("Income", "income")}
          </div>
        )}
      </section>

      {modal.open && (
        <Modal title={modal.category ? "Edit category" : "Add category"} onClose={closeModal}>
          <CategoryForm initial={modal.category} onSaved={handleSaved} onCancel={closeModal} />
        </Modal>
      )}
    </>
  );
}