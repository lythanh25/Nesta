import { useState, type FormEvent } from "react";
import { useFeedback } from "../../components/feedback/useFeedback";
import {
  ADMIN_STORAGE_KEYS,
  readStorage,
  writeStorage,
  type AdminProfile as AdminProfileData,
} from "../../utils/adminData";

const defaultProfile: AdminProfileData = {
  fullName: "Quản trị viên NESTA",
  email: "admin@nesta.com",
  phone: "",
  position: "Quản trị viên",
};

function loadProfile(): AdminProfileData {
  const saved = readStorage<Partial<AdminProfileData>>(
    ADMIN_STORAGE_KEYS.adminProfile,
    {},
  );

  return {
    ...defaultProfile,
    ...saved,
  };
}

function AdminProfile() {
  const { toast, confirm } = useFeedback();

  const [form, setForm] = useState<AdminProfileData>(loadProfile);

  const [savedForm, setSavedForm] = useState<AdminProfileData>(() => ({
    ...form,
  }));

  const isDirty =
    form.fullName !== savedForm.fullName ||
    form.email !== savedForm.email ||
    form.phone !== savedForm.phone ||
    form.position !== savedForm.position;

  function updateField(field: keyof AdminProfileData, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedForm: AdminProfileData = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
    };

    if (!normalizedForm.fullName || !normalizedForm.email) {
      toast("Họ tên và email không được để trống.", "warning");
      return;
    }

    const success = writeStorage(
      ADMIN_STORAGE_KEYS.adminProfile,
      normalizedForm,
    );

    if (success) {
      setForm(normalizedForm);
      setSavedForm(normalizedForm);
      toast("Đã lưu hồ sơ quản trị viên.", "success");
    } else {
      toast("Không thể lưu hồ sơ. Vui lòng thử lại.", "error");
    }
  }

  async function resetProfile() {
    const confirmed = await confirm({
      title: "Khôi phục hồ sơ mặc định?",
      message:
        "Toàn bộ thông tin hồ sơ hiện tại sẽ được thay thế bằng thông tin mặc định của NESTA.",
      confirmText: "Khôi phục",
      cancelText: "Hủy",
      danger: true,
    });

    if (!confirmed) return;

    const success = writeStorage(
      ADMIN_STORAGE_KEYS.adminProfile,
      defaultProfile,
    );

    if (success) {
      setForm({ ...defaultProfile });
      setSavedForm({ ...defaultProfile });
      toast("Đã khôi phục hồ sơ mặc định.", "success");
    } else {
      toast("Không thể khôi phục hồ sơ.", "error");
    }
  }

  function discardChanges() {
    setForm({ ...savedForm });
    toast("Đã hủy các thay đổi chưa lưu.", "info");
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 pb-8">
      {/* Page heading */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
          NESTA / QUẢN TRỊ
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-[#2d261f] sm:text-[34px]">
              Hồ sơ quản trị viên
            </h1>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              Quản lý thông tin cá nhân và hồ sơ hiển thị trong hệ thống quản
              trị.
            </p>
          </div>

          {isDirty && (
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Có thay đổi chưa lưu
            </span>
          )}
        </div>
      </header>

      {/* Profile overview */}
      <section className="overflow-hidden rounded-2xl border border-[#5b493b] bg-[#49382b] shadow-sm">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex min-w-0 items-center gap-5">
            {/* Admin avatar */}
            <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-[#eee7df] font-sans text-2xl font-bold tracking-wide text-[#49382b] shadow-sm">
              AD
            </div>

            {/* Admin information */}
            <div className="min-w-0">
              <h2 className="break-words text-xl font-semibold text-white sm:text-2xl">
                {form.fullName || "Quản trị viên NESTA"}
              </h2>

              <p className="mt-1 text-sm text-[#e4d9ce]">
                {form.position || "Quản trị viên"}
              </p>

              <p className="mt-1 break-all text-xs text-[#cbbbae]">
                {form.email || "Chưa cập nhật email"}
              </p>
            </div>
          </div>

          {/* Profile badge */}
          <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs font-medium text-white">
              Hồ sơ quản trị
            </span>
          </div>
        </div>

        <div className="border-t border-white/10 px-6 py-3 sm:px-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#cbbbae]">
            NESTA ADMINISTRATION
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Personal information form */}
        <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-5 sm:px-7">
            <h2 className="font-serif text-xl text-[#2d261f]">
              Thông tin cá nhân
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Cập nhật các thông tin cơ bản của tài khoản quản trị viên.
            </p>
          </div>

          <form onSubmit={saveProfile} className="space-y-6 p-6 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Full name */}
              <label className="block">
                <span className="text-sm font-medium text-[#3b2f25]">
                  Họ và tên <span className="text-red-500">*</span>
                </span>

                <input
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  placeholder="Nhập họ và tên"
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3 text-sm text-[#2d261f] outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#8b7765] focus:bg-white focus:ring-2 focus:ring-[#8b7765]/10"
                />
              </label>

              {/* Email */}
              <label className="block">
                <span className="text-sm font-medium text-[#3b2f25]">
                  Email <span className="text-red-500">*</span>
                </span>

                <input
                  required
                  type="email"
                  maxLength={150}
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="example@nesta.com"
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3 text-sm text-[#2d261f] outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#8b7765] focus:bg-white focus:ring-2 focus:ring-[#8b7765]/10"
                />
              </label>

              {/* Phone */}
              <label className="block">
                <span className="text-sm font-medium text-[#3b2f25]">
                  Số điện thoại
                </span>

                <input
                  type="tel"
                  maxLength={20}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="Nhập số điện thoại"
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3 text-sm text-[#2d261f] outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#8b7765] focus:bg-white focus:ring-2 focus:ring-[#8b7765]/10"
                />
              </label>

              {/* Position */}
              <label className="block">
                <span className="text-sm font-medium text-[#3b2f25]">
                  Chức vụ
                </span>

                <input
                  maxLength={80}
                  value={form.position}
                  onChange={(event) =>
                    updateField("position", event.target.value)
                  }
                  placeholder="Nhập chức vụ"
                  className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3 text-sm text-[#2d261f] outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-[#8b7765] focus:bg-white focus:ring-2 focus:ring-[#8b7765]/10"
                />
              </label>
            </div>

            {/* Account note */}
            <div className="flex gap-3 rounded-xl border border-[#e9e2db] bg-[#faf8f6] p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eee7e0] text-[#6b5848]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 11v5m0-8h.01"
                  />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#3b2f25]">
                  Lưu ý về thông tin đăng nhập
                </p>

                <p className="mt-1 text-xs leading-6 text-stone-500">
                  Email tại đây chỉ phục vụ hồ sơ hiển thị trong khu vực quản
                  trị. Việc thay đổi email không làm thay đổi thông tin dùng để
                  đăng nhập Admin. Xác thực tài khoản hiện được quản lý riêng
                  trong{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 text-[#6b5848]">
                    adminAuth.ts
                  </code>
                  .
                </p>
              </div>
            </div>

            {/* Form actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={resetProfile}
                className="rounded-xl px-4 py-3 text-sm font-medium text-stone-500 transition hover:bg-red-50 hover:text-red-700"
              >
                Khôi phục mặc định
              </button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {isDirty && (
                  <button
                    type="button"
                    onClick={discardChanges}
                    className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
                  >
                    Hủy thay đổi
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!isDirty}
                  className="rounded-xl bg-[#3b2f25] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#5a493d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Account information */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#e9e2db] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3f0ec] text-[#6b5848]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 12 2 2 4-4"
                  />
                </svg>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#2d261f]">
                  Tài khoản quản trị
                </h3>

                <p className="mt-0.5 text-xs text-stone-400">
                  Thông tin hệ thống
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-stone-400">Vai trò</p>

                <p className="mt-1 text-sm font-medium text-[#3b2f25]">
                  Quản trị viên
                </p>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs text-stone-400">Đơn vị</p>

                <p className="mt-1 text-sm font-medium text-[#3b2f25]">NESTA</p>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs text-stone-400">Trạng thái hồ sơ</p>

                <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Đang hoạt động
                </p>
              </div>
            </div>
          </section>

          {/* Security suggestion */}
          <section className="rounded-2xl border border-[#e9e2db] bg-[#faf8f6] p-5">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4 text-[#8b7765]"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3 19 6v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z"
                />
              </svg>

              <h3 className="text-sm font-semibold text-[#3b2f25]">
                Gợi ý bảo mật
              </h3>
            </div>

            <p className="mt-2 text-xs leading-6 text-stone-500">
              Không chia sẻ thông tin đăng nhập quản trị với người khác. Hãy
              kiểm tra kỹ thông tin trước khi lưu để đảm bảo hồ sơ luôn chính
              xác.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default AdminProfile;
