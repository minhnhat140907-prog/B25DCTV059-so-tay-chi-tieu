// PHẦN B: Sổ chi tiêu cá nhân bằng FUNCTION COMPONENT + HOOKS
// Hooks dùng: useState, useEffect, useMemo, useCallback + custom hook useLocalStorage
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import {
  ALL_CATEGORIES,
  CATEGORIES,
  EMPTY_FILTERS,
  STORAGE_KEY,
  filterTransactions,
  formatMoney,
  makeEmptyForm,
  newId,
  summarize,
  toForm,
  validate,
} from "./utils";

/* ---------- Custom hook: state đồng bộ với localStorage ---------- */
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* bỏ qua nếu không ghi được */
    }
  }, [key, value]);

  return [value, setValue];
}

/* ---------- Thống kê ---------- */
function Summary({ stats }) {
  const { income, expense, balance, categories } = stats;
  const max = categories.length ? categories[0].total : 1;
  return (
    <section className="panel">
      <h2>Thống kê theo bộ lọc hiện tại</h2>
      <div className="summary">
        <div className="stat income">
          <span>Tổng thu</span>
          <strong>{formatMoney(income)}</strong>
        </div>
        <div className="stat expense">
          <span>Tổng chi</span>
          <strong>{formatMoney(expense)}</strong>
        </div>
        <div className={"stat " + (balance < 0 ? "negative" : "balance")}>
          <span>Số dư</span>
          <strong>{formatMoney(balance)}</strong>
        </div>
      </div>
      {categories.length > 0 && (
        <ul className="bars">
          {categories.map((c) => (
            <li key={c.name}>
              <span className="bar-label">{c.name}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: (c.total / max) * 100 + "%" }} />
              </span>
              <span className="bar-value">{formatMoney(c.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Form thêm / sửa ---------- */
function TransactionForm({ editing, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => (editing ? toForm(editing) : makeEmptyForm()));
  const [errors, setErrors] = useState({});

  // Khi bấm "Sửa" (editing đổi), nạp dữ liệu khoản đó vào form
  useEffect(() => {
    setForm(editing ? toForm(editing) : makeEmptyForm());
    setErrors({});
  }, [editing]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "type") next.category = CATEGORIES[value][0];
      return next;
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    onSubmit({
      type: form.type,
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    });
    // Đang sửa thì App đặt editing = null và useEffect ở trên tự reset form
    if (!editing) {
      setForm(makeEmptyForm());
      setErrors({});
    }
  };

  return (
    <section className="panel">
      <h2>{editing ? "Sửa khoản" : "Thêm khoản mới"}</h2>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="segmented" role="radiogroup" aria-label="Loại khoản">
          {["expense", "income"].map((t) => (
            <label key={t} className={form.type === t ? "on " + t : ""}>
              <input type="radio" name="type" value={t} checked={form.type === t} onChange={handleChange} />
              {t === "expense" ? "Khoản chi" : "Khoản thu"}
            </label>
          ))}
        </div>

        <label className="field">
          Tên khoản
          <input name="title" value={form.title} onChange={handleChange} placeholder="Ví dụ: Cơm trưa" />
          {errors.title && <small className="error">{errors.title}</small>}
        </label>

        <div className="row">
          <label className="field">
            Số tiền (₫)
            <input name="amount" type="number" min="0" value={form.amount} onChange={handleChange} />
            {errors.amount && <small className="error">{errors.amount}</small>}
          </label>
          <label className="field">
            Ngày
            <input name="date" type="date" value={form.date} onChange={handleChange} />
            {errors.date && <small className="error">{errors.date}</small>}
          </label>
        </div>

        <label className="field">
          Danh mục
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES[form.type].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="field">
          Ghi chú
          <input name="note" value={form.note} onChange={handleChange} placeholder="Không bắt buộc" />
        </label>

        <div className="actions">
          <button type="submit" className="primary">
            {editing ? "Lưu thay đổi" : "Thêm khoản"}
          </button>
          {editing && (
            <button type="button" onClick={onCancel}>
              Hủy sửa
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

/* ---------- Bộ lọc ---------- */
function Filters({ filters, onChange, onReset }) {
  const handleChange = (e) => onChange(e.target.name, e.target.value);
  return (
    <section className="panel filters">
      <input name="keyword" value={filters.keyword} onChange={handleChange} placeholder="Tìm theo tên hoặc ghi chú" aria-label="Tìm kiếm" />
      <select name="type" value={filters.type} onChange={handleChange} aria-label="Loại">
        <option value="all">Tất cả loại</option>
        <option value="expense">Khoản chi</option>
        <option value="income">Khoản thu</option>
      </select>
      <select name="category" value={filters.category} onChange={handleChange} aria-label="Danh mục">
        <option value="all">Tất cả danh mục</option>
        {ALL_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <input name="month" type="month" value={filters.month} onChange={handleChange} aria-label="Tháng" />
      <button type="button" onClick={onReset}>
        Xóa lọc
      </button>
    </section>
  );
}

/* ---------- Danh sách ---------- */
// memo: một dòng chỉ render lại khi props của nó đổi (onEdit/onDelete ổn định nhờ useCallback)
const TransactionItem = memo(function TransactionItem({ t, isEditing, onEdit, onDelete }) {
  return (
    <li className={"item " + t.type + (isEditing ? " editing" : "")}>
      <div className="item-main">
        <strong>{t.title}</strong>
        <small>
          {t.category} · {t.date.split("-").reverse().join("/")}
          {t.note ? " · " + t.note : ""}
        </small>
      </div>
      <span className="amount">
        {t.type === "income" ? "+" : "−"}
        {formatMoney(t.amount)}
      </span>
      <div className="item-actions">
        <button type="button" onClick={() => onEdit(t.id)}>
          Sửa
        </button>
        <button type="button" className="danger" onClick={() => onDelete(t.id)}>
          Xóa
        </button>
      </div>
    </li>
  );
});

function TransactionList({ items, editingId, onEdit, onDelete, isEmptyStore }) {
  if (items.length === 0) {
    return (
      <p className="empty">
        {isEmptyStore ? "Chưa có khoản nào. Thêm khoản đầu tiên ở form bên cạnh." : "Không có khoản nào khớp bộ lọc."}
      </p>
    );
  }
  return (
    <ul className="list">
      {items.map((t) => (
        <TransactionItem key={t.id} t={t} isEditing={t.id === editingId} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

/* ---------- App ---------- */
export default function AppHooks() {
  const [transactions, setTransactions] = useLocalStorage(STORAGE_KEY, []);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Giá trị dẫn xuất: chỉ tính lại khi dữ liệu đầu vào đổi
  const editing = useMemo(() => transactions.find((t) => t.id === editingId) || null, [transactions, editingId]);
  const visible = useMemo(() => filterTransactions(transactions, filters), [transactions, filters]);
  const stats = useMemo(() => summarize(visible), [visible]);

  const handleSubmit = useCallback(
    (data) => {
      if (editingId) {
        setTransactions((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...data } : t)));
        setEditingId(null);
      } else {
        setTransactions((prev) => [{ id: newId(), ...data }, ...prev]);
      }
    },
    [editingId, setTransactions]
  );

  const handleDelete = useCallback(
    (id) => {
      if (!window.confirm("Xóa khoản này?")) return;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setEditingId((cur) => (cur === id ? null : cur));
    },
    [setTransactions]
  );

  const handleEdit = useCallback((id) => setEditingId(id), []);
  const handleCancelEdit = useCallback(() => setEditingId(null), []);
  const handleFilterChange = useCallback((name, value) => setFilters((prev) => ({ ...prev, [name]: value })), []);
  const handleResetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  return (
    <div className="app">
      <header>
        <h1>Sổ chi tiêu cá nhân</h1>
        <p className="tag">Phần B · Function Component + Hooks</p>
      </header>

      <main className="layout">
        <div className="col">
          <TransactionForm editing={editing} onSubmit={handleSubmit} onCancel={handleCancelEdit} />
        </div>
        <div className="col">
          <Summary stats={stats} />
          <Filters filters={filters} onChange={handleFilterChange} onReset={handleResetFilters} />
          <TransactionList
            items={visible}
            editingId={editingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isEmptyStore={transactions.length === 0}
          />
        </div>
      </main>
    </div>
  );
}
