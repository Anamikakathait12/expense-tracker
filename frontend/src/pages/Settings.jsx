import { useEffect, useState } from "react";
import { getCategories, deleteCategory } from "../api/categories";
import ProfileForm from "../components/ProfileForm";
import CategoryForm from "../components/CategoryForm";
import Modal from "../components/Modal";
import getErrorMessage from "../utils/getErrorMessage";

export default function Settings() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");
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
              <span>
                <span className="dot" style={{ background: c.color }} />
                {c.name}
              </span>
              <div className="row-actions">
                <button className="btn btn-outline btn-sm"
                        onClick={() => setModal({ open: true, category: c })}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="panel settings-section">
        <h3>Profile</h3>
        <ProfileForm />
      </div>

      <div className="panel settings-section">
        <div className="panel-head">
          <h3>Categories</h3>
          <button className="btn btn-sm" onClick={() => setModal({ open: true, category: null })}>
            + Add category
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {!categories ? (
          !error && <p className="empty">Loading...</p>
        ) : (
          <div className="cat-columns">
            {renderGroup("Expense", "expense")}
            {renderGroup("Income", "income")}
          </div>
        )}
      </div>

      {modal.open && (
        <Modal title={modal.category ? "Edit category" : "Add category"} onClose={closeModal}>
          <CategoryForm initial={modal.category} onSaved={handleSaved} onCancel={closeModal} />
        </Modal>
      )}
    </>
  );
}