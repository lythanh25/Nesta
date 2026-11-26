import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ADMIN_STORAGE_KEYS,
  readCustomers,
  writeStorage,
} from "../../utils/adminData";
import type {
  Customer,
  CustomerDeactivationRecord,
} from "../../utils/customerAuth";
import { useFeedback } from "../../components/feedback/useFeedback";

type CustomerFilter = "all" | "active" | "inactive";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function isActive(customer: Customer): boolean {
  // Tài khoản cũ chưa có status được mặc định là đang hoạt động.
  return customer.status !== "inactive";
}

function formatCustomerDate(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function AdminCustomers() {
  const { toast, confirm } = useFeedback();

  const [customers, setCustomers] = useState<Customer[]>(() => readCustomers());
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerFilter>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [deactivationTarget, setDeactivationTarget] = useState<Customer | null>(
    null,
  );
  const [deactivationReason, setDeactivationReason] = useState("");
  const [processingId, setProcessingId] = useState("");

  const loadCustomers = useCallback(() => {
    const latestCustomers = readCustomers();

    setCustomers(latestCustomers);

    setSelectedCustomer((current) => {
      if (!current) return null;

      return (
        latestCustomers.find((customer) => customer.id === current.id) ?? null
      );
    });

    setDeactivationTarget((current) => {
      if (!current) return null;

      return (
        latestCustomers.find((customer) => customer.id === current.id) ?? null
      );
    });
  }, []);

  useEffect(() => {
    window.addEventListener("customerAuthUpdated", loadCustomers);
    window.addEventListener("adminDataUpdated", loadCustomers);
    window.addEventListener("storage", loadCustomers);

    return () => {
      window.removeEventListener("customerAuthUpdated", loadCustomers);
      window.removeEventListener("adminDataUpdated", loadCustomers);
      window.removeEventListener("storage", loadCustomers);
    };
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const search = normalizeText(keyword);

    return customers.filter((customer) => {
      const matchesSearch =
        !search ||
        normalizeText(customer.fullName || "").includes(search) ||
        normalizeText(customer.email || "").includes(search) ||
        normalizeText(customer.phone || "").includes(search) ||
        normalizeText(customer.id || "").includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive(customer)) ||
        (statusFilter === "inactive" && !isActive(customer));

      return matchesSearch && matchesStatus;
    });
  }, [customers, keyword, statusFilter]);

  const customerStats = useMemo(
    () => ({
      total: customers.length,
      active: customers.filter(isActive).length,
      inactive: customers.filter((customer) => !isActive(customer)).length,
      withPhone: customers.filter((customer) => customer.phone?.trim()).length,
      withoutPhone: customers.filter((customer) => !customer.phone?.trim())
        .length,
    }),
    [customers],
  );

  const hasActiveSearch = keyword.trim() !== "";

  const clearSearch = () => setKeyword("");

  // Lưu danh sách khách hàng và đồng bộ trạng thái tài khoản.
  const saveCustomers = (updatedCustomers: Customer[]): boolean => {
    const saved = writeStorage(ADMIN_STORAGE_KEYS.users, updatedCustomers);

    if (!saved) return false;

    setCustomers(updatedCustomers);

    window.dispatchEvent(new Event("customerAuthUpdated"));
    window.dispatchEvent(new Event("adminDataUpdated"));

    return true;
  };

  // Mở modal nhập lý do ngừng hoạt động.
  const openDeactivationModal = (customer: Customer) => {
    if (!isActive(customer)) return;

    setDeactivationReason("");
    setDeactivationTarget(customer);
  };

  // Ngừng hoạt động tài khoản sau khi có lý do cụ thể.
  const deactivateCustomer = () => {
    if (!deactivationTarget || processingId) return;

    const reason = deactivationReason.trim();

    if (!reason) {
      toast("Vui lòng nhập lý do ngừng hoạt động tài khoản.", "warning");
      return;
    }

    if (reason.length < 5) {
      toast("Lý do cần có ít nhất 5 ký tự.", "warning");
      return;
    }

    const customerId = deactivationTarget.id;
    setProcessingId(customerId);

    try {
      // Đọc dữ liệu mới nhất để tránh ghi đè thay đổi vừa phát sinh.
      const latestCustomers = readCustomers();
      const target = latestCustomers.find(
        (customer) => customer.id === customerId,
      );

      if (!target) {
        toast("Không tìm thấy tài khoản khách hàng.", "error");
        return;
      }

      if (!isActive(target)) {
        toast("Tài khoản này đã ngừng hoạt động trước đó.", "warning");
        setDeactivationTarget(null);
        loadCustomers();
        return;
      }

      const now = new Date().toISOString();

      const history: CustomerDeactivationRecord[] = [
        ...(target.deactivationHistory ?? []),
        {
          reason,
          deactivatedAt: now,
        },
      ];

      const updatedCustomers = latestCustomers.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              status: "inactive" as const,
              deactivationReason: reason,
              deactivatedAt: now,
              deactivationHistory: history,
            }
          : customer,
      );

      if (!saveCustomers(updatedCustomers)) {
        toast(
          "Không thể cập nhật trạng thái tài khoản. Vui lòng thử lại.",
          "error",
        );
        return;
      }

      // Nếu tài khoản đang đăng nhập trên trình duyệt hiện tại,
      // kết thúc phiên đăng nhập nhưng không xóa hồ sơ hoặc địa chỉ.
      try {
        const sessionRaw = localStorage.getItem("nesta-user-session");

        if (sessionRaw) {
          const session = JSON.parse(sessionRaw) as {
            user?: { id?: string };
          };

          if (session.user?.id === customerId) {
            localStorage.removeItem("nesta-user-session");
          }
        }
      } catch {
        // Không ảnh hưởng đến việc cập nhật trạng thái tài khoản.
      }

      setSelectedCustomer((current) =>
        current?.id === customerId
          ? {
              ...current,
              status: "inactive",
              deactivationReason: reason,
              deactivatedAt: now,
              deactivationHistory: history,
            }
          : current,
      );

      setDeactivationTarget(null);
      setDeactivationReason("");

      toast(
        `Đã ngừng hoạt động tài khoản ${target.email}. Thông tin và lịch sử đơn hàng được giữ nguyên.`,
        "success",
      );
    } finally {
      setProcessingId("");
    }
  };

  // Kích hoạt lại tài khoản, không xóa lịch sử ngừng hoạt động.
  const reactivateCustomer = async (customer: Customer) => {
    if (processingId || isActive(customer)) return;

    const confirmed = await confirm({
      title: "Kích hoạt lại tài khoản?",
      message:
        `Bạn có muốn kích hoạt lại tài khoản "${customer.fullName}" không?\n\n` +
        "Khách hàng sẽ có thể đăng nhập và sử dụng tài khoản trở lại. " +
        "Lịch sử ngừng hoạt động trước đó vẫn được lưu giữ.",
      confirmText: "Kích hoạt lại",
      danger: false,
    });

    if (!confirmed) return;

    setProcessingId(customer.id);

    try {
      const latestCustomers = readCustomers();
      const target = latestCustomers.find((item) => item.id === customer.id);

      if (!target) {
        toast("Không tìm thấy tài khoản khách hàng.", "error");
        return;
      }

      if (isActive(target)) {
        toast("Tài khoản này đã được kích hoạt trước đó.", "warning");
        loadCustomers();
        return;
      }

      const now = new Date().toISOString();
      const history = [...(target.deactivationHistory ?? [])];

      // Ghi nhận thời điểm kích hoạt lại cho lần ngừng hoạt động gần nhất.
      for (let index = history.length - 1; index >= 0; index -= 1) {
        if (!history[index].reactivatedAt) {
          history[index] = {
            ...history[index],
            reactivatedAt: now,
          };
          break;
        }
      }

      const updatedCustomers = latestCustomers.map((item) =>
        item.id === customer.id
          ? {
              ...item,
              status: "active" as const,
              lastReactivatedAt: now,
              deactivationHistory: history,
            }
          : item,
      );

      if (!saveCustomers(updatedCustomers)) {
        toast("Không thể kích hoạt tài khoản. Vui lòng thử lại.", "error");
        return;
      }

      toast(`Đã kích hoạt lại tài khoản ${target.email}.`, "success");
    } finally {
      setProcessingId("");
    }
  };

  const statCards = [
    {
      label: "Tổng tài khoản",
      value: customerStats.total,
      description: "Tổng số khách hàng đã đăng ký",
      color: "text-[#2d261f]",
      icon: "♙",
    },
    {
      label: "Đang hoạt động",
      value: customerStats.active,
      description: "Có thể đăng nhập và mua sắm",
      color: "text-green-700",
      icon: "✓",
    },
    {
      label: "Ngừng hoạt động",
      value: customerStats.inactive,
      description: "Tài khoản đang bị vô hiệu hóa",
      color: "text-red-700",
      icon: "Ⅱ",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 text-[#2d261f]">
      {/* Tiêu đề */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            NESTA / QUẢN TRỊ
          </p>

          <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
            Quản lý khách hàng
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Tra cứu thông tin và quản lý trạng thái tài khoản khách hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCustomers}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-stone-50"
        >
          <span>↻</span>
          Làm mới dữ liệu
        </button>
      </header>

      {/* Thống kê */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5 transition hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-stone-500">{item.label}</p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f7f1ed] text-lg text-[#806c5a]">
                {item.icon}
              </span>
            </div>

            <p className={`mt-3 text-3xl font-semibold ${item.color}`}>
              {item.value.toLocaleString("vi-VN")}
            </p>

            <p className="mt-1 text-xs text-stone-400">{item.description}</p>
          </div>
        ))}
      </section>

      {/* Danh sách khách hàng */}
      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        {/* Tìm kiếm và lọc */}
        <div className="space-y-4 border-b border-stone-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-stone-400">
                ⌕
              </span>

              <input
                type="search"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại hoặc mã tài khoản..."
                className="min-h-11 w-full rounded-xl border border-stone-200 bg-[#fdfcfb] py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#8b7765]"
              />
            </div>

            {hasActiveSearch && (
              <button
                type="button"
                onClick={clearSearch}
                className="min-h-11 rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Tất cả", count: customerStats.total },
                {
                  value: "active",
                  label: "Đang hoạt động",
                  count: customerStats.active,
                },
                {
                  value: "inactive",
                  label: "Ngừng hoạt động",
                  count: customerStats.inactive,
                },
              ].map((item) => {
                const active = statusFilter === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(item.value as CustomerFilter)
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "bg-[#3b2f25] text-white"
                        : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {item.label}
                    <span className="ml-1.5 opacity-75">{item.count}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-stone-500">
              Hiển thị{" "}
              <strong className="text-[#2d261f]">
                {filteredCustomers.length}
              </strong>{" "}
              / {customers.length} khách hàng
            </p>
          </div>
        </div>

        {/* Bảng khách hàng */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-4 font-medium">Khách hàng</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Điện thoại</th>
                <th className="px-5 py-4 font-medium">Mã tài khoản</th>
                <th className="px-5 py-4 text-center font-medium">
                  Trạng thái
                </th>
                <th className="px-5 py-4 text-center font-medium">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {filteredCustomers.map((customer) => {
                const active = isActive(customer);
                const processing = processingId === customer.id;

                return (
                  <tr
                    key={customer.id}
                    className="transition hover:bg-[#fcfaf8]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f1ed] font-semibold text-[#5a493d]">
                          {(customer.fullName || "?").charAt(0).toUpperCase()}
                        </div>

                        <span className="font-medium text-[#2d261f]">
                          {customer.fullName || "Chưa cập nhật"}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-stone-600">
                      {customer.email || "—"}
                    </td>

                    <td className="px-5 py-4 text-stone-600">
                      {customer.phone || (
                        <span className="text-stone-400">Chưa cập nhật</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-stone-500">
                        {customer.id}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                          active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {active ? "Đang hoạt động" : "Ngừng hoạt động"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(customer)}
                          className="whitespace-nowrap rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium transition hover:border-[#c7b8aa] hover:bg-stone-50"
                        >
                          Chi tiết
                        </button>

                        {active ? (
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => openDeactivationModal(customer)}
                            className="whitespace-nowrap rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"
                          >
                            Ngừng hoạt động
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => reactivateCustomer(customer)}
                            className="whitespace-nowrap rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-wait disabled:opacity-50"
                          >
                            {processing ? "Đang xử lý..." : "Kích hoạt lại"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7f5f2] text-2xl text-stone-400">
                      ⌕
                    </div>

                    <p className="mt-3 font-medium text-stone-600">
                      {customers.length === 0
                        ? "Chưa có khách hàng đăng ký"
                        : "Không tìm thấy khách hàng"}
                    </p>

                    <p className="mt-1 text-sm text-stone-400">
                      {customers.length === 0
                        ? "Thông tin khách hàng sẽ xuất hiện tại đây khi có tài khoản đăng ký."
                        : "Hãy thử từ khóa khác hoặc thay đổi bộ lọc trạng thái."}
                    </p>

                    {(hasActiveSearch || statusFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          clearSearch();
                          setStatusFilter("all");
                        }}
                        className="mt-3 text-sm font-medium text-[#5a493d] underline underline-offset-4"
                      >
                        Xóa bộ lọc
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal nhập lý do ngừng hoạt động */}
      {deactivationTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !processingId) {
              setDeactivationTarget(null);
              setDeactivationReason("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivation-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                  NESTA / QUẢN LÝ TÀI KHOẢN
                </p>

                <h2
                  id="deactivation-title"
                  className="mt-2 text-xl font-semibold text-[#2d261f]"
                >
                  Ngừng hoạt động tài khoản
                </h2>
              </div>

              <button
                type="button"
                disabled={Boolean(processingId)}
                onClick={() => {
                  setDeactivationTarget(null);
                  setDeactivationReason("");
                }}
                aria-label="Đóng"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-stone-500 transition hover:bg-stone-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-[#faf8f6] p-4">
                <p className="text-xs text-stone-500">Tài khoản được chọn</p>
                <p className="mt-1 font-semibold text-[#2d261f]">
                  {deactivationTarget.fullName}
                </p>
                <p className="mt-1 break-all text-sm text-stone-500">
                  {deactivationTarget.email}
                </p>
              </div>

              <div>
                <label
                  htmlFor="deactivation-reason"
                  className="mb-2 block text-sm font-semibold text-[#2d261f]"
                >
                  Lý do ngừng hoạt động
                  <span className="ml-1 text-red-600">*</span>
                </label>

                <textarea
                  id="deactivation-reason"
                  value={deactivationReason}
                  onChange={(event) =>
                    setDeactivationReason(event.target.value)
                  }
                  rows={4}
                  maxLength={500}
                  placeholder="Nhập lý do cụ thể để lưu vào lịch sử quản lý tài khoản..."
                  className="w-full resize-y rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-stone-400 focus:border-[#8b7765]"
                />

                <div className="mt-1 flex justify-between gap-3">
                  <p className="text-xs text-stone-400">
                    Bắt buộc nhập, tối thiểu 5 ký tự.
                  </p>
                  <p className="text-xs text-stone-400">
                    {deactivationReason.length}/500
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs leading-5 text-amber-800">
                  Tài khoản sẽ không thể đăng nhập sau khi ngừng hoạt động.
                  Thông tin cá nhân, địa chỉ và lịch sử đơn hàng vẫn được giữ
                  nguyên. Lý do này sẽ được lưu trong lịch sử quản lý.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={Boolean(processingId)}
                  onClick={() => {
                    setDeactivationTarget(null);
                    setDeactivationReason("");
                  }}
                  className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  disabled={Boolean(processingId)}
                  onClick={deactivateCustomer}
                  className="rounded-xl bg-red-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-50"
                >
                  {processingId === deactivationTarget.id
                    ? "Đang xử lý..."
                    : "Xác nhận ngừng hoạt động"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal chi tiết khách hàng */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCustomer(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-detail-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            {/* Đầu modal */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-100 bg-white px-6 py-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                  NESTA / THÔNG TIN TÀI KHOẢN
                </p>

                <h2
                  id="customer-detail-title"
                  className="mt-2 text-xl font-semibold text-[#2d261f]"
                >
                  Chi tiết khách hàng
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Đóng chi tiết"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-stone-500 transition hover:bg-stone-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Thông tin nhận diện */}
              <div className="flex items-center gap-4 rounded-xl bg-[#faf8f6] p-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eee5dc] text-xl font-semibold text-[#5a493d]">
                  {(selectedCustomer.fullName || "?").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-[#2d261f]">
                    {selectedCustomer.fullName || "Chưa cập nhật"}
                  </h3>

                  <p className="mt-1 break-all text-xs text-stone-500">
                    {selectedCustomer.email}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      isActive(selectedCustomer)
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {isActive(selectedCustomer)
                      ? "Đang hoạt động"
                      : "Ngừng hoạt động"}
                  </span>
                </div>
              </div>

              {/* Thông tin cá nhân */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#2d261f]">
                  Thông tin cá nhân
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-stone-500">Mã tài khoản</p>
                    <p className="mt-1 break-all text-sm font-medium">
                      {selectedCustomer.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-stone-500">Họ và tên</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedCustomer.fullName || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-stone-500">Email</p>
                    <p className="mt-1 break-all text-sm font-medium">
                      {selectedCustomer.email || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-stone-500">Số điện thoại</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedCustomer.phone || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông tin ngừng hoạt động */}
              {!isActive(selectedCustomer) && (
                <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                  <h3 className="text-sm font-semibold text-red-800">
                    Thông tin ngừng hoạt động
                  </h3>

                  <div className="mt-3 space-y-3">
                    <div>
                      <p className="text-xs text-red-700/70">Lý do gần nhất</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-red-900">
                        {selectedCustomer.deactivationReason ||
                          "Chưa có thông tin"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-red-700/70">
                        Thời điểm ngừng hoạt động
                      </p>
                      <p className="mt-1 text-sm font-medium text-red-900">
                        {formatCustomerDate(selectedCustomer.deactivatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lịch sử trạng thái */}
              {(selectedCustomer.deactivationHistory?.length ?? 0) > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-[#2d261f]">
                    Lịch sử trạng thái tài khoản
                  </h3>

                  <div className="space-y-3">
                    {[...(selectedCustomer.deactivationHistory ?? [])]
                      .reverse()
                      .map((record, index) => (
                        <div
                          key={`${record.deactivatedAt}-${index}`}
                          className="rounded-xl border border-stone-100 bg-[#fdfcfb] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-[#5a493d]">
                              Lần{" "}
                              {(selectedCustomer.deactivationHistory?.length ??
                                0) - index}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                record.reactivatedAt
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {record.reactivatedAt
                                ? "Đã kích hoạt lại"
                                : "Chưa kích hoạt lại"}
                            </span>
                          </div>

                          <p className="mt-3 text-xs text-stone-500">Lý do</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-stone-700">
                            {record.reason}
                          </p>

                          <p className="mt-3 text-xs text-stone-500">
                            Ngừng hoạt động:{" "}
                            <span className="font-medium text-stone-700">
                              {formatCustomerDate(record.deactivatedAt)}
                            </span>
                          </p>

                          {record.reactivatedAt && (
                            <p className="mt-1 text-xs text-stone-500">
                              Kích hoạt lại:{" "}
                              <span className="font-medium text-stone-700">
                                {formatCustomerDate(record.reactivatedAt)}
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Lưu ý */}
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs leading-5 text-amber-800">
                  Mật khẩu khách hàng không được hiển thị trong trang quản trị.
                  Việc thay đổi trạng thái tài khoản không làm mất thông tin cá
                  nhân hoặc lịch sử đơn hàng.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {!isActive(selectedCustomer) && (
                  <button
                    type="button"
                    disabled={processingId === selectedCustomer.id}
                    onClick={() => reactivateCustomer(selectedCustomer)}
                    className="flex-1 rounded-xl border border-green-200 px-4 py-3 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-50"
                  >
                    Kích hoạt lại tài khoản
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="flex-1 rounded-xl bg-[#3b2f25] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#5a493d]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
