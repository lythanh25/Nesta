import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "../../data/products";
import {
  formatCurrency,
  formatDate,
  getOrderStatusClass,
  readAllOrders,
  type AdminOrder,
} from "../../utils/adminData";

function Dashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    const refresh = () => setOrders(readAllOrders());

    refresh();

    window.addEventListener("ordersUpdated", refresh);
    window.addEventListener("adminDataUpdated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("ordersUpdated", refresh);
      window.removeEventListener("adminDataUpdated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "Đã hoàn thành"),
    [orders],
  );

  const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "Đã tiếp nhận" || order.status === "Đang xử lý",
  ).length;

  const recentOrders = orders.slice(0, 6);

  const stats = [
    {
      label: "Tổng sản phẩm",
      value: products.length.toLocaleString("vi-VN"),
      detail: "Sản phẩm trong danh mục",
      symbol: "▣",
    },
    {
      label: "Tổng đơn hàng",
      value: orders.length.toLocaleString("vi-VN"),
      detail: "Đơn hàng đã ghi nhận",
      symbol: "▤",
    },
    {
      label: "Chờ xử lý",
      value: pendingOrders.toLocaleString("vi-VN"),
      detail: "Cần kiểm tra và xử lý",
      symbol: "◷",
    },
    {
      label: "Doanh thu hoàn thành",
      value: formatCurrency(revenue),
      detail: `${completedOrders.length} đơn đã hoàn thành`,
      symbol: "₫",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
          NESTA / ADMIN
        </p>
        <h1 className="mt-2 font-serif text-3xl text-[#2d261f]">Tổng quan</h1>
        <p className="mt-2 text-sm text-stone-500">
          Theo dõi tình hình hoạt động cửa hàng nội thất NESTA.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-[#e9e2db] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-stone-500">{stat.label}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f1ed] text-xl text-[#5a493d]">
                {stat.symbol}
              </span>
            </div>
            <p className="mt-5 break-words text-2xl font-semibold text-[#2d261f]">
              {stat.value}
            </p>
            <p className="mt-2 text-xs text-stone-400">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-[#2d261f]">Đơn hàng gần đây</h2>
              <p className="mt-1 text-xs text-stone-500">
                Những đơn được ghi nhận gần nhất.
              </p>
            </div>
            <Link
              to="/admin/orders"
              className="whitespace-nowrap text-sm font-medium text-[#5a493d] hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#faf8f6] text-xs text-stone-500">
                <tr>
                  <th className="px-5 py-3">Mã đơn</th>
                  <th className="px-5 py-3">Khách hàng</th>
                  <th className="px-5 py-3">Tổng tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fcfaf8]">
                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {order.id}
                      <p className="mt-1 text-xs font-normal text-stone-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {order.customer?.fullName || "Khách hàng"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${getOrderStatusClass(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <p className="font-medium text-stone-600">
                        Chưa có đơn hàng
                      </p>
                      <p className="mt-1 text-xs text-stone-400">
                        Đơn hàng sẽ xuất hiện khi khách hoàn tất đặt hàng.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e9e2db] bg-white p-5">
          <h2 className="font-semibold text-[#2d261f]">Truy cập nhanh</h2>
          <p className="mt-1 text-sm text-stone-500">
            Đi tới các khu vực quản trị thường dùng.
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                title: "Quản lý sản phẩm",
                description: "Thêm, sửa và kiểm tra sản phẩm.",
                path: "/admin/products",
                icon: "▣",
              },
              {
                title: "Quản lý đơn hàng",
                description: "Xem đơn và cập nhật trạng thái.",
                path: "/admin/orders",
                icon: "▤",
              },
              {
                title: "Quản lý khách hàng",
                description: "Tra cứu danh sách tài khoản.",
                path: "/admin/customers",
                icon: "♙",
              },
              {
                title: "Quản lý bài đăng",
                description: "Quản lý nội dung giới thiệu và tin tức.",
                path: "/admin/articles",
                icon: "▧",
              },
            ].map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 rounded-xl border border-stone-100 p-4 transition hover:border-stone-300 hover:bg-[#faf8f6]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f1ed] text-lg text-[#5a493d]">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-stone-500">
                    {item.description}
                  </span>
                </span>
                <span className="text-stone-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
