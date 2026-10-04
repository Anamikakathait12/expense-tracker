import { useEffect, useState } from "react";
import { getTransactions, deleteTransaction } from "../api/transactions";
import { getCategories } from "../api/categories";
import useDebounce from "../hooks/useDebounce";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney, formatDate } from "../utils/format";
import { paymentLabel } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

const EMPTY_FILTERS = { type: "", category: "", from: "", to: "", sort: "-date" };
const LIMIT = 10;

// Only send filters that are set. The date inputs become the start and end of the
// day in the browser's timezone, so the last day of a range is fully included.
const buildParams = (filters, search, page) => {
  const params = { page, limit: LIMIT, sort: filters.sort };
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  if (search) params.search = search;
  if (filters.from) params.from = new Date(`${filters.from}T00:00:00`).toISOString();
  if (filters.to) params.to = new Date(`${filters.to}T23:59:59.999`).toISOString();
  return params;
};

export default function Transactions() {
  const { user } = useAuth();
  const currency = user.currency || "INR";

  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modal, setModal] = useState({ open: false, transaction: null });

  // Categories load once, for the filter dropdown and the form
  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data.categories))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  // Reload whenever a filter, the search, the page or reloadKey changes
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError("");

    getTransactions(buildParams(filters, debouncedSearch, page))
      .then((res) => {
        if (ignore) return;
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
      })
      .catch((err) => !ignore && setError(getErrorMessage(err)))
      .finally(() => !ignore && setLoading(false));

    return () => {
      ignore = true; // an older, slower response must not overwrite a newer one
    };
  }, [filters, debouncedSearch, page, reloadKey]);

  const changeFilter = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1); // a new filter means a new result set, so go back to page 1
  };

  const changeSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
    setPage(1);
  };

  const closeModal = () => setModal({ open: false, transaction: null });

  const handleSaved = () => {
    if (!modal.transaction) setPage(1); // a new entry shows up on the first page
    closeModal();
    setReloadKey((k) => k + 1);
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete this ${t.type} of ${formatMoney(t.amount, currency)}?`)) return;
    try {
      await deleteTransaction(t._id);
      // deleting the last row of a later page would leave it empty, so step back
      if (transactions.length === 1 && page > 1) setPage((p) => p - 1);
      else setReloadKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Transactions</h1>
        <button className="btn" onClick={() => setModal({ open: true, transaction: null })}>
          + Add transaction
        </button>
      </div>

      <div className="toolbar">
        <input className="input" placeholder="Search notes..." value={search} onChange={changeSearch} />

        <select className="input" name="type" value={filters.type} onChange={changeFilter}>
          <option value="">All types</option>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <select className="input" name="category" value={filters.category} onChange={changeFilter}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <input className="input" type="date" name="from" value={filters.from}
               onChange={changeFilter} aria-label="From date" />
        <input className="input" type="date" name="to" value={filters.to}
               onChange={changeFilter} aria-label="To date" />

        <select className="input" name="sort" value={filters.sort} onChange={changeFilter}>
          <option value="-date">Newest first</option>
          <option value="date">Oldest first</option>
          <option value="-amount">Highest amount</option>
          <option value="amount">Lowest amount</option>
        </select>

        <button className="btn btn-outline" onClick={clearFilters}>Clear</button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading && transactions.length === 0 ? (
        <p className="empty">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="empty">No transactions found.</p>
      ) : (
        <div className={`table-wrap ${loading ? "loading" : ""}`}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Note</th>
                <th>Method</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{formatDate(t.date)}</td>
                  <td>
                    <span className="dot" style={{ background: t.category.color }} />
                    {t.category.name}
                  </td>
                  <td>{t.note || "-"}</td>
                  <td>{paymentLabel(t.paymentMethod)}</td>
                  <td className={t.type === "income" ? "amount-income" : "amount-expense"}>
                    {t.type === "income" ? "+" : "-"}{formatMoney(t.amount, currency)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-outline btn-sm"
                              onClick={() => setModal({ open: true, transaction: t })}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="btn btn-outline btn-sm" disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span className="muted">
          Page {page} of {pagination.totalPages} ({pagination.total} total)
        </span>
        <button className="btn btn-outline btn-sm" disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {modal.open && (
        <Modal title={modal.transaction ? "Edit transaction" : "Add transaction"} onClose={closeModal}>
          <TransactionForm
            categories={categories}
            initial={modal.transaction}
            onSaved={handleSaved}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}