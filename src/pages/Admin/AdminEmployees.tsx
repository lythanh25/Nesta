import { useEffect, useState } from "react";
import {
  ADMIN_STORAGE_KEYS,
  readStorage,
  writeStorage,
  type AdminEmployee,
} from "../../utils/adminData";

const emptyEmployee: Omit<AdminEmployee, "id" | "createdAt"> = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  department: "",
  status: "Đang làm việc",
};

function AdminEmployees() {
  const [employees, setEmployees] = useState<AdminEmployee[]>(() =>
    readStorage<AdminEmployee[]>(ADMIN_STORAGE_KEYS.employees, []),
  );
  const [keyword, setKeyword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyEmployee);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setEmployees(
        readStorage<AdminEmployee[]>(ADMIN_STORAGE_KEYS.employees, []),
      );
    };

    window.addEventListener("adminDataUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("adminDataUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = employees.filter((employee) => {
    const search = keyword.trim().toLowerCase();
    return (
      !search ||
      employee.fullName.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      employee.position.toLowerCase().includes(search) ||
      employee.department.toLowerCase().includes(search)
    );
  });

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyEmployee);
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(employee: AdminEmployee) {
    setEditingId(employee.id);
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      department: employee.department,
      status: employee.status,
    });
    setMessage("");
    setShowForm(true);
  }

  function saveEmployee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();

    if (!fullName || !email || !form.position.trim()) {
      setMessage("Vui lòng nhập họ tên, email và chức vụ.");
      return;
    }

    const duplicateEmail = employees.some(
      (employee) =>
        employee.email.toLowerCase() === email && employee.id !== editingId,
    );

    if (duplicateEmail) {
      setMessage("Email này đã được sử dụng cho nhân viên khác.");
      return;
    }

    const nextEmployees = editingId
      ? employees.map((employee) =>
          employee.id === editingId
            ? { ...employee, ...form, fullName, email }
            : employee,
        )
      : [
          {
            ...form,
            fullName,
            email,
            id: `employee-${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
          ...employees,
        ];

    if (!writeStorage(ADMIN_STORAGE_KEYS.employees, nextEmployees)) {
      setMessage("Không thể lưu dữ liệu nhân viên. Vui lòng thử lại.");
      return;
    }

    setEmployees(nextEmployees);
    setShowForm(false);
    setMessage(editingId ? "Đã cập nhật nhân viên." : "Đã thêm nhân viên.");
  }

  function removeEmployee(employee: AdminEmployee) {
    if (!window.confirm(`Xóa nhân viên "${employee.fullName}"?`)) return;

    const nextEmployees = employees.filter((item) => item.id !== employee.id);

    if (!writeStorage(ADMIN_STORAGE_KEYS.employees, nextEmployees)) {
      setMessage("Không thể xóa nhân viên. Vui lòng thử lại.");
      return;
    }

    setEmployees(nextEmployees);
    setMessage("Đã xóa hồ sơ nhân viên.");
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            NESTA / QUẢN TRỊ
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
            Quản lý nhân viên
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Quản lý hồ sơ, chức vụ và trạng thái làm việc.
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="rounded-xl bg-[#3b2f25] px-4 py-3 text-sm font-medium text-white hover:bg-[#5a493d]"
        >
          + Thêm nhân viên
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

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Tổng nhân viên", employees.length],
          [
            "Đang làm việc",
            employees.filter((e) => e.status === "Đang làm việc").length,
          ],
          ["Tạm nghỉ", employees.filter((e) => e.status === "Tạm nghỉ").length],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5"
          >
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        <div className="border-b border-stone-100 p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên, email, chức vụ hoặc phòng ban..."
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#8b7765]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-4">Nhân viên</th>
                <th className="px-5 py-4">Chức vụ</th>
                <th className="px-5 py-4">Phòng ban</th>
                <th className="px-5 py-4">Liên hệ</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((employee) => (
                <tr key={employee.id} className="hover:bg-[#fcfaf8]">
                  <td className="px-5 py-4">
                    <p className="font-medium">{employee.fullName}</p>
                    <p className="mt-1 text-xs text-stone-400">{employee.id}</p>
                  </td>
                  <td className="px-5 py-4">{employee.position}</td>
                  <td className="px-5 py-4">{employee.department || "—"}</td>
                  <td className="px-5 py-4">
                    <p>{employee.email}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {employee.phone || "—"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        employee.status === "Đang làm việc"
                          ? "bg-green-100 text-green-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(employee)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs hover:bg-stone-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => removeEmployee(employee)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-stone-500"
                  >
                    Chưa có nhân viên phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveEmployee}
            className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingId ? "Cập nhật nhân viên" : "Thêm nhân viên"}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Họ và tên *
                <input
                  required
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Email *
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Số điện thoại
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Chức vụ *
                <input
                  required
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  placeholder="VD: Quản lý cửa hàng"
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Phòng ban
                <input
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  placeholder="VD: Kinh doanh"
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2.5"
                />
              </label>
              <label className="text-sm">
                Trạng thái
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as AdminEmployee["status"],
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5"
                >
                  <option>Đang làm việc</option>
                  <option>Tạm nghỉ</option>
                </select>
              </label>
            </div>

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
                Lưu nhân viên
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminEmployees;
