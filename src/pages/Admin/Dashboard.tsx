import { useEffect, useState } from "react";

type AdminOrder = {
  id: string | number;
  total: number;
  status: string;
  createdAt?: string;
};

const ORDERS_KEY = "nesta-orders";

function readOrders(): AdminOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is AdminOrder =>
        item !== null &&
        typeof item === "object" &&
        "id" in item &&
        "total" in item &&
        typeof item.total === "number" &&
        "status" in item &&
        typeof item.status === "string",
    );
  } catch {
    return [];
  }
}

function Dashboard() {
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

  const revenue = orders
    .filter((order) => order.status !== "Đã hủy")
    .reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = orders.filter((order) =>
    ["Đã tiếp nhận", "Đang chờ xác nhận"].includes(order.status),
  ).length;

  const stats = [
    {
      label: "Doanh thu dự kiến",
      value: `${revenue.toLocaleString("vi-VN")} đ`,
    },
    {
      label: "Tổng đơn hàng",
      value: orders.length.toLocaleString("vi-VN"),
    },
    {
      label: "Đơn chờ xác nhận",
      value: pendingOrders.toLocaleString("vi-VN"),
    },
    {
      label: "Đơn đã hủy",
      value: orders
        .filter((order) => order.status === "Đã hủy")
        .length.toLocaleString("vi-VN"),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-sm text-[#8b8178]">Admin / Tổng quan</p>

        <h1 className="mt-2 text-2xl font-semibold">Tổng quan hệ thống</h1>

        <p className="mt-1 text-sm text-[#8b8178]">
          Theo dõi tình hình hoạt động của cửa hàng NESTA.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border border-[#e5ddd5] bg-white p-5"
          >
            <p className="text-sm text-[#8b8178]">{stat.label}</p>

            <p className="mt-4 break-words text-xl font-semibold">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-6 border border-[#e5ddd5] bg-white p-5">
        <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>

        {orders.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#8b8178]">
            Chưa có đơn hàng. Đơn hàng sẽ xuất hiện tại đây sau khi khách hàng
            đặt hàng thành công.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#eeeae6]">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Ngày đặt</th>
                  <th className="px-4 py-3">Giá trị</th>
                  <th className="px-4 py-3">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {orders
                  .slice(-5)
                  .reverse()
                  .map((order) => (
                    <tr key={order.id} className="border-t border-[#e5ddd5]">
                      <td className="px-4 py-3">{order.id}</td>

                      <td className="px-4 py-3">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {order.total.toLocaleString("vi-VN")} đ
                      </td>

                      <td className="px-4 py-3">{order.status}</td>
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
