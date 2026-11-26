import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ADMIN_STORAGE_KEYS,
  readStorage,
  writeStorage,
  formatDate,
  type AdminArticle,
} from "../../utils/adminData";
import { useFeedback } from "../../components/feedback/useFeedback";

const emptyArticle: Omit<AdminArticle, "id" | "createdAt" | "updatedAt"> = {
  title: "",
  category: "Tin tức",
  excerpt: "",
  content: "",
  image: "",
  status: "Bản nháp",
};

type StatusFilter = "Tất cả" | AdminArticle["status"];

const statusFilters: StatusFilter[] = ["Tất cả", "Đã xuất bản", "Bản nháp"];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function AdminArticles() {
  const { toast, confirm } = useFeedback();

  const [articles, setArticles] = useState<AdminArticle[]>(() =>
    readStorage<AdminArticle[]>(ADMIN_STORAGE_KEYS.articles, []),
  );

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tất cả");

  const [form, setForm] = useState(emptyArticle);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Đọc lại dữ liệu khi có thay đổi từ những trang quản trị khác.
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

  // Tìm kiếm và lọc bài viết.
  const filteredArticles = useMemo(() => {
    const search = normalizeText(keyword);

    return articles.filter((article) => {
      const matchesSearch =
        !search ||
        normalizeText(article.title || "").includes(search) ||
        normalizeText(article.category || "").includes(search) ||
        normalizeText(article.excerpt || "").includes(search) ||
        normalizeText(article.content || "").includes(search);

      const matchesStatus =
        statusFilter === "Tất cả" || article.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [articles, keyword, statusFilter]);

  // Thống kê.
  const articleStats = useMemo(
    () => ({
      total: articles.length,
      published: articles.filter((article) => article.status === "Đã xuất bản")
        .length,
      drafts: articles.filter((article) => article.status === "Bản nháp")
        .length,
    }),
    [articles],
  );

  const hasActiveFilter = keyword.trim() !== "" || statusFilter !== "Tất cả";

  // Mở form tạo bài viết.
  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyArticle });
    setImageError(false);
    setShowForm(true);
  }

  // Mở form chỉnh sửa.
  function openEdit(article: AdminArticle) {
    setEditingId(article.id);

    setForm({
      title: article.title || "",
      category: article.category || "Tin tức",
      excerpt: article.excerpt || "",
      content: article.content || "",
      image: article.image || "",
      status: article.status || "Bản nháp",
    });

    setImageError(false);
    setShowForm(true);
  }

  // Đóng form.
  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyArticle });
    setImageError(false);
  }

  // Lưu bài viết.
  function saveArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.content.trim()) {
      toast("Vui lòng nhập đầy đủ tiêu đề và nội dung bài viết.", "warning");
      return;
    }

    const now = new Date().toISOString();
    let nextArticles: AdminArticle[];

    if (editingId) {
      nextArticles = articles.map((article) =>
        article.id === editingId
          ? {
              ...article,
              ...form,
              title: form.title.trim(),
              category: form.category.trim() || "Tin tức",
              excerpt: form.excerpt.trim(),
              content: form.content.trim(),
              image: form.image.trim(),
              updatedAt: now,
            }
          : article,
      );
    } else {
      const newArticle: AdminArticle = {
        ...form,
        title: form.title.trim(),
        category: form.category.trim() || "Tin tức",
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        image: form.image.trim(),
        id: `article-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };

      nextArticles = [newArticle, ...articles];
    }

    if (!writeStorage(ADMIN_STORAGE_KEYS.articles, nextArticles)) {
      toast("Không thể lưu bài viết. Vui lòng thử lại.", "error");
      return;
    }

    setArticles(nextArticles);
    window.dispatchEvent(new Event("adminDataUpdated"));

    closeForm();

    toast(
      editingId
        ? "Đã cập nhật bài viết thành công."
        : "Đã tạo bài viết mới thành công.",
      "success",
    );
  }

  // Thay đổi trạng thái bài viết.
  async function changeStatus(article: AdminArticle) {
    const nextStatus: AdminArticle["status"] =
      article.status === "Đã xuất bản" ? "Bản nháp" : "Đã xuất bản";

    const isPublishing = nextStatus === "Đã xuất bản";

    const accepted = await confirm({
      title: isPublishing
        ? "Xuất bản bài viết?"
        : "Chuyển bài viết về bản nháp?",
      message: isPublishing
        ? `Bạn có chắc muốn xuất bản bài viết "${article.title}" không?`
        : `Bài viết "${article.title}" sẽ được chuyển về bản nháp. Bạn có muốn tiếp tục không?`,
      confirmText: isPublishing ? "Xuất bản" : "Chuyển về bản nháp",
      cancelText: "Hủy",
      danger: !isPublishing,
    });

    if (!accepted) return;

    const nextArticles = articles.map((item) =>
      item.id === article.id
        ? {
            ...item,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          }
        : item,
    );

    if (!writeStorage(ADMIN_STORAGE_KEYS.articles, nextArticles)) {
      toast("Không thể cập nhật trạng thái bài viết.", "error");
      return;
    }

    setArticles(nextArticles);
    window.dispatchEvent(new Event("adminDataUpdated"));

    toast(
      isPublishing
        ? "Bài viết đã được đánh dấu xuất bản."
        : "Bài viết đã được chuyển về bản nháp.",
      "success",
    );
  }

  // Xóa bài viết.
  async function deleteArticle(article: AdminArticle) {
    const accepted = await confirm({
      title: "Xóa bài viết?",
      message:
        `Bạn có chắc muốn xóa bài viết "${article.title}" không?\n\n` +
        "Thao tác này sẽ xóa bài viết khỏi danh sách quản trị và không thể hoàn tác.",
      confirmText: "Xóa bài viết",
      cancelText: "Giữ lại",
      danger: true,
    });

    if (!accepted) return;

    const nextArticles = articles.filter((item) => item.id !== article.id);

    if (!writeStorage(ADMIN_STORAGE_KEYS.articles, nextArticles)) {
      toast("Không thể xóa bài viết. Vui lòng thử lại.", "error");
      return;
    }

    setArticles(nextArticles);
    window.dispatchEvent(new Event("adminDataUpdated"));

    toast("Đã xóa bài viết thành công.", "success");
  }

  // Xóa bộ lọc.
  function clearFilters() {
    setKeyword("");
    setStatusFilter("Tất cả");
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 text-[#2d261f]">
      {/* Tiêu đề trang */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            NESTA / QUẢN TRỊ
          </p>

          <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
            Quản lý bài đăng
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Quản lý tin tức, nội dung và các bài viết của cửa hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b2f25] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#5a493d] active:scale-[0.98]"
        >
          <span className="text-lg leading-none">+</span>
          Tạo bài viết
        </button>
      </header>

      {/* Thống kê */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Tổng bài viết",
            value: articleStats.total,
            description: "Tất cả bài viết hiện có",
            icon: "▤",
            iconStyle: "bg-[#f1ebe5] text-[#5a493d]",
          },
          {
            label: "Đã xuất bản",
            value: articleStats.published,
            description: "Bài viết đã được xuất bản",
            icon: "✓",
            iconStyle: "bg-green-50 text-green-700",
          },
          {
            label: "Bản nháp",
            value: articleStats.drafts,
            description: "Bài viết đang được lưu nháp",
            icon: "✎",
            iconStyle: "bg-amber-50 text-amber-700",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-stone-500">{item.label}</p>

                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#2d261f]">
                  {item.value.toLocaleString("vi-VN")}
                </p>

                <p className="mt-2 text-xs text-stone-400">
                  {item.description}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${item.iconStyle}`}
              >
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Danh sách bài viết */}
      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white shadow-sm">
        {/* Thanh công cụ */}
        <div className="space-y-4 border-b border-stone-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#2d261f]">
                Danh sách bài viết
              </h2>

              <p className="mt-1 text-xs text-stone-500">
                Hiển thị {filteredArticles.length} / {articles.length} bài viết
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                ⌕
              </span>

              <input
                type="text"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm kiếm bài viết..."
                aria-label="Tìm kiếm bài viết"
                className="w-full rounded-xl border border-stone-200 bg-[#fcfbfa] py-3 pl-10 pr-10 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#8b7765] focus:bg-white focus:ring-2 focus:ring-[#8b7765]/10"
              />

              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-stone-400 transition hover:text-stone-700"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((status) => {
              const active = statusFilter === status;

              const count =
                status === "Tất cả"
                  ? articleStats.total
                  : status === "Đã xuất bản"
                    ? articleStats.published
                    : articleStats.drafts;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                    active
                      ? "border-[#3b2f25] bg-[#3b2f25] text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-[#8b7765] hover:bg-[#faf8f6]"
                  }`}
                >
                  {status}

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto text-xs font-medium text-stone-500 underline underline-offset-4 transition hover:text-[#3b2f25]"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Danh sách */}
        <div className="divide-y divide-stone-100">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group flex flex-col gap-4 p-4 transition hover:bg-[#fcfbfa] sm:flex-row sm:items-start sm:p-5"
            >
              {/* Ảnh bài viết */}
              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-[#f7f1ed] sm:h-32 sm:w-44">
                {article.image && !imageError ? (
                  <img
                    src={article.image}
                    alt={article.title}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-stone-400">
                    <span className="text-3xl">▧</span>
                    <span className="text-xs">
                      {article.image ? "Không thể tải ảnh" : "Chưa có ảnh"}
                    </span>
                  </div>
                )}
              </div>

              {/* Nội dung */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      article.status === "Đã xuất bản"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span className="mr-1">●</span>
                    {article.status}
                  </span>

                  <span className="rounded-full bg-[#f5f1ed] px-3 py-1 text-[11px] text-stone-600">
                    {article.category || "Tin tức"}
                  </span>
                </div>

                <h3 className="mt-3 break-words text-base font-semibold text-[#2d261f] transition group-hover:text-[#6a5543]">
                  {article.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-500">
                  {article.excerpt || article.content || "Chưa có mô tả."}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                  <span>Cập nhật: {formatDate(article.updatedAt)}</span>

                  <span>Tạo ngày: {formatDate(article.createdAt)}</span>
                </div>
              </div>

              {/* Thao tác */}
              <div className="flex shrink-0 flex-wrap gap-2 sm:w-36 sm:flex-col">
                <button
                  type="button"
                  onClick={() => openEdit(article)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-stone-200 px-3 py-2.5 text-xs font-medium text-stone-600 transition hover:border-[#8b7765] hover:bg-[#f7f1ed] hover:text-[#3b2f25] sm:flex-none"
                >
                  <span>✎</span>
                  Chỉnh sửa
                </button>

                <button
                  type="button"
                  onClick={() => changeStatus(article)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition sm:flex-none ${
                    article.status === "Đã xuất bản"
                      ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                      : "border-green-200 text-green-700 hover:bg-green-50"
                  }`}
                >
                  <span>{article.status === "Đã xuất bản" ? "↶" : "✓"}</span>

                  {article.status === "Đã xuất bản"
                    ? "Về bản nháp"
                    : "Xuất bản"}
                </button>

                <button
                  type="button"
                  onClick={() => deleteArticle(article)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 sm:flex-none"
                >
                  <span>⌫</span>
                  Xóa bài viết
                </button>
              </div>
            </article>
          ))}

          {/* Trạng thái không có dữ liệu */}
          {filteredArticles.length === 0 && (
            <div className="flex flex-col items-center px-5 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f7f1ed] text-3xl text-[#8b7765]">
                ▤
              </div>

              <h3 className="mt-5 text-base font-semibold text-[#2d261f]">
                {articles.length === 0
                  ? "Chưa có bài viết nào"
                  : "Không tìm thấy bài viết"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
                {articles.length === 0
                  ? "Các bài viết và tin tức của cửa hàng sẽ được hiển thị tại đây sau khi bạn tạo nội dung mới."
                  : "Không có bài viết phù hợp với từ khóa hoặc trạng thái đang chọn. Hãy thử thay đổi bộ lọc."}
              </p>

              {articles.length === 0 ? (
                <button
                  type="button"
                  onClick={openCreate}
                  className="mt-5 rounded-xl bg-[#3b2f25] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#5a493d]"
                >
                  + Tạo bài viết đầu tiên
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 text-sm font-medium text-[#5a493d] underline underline-offset-4"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Form tạo / chỉnh sửa */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <form
            onSubmit={saveArticle}
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-form-title"
            className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* Tiêu đề form */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-100 bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  NESTA / QUẢN LÝ NỘI DUNG
                </p>

                <h2
                  id="article-form-title"
                  className="mt-2 font-serif text-2xl text-[#2d261f]"
                >
                  {editingId ? "Chỉnh sửa bài viết" : "Tạo bài viết mới"}
                </h2>

                <p className="mt-1 text-xs text-stone-500">
                  Điền thông tin để hoàn thiện nội dung bài viết.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Đóng biểu mẫu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                ×
              </button>
            </div>

            {/* Nội dung form */}
            <div className="space-y-5 p-5 sm:p-7">
              {/* Tiêu đề */}
              <label className="block">
                <span className="text-sm font-medium text-[#2d261f]">
                  Tiêu đề bài viết <span className="text-red-500">*</span>
                </span>

                <input
                  required
                  maxLength={150}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="Nhập tiêu đề bài viết..."
                  className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-[#8b7765] focus:ring-2 focus:ring-[#8b7765]/10"
                />
              </label>

              {/* Danh mục và trạng thái */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-[#2d261f]">
                    Danh mục
                  </span>

                  <input
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                    placeholder="Ví dụ: Tin tức, Xu hướng..."
                    className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-[#8b7765] focus:ring-2 focus:ring-[#8b7765]/10"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-[#2d261f]">
                    Trạng thái
                  </span>

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as AdminArticle["status"],
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#8b7765] focus:ring-2 focus:ring-[#8b7765]/10"
                  >
                    <option value="Bản nháp">Bản nháp</option>
                    <option value="Đã xuất bản">Đã xuất bản</option>
                  </select>
                </label>
              </div>

              {/* Ảnh */}
              <div>
                <label className="block">
                  <span className="text-sm font-medium text-[#2d261f]">
                    Đường dẫn hình ảnh
                  </span>

                  <input
                    value={form.image}
                    onChange={(event) => {
                      setForm({ ...form, image: event.target.value });
                      setImageError(false);
                    }}
                    placeholder="/images/article.jpg hoặc URL hình ảnh"
                    className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-[#8b7765] focus:ring-2 focus:ring-[#8b7765]/10"
                  />
                </label>

                <p className="mt-2 text-xs leading-5 text-stone-400">
                  Có thể sử dụng đường dẫn ảnh trong thư mục public hoặc URL
                  hình ảnh hợp lệ.
                </p>

                {form.image.trim() && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-[#faf8f6]">
                    {!imageError ? (
                      <img
                        src={form.image}
                        alt="Xem trước ảnh bài viết"
                        onError={() => setImageError(true)}
                        className="max-h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-2 text-sm text-stone-400">
                        <span className="text-2xl">▧</span>
                        Không thể tải hình ảnh từ đường dẫn này.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mô tả */}
              <label className="block">
                <span className="text-sm font-medium text-[#2d261f]">
                  Mô tả ngắn
                </span>

                <textarea
                  rows={3}
                  maxLength={300}
                  value={form.excerpt}
                  onChange={(event) =>
                    setForm({ ...form, excerpt: event.target.value })
                  }
                  placeholder="Viết một đoạn giới thiệu ngắn cho bài viết..."
                  className="mt-2 w-full resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-stone-400 focus:border-[#8b7765] focus:ring-2 focus:ring-[#8b7765]/10"
                />

                <p className="mt-1 text-right text-xs text-stone-400">
                  {form.excerpt.length}/300 ký tự
                </p>
              </label>

              {/* Nội dung */}
              <label className="block">
                <span className="text-sm font-medium text-[#2d261f]">
                  Nội dung bài viết <span className="text-red-500">*</span>
                </span>

                <textarea
                  required
                  rows={9}
                  value={form.content}
                  onChange={(event) =>
                    setForm({ ...form, content: event.target.value })
                  }
                  placeholder="Nhập nội dung chi tiết của bài viết..."
                  className="mt-2 w-full resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-stone-400 focus:border-[#8b7765] focus:ring-2 focus:ring-[#8b7765]/10"
                />

                <p className="mt-1 text-xs text-stone-400">
                  Nội dung sẽ được lưu dưới dạng văn bản thuần.
                </p>
              </label>
            </div>

            {/* Nút thao tác */}
            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-stone-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="rounded-xl bg-[#3b2f25] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#5a493d] active:scale-[0.98]"
              >
                {editingId ? "Lưu thay đổi" : "Tạo bài viết"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminArticles;
