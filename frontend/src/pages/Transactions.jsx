import { createElement, useEffect, useState } from "react";
import { getTransactions, deleteTransaction } from "../api/transactions";
import { getCategories } from "../api/categories";
import useDebounce from "../hooks/useDebounce";
import Modal from "../components/Modal";
import TransactionForm from "../components/TransactionForm";
import getErrorMessage from "../utils/getErrorMessage";
import { formatMoney, formatDate } from "../utils/format";
import { paymentLabel } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useQuickAdd } from "../context/QuickAddContext";
import categoryIcon from "../utils/categoryIcon";
import { Pencil, Search, SlidersHorizontal, Trash2 } from "lucide-react";

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
  const { openAdd, version } = useQuickAdd();
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    // This flag represents the start of the request for the current filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  }, [filters, debouncedSearch, page, reloadKey, version]);

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

  const activeFilterCount = Number(Boolean(filters.type))
    + Number(Boolean(filters.category))
    + Number(Boolean(filters.from))
    + Number(Boolean(filters.to))
    + Number(filters.sort !== EMPTY_FILTERS.sort);

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
        <button className="btn btn-primary transaction-add-button" onClick={openAdd}>
          + Add transaction
        </button>
      </div>

      <div className="transaction-search-row">
        <label className="transaction-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Search transactions</span>
          <input
            className="input"
            placeholder="Search notes..."
            value={search}
            onChange={changeSearch}
          />
        </label>
        <button
          className={`btn btn-soft transaction-filter-toggle${filtersOpen ? " is-open" : ""}`}
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls="transaction-filters"
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
        </button>
      </div>

      {filtersOpen && (
        <section className="transaction-filter-panel" id="transaction-filters" aria-label="Transaction filters">
          <label className="transaction-filter-field">
            <span>Type</span>
            <select className="input" name="type" value={filters.type} onChange={changeFilter}>
              <option value="">All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label className="transaction-filter-field">
            <span>Category</span>
            <select className="input" name="category" value={filters.category} onChange={changeFilter}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label className="transaction-filter-field">
            <span>From</span>
            <input className="input" type="date" name="from" value={filters.from} onChange={changeFilter} />
          </label>
          <label className="transaction-filter-field">
            <span>To</span>
            <input className="input" type="date" name="to" value={filters.to} onChange={changeFilter} />
          </label>

          <label className="transaction-filter-field">
            <span>Sort by</span>
            <select className="input" name="sort" value={filters.sort} onChange={changeFilter}>
              <option value="-date">Newest first</option>
              <option value="date">Oldest first</option>
              <option value="-amount">Highest amount</option>
              <option value="amount">Lowest amount</option>
            </select>
          </label>

          <button className="btn btn-ghost transaction-clear-button" onClick={clearFilters}>
            Clear filters
          </button>
        </section>
      )}

      {error && <div className="error" role="alert">{error}</div>}

      {loading && transactions.length === 0 ? (
        <p className="empty">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="empty">No transactions found.</p>
      ) : (
        <div className={`table-wrap ${loading ? "loading" : ""}`}>
          <table className="transactions-table">
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
                    <span className="transaction-category-cell">
                      <span
                        className="icon-badge transaction-category-icon"
                        style={{ "--category-color": t.category.color }}
                        aria-hidden="true"
                      >
                        {createElement(categoryIcon(t.category.icon), { size: 17 })}
                      </span>
                      {t.category.name}
                    </span>
                  </td>
                  <td>{t.note || "-"}</td>
                  <td>{paymentLabel(t.paymentMethod)}</td>
                  <td className={t.type === "income" ? "amount-income" : "amount-expense"}>
                    {t.type === "income" ? "+" : "-"}{formatMoney(t.amount, currency)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="icon-btn transaction-action"
                        aria-label={`Edit ${t.category.name} transaction`}
                        onClick={() => setModal({ open: true, transaction: t })}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-btn transaction-action delete-action"
                        aria-label={`Delete ${t.category.name} transaction`}
                        onClick={() => handleDelete(t)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {transactions.length > 0 && (
        <div className={`transaction-mobile-list ${loading ? "loading" : ""}`}>
          {transactions.map((transaction) => {
            const income = transaction.type === "income";
            return (
              <article className="transaction-mobile-card" key={transaction._id}>
                <span
                  className="icon-badge transaction-mobile-icon"
                  style={{ "--category-color": transaction.category.color }}
                  aria-hidden="true"
                >
                  {createElement(categoryIcon(transaction.category.icon), { size: 19 })}
                </span>
                <div className="transaction-mobile-main">
                  <strong>{transaction.category.name}</strong>
                  <span>{transaction.note || formatDate(transaction.date)}</span>
                  <small>{paymentLabel(transaction.paymentMethod)} · {formatDate(transaction.date)}</small>
                </div>
                <div className="transaction-mobile-side">
                  <strong className={income ? "amount-income" : "amount-expense"}>
                    {income ? "+" : "−"}{formatMoney(transaction.amount, currency)}
                  </strong>
                  <div className="transaction-mobile-actions">
                    <button
                      className="icon-btn transaction-action"
                      aria-label={`Edit ${transaction.category.name} transaction`}
                      onClick={() => setModal({ open: true, transaction })}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-btn transaction-action delete-action"
                      aria-label={`Delete ${transaction.category.name} transaction`}
                      onClick={() => handleDelete(transaction)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
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