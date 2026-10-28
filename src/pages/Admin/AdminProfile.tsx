import { useState } from "react";
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

function AdminProfile() {
  const [form, setForm] = useState<AdminProfileData>(() => {
    const saved = readStorage<Partial<AdminProfileData>>(
      ADMIN_STORAGE_KEYS.adminProfile,
      {},
    );

    return { ...defaultProfile, ...saved };
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.fullName.trim() || !form.email.trim()) {
      setMessageType("error");
      setMessage("Họ tên và email không được để trống.");
      return;
    }

    const success = writeStorage(ADMIN_STORAGE_KEYS.adminProfile, {
      ...form,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
    });

    setMessageType(success ? "success" : "error");
    setMessage(
      success
        ? "Đã lưu hồ sơ quản trị viên."
        : "Không thể lưu hồ sơ. Vui lòng thử lại.",
    );
  }

  function resetProfile() {
    if (!window.confirm("Khôi phục thông tin hồ sơ mặc định?")) return;

    const success = writeStorage(
      ADMIN_STORAGE_KEYS.adminProfile,
      defaultProfile,
    );

    if (success) {
      setForm(defaultProfile);
      setMessageType("success");
      setMessage("Đã khôi phục hồ sơ mặc định.");
    } else {
      setMessageType("error");
      setMessage("Không thể khôi phục hồ sơ.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
          NESTA / QUẢN TRỊ
        </p>
        <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
          Hồ sơ quản trị viên
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Cập nhật thông tin cá nhân hiển thị trong khu vực quản trị.
        </p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        <div className="flex items-center gap-4 border-b border-stone-100 bg-[#faf8f6] p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3b2f25] font-serif text-2xl text-white">
            N
          </div>
          <div>
            <h2 className="text-lg font-semibold">{form.fullName}</h2>
            <p className="mt-1 text-sm text-stone-500">{form.position}</p>
            <p className="mt-1 text-xs text-stone-400">{form.email}</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-5 p-6">
          {message && (
            <div
              role="status"
              className={`rounded-xl p-3 text-sm ${
                messageType === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Họ và tên *
              <input
                required
                value={form.fullName}
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal outline-none focus:border-[#8b7765]"
              />
            </label>

            <label className="block text-sm font-medium">
              Email *
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal outline-none focus:border-[#8b7765]"
              />
            </label>

            <label className="block text-sm font-medium">
              Số điện thoại
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal outline-none focus:border-[#8b7765]"
              />
            </label>

            <label className="block text-sm font-medium">
              Chức vụ
              <input
                value={form.position}
                onChange={(event) =>
                  setForm({ ...form, position: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-stone-200 px-4 py-3 font-normal outline-none focus:border-[#8b7765]"
              />
            </label>
          </div>

          <div className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Thông tin tại trang này chỉ phục vụ hồ sơ hiển thị. Việc sửa email ở
            đây không thay đổi email dùng để đăng nhập Admin. Chức năng xác thực
            hiện vẫn được quản lý riêng bởi <code>adminAuth.ts</code>.
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-5">
            <button
              type="button"
              onClick={resetProfile}
              className="rounded-xl border border-stone-200 px-4 py-3 text-sm font-medium hover:bg-stone-50"
            >
              Khôi phục mặc định
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#3b2f25] px-5 py-3 text-sm font-medium text-white hover:bg-[#5a493d]"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AdminProfile;
