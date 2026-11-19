// PHẦN A: Sổ chi tiêu cá nhân bằng CLASS COMPONENT
// state: this.state / this.setState | lifecycle: componentDidUpdate
import React, { Component } from "react";
import "./styles.css";
import {
  ALL_CATEGORIES,
  CATEGORIES,
  EMPTY_FILTERS,
  filterTransactions,
  formatMoney,
  loadTransactions,
  makeEmptyForm,
  newId,
  saveTransactions,
  summarize,
  toForm,
  validate,
} from "./utils";

/* ---------- Thống kê ---------- */
class Summary extends Component {
  render() {
    const { income, expense, balance, categories } = this.props.stats;
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
}

/* ---------- Form thêm / sửa ---------- */
class TransactionForm extends Component {
  state = { form: makeEmptyForm(), errors: {} };

  // Khi bấm "Sửa" (prop editing đổi), nạp dữ liệu khoản đó vào form
  componentDidUpdate(prevProps) {
    if (prevProps.editing !== this.props.editing) {
      const { editing } = this.props;
      this.setState({ form: editing ? toForm(editing) : makeEmptyForm(), errors: {} });
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => {
      const form = { ...prev.form, [name]: value };
      // Đổi loại thu/chi thì danh mục về mục đầu của loại mới
      if (name === "type") form.category = CATEGORIES[value][0];
      return { form };
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { form } = this.state;
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      this.setState({ errors });
      return;
    }
    this.props.onSubmit({
      type: form.type,
      title: form.title.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      note: form.note.trim(),
    });
    // Đang sửa thì App sẽ đặt editing = null và componentDidUpdate tự reset form
    if (!this.props.editing) this.setState({ form: makeEmptyForm(), errors: {} });
  };

  render() {
    const { form, errors } = this.state;
    const { editing, onCancel } = this.props;
    return (
      <section className="panel">
        <h2>{editing ? "Sửa khoản" : "Thêm khoản mới"}</h2>
        <form className="form" onSubmit={this.handleSubmit} noValidate>
          <div className="segmented" role="radiogroup" aria-label="Loại khoản">
            {["expense", "income"].map((t) => (
              <label key={t} className={form.type === t ? "on " + t : ""}>
                <input type="radio" name="type" value={t} checked={form.type === t} onChange={this.handleChange} />
                {t === "expense" ? "Khoản chi" : "Khoản thu"}
              </label>
            ))}
          </div>

          <label className="field">
            Tên khoản
            <input name="title" value={form.title} onChange={this.handleChange} placeholder="Ví dụ: Cơm trưa" />
            {errors.title && <small className="error">{errors.title}</small>}
          </label>

          <div className="row">
            <label className="field">
              Số tiền (₫)
              <input name="amount" type="number" min="0" value={form.amount} onChange={this.handleChange} />
              {errors.amount && <small className="error">{errors.amount}</small>}
            </label>
            <label className="field">
              Ngày
              <input name="date" type="date" value={form.date} onChange={this.handleChange} />
              {errors.date && <small className="error">{errors.date}</small>}
            </label>
          </div>

          <label className="field">
            Danh mục
            <select name="category" value={form.category} onChange={this.handleChange}>
              {CATEGORIES[form.type].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="field">
            Ghi chú
            <input name="note" value={form.note} onChange={this.handleChange} placeholder="Không bắt buộc" />
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
}

/* ---------- Bộ lọc ---------- */
class Filters extends Component {
  handleChange = (e) => this.props.onChange(e.target.name, e.target.value);

  render() {
    const { filters, onReset } = this.props;
    return (
      <section className="panel filters">
        <input name="keyword" value={filters.keyword} onChange={this.handleChange} placeholder="Tìm theo tên hoặc ghi chú" aria-label="Tìm kiếm" />
        <select name="type" value={filters.type} onChange={this.handleChange} aria-label="Loại">
          <option value="all">Tất cả loại</option>
          <option value="expense">Khoản chi</option>
          <option value="income">Khoản thu</option>
        </select>
        <select name="category" value={filters.category} onChange={this.handleChange} aria-label="Danh mục">
          <option value="all">Tất cả danh mục</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input name="month" type="month" value={filters.month} onChange={this.handleChange} aria-label="Tháng" />
        <button type="button" onClick={onReset}>
          Xóa lọc
        </button>
      </section>
    );
  }
}

/* ---------- Danh sách ---------- */
class TransactionList extends Component {
  render() {
    const { items, editingId, onEdit, onDelete, isEmptyStore } = this.props;
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
          <li key={t.id} className={"item " + t.type + (t.id === editingId ? " editing" : "")}>
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
        ))}
      </ul>
    );
  }
}

/* ---------- App ---------- */
export default class AppClass extends Component {
  state = {
    transactions: loadTransactions(),
    editingId: null,
    filters: EMPTY_FILTERS,
  };

  // Lưu localStorage mỗi khi danh sách thay đổi
  componentDidUpdate(_prevProps, prevState) {
    if (prevState.transactions !== this.state.transactions) {
      saveTransactions(this.state.transactions);
    }
  }

  handleSubmit = (data) => {
    this.setState((prev) => {
      if (prev.editingId) {
        return {
          transactions: prev.transactions.map((t) => (t.id === prev.editingId ? { ...t, ...data } : t)),
          editingId: null,
        };
      }
      return { transactions: [{ id: newId(), ...data }, ...prev.transactions] };
    });
  };

  handleDelete = (id) => {
    if (!window.confirm("Xóa khoản này?")) return;
    this.setState((prev) => ({
      transactions: prev.transactions.filter((t) => t.id !== id),
      editingId: prev.editingId === id ? null : prev.editingId,
    }));
  };

  handleEdit = (id) => this.setState({ editingId: id });
  handleCancelEdit = () => this.setState({ editingId: null });

  handleFilterChange = (name, value) =>
    this.setState((prev) => ({ filters: { ...prev.filters, [name]: value } }));

  handleResetFilters = () => this.setState({ filters: EMPTY_FILTERS });

  render() {
    const { transactions, editingId, filters } = this.state;
    const editing = transactions.find((t) => t.id === editingId) || null;
    const visible = filterTransactions(transactions, filters);
    const stats = summarize(visible);

    return (
      <div className="app">
        <header>
          <h1>Sổ chi tiêu cá nhân</h1>
          <p className="tag">Phần A · Class Component</p>
        </header>

        <main className="layout">
          <div className="col">
            <TransactionForm editing={editing} onSubmit={this.handleSubmit} onCancel={this.handleCancelEdit} />
          </div>
          <div className="col">
            <Summary stats={stats} />
            <Filters filters={filters} onChange={this.handleFilterChange} onReset={this.handleResetFilters} />
            <TransactionList
              items={visible}
              editingId={editingId}
              onEdit={this.handleEdit}
              onDelete={this.handleDelete}
              isEmptyStore={transactions.length === 0}
            />
          </div>
        </main>
      </div>
    );
  }
}
