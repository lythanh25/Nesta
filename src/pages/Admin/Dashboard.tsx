import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type AdminOrder = {
  id: string | number;
  total: number;
  status: string;
  createdAt?: string;
  customer?: {
    fullName?: string;
    email?: string;
  };
};

const ORDERS_KEY = "nesta-orders";

function isAdminOrder(value: unknown): value is AdminOrder {
  if (!value || typeof value !== "object") return false;

  const order = value as Record<string, unknown>;

  return (
    (typeof order.id === "string" || typeof order.id === "number") &&
    typeof order.total === "number" &&
    typeof order.status === "string"
  );
}

function readOrders(): AdminOrder[] {
  try {
    const orderMap = new Map<string, AdminOrder>();

    // Đọc đơn hàng cũ nếu có.
    const legacyRaw = localStorage.getItem(ORDERS_KEY);
    const legacyOrders: unknown = legacyRaw ? JSON.parse(legacyRaw) : [];

    if (Array.isArray(legacyOrders)) {
      for (const order of legacyOrders) {
        if (isAdminOrder(order)) {
          orderMap.set(String(order.id), order);
        }
      }
    }

    // Đọc thêm đơn hàng được lưu theo từng tài khoản khách hàng.
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);

      if (!key || !key.startsWith(`${ORDERS_KEY}:`)) continue;

      try {
        const raw = localStorage.getItem(key);
        const parsed: unknown = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(parsed)) continue;

        for (const order of parsed) {
          if (isAdminOrder(order)) {
            // Ghi đè bản cũ nếu cùng mã đơn xuất hiện ở nhiều nơi.
            orderMap.set(String(order.id), order);
          }
        }
      } catch {
        // Bỏ qua dữ liệu lỗi của riêng khóa này.
      }
    }

    return [...orderMap.values()].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      return dateB - dateA;
    });
  } catch {
    return [];
  }
}

function formatPrice(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function getStatusClass(status: string) {
  switch (status) {
    case "Đã hủy":
      return "bg-red-50 text-red-700";
    case "Đã giao":
    case "Hoàn thành":
      return "bg-green-50 text-green-700";
    case "Đã tiếp nhận":
    case "Đang chờ xác nhận":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-[#f3eee9] text-[#62584f]";
  }
}

function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrder[]>(readOrders);

  useEffect(() => {
    function refreshOrders() {
      setOrders(readOrders());
    }

    window.addEventListener("ordersUpdated", refreshOrders);
    window.addEventListener("storage", refreshOrders);
    window.addEventListener("focus", refreshOrders);

    return () => {
      window.removeEventListener("ordersUpdated", refreshOrders);
      window.removeEventListener("storage", refreshOrders);
      window.removeEventListener("focus", refreshOrders);
    };
  }, []);

  const canceledOrders = orders.filter((order) => order.status === "Đã hủy");

  const pendingOrders = orders.filter((order) =>
    ["Đã tiếp nhận", "Đang chờ xác nhận"].includes(order.status),
  );

  const revenue = orders.reduce((sum, order) => {
    const status = String(order.status ?? "")
      .trim()
      .toLowerCase();

    const isDelivered = [
      "đã giao",
      "đã giao hàng",
      "giao thành công",
      "hoàn thành",
      "delivered",
      "completed",
    ].includes(status);

    return isDelivered ? sum + Number(order.total || 0) : sum;
  }, 0);

  const stats = [
    {
      label: "Doanh thu từ đơn hoàn thành",
      value: formatPrice(revenue),
      description: "Chỉ tính đơn đã giao hoặc hoàn thành",
    },
    {
      label: "Tổng đơn hàng",
      value: orders.length.toLocaleString("vi-VN"),
      description: "Đã loại bỏ đơn trùng mã",
    },
    {
      label: "Đơn chờ xác nhận",
      value: pendingOrders.length.toLocaleString("vi-VN"),
      description: "Đang chờ cửa hàng xử lý",
    },
    {
      label: "Đơn đã hủy",
      value: canceledOrders.length.toLocaleString("vi-VN"),
      description: "Các đơn có trạng thái đã hủy",
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl">
      {/* PAGE HEADER */}
      <div className="mb-6">
        <p className="text-sm text-[#8b8178]">Admin / Tổng quan</p>

        <h1 className="mt-2 text-2xl font-semibold">Tổng quan hệ thống</h1>

        <p className="mt-1 text-sm text-[#8b8178]">
          Theo dõi tình hình hoạt động của cửa hàng NESTA.
        </p>
      </div>

      {/* STATISTICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="
              min-w-0 border border-[#e5ddd5]
              bg-white p-5 transition-shadow
              hover:shadow-sm
            "
          >
            <p className="text-sm text-[#8b8178]">{stat.label}</p>

            <p className="mt-4 break-words text-xl font-semibold text-[#2d261f]">
              {stat.value}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#8b8178]">
              {stat.description}
            </p>
          </article>
        ))}
      </div>

      {/* RECENT ORDERS */}
      <section className="mt-6 border border-[#e5ddd5] bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>

            <p className="mt-1 text-xs text-[#8b8178]">
              5 đơn hàng được cập nhật gần nhất.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="
              border border-[#5a493d] px-4 py-2
              text-xs font-medium text-[#5a493d]
              transition hover:bg-[#5a493d] hover:text-white
            "
          >
            Xem tất cả đơn hàng
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#8b8178]">
            Chưa có đơn hàng. Đơn hàng sẽ xuất hiện tại đây sau khi khách hàng
            đặt hàng thành công.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#eeeae6] text-[#62584f]">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã đơn</th>
                  <th className="px-4 py-3 font-medium">Ngày đặt</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Giá trị</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-[#e5ddd5] transition hover:bg-[#faf8f6]"
                  >
                    <td className="px-4 py-3 font-medium text-[#3b2f25]">
                      {order.id}
                    </td>

                    <td className="px-4 py-3 text-[#62584f]">
                      {order.createdAt &&
                      !Number.isNaN(new Date(order.createdAt).getTime())
                        ? new Date(order.createdAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-[#62584f]">
                      {order.customer?.fullName || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      {formatPrice(order.total)}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex whitespace-nowrap rounded px-2.5 py-1 text-xs font-medium ${getStatusClass(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
