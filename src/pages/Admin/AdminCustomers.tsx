import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_STORAGE_KEYS,
  readCustomers,
  writeStorage,
} from "../../utils/adminData";
import type { Customer } from "../../utils/customerAuth";

function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(() => readCustomers());
  const [keyword, setKeyword] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const refresh = () => {
      setCustomers(readCustomers());
    };

    window.addEventListener("customerAuthUpdated", refresh);
    window.addEventListener("adminDataUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("customerAuthUpdated", refresh);
      window.removeEventListener("adminDataUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return customers.filter(
      (customer) =>
        !search ||
        customer.fullName.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        (customer.phone || "").toLowerCase().includes(search) ||
        customer.id.toLowerCase().includes(search),
    );
  }, [customers, keyword]);

  function deleteCustomer(customer: Customer) {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${customer.fullName}"?\n\nHồ sơ và địa chỉ của tài khoản sẽ bị xóa. Lịch sử đơn hàng được giữ nguyên.`,
    );

    if (!confirmed) return;

    const updated = customers.filter((item) => item.id !== customer.id);

    if (!writeStorage(ADMIN_STORAGE_KEYS.users, updated)) {
      setMessage("Không thể lưu thay đổi. Vui lòng thử lại.");
      return;
    }

    try {
      localStorage.removeItem(
        `${ADMIN_STORAGE_KEYS.customerProfile}:${customer.id}`,
      );
      localStorage.removeItem(
        `${ADMIN_STORAGE_KEYS.customerAddress}:${customer.id}`,
      );

      // Nếu khách đang đăng nhập trên trình duyệt này, xóa phiên đó.
      const sessionRaw = localStorage.getItem("nesta-user-session");

      if (sessionRaw) {
        try {
          const session = JSON.parse(sessionRaw) as {
            user?: { id?: string };
          };

          if (session.user?.id === customer.id) {
            localStorage.removeItem("nesta-user-session");
            window.dispatchEvent(new Event("customerAuthUpdated"));
          }
        } catch {
          // Bỏ qua phiên đăng nhập không đúng định dạng.
        }
      }

      setCustomers(updated);
      setSelectedCustomer(null);
      setMessage(`Đã xóa tài khoản ${customer.email}.`);
    } catch {
      // Tài khoản đã xóa khỏi danh sách, nhưng có thể chưa dọn hết hồ sơ.
      setCustomers(readCustomers());
      setMessage(
        "Tài khoản đã được xóa nhưng không thể dọn toàn bộ dữ liệu hồ sơ.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            NESTA / QUẢN TRỊ
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
            Quản lý khách hàng
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Tra cứu và quản lý tài khoản khách hàng đã đăng ký.
          </p>
        </div>

        <button
          onClick={() => setCustomers(readCustomers())}
          className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50"
        >
          Làm mới dữ liệu
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
        <div className="rounded-2xl border border-[#e9e2db] bg-white p-5">
          <p className="text-sm text-stone-500">Tổng tài khoản</p>
          <p className="mt-3 text-3xl font-semibold">{customers.length}</p>
        </div>

        <div className="rounded-2xl border border-[#e9e2db] bg-white p-5">
          <p className="text-sm text-stone-500">Có số điện thoại</p>
          <p className="mt-3 text-3xl font-semibold">
            {customers.filter((customer) => customer.phone?.trim()).length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#e9e2db] bg-white p-5">
          <p className="text-sm text-stone-500">Kết quả tìm kiếm</p>
          <p className="mt-3 text-3xl font-semibold">
            {filteredCustomers.length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        <div className="border-b border-stone-100 p-4">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm theo tên, email, số điện thoại hoặc mã tài khoản..."
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[#8b7765]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Điện thoại</th>
                <th className="px-5 py-4">Mã tài khoản</th>
                <th className="px-5 py-4">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#fcfaf8]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7f1ed] font-semibold text-[#5a493d]">
                        {customer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{customer.fullName}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4">{customer.email}</td>
                  <td className="px-5 py-4">{customer.phone || "—"}</td>
                  <td className="px-5 py-4 text-xs text-stone-500">
                    {customer.id}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-50"
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => deleteCustomer(customer)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-14 text-center text-stone-500"
                  >
                    Chưa có tài khoản phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
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
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-stone-500">
                  Thông tin tài khoản
                </p>
                <h2
                  id="customer-detail-title"
                  className="mt-2 text-xl font-semibold"
                >
                  {selectedCustomer.fullName}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                aria-label="Đóng"
                className="rounded-full px-3 py-1 text-xl hover:bg-stone-100"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-stone-500">Mã tài khoản</p>
                <p className="mt-1 break-all font-medium">
                  {selectedCustomer.id}
                </p>
              </div>

              <div>
                <p className="text-stone-500">Họ và tên</p>
                <p className="mt-1 font-medium">{selectedCustomer.fullName}</p>
              </div>

              <div>
                <p className="text-stone-500">Email</p>
                <p className="mt-1 font-medium">{selectedCustomer.email}</p>
              </div>

              <div>
                <p className="text-stone-500">Số điện thoại</p>
                <p className="mt-1 font-medium">
                  {selectedCustomer.phone || "Chưa cập nhật"}
                </p>
              </div>

              <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                Hệ thống hiện chưa lưu thời gian đăng ký. Mật khẩu không được
                hiển thị trong trang quản trị.
              </p>
            </div>

            <button
              onClick={() => setSelectedCustomer(null)}
              className="mt-6 w-full rounded-xl bg-[#3b2f25] px-4 py-3 text-sm font-medium text-white hover:bg-[#5a493d]"
            >
              Đóng
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
