import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { getCategories } from "../api/categories";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import getErrorMessage from "../utils/getErrorMessage";

const QuickAddContext = createContext(null);

function QuickAddLayer({ children }) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const categoryRequest = useRef(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const openAdd = useCallback(async () => {
    setOpen(true);
    setError("");
    if (categoriesLoaded) return;
    if (categoryRequest.current) return categoryRequest.current;

    setLoadingCategories(true);
    const request = getCategories()
      .then((response) => {
      setCategories(response.data.categories);
      setCategoriesLoaded(true);
      })
      .catch((err) => {
        setError(getErrorMessage(err));
      })
      .finally(() => {
        categoryRequest.current = null;
        setLoadingCategories(false);
      });
    categoryRequest.current = request;
    return request;
  }, [categoriesLoaded]);

  const closeAdd = () => {
    setOpen(false);
    setError("");
  };

  const handleSaved = () => {
    closeAdd();
    setVersion((current) => current + 1);
  };

  const value = useMemo(() => ({ openAdd, version }), [openAdd, version]);

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      {open && (
        <Modal title="Add transaction" onClose={closeAdd}>
          {loadingCategories ? (
            <p className="empty">Loading categories...</p>
          ) : error ? (
            <div className="error" role="alert">
              {error}
              <button type="button" className="btn btn-outline" onClick={openAdd}>
                Try again
              </button>
            </div>
          ) : (
            <TransactionForm
              categories={categories}
              onSaved={handleSaved}
              onCancel={closeAdd}
            />
          )}
        </Modal>
      )}
    </QuickAddContext.Provider>
  );
}

export function QuickAddProvider({ children }) {
  return <QuickAddLayer>{children}</QuickAddLayer>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return context;
}
