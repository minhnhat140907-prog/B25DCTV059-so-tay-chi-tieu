// Hàm và hằng số dùng chung cho Phần A (Class) và Phần B (Hooks).
// Không chứa React: chỉ là logic thuần để hai phần cùng dùng.

export const STORAGE_KEY = "so-chi-tieu-v1";

export const CATEGORIES = {
  expense: ["Ăn uống", "Đi lại", "Nhà ở", "Học tập", "Giải trí", "Mua sắm", "Sức khỏe", "Khác"],
  income: ["Lương", "Thưởng", "Học bổng", "Gia đình gửi", "Khác"],
};

// Danh mục không trùng nhau, dùng cho ô lọc
export const ALL_CATEGORIES = [...new Set([...CATEGORIES.expense, ...CATEGORIES.income])];

export const EMPTY_FILTERS = { type: "all", category: "all", month: "", keyword: "" };

export const formatMoney = (n) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";

export function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function makeEmptyForm() {
  return { type: "expense", title: "", amount: "", category: CATEGORIES.expense[0], date: todayStr(), note: "" };
}

// Chuyển một khoản đã lưu thành dữ liệu của form (amount về dạng chuỗi)
export function toForm(t) {
  return { type: t.type, title: t.title, amount: String(t.amount), category: t.category, date: t.date, note: t.note || "" };
}

// Trả về object lỗi; rỗng nghĩa là hợp lệ
export function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Nhập tên khoản chi tiêu.";
  const amount = Number(form.amount);
  if (form.amount === "" || Number.isNaN(amount)) errors.amount = "Nhập số tiền.";
  else if (amount <= 0) errors.amount = "Số tiền phải lớn hơn 0.";
  if (!form.date) errors.date = "Chọn ngày.";
  return errors;
}

export function filterTransactions(list, f) {
  const kw = f.keyword.trim().toLowerCase();
  return list
    .filter((t) => f.type === "all" || t.type === f.type)
    .filter((t) => f.category === "all" || t.category === f.category)
    .filter((t) => !f.month || t.date.startsWith(f.month))
    .filter((t) => !kw || t.title.toLowerCase().includes(kw) || (t.note || "").toLowerCase().includes(kw))
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

// Tổng thu, tổng chi, số dư và chi theo danh mục (lớn đến nhỏ)
export function summarize(list) {
  let income = 0;
  let expense = 0;
  const byCategory = {};
  for (const t of list) {
    if (t.type === "income") income += t.amount;
    else {
      expense += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }
  const categories = Object.entries(byCategory)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
  return { income, expense, balance: income - expense, categories };
}

// Chỉ Phần A dùng hai hàm này; Phần B có hook useLocalStorage riêng.
export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* localStorage đầy hoặc bị chặn: bỏ qua */
  }
}
