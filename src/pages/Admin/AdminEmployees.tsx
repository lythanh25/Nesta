import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ADMIN_STORAGE_KEYS,
  readStorage,
  writeStorage,
  type AdminEmployee,
} from "../../utils/adminData";
import { useFeedback } from "../../components/feedback/useFeedback";

type EmployeeForm = Omit<AdminEmployee, "id" | "createdAt" | "status">;

type StatusFilter = "Tất cả" | AdminEmployee["status"];

const emptyEmployee: EmployeeForm = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  department: "",
};

const statusOptions: StatusFilter[] = [
  "Tất cả",
  "Đang làm việc",
  "Tạm nghỉ",
  "Đã nghỉ việc",
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function getStatusClass(status: AdminEmployee["status"]) {
  switch (status) {
    case "Đang làm việc":
      return "bg-green-50 text-green-700 border-green-200";
    case "Tạm nghỉ":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Đã nghỉ việc":
      return "bg-stone-100 text-stone-600 border-stone-200";
    default:
      return "bg-stone-100 text-stone-600 border-stone-200";
  }
}

function AdminEmployees() {
  const { toast, confirm } = useFeedback();

  const [employees, setEmployees] = useState<AdminEmployee[]>(() =>
    readStorage<AdminEmployee[]>(ADMIN_STORAGE_KEYS.employees, []),
  );

  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Tất cả");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyEmployee);
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

  const stats = useMemo(
    () => ({
      total: employees.length,
      working: employees.filter(
        (employee) => employee.status === "Đang làm việc",
      ).length,
      resting: employees.filter((employee) => employee.status === "Tạm nghỉ")
        .length,
      resigned: employees.filter(
        (employee) => employee.status === "Đã nghỉ việc",
      ).length,
    }),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const search = normalizeText(keyword);

    return employees.filter((employee) => {
      const matchesKeyword =
        !search ||
        normalizeText(employee.fullName).includes(search) ||
        normalizeText(employee.email).includes(search) ||
        normalizeText(employee.position).includes(search) ||
        normalizeText(employee.department || "").includes(search) ||
        normalizeText(employee.phone || "").includes(search);

      const matchesStatus =
        statusFilter === "Tất cả" || employee.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [employees, keyword, statusFilter]);

  function openCreateForm() {
    setEditingId(null);
    setForm({ ...emptyEmployee });
    setShowForm(true);
  }

  function openEditForm(employee: AdminEmployee) {
    setEditingId(employee.id);

    setForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone || "",
      position: employee.position,
      department: employee.department || "",
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyEmployee });
  }

  function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const position = form.position.trim();
    const department = form.department.trim();

    if (!fullName || !email || !position) {
      toast("Vui lòng nhập đầy đủ họ tên, email và chức vụ.", "warning");
      return;
    }

    const duplicateEmail = employees.some(
      (employee) =>
        employee.email.toLowerCase() === email && employee.id !== editingId,
    );

    if (duplicateEmail) {
      toast("Email này đã được sử dụng cho nhân viên khác.", "warning");
      return;
    }

    const nextEmployees = editingId
      ? employees.map((employee) =>
          employee.id === editingId
            ? {
                ...employee,
                fullName,
                email,
                phone,
                position,
                department,
              }
            : employee,
        )
      : [
          {
            ...form,
            fullName,
            email,
            phone,
            position,
            department,
            id: `employee-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: "Đang làm việc" as const,
          },
          ...employees,
        ];

    if (!writeStorage(ADMIN_STORAGE_KEYS.employees, nextEmployees)) {
      toast("Không thể lưu dữ liệu nhân viên. Vui lòng thử lại.", "error");
      return;
    }

    setEmployees(nextEmployees);
    closeForm();

    toast(
      editingId ? "Đã cập nhật thông tin nhân viên." : "Đã thêm nhân viên mới.",
      "success",
    );
  }

  async function changeEmployeeStatus(
    employee: AdminEmployee,
    nextStatus: AdminEmployee["status"],
  ) {
    const isResigning = nextStatus === "Đã nghỉ việc";

    const accepted = await confirm({
      title: isResigning ? "Xác nhận nghỉ việc" : "Khôi phục nhân viên",
      message: isResigning
        ? `Bạn có chắc chắn muốn chuyển nhân viên "${employee.fullName}" sang trạng thái Đã nghỉ việc? Hồ sơ nhân viên vẫn được lưu lại.`
        : `Bạn có muốn chuyển nhân viên "${employee.fullName}" trở lại trạng thái Đang làm việc?`,
      confirmText: isResigning ? "Xác nhận nghỉ việc" : "Khôi phục",
      cancelText: "Hủy",
      danger: isResigning,
    });

    if (!accepted) return;

    const nextEmployees = employees.map((item) =>
      item.id === employee.id ? { ...item, status: nextStatus } : item,
    );

    if (!writeStorage(ADMIN_STORAGE_KEYS.employees, nextEmployees)) {
      toast("Không thể cập nhật trạng thái nhân viên.", "error");
      return;
    }

    setEmployees(nextEmployees);

    toast(
      isResigning
        ? "Đã chuyển nhân viên sang trạng thái Đã nghỉ việc."
        : "Đã khôi phục nhân viên.",
      "success",
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            NESTA / QUẢN TRỊ
          </p>

          <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
            Quản lý nhân viên
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Quản lý hồ sơ, chức vụ và trạng thái làm việc của nhân viên.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="rounded-xl bg-[#3b2f25] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#5a493d]"
        >
          + Thêm nhân viên
        </button>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Tổng nhân viên",
            value: stats.total,
            description: "Tất cả hồ sơ",
          },
          {
            label: "Đang làm việc",
            value: stats.working,
            description: "Nhân viên hiện tại",
          },
          {
            label: "Tạm nghỉ",
            value: stats.resting,
            description: "Nhân viên tạm nghỉ",
          },
          {
            label: "Đã nghỉ việc",
            value: stats.resigned,
            description: "Hồ sơ đã lưu",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5"
          >
            <p className="text-sm text-stone-500">{item.label}</p>

            <p className="mt-3 text-3xl font-semibold text-[#2d261f]">
              {item.value}
            </p>

            <p className="mt-1 text-xs text-stone-400">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Employee list */}
      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        <div className="space-y-4 border-b border-stone-100 p-4 sm:p-5">
          <div>
            <h2 className="font-semibold text-[#2d261f]">
              Danh sách nhân viên
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Tìm kiếm và quản lý thông tin nhân viên.
            </p>
          </div>

          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên, email, chức vụ, phòng ban..."
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-[#8b7765] focus:ring-2 focus:ring-[#8b7765]/10"
          />

          {/* Status filters */}
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => {
              const active = statusFilter === status;

              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    active
                      ? "border-[#3b2f25] bg-[#3b2f25] text-white"
                      : "border-stone-200 bg-white text-stone-600 hover:border-[#8b7765] hover:text-[#3b2f25]"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
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
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="transition hover:bg-[#fcfaf8]">
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#2d261f]">
                      {employee.fullName}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">{employee.id}</p>
                  </td>

                  <td className="px-5 py-4 text-stone-700">
                    {employee.position}
                  </td>

                  <td className="px-5 py-4 text-stone-600">
                    {employee.department || "—"}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-stone-700">{employee.email}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {employee.phone || "—"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${getStatusClass(employee.status)}`}
                    >
                      {employee.status || "Đang làm việc"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(employee)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-700 transition hover:bg-stone-50"
                      >
                        Sửa
                      </button>

                      {employee.status !== "Đã nghỉ việc" ? (
                        <button
                          onClick={() =>
                            changeEmployeeStatus(employee, "Đã nghỉ việc")
                          }
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700 transition hover:bg-red-50"
                        >
                          Nghỉ việc
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            changeEmployeeStatus(employee, "Đang làm việc")
                          }
                          className="rounded-lg border border-green-200 px-3 py-2 text-xs text-green-700 transition hover:bg-green-50"
                        >
                          Khôi phục
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="font-medium text-stone-600">
                      Không tìm thấy nhân viên phù hợp.
                    </p>
                    <p className="mt-2 text-xs text-stone-400">
                      Thử thay đổi từ khóa hoặc bộ lọc trạng thái.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-stone-100 px-5 py-3">
          <p className="text-xs text-stone-500">
            Hiển thị {filteredEmployees.length} / {employees.length} nhân viên
          </p>
        </div>
      </section>

      {/* Create / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <form
            onSubmit={saveEmployee}
            className="max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-2xl text-[#2d261f]">
                  {editingId ? "Cập nhật nhân viên" : "Thêm nhân viên"}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Nhập thông tin hồ sơ nhân viên.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Đóng biểu mẫu"
                className="rounded-lg px-2 text-2xl text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                Họ và tên *
                <input
                  required
                  maxLength={100}
                  value={form.fullName}
                  onChange={(event) =>
                    setForm({ ...form, fullName: event.target.value })
                  }
                  placeholder="Nhập họ và tên"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none transition focus:border-[#8b7765]"
                />
              </label>

              <label className="text-sm font-medium text-stone-700">
                Email *
                <input
                  required
                  type="email"
                  maxLength={150}
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  placeholder="example@email.com"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none transition focus:border-[#8b7765]"
                />
              </label>

              <label className="text-sm font-medium text-stone-700">
                Số điện thoại
                <input
                  type="tel"
                  maxLength={20}
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  placeholder="Nhập số điện thoại"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none transition focus:border-[#8b7765]"
                />
              </label>

              <label className="text-sm font-medium text-stone-700">
                Chức vụ *
                <input
                  required
                  maxLength={100}
                  value={form.position}
                  onChange={(event) =>
                    setForm({ ...form, position: event.target.value })
                  }
                  placeholder="VD: Quản lý cửa hàng"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none transition focus:border-[#8b7765]"
                />
              </label>

              <label className="text-sm font-medium text-stone-700 sm:col-span-2">
                Phòng ban
                <input
                  maxLength={100}
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                  placeholder="VD: Kinh doanh"
                  className="mt-2 w-full rounded-xl border border-stone-200 px-3 py-2.5 font-normal outline-none transition focus:border-[#8b7765]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm text-stone-600 transition hover:bg-stone-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="rounded-xl bg-[#3b2f25] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#5a493d]"
              >
                {editingId ? "Lưu thay đổi" : "Thêm nhân viên"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminEmployees;
