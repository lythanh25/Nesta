import { useEffect, useMemo, useState } from "react";
import {
  formatCurrency,
  formatDate,
  getOrderStatusClass,
  readAllOrders,
  updateOrderStatus,
  type AdminOrder,
  type OrderStatus,
} from "../../utils/adminData";

const statuses: OrderStatus[] = [
  "Đã tiếp nhận",
  "Đang xử lý",
  "Đang giao hàng",
  "Đã hoàn thành",
  "Đã hủy",
];

function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>(() => readAllOrders());
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  function loadOrders() {
    setOrders(readAllOrders());
  }

  useEffect(() => {
    const refresh = () => {
      setOrders(readAllOrders());
    };

    window.addEventListener("ordersUpdated", refresh);
    window.addEventListener("adminDataUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("ordersUpdated", refresh);
      window.removeEventListener("adminDataUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesKeyword =
        !normalized ||
        order.id.toLowerCase().includes(normalized) ||
        order.customer?.fullName?.toLowerCase().includes(normalized) ||
        order.customer?.email?.toLowerCase().includes(normalized) ||
        order.customer?.phone?.toLowerCase().includes(normalized);

      const matchesStatus =
        statusFilter === "Tất cả" || order.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [orders, keyword, statusFilter]);

  const totalRevenue = orders
    .filter((order) => order.status === "Đã hoàn thành")
    .reduce((sum, order) => sum + order.total, 0);

  function handleStatusChange(order: AdminOrder, status: OrderStatus) {
    setUpdatingId(order.id);
    setMessage("");

    const success = updateOrderStatus(order.id, status);

    if (!success) {
      setMessage(
        "Không thể cập nhật trạng thái. Hãy kiểm tra dữ liệu đơn hàng trong trình duyệt.",
      );
      setUpdatingId("");
      return;
    }

    setOrders(readAllOrders());
    setSelectedOrder((current) =>
      current?.id === order.id ? { ...current, status } : current,
    );
    setMessage(`Đã cập nhật đơn ${order.id}.`);
    setUpdatingId("");
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            NESTA / QUẢN TRỊ
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">
            Quản lý đơn hàng
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Theo dõi đơn đặt hàng và cập nhật tiến trình xử lý.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-stone-50"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
        >
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Tổng đơn hàng", value: orders.length },
          {
            label: "Chờ xử lý",
            value: orders.filter(
              (order) =>
                order.status === "Đã tiếp nhận" ||
                order.status === "Đang xử lý",
            ).length,
          },
          {
            label: "Đang giao",
            value: orders.filter((order) => order.status === "Đang giao hàng")
              .length,
          },
          {
            label: "Doanh thu hoàn thành",
            value: formatCurrency(totalRevenue),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-stone-500">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[#2d261f]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 md:flex-row">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm mã đơn, tên khách, email hoặc số điện thoại..."
            className="min-w-0 flex-1 rounded-xl border border-stone-200 px-4 py-2.5 text-sm outline-none focus:border-[#8b7765]"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#8b7765]"
          >
            <option>Tất cả</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-4">Mã đơn</th>
                <th className="px-5 py-4">Khách hàng</th>
                <th className="px-5 py-4">Ngày đặt</th>
                <th className="px-5 py-4">Sản phẩm</th>
                <th className="px-5 py-4">Tổng tiền</th>
                <th className="px-5 py-4">Trạng thái</th>
                <th className="px-5 py-4">Chi tiết</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#fcfaf8]">
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {order.id}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium">
                      {order.customer?.fullName || "Khách hàng"}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {order.customer?.phone || order.customer?.email || "—"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-4">{order.items.length} sản phẩm</td>
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={
                        statuses.includes(order.status as OrderStatus)
                          ? order.status
                          : "Đã tiếp nhận"
                      }
                      disabled={updatingId === order.id}
                      onChange={(event) =>
                        handleStatusChange(
                          order,
                          event.target.value as OrderStatus,
                        )
                      }
                      className={`max-w-[170px] rounded-full px-3 py-2 text-xs font-medium outline-none ${getOrderStatusClass(
                        order.status,
                      )}`}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-100"
                    >
                      Xem đơn
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="font-medium text-stone-600">
                      Không tìm thấy đơn hàng
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      Đơn hàng mới sẽ xuất hiện tại đây sau khi khách đặt hàng.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedOrder(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-stone-500">
                  Chi tiết đơn hàng
                </p>
                <h2
                  id="order-detail-title"
                  className="mt-1 text-xl font-semibold"
                >
                  {selectedOrder.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết"
                className="rounded-full px-3 py-1 text-xl text-stone-500 hover:bg-stone-100"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-xl bg-[#faf8f6] p-4 text-sm sm:grid-cols-2">
              <p>
                <span className="text-stone-500">Khách hàng:</span>{" "}
                {selectedOrder.customer?.fullName || "—"}
              </p>
              <p>
                <span className="text-stone-500">Điện thoại:</span>{" "}
                {selectedOrder.customer?.phone || "—"}
              </p>
              <p>
                <span className="text-stone-500">Email:</span>{" "}
                {selectedOrder.customer?.email || "—"}
              </p>
              <p>
                <span className="text-stone-500">Ngày đặt:</span>{" "}
                {formatDate(selectedOrder.createdAt)}
              </p>
              <p className="sm:col-span-2">
                <span className="text-stone-500">Địa chỉ:</span>{" "}
                {[
                  selectedOrder.customer?.address,
                  selectedOrder.customer?.ward,
                  selectedOrder.customer?.district,
                  selectedOrder.customer?.city,
                ]
                  .filter(Boolean)
                  .join(", ") || "Chưa có địa chỉ"}
              </p>
              <p>
                <span className="text-stone-500">Thanh toán:</span>{" "}
                {selectedOrder.paymentMethod === "bank"
                  ? "Chuyển khoản"
                  : "Thanh toán khi nhận hàng"}
              </p>
              <p>
                <span className="text-stone-500">Trạng thái:</span>{" "}
                {selectedOrder.status}
              </p>
            </div>

            <h3 className="mt-6 font-semibold">Sản phẩm trong đơn</h3>
            <div className="mt-3 divide-y divide-stone-100">
              {selectedOrder.items.map((item, index) => (
                <div
                  key={`${item.productId}-${item.size || ""}-${index}`}
                  className="flex items-center gap-3 py-3"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded-lg bg-stone-100 object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-stone-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.size && (
                      <p className="mt-1 text-xs text-stone-500">
                        Kích thước: {item.size}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-stone-500">
                      SL: {item.quantity}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Tạm tính</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Phí vận chuyển</span>
                <span>{formatCurrency(selectedOrder.shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Tổng thanh toán</span>
                <span>{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(selectedOrder, status)}
                  disabled={selectedOrder.status === status}
                  className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {status}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
