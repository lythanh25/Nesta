import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  getOrderStatusClass,
  readAllOrders,
  type AdminOrder,
} from "../../utils/adminData";
import { getProducts, subscribeToProducts } from "../../utils/productStorage";

type ChartMode = "orders" | "revenue";
type DateRange = 7 | 30;

type ChartPoint = {
  key: string;
  label: string;
  fullDate: string;
  value: number;
};

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatWeekday(date: Date): string {
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return weekdays[date.getDay()];
}

function Dashboard() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [productCount, setProductCount] = useState(() => getProducts().length);
  const [chartMode, setChartMode] = useState<ChartMode>("orders");
  const [dateRange, setDateRange] = useState<DateRange>(7);

  // Đồng bộ dữ liệu đơn hàng
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

  // Đồng bộ dữ liệu sản phẩm từ LocalStorage
  useEffect(() => {
    const refreshProducts = () => {
      setProductCount(getProducts().length);
    };

    refreshProducts();

    return subscribeToProducts(refreshProducts);
  }, []);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === "Đã hoàn thành"),
    [orders],
  );

  const revenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "Đã tiếp nhận" || order.status === "Đang xử lý",
  ).length;

  // readAllOrders đã sắp xếp theo thời gian mới nhất trước
  const recentOrders = orders.slice(0, 6);

  // Chuẩn bị dữ liệu biểu đồ theo khoảng thời gian
  const chartData = useMemo<ChartPoint[]>(() => {
    const today = new Date();
    const points: ChartPoint[] = [];

    for (let offset = dateRange - 1; offset >= 0; offset--) {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - offset,
      );

      const key = getDateKey(date);

      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);

        return (
          !Number.isNaN(orderDate.getTime()) && getDateKey(orderDate) === key
        );
      });

      const value =
        chartMode === "orders"
          ? dayOrders.length
          : dayOrders
              .filter((order) => order.status === "Đã hoàn thành")
              .reduce((sum, order) => sum + order.total, 0);

      points.push({
        key,
        label:
          dateRange === 7
            ? formatWeekday(date)
            : offset % 5 === 0 || offset === 0
              ? formatShortDate(date)
              : "",
        fullDate: formatDate(date.toISOString()),
        value,
      });
    }

    return points;
  }, [orders, dateRange, chartMode]);

  const chartTotal = chartData.reduce((sum, point) => sum + point.value, 0);

  const chartMax = Math.max(...chartData.map((point) => point.value), 1);

  const stats = [
    {
      label: "Tổng sản phẩm",
      value: productCount.toLocaleString("vi-VN"),
      detail: "Sản phẩm trong danh mục",
      icon: "▣",
      iconStyle: "bg-[#f1e9e1] text-[#725b48]",
    },
    {
      label: "Tổng đơn hàng",
      value: orders.length.toLocaleString("vi-VN"),
      detail: "Đơn hàng đã ghi nhận",
      icon: "▤",
      iconStyle: "bg-[#eeeae2] text-[#756b55]",
    },
    {
      label: "Chờ xử lý",
      value: pendingOrders.toLocaleString("vi-VN"),
      detail: "Cần kiểm tra và xử lý",
      icon: "◷",
      iconStyle: "bg-[#f5eee2] text-[#987747]",
    },
    {
      label: "Doanh thu hoàn thành",
      value: formatCurrency(revenue),
      detail: `${completedOrders.length} đơn đã hoàn thành`,
      icon: "₫",
      iconStyle: "bg-[#e9eee7] text-[#61745d]",
      compact: true,
    },
  ];

  const quickLinks = [
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
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-7">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#96887b]">
            NESTA / ADMINISTRATION
          </p>

          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#2d261f] sm:text-[34px]">
            Tổng quan
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            Theo dõi và quản lý hoạt động cửa hàng nội thất NESTA.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-full border border-[#e9e2db] bg-white px-3 py-2 text-xs text-stone-500 sm:self-auto">
          <span className="h-2 w-2 rounded-full bg-[#7c9874]" />
          Dữ liệu được cập nhật từ hệ thống
        </div>
      </header>

      {/* Statistic cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article
            key={stat.label}
            className="group rounded-2xl border border-[#e9e2db] bg-white p-5 shadow-[0_2px_12px_rgba(45,38,31,0.025)] transition-all duration-300 hover:-translate-y-1 hover:border-[#d7cabe] hover:shadow-[0_10px_28px_rgba(45,38,31,0.07)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-500">
                  {stat.label}
                </p>
                <p className="mt-1 text-[11px] text-stone-400">
                  {String(index + 1).padStart(2, "0")} / 04
                </p>
              </div>

              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-105 ${stat.iconStyle}`}
              >
                {stat.icon}
              </span>
            </div>

            <p
              className={`mt-5 break-words font-semibold tracking-tight text-[#2d261f] ${
                stat.compact ? "text-xl sm:text-2xl" : "text-3xl"
              }`}
            >
              {stat.value}
            </p>

            <p className="mt-2 text-xs text-stone-400">{stat.detail}</p>
          </article>
        ))}
      </section>

      {/* Activity chart */}
      <section className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white shadow-[0_2px_12px_rgba(45,38,31,0.025)]">
        <div className="flex flex-col gap-4 border-b border-stone-100 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-[#2d261f]">Thống kê hoạt động</h2>
            <p className="mt-1 text-xs text-stone-500">
              Theo dõi biến động đơn hàng và doanh thu theo thời gian.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-[#f7f5f2] p-1">
              <button
                type="button"
                onClick={() => setChartMode("orders")}
                className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                  chartMode === "orders"
                    ? "bg-white text-[#3b2f25] shadow-sm"
                    : "text-stone-500 hover:text-[#2d261f]"
                }`}
              >
                Đơn hàng
              </button>

              <button
                type="button"
                onClick={() => setChartMode("revenue")}
                className={`rounded-md px-3 py-2 text-xs font-medium transition ${
                  chartMode === "revenue"
                    ? "bg-white text-[#3b2f25] shadow-sm"
                    : "text-stone-500 hover:text-[#2d261f]"
                }`}
              >
                Doanh thu
              </button>
            </div>

            <select
              value={dateRange}
              onChange={(event) =>
                setDateRange(Number(event.target.value) as DateRange)
              }
              className="rounded-lg border border-[#e9e2db] bg-white px-3 py-2 text-xs text-[#62584f] outline-none transition focus:border-[#a89582]"
              aria-label="Khoảng thời gian biểu đồ"
            >
              <option value={7}>7 ngày gần nhất</option>
              <option value={30}>30 ngày gần nhất</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-stone-400">
                {chartMode === "orders"
                  ? "Tổng số đơn trong khoảng thời gian"
                  : "Doanh thu từ đơn đã hoàn thành"}
              </p>

              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#2d261f]">
                {chartMode === "orders"
                  ? chartTotal.toLocaleString("vi-VN")
                  : formatCurrency(chartTotal)}
                {chartMode === "orders" && (
                  <span className="ml-2 text-sm font-normal text-stone-400">
                    đơn hàng
                  </span>
                )}
              </p>
            </div>

            <span className="rounded-full bg-[#f7f1ed] px-3 py-1.5 text-[11px] font-medium text-[#806b59]">
              {dateRange} ngày
            </span>
          </div>

          {/* Chart */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between pb-7">
              {[0, 1, 2, 3].map((line) => (
                <div
                  key={line}
                  className="border-t border-dashed border-stone-100"
                />
              ))}
            </div>

            <div
              className="relative grid h-[190px] items-end gap-1 sm:gap-2"
              style={{
                gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))`,
              }}
            >
              {chartData.map((point) => {
                const height =
                  point.value > 0
                    ? Math.max((point.value / chartMax) * 100, 4)
                    : 0;

                return (
                  <div
                    key={point.key}
                    className="group/bar flex h-full min-w-0 flex-col items-center justify-end"
                    title={`${point.fullDate}: ${
                      chartMode === "orders"
                        ? `${point.value} đơn hàng`
                        : formatCurrency(point.value)
                    }`}
                  >
                    <div className="flex h-full w-full items-end justify-center">
                      <div
                        className={`w-full max-w-8 rounded-t-md transition-all duration-300 ${
                          chartMode === "revenue"
                            ? "bg-[#8d7966] group-hover/bar:bg-[#6e5946]"
                            : "bg-[#b2a08e] group-hover/bar:bg-[#806b59]"
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    </div>

                    <span className="mt-3 h-4 whitespace-nowrap text-[9px] text-stone-400 sm:text-[10px]">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {chartTotal === 0 && (
            <p className="mt-3 text-center text-xs text-stone-400">
              Chưa có dữ liệu trong khoảng thời gian này.
            </p>
          )}

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-sm bg-[#b2a08e]" />
            <span className="text-[11px] text-stone-400">
              {chartMode === "orders"
                ? "Số đơn hàng được tạo theo ngày"
                : "Doanh thu đơn hàng hoàn thành theo ngày đặt"}
            </span>
          </div>
        </div>
      </section>

      {/* Recent orders and quick links */}
      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Recent orders */}
        <div className="overflow-hidden rounded-2xl border border-[#e9e2db] bg-white shadow-[0_2px_12px_rgba(45,38,31,0.025)]">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-5">
            <div>
              <h2 className="font-semibold text-[#2d261f]">Đơn hàng gần đây</h2>
              <p className="mt-1 text-xs text-stone-500">
                Những đơn hàng được ghi nhận gần nhất.
              </p>
            </div>

            <Link
              to="/admin/orders"
              className="whitespace-nowrap text-xs font-semibold text-[#806b59] transition hover:text-[#3b2f25] hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-[#faf8f6] text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="px-5 py-4">Mã đơn hàng</th>
                  <th className="px-5 py-4">Khách hàng</th>
                  <th className="px-5 py-4">Tổng tiền</th>
                  <th className="px-5 py-4">Trạng thái</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-[#fcfaf8]"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="font-semibold text-[#5a493d]">
                        {order.id}
                      </span>
                      <p className="mt-1 text-[11px] text-stone-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-[#40372f]">
                        {order.customer?.fullName || "Khách hàng"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-medium text-[#40372f]">
                      {formatCurrency(order.total)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium ${getOrderStatusClass(
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
                    <td colSpan={4} className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f1ed] text-xl text-[#806b59]">
                        ▤
                      </div>
                      <p className="mt-3 text-sm font-medium text-stone-600">
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

        {/* Quick links */}
        <div className="rounded-2xl border border-[#e9e2db] bg-white p-5 shadow-[0_2px_12px_rgba(45,38,31,0.025)]">
          <div>
            <h2 className="font-semibold text-[#2d261f]">Truy cập nhanh</h2>
            <p className="mt-1 text-xs text-stone-500">
              Các khu vực quản trị thường dùng.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {quickLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="group flex items-center gap-3 rounded-xl border border-stone-100 p-3.5 transition-all duration-200 hover:border-[#d9cbbd] hover:bg-[#faf8f6]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f7f1ed] text-lg text-[#806b59] transition-colors group-hover:bg-[#eae0d6]">
                  {item.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#40372f]">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-stone-400">
                    {item.description}
                  </span>
                </span>

                <span className="text-sm text-stone-300 transition-transform group-hover:translate-x-1 group-hover:text-[#806b59]">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
