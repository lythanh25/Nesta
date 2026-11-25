import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logoutAdmin } from "../../utils/adminAuth";

const menuItems = [
  { label: "Tổng quan", path: "/admin", icon: "▦", end: true },
  { label: "Đơn hàng", path: "/admin/orders", icon: "▤" },
  { label: "Sản phẩm", path: "/admin/products", icon: "▣" },
  { label: "Khách hàng", path: "/admin/customers", icon: "♙" },
  { label: "Quản lý nhân viên", path: "/admin/employees", icon: "♧" },
  { label: "Quản lý bài đăng", path: "/admin/articles", icon: "▧" },
];

function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login", { replace: true });
  }

  const menuClass = ({ isActive }: { isActive: boolean }) =>
    `flex shrink-0 items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${
      isActive
        ? "bg-[#c8c0b8] font-semibold text-[#2d261f]"
        : "text-[#62584f] hover:bg-[#e9e1da]"
    }`;

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-[#2d261f] md:flex">
      {/* Sidebar */}
      <aside className="flex w-full shrink-0 flex-col border-b border-[#e5ddd5] bg-[#f7f1ed] md:sticky md:top-0 md:h-screen md:min-h-0 md:w-60 md:border-b-0 md:border-r">
        {/* Logo */}
        <div className="shrink-0 border-b border-[#e5ddd5] px-5 py-6">
          <NavLink
            to="/admin"
            className="font-serif text-2xl font-bold tracking-wide"
          >
            NESTA
          </NavLink>

          <p className="mt-1 text-xs tracking-widest text-[#8b8178]">
            ADMINISTRATION
          </p>
        </div>

        {/* Menu */}
        <nav className="flex gap-1 overflow-x-auto p-3 md:min-h-0 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={menuClass}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions - Desktop */}
        <div className="hidden shrink-0 space-y-1 border-t border-[#e5ddd5] p-3 md:block">
          <NavLink to="/admin/profile" className={menuClass}>
            <span className="w-5 text-center">♙</span>
            Hồ sơ
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-md px-3 py-3 text-left text-sm text-[#62584f] transition-colors hover:bg-[#e9e1da] hover:text-[#2d261f]"
          >
            <span className="mr-3 inline-block w-5 text-center">⇥</span>
            Đăng xuất
          </button>
        </div>

        {/* Bottom actions - Mobile */}
        <div className="flex shrink-0 gap-2 border-t border-[#e5ddd5] p-3 md:hidden">
          <button
            type="button"
            onClick={() => navigate("/admin/profile")}
            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#e9e1da]"
          >
            ♙ Hồ sơ
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-[#e9e1da]"
          >
            ⇥ Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
