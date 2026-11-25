import { useCallback, useEffect, useMemo, useState } from "react";
import { useFeedback } from "../../components/feedback/useFeedback";
import {
  formatCurrency,
  formatDate,
  getOrderStatusClass,
  readAllOrders,
  updateOrderStatus,
  type AdminOrder,
  type OrderStatus,
} from "../../utils/adminData";
import { products } from "../../data/products";
import {
  getStock,
  setMultipleStock,
  type StockUpdate,
} from "../../utils/stock";

const statuses: OrderStatus[] = [
  "Đã tiếp nhận",
  "Đang xử lý",
  "Đang giao hàng",
  "Đã hoàn thành",
  "Đã hủy",
];

const cancelReasons = [
  "Đặt nhầm sản phẩm",
  "Muốn thay đổi sản phẩm hoặc số lượng",
  "Muốn thay đổi địa chỉ nhận hàng",
  "Thời gian giao hàng không phù hợp",
  "Tìm được sản phẩm phù hợp hơn",
  "Lý do khác",
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function canCancelOrder(status: OrderStatus): boolean {
  return status === "Đã tiếp nhận" || status === "Đang xử lý";
}

function getNextStatuses(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "Đã tiếp nhận":
      return ["Đang xử lý", "Đã hủy"];

    case "Đang xử lý":
      return ["Đang giao hàng", "Đã hủy"];

    case "Đang giao hàng":
      return ["Đã hoàn thành"];

    case "Đã hoàn thành":
    case "Đã hủy":
    default:
      return [];
  }
}

function getAvailableStatuses(status: OrderStatus): OrderStatus[] {
  return [status, ...getNextStatuses(status)];
}

