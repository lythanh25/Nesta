import { useEffect, useState } from "react";
import {
  ADMIN_STORAGE_KEYS,
  readStorage,
  writeStorage,
  formatDate,
  type AdminArticle,
} from "../../utils/adminData";

const emptyArticle: Omit<AdminArticle, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  category: "Tin tức",
  excerpt: "",
  content: "",
  image: "",
  status: "Bản nháp",
};

function AdminArticles() {
  const [articles, setArticles] = useState<AdminArticle[]>(() =>
    readStorage<AdminArticle[]>(ADMIN_STORAGE_KEYS.articles, []),
  );

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [form, setForm] = useState(emptyArticle);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = () => {
      setArticles(readStorage<AdminArticle[]>(ADMIN_STORAGE_KEYS.articles, []));
    };

    window.addEventListener("adminDataUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("adminDataUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = articles.filter((article) => {
    const search = keyword.trim().toLowerCase();
    const matchesSearch =
      !search ||
      article.title.toLowerCase().includes(search) ||
      article.category.toLowerCase().includes(search) ||
      article.excerpt.toLowerCase().includes(search);

    return (
      matchesSearch &&
      (statusFilter === "Tất cả" || article.status === statusFilter)
    );
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyArticle);
    setMessage("");
    setShowForm(true);
  }

  function openEdit(article: AdminArticle) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      content: article.content,
      image: article.image,
      status: article.status,
    });
    setMessage("");
    setShowForm(true);
  }

  function saveArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      setMessage("Vui lòng nhập tiêu đề và nội dung bài viết.");
      return;
    }

    const now = new Date().toISOString();
    let next: AdminArticle[];

    if (editingId) {
      next = articles.map((article) =>
        article.id === editingId
          ? {
              ...article,
              ...form,
              title: form.title.trim(),
              updatedAt: now,
            }
          : article,
      );
    } else {
      next = [
        {
          ...form,
          title: form.title.trim(),
          id: `article-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
        },
        ...articles,
      ];
    }

    if (!writeStorage(ADMIN_STORAGE_KEYS.articles, next)) {
      setMessage("Không thể lưu bài viết. Vui lòng thử lại.");
      return;
    }

    setArticles(next);
    setShowForm(false);
    setMessage(editingId ? "Đã cập nhật bài viết." : "Đã tạo bài viết.");
  }

  function changeStatus(article: AdminArticle) {
    const nextStatus: AdminArticle["status"] =
      article.status === "Đã xuất bản" ? "Bản nháp" : "Đã xuất bản";

    const next: AdminArticle[] = articles.map((item) =>
      item.id === article.id
        ? {
            ...item,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    if (!writeStorage(ADMIN_STORAGE_KEYS.articles, next)) {
      setMessage("Không thể cập nhật trạng thái bài viết.");
      return;
    }

    setArticles(next);
    setMessage(
      nextStatus === "Đã xuất bản"
        ? "Bài viết đã được đánh dấu xuất bản."
        : "Bài viết đã chuyển về bản nháp.",
    );
  }

  function deleteArticle(article: AdminArticle) {
    if (!window.confirm(`Bạn có chắc muốn xóa bài "${article.title}"?`)) return;

    const next = articles.filter((item) => item.id !== article.id);

    if (!writeStorage(ADMIN_STORAGE_KEYS.articles, next)) {
      setMessage("Không thể xóa bài viết. Vui lòng thử lại.");
      return;
    }

    setArticles(next);
    setMessage("Đã xóa bài viết.");
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            NESTA / QUẢN TRỊ
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
            Quản lý bài đăng
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Tạo và quản lý nội dung bài viết của cửa hàng.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-xl bg-[#3b2f25] px-4 py-3 text-sm font-medium text-white hover:bg-[#5a493d]"
        >
          + Tạo bài viết
        </button>
      </header>

      {message && (
        <div
          role="status"
          className="rounded-xl bg-white p-3 text-sm text-stone-700"
        >
          {message}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Tổng bài viết", articles.length],
          [
            "Đã xuất bản",
            articles.filter((a) => a.status === "Đã xuất bản").length,
          ],
          ["Bản nháp", articles.filter((a) => a.status === "Bản nháp").length],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5"
          >
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        <div className="grid gap-3 border-b border-stone-100 p-4 md:grid-cols-[1fr_200px]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tiêu đề, danh mục hoặc mô tả..."
            className="rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#8b7765]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none"
          >
            <option>Tất cả</option>
            <option>Bản nháp</option>
            <option>Đã xuất bản</option>
          </select>
        </div>

        <div className="divide-y divide-stone-100">
          {filtered.map((article) => (
            <article
              key={article.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5"
            >
              {article.image ? (
                <img
                  src={article.image}
                  alt={article.title}
                  className="h-32 w-full rounded-xl bg-stone-100 object-cover sm:w-44"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-xl bg-[#f7f1ed] text-sm text-stone-400 sm:w-44">
                  Chưa có ảnh
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${article.status === "Đã xuất bản" ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"}`}
                  >
                    {article.status}
                  </span>
                  <span className="text-xs text-stone-400">
                    {article.category}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{article.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                  {article.excerpt || article.content}
                </p>
                <p className="mt-3 text-xs text-stone-400">
                  Cập nhật: {formatDate(article.updatedAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-36 sm:flex-col">
                <button
                  onClick={() => openEdit(article)}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs hover:bg-stone-50"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => changeStatus(article)}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-xs hover:bg-stone-50"
                >
                  {article.status === "Đã xuất bản"
                    ? "Về bản nháp"
                    : "Xuất bản"}
                </button>
                <button
                  onClick={() => deleteArticle(article)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="px-5 py-14 text-center text-sm text-stone-500">
              Chưa có bài viết phù hợp. Chọn “Tạo bài viết” để thêm nội dung.
            </div>
          )}
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveArticle}
            className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">
                {editingId ? "Chỉnh sửa bài viết" : "Tạo bài viết"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-2 text-2xl text-stone-500"
              >
                ×
              </button>
            </div>

            {message && <p className="text-sm text-red-600">{message}</p>}

            <label className="block text-sm">
              Tiêu đề *
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                Danh mục
                <input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="block text-sm">
                Trạng thái
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as AdminArticle["status"],
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5"
                >
                  <option>Bản nháp</option>
                  <option>Đã xuất bản</option>
                </select>
              </label>
            </div>

            <label className="block text-sm">
              Đường dẫn ảnh
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="/src/assets/images/..."
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
              />
            </label>

            <label className="block text-sm">
              Mô tả ngắn
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
              />
            </label>

            <label className="block text-sm">
              Nội dung bài viết *
              <textarea
                required
                rows={7}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#3b2f25] px-5 py-2.5 text-sm font-medium text-white"
              >
                Lưu bài viết
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminArticles;