function AdminOrders() {
  const { toast, confirm } = useFeedback();

  const [orders, setOrders] = useState<AdminOrder[]>(() => readAllOrders());
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [updatingId, setUpdatingId] = useState("");

  // Trạng thái modal hủy đơn
  const [pendingCancelOrderId, setPendingCancelOrderId] = useState<
    string | null
  >(null);
  const [cancelReason, setCancelReason] = useState("");
  const [otherCancelReason, setOtherCancelReason] = useState("");

  const loadOrders = useCallback(() => {
    const latestOrders = readAllOrders();

    setOrders(latestOrders);

    setSelectedOrder((current) => {
      if (!current) return null;

      return latestOrders.find((order) => order.id === current.id) ?? current;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("ordersUpdated", loadOrders);
    window.addEventListener("adminDataUpdated", loadOrders);
    window.addEventListener("storage", loadOrders);

    return () => {
      window.removeEventListener("ordersUpdated", loadOrders);
      window.removeEventListener("adminDataUpdated", loadOrders);
      window.removeEventListener("storage", loadOrders);
    };
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalized = normalizeText(keyword);

    return orders.filter((order) => {
      const matchesKeyword =
        !normalized ||
        normalizeText(order.id).includes(normalized) ||
        normalizeText(order.customer?.fullName ?? "").includes(normalized) ||
        normalizeText(order.customer?.email ?? "").includes(normalized) ||
        normalizeText(order.customer?.phone ?? "").includes(normalized);

      const matchesStatus =
        statusFilter === "Tất cả" || order.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [orders, keyword, statusFilter]);

  const orderStats = useMemo(() => {
    const completedOrders = orders.filter(
      (order) => order.status === "Đã hoàn thành",
    );

    return {
      total: orders.length,
      pending: orders.filter(
        (order) =>
          order.status === "Đã tiếp nhận" || order.status === "Đang xử lý",
      ).length,
      shipping: orders.filter((order) => order.status === "Đang giao hàng")
        .length,
      cancelled: orders.filter((order) => order.status === "Đã hủy").length,
      revenue: completedOrders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  const hasActiveFilters = keyword.trim() !== "" || statusFilter !== "Tất cả";

  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("Tất cả");
  };

  // Mở modal hủy đơn
  const openCancelModal = (order: AdminOrder) => {
    if (!canCancelOrder(order.status)) {
      toast("Đơn hàng này không còn được phép hủy.", "warning");
      return;
    }

    setCancelReason("");
    setOtherCancelReason("");
    setPendingCancelOrderId(order.id);
  };

  // Cập nhật trạng thái thông thường
  const handleStatusChange = async (
    order: AdminOrder,
    newStatus: OrderStatus,
  ) => {
    if (order.status === newStatus || updatingId === order.id) {
      return;
    }

    // Hủy đơn phải đi qua modal nhập lý do
    if (newStatus === "Đã hủy") {
      openCancelModal(order);
      return;
    }

    // Chặn mọi chuyển trạng thái không hợp lệ
    if (!getNextStatuses(order.status).includes(newStatus)) {
      toast("Không thể chuyển đơn hàng về trạng thái này.", "warning");
      loadOrders();
      return;
    }

    const confirmed = await confirm({
      title: "Xác nhận cập nhật trạng thái?",
      message: `Bạn có chắc muốn chuyển đơn hàng ${order.id} từ "${order.status}" sang "${newStatus}"?`,
      confirmText: "Xác nhận cập nhật",
    });

    if (!confirmed) {
      loadOrders();
      return;
    }

    setUpdatingId(order.id);

    const success = updateOrderStatus(order.id, newStatus);

    if (!success) {
      toast(
        "Không thể cập nhật trạng thái. Vui lòng kiểm tra lại dữ liệu đơn hàng.",
        "error",
      );
      setUpdatingId("");
      loadOrders();
      return;
    }

    loadOrders();

    toast(`Đã cập nhật đơn hàng ${order.id}.`, "success");
    setUpdatingId("");
  };

  // Xác nhận hủy đơn và hoàn kho
  const confirmCancelOrder = () => {
    if (!pendingCancelOrderId) return;

    const finalReason =
      cancelReason === "Lý do khác" ? otherCancelReason.trim() : cancelReason;

    if (!finalReason) {
      toast("Vui lòng chọn hoặc nhập lý do hủy đơn hàng.", "warning");
      return;
    }

    const orderId = pendingCancelOrderId;

    // Đọc lại dữ liệu mới nhất trước khi xử lý
    const latestOrders = readAllOrders();
    const targetOrder = latestOrders.find((order) => order.id === orderId);

    if (!targetOrder) {
      toast("Không tìm thấy đơn hàng cần hủy.", "error");
      setPendingCancelOrderId(null);
      loadOrders();
      return;
    }

    if (!canCancelOrder(targetOrder.status)) {
      toast("Đơn hàng này không còn được phép hủy.", "warning");
      setPendingCancelOrderId(null);
      loadOrders();
      return;
    }

    if (updatingId === orderId) return;

    // Kiểm tra và gộp các sản phẩm trùng ID + kích thước
    const quantityMap = new Map<string, StockUpdate>();

    for (const item of targetOrder.items) {
      const product = products.find((product) => product.id === item.productId);

      if (
        !product ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        (product.sizes?.length && !item.size) ||
        (!product.sizes?.length && item.size) ||
        (item.size && !product.sizes?.some((size) => size.label === item.size))
      ) {
        toast(
          "Không thể hoàn kho vì thông tin sản phẩm trong đơn hàng không hợp lệ.",
          "error",
        );
        return;
      }

      const key = `${item.productId}::${item.size ?? ""}`;
      const existing = quantityMap.get(key);

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        quantityMap.set(key, {
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        });
      }
    }

    // Lưu tồn kho cũ và tính tồn kho mới
    const previousStock: StockUpdate[] = [];
    const nextStock: StockUpdate[] = [];

    for (const item of quantityMap.values()) {
      const currentStock = getStock(item.productId, item.size);

      if (!Number.isInteger(currentStock) || currentStock < 0) {
        toast("Dữ liệu tồn kho không hợp lệ. Không thể hủy đơn hàng.", "error");
        return;
      }

      previousStock.push({
        productId: item.productId,
        size: item.size,
        quantity: currentStock,
      });

      nextStock.push({
        productId: item.productId,
        size: item.size,
        quantity: currentStock + item.quantity,
      });
    }

    setUpdatingId(orderId);

    // Hoàn kho trước khi cập nhật đơn hàng
    if (nextStock.length > 0 && !setMultipleStock(nextStock)) {
      toast("Không thể hoàn lại tồn kho. Vui lòng thử lại.", "error");
      setUpdatingId("");
      return;
    }

    const success = updateOrderStatus(orderId, "Đã hủy", {
      cancellationReason: finalReason,
      cancelledAt: new Date().toISOString(),
    });

    if (!success) {
      // Nếu không lưu được đơn hàng, khôi phục tồn kho cũ
      const restored =
        previousStock.length === 0 || setMultipleStock(previousStock);

      toast(
        restored
          ? "Không thể lưu trạng thái đơn hàng. Tồn kho đã được khôi phục, vui lòng thử lại."
          : "Không thể lưu trạng thái đơn hàng và khôi phục tồn kho tự động. Vui lòng kiểm tra lại dữ liệu tồn kho.",
        "error",
      );

      setUpdatingId("");
      return;
    }

    setPendingCancelOrderId(null);
    setCancelReason("");
    setOtherCancelReason("");

    loadOrders();

    toast(
      "Đã hủy đơn hàng thành công. Số lượng sản phẩm đã được hoàn lại kho.",
      "success",
    );

    setUpdatingId("");
  };

  const statCards = [
    {
      label: "Tổng đơn hàng",
      value: orderStats.total.toLocaleString("vi-VN"),
      description: "Tất cả đơn hàng",
      color: "text-[#2d261f]",
    },
    {
      label: "Chờ xử lý",
      value: orderStats.pending.toLocaleString("vi-VN"),
      description: "Đã tiếp nhận và đang xử lý",
      color: "text-amber-700",
    },
    {
      label: "Đang giao hàng",
      value: orderStats.shipping.toLocaleString("vi-VN"),
      description: "Đơn hàng đang được vận chuyển",
      color: "text-blue-700",
    },
    {
      label: "Đã hủy",
      value: orderStats.cancelled.toLocaleString("vi-VN"),
      description: "Đơn hàng đã bị hủy",
      color: "text-red-600",
    },
    {
      label: "Doanh thu hoàn thành",
      value: formatCurrency(orderStats.revenue),
      description: "Tính từ các đơn đã hoàn thành",
      color: "text-green-700",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 text-[#2d261f]">
      {/* Tiêu đề */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
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
          type="button"
          onClick={loadOrders}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-stone-50"
        >
          <span>↻</span>
          Làm mới dữ liệu
        </button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5 transition hover:shadow-sm"
          >
            <p className="text-sm text-stone-500">{item.label}</p>

            <p
              className={`mt-3 break-words text-2xl font-semibold ${item.color}`}
            >
              {item.value}
            </p>

            <p className="mt-1 text-xs text-stone-400">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Danh sách đơn hàng */}
      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
        {/* Bộ lọc */}
        <div className="border-b border-stone-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm mã đơn, tên khách, email hoặc số điện thoại..."
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-[#fdfcfb] px-4 py-2.5 text-sm outline-none transition focus:border-[#8b7765]"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#8b7765]"
            >
              <option value="Tất cả">Tất cả trạng thái</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-500">
              Hiển thị{" "}
              <strong className="text-[#2d261f]">
                {filteredOrders.length}
              </strong>{" "}
              / {orders.length} đơn hàng
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-medium text-[#5a493d] underline underline-offset-4 transition hover:text-[#2d261f]"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Bảng */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-[#faf8f6] text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-5 py-4 font-medium">Mã đơn</th>
                <th className="px-5 py-4 font-medium">Khách hàng</th>
                <th className="px-5 py-4 font-medium">Ngày đặt</th>
                <th className="px-5 py-4 font-medium">Sản phẩm</th>
                <th className="px-5 py-4 font-medium">Tổng tiền</th>
                <th className="px-5 py-4 font-medium">Trạng thái</th>
                <th className="px-5 py-4 text-center font-medium">Chi tiết</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {filteredOrders.map((order) => {
                const availableStatuses = getAvailableStatuses(order.status);

                return (
                  <tr key={order.id} className="transition hover:bg-[#fcfaf8]">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#5a493d]">
                      {order.id}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-[#2d261f]">
                        {order.customer?.fullName || "Khách hàng"}
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        {order.customer?.phone || order.customer?.email || "—"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                      {formatDate(order.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {order.items.length} sản phẩm
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(event) =>
                          handleStatusChange(
                            order,
                            event.target.value as OrderStatus,
                          )
                        }
                        className={`max-w-[175px] rounded-full px-3 py-2 text-xs font-medium outline-none transition disabled:cursor-wait disabled:opacity-60 ${getOrderStatusClass(
                          order.status,
                        )}`}
                      >
                        {availableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="whitespace-nowrap rounded-lg border border-stone-200 px-3 py-2 text-xs font-medium transition hover:border-[#c7b8aa] hover:bg-stone-100"
                      >
                        Xem đơn
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f7f5f2] text-2xl text-stone-400">
                      ⌕
                    </div>

                    <p className="mt-3 font-medium text-stone-600">
                      Không tìm thấy đơn hàng
                    </p>

                    <p className="mt-1 text-sm text-stone-400">
                      Hãy thử từ khóa khác hoặc thay đổi bộ lọc.
                    </p>

                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
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

      {/* Chi tiết đơn hàng */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            {/* Đầu modal */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-stone-100 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
                  Chi tiết đơn hàng
                </p>

                <h2
                  id="order-detail-title"
                  className="mt-1 text-xl font-semibold text-[#2d261f]"
                >
                  {selectedOrder.id}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Đóng chi tiết"
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-stone-500 transition hover:bg-stone-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
              {/* Thông tin khách hàng */}
              <div>
                <h3 className="font-semibold text-[#2d261f]">
                  Thông tin đơn hàng
                </h3>

                <div className="mt-3 grid gap-3 rounded-xl bg-[#faf8f6] p-4 text-sm sm:grid-cols-2">
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
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusClass(
                        selectedOrder.status,
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Thông tin hủy đơn */}
              {selectedOrder.status === "Đã hủy" && (
                <div className="rounded-xl border border-red-100 bg-red-50/70 p-4">
                  <h3 className="text-sm font-semibold text-red-800">
                    Thông tin hủy đơn hàng
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-red-900">
                    <span className="font-medium">Lý do hủy:</span>{" "}
                    {selectedOrder.cancellationReason ||
                      "Chưa có thông tin lý do hủy"}
                  </p>

                  {selectedOrder.cancelledAt && (
                    <p className="mt-1 text-xs text-red-700">
                      Thời gian hủy: {formatDate(selectedOrder.cancelledAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Sản phẩm */}
              <div>
                <h3 className="font-semibold text-[#2d261f]">
                  Sản phẩm trong đơn
                </h3>

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
                          loading="lazy"
                          className="h-16 w-16 shrink-0 rounded-lg border border-stone-100 bg-stone-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400">
                          Không ảnh
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#2d261f]">
                          {item.name}
                        </p>

                        {item.size && (
                          <p className="mt-1 text-xs text-stone-500">
                            Kích thước: {item.size}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-stone-500">
                          Số lượng: {item.quantity}
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-sm font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thanh toán */}
              <div className="space-y-3 border-t border-stone-200 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tạm tính</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500">Phí vận chuyển</span>
                  <span>{formatCurrency(selectedOrder.shipping)}</span>
                </div>

                <div className="flex justify-between border-t border-stone-100 pt-3 text-base font-semibold">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#5a493d]">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* Cập nhật trạng thái */}
              <div className="border-t border-stone-200 pt-5">
                <h3 className="font-semibold text-[#2d261f]">
                  Cập nhật trạng thái
                </h3>

                <p className="mt-1 text-xs text-stone-500">
                  Chỉ có thể chuyển đơn hàng sang trạng thái tiếp theo trong quy
                  trình xử lý.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {getAvailableStatuses(selectedOrder.status).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(selectedOrder, status)}
                      disabled={
                        selectedOrder.status === status ||
                        updatingId === selectedOrder.id
                      }
                      className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedOrder.status === status
                          ? "border-[#5a493d] bg-[#f7f1ed] text-[#5a493d]"
                          : status === "Đã hủy"
                            ? "border-red-200 text-red-700 hover:border-red-400 hover:bg-red-50"
                            : "border-stone-200 text-stone-600 hover:border-[#c7b8aa] hover:bg-stone-50"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {getNextStatuses(selectedOrder.status).length === 0 && (
                  <p className="mt-3 text-xs text-stone-400">
                    Đơn hàng đã ở trạng thái kết thúc và không thể cập nhật
                    thêm.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal hủy đơn */}
      {pendingCancelOrderId && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPendingCancelOrderId(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl md:p-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#e5ddd6] pb-4">
              <div>
                <p className="text-[10px] tracking-[0.18em] text-[#9a8878]">
                  NESTA FURNITURE
                </p>

                <h2
                  id="cancel-order-title"
                  className="mt-2 text-base font-semibold text-[#2d261f]"
                >
                  HỦY ĐƠN HÀNG
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setPendingCancelOrderId(null)}
                aria-label="Đóng hộp thoại"
                className="text-xl text-[#8c8178] transition hover:text-[#2d261f]"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-xs leading-5 text-[#756b63]">
              Bạn vui lòng cho NESTA biết lý do muốn hủy đơn hàng{" "}
              <strong>{pendingCancelOrderId}</strong>. Thông tin này sẽ được lưu
              cùng đơn hàng sau khi xác nhận.
            </p>

            <div className="mt-5">
              <label
                htmlFor="adminCancelReason"
                className="mb-2 block text-xs font-semibold text-[#3b2f25]"
              >
                Lý do hủy đơn hàng <span className="text-red-600">*</span>
              </label>

              <select
                id="adminCancelReason"
                value={cancelReason}
                onChange={(event) => {
                  setCancelReason(event.target.value);
                  setOtherCancelReason("");
                }}
                className="h-11 w-full border border-[#cfc5bc] bg-white px-3 text-xs text-[#2d261f] outline-none focus:border-[#6e5a47]"
              >
                <option value="">-- Chọn lý do hủy đơn --</option>

                {cancelReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {cancelReason === "Lý do khác" && (
              <div className="mt-4">
                <label
                  htmlFor="adminOtherCancelReason"
                  className="mb-2 block text-xs font-semibold text-[#3b2f25]"
                >
                  Nhập lý do cụ thể <span className="text-red-600">*</span>
                </label>

                <textarea
                  id="adminOtherCancelReason"
                  rows={3}
                  value={otherCancelReason}
                  onChange={(event) => setOtherCancelReason(event.target.value)}
                  placeholder="Vui lòng nhập lý do hủy đơn hàng..."
                  className="w-full resize-none border border-[#cfc5bc] bg-white p-3 text-xs text-[#2d261f] outline-none placeholder:text-[#a59a91] focus:border-[#6e5a47]"
                />
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setPendingCancelOrderId(null)}
                disabled={updatingId === pendingCancelOrderId}
                className="flex-1 border border-[#cfc5bc] px-4 py-3 text-[10px] font-medium text-[#51463d] transition hover:bg-[#f7f1ed] disabled:opacity-50"
              >
                QUAY LẠI
              </button>

              <button
                type="button"
                disabled={
                  !cancelReason ||
                  (cancelReason === "Lý do khác" &&
                    !otherCancelReason.trim()) ||
                  updatingId === pendingCancelOrderId
                }
                onClick={confirmCancelOrder}
                className="flex-1 bg-red-700 px-4 py-3 text-[10px] font-medium text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {updatingId === pendingCancelOrderId
                  ? "ĐANG XỬ LÝ..."
                  : "XÁC NHẬN HỦY ĐƠN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
