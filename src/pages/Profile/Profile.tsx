import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { products } from "../../data/products";
import type { Product } from "../../data/products";
import { getFavoriteIds, toggleProductFavorite } from "../../utils/favorites";

const PROFILE_STORAGE_KEY = "nesta-profile";
const ADDRESS_STORAGE_KEY = "nesta-address";
const ORDERS_STORAGE_KEY = "nesta-orders";

type ProfileInfo = {
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
};

type AddressInfo = {
  recipient: string;
  phone: string;
  city: string;
  district: string;
  ward: string;
  address: string;
};

type OrderItem = {
  productId: number;
  name: string;
  image?: string;
  price: number;
  size?: string;
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  customer: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    district: string;
    ward?: string;
    address: string;
    note?: string;
  };
  paymentMethod: "cod" | "bank";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
};

type SectionId = "personal" | "password" | "address" | "favorites" | "orders";

const emptyProfile: ProfileInfo = {
  fullName: "",
  email: "",
  phone: "",
  birthday: "",
};

const emptyAddress: AddressInfo = {
  recipient: "",
  phone: "",
  city: "",
  district: "",
  ward: "",
  address: "",
};

const menuItems: { id: SectionId; label: string }[] = [
  { id: "personal", label: "Thông tin cá nhân" },
  { id: "password", label: "Đổi mật khẩu" },
  { id: "address", label: "Địa chỉ" },
  { id: "favorites", label: "Yêu thích" },
  { id: "orders", label: "Đơn hàng" },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readOrders(): Order[] {
  const saved = readStorage<unknown>(ORDERS_STORAGE_KEY, []);

  if (!Array.isArray(saved)) {
    return [];
  }

  return saved.filter((value): value is Order => {
    if (!isRecord(value)) {
      return false;
    }

    return (
      typeof value.id === "string" &&
      typeof value.createdAt === "string" &&
      Array.isArray(value.items) &&
      typeof value.total === "number"
    );
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa có thông tin";
  }

  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderStatusClass(status: string) {
  const normalized = status.toLocaleLowerCase("vi-VN");

  if (
    normalized.includes("hủy") ||
    normalized.includes("huy") ||
    normalized.includes("cancel")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    normalized.includes("giao thành công") ||
    normalized.includes("hoàn thành") ||
    normalized.includes("delivered") ||
    normalized.includes("completed")
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  return "border-[#d5c8b7] bg-[#f7f1ed] text-[#6e5a47]";
}

function Profile() {
  const [activeSection, setActiveSection] = useState<SectionId>("personal");

  const [favoriteIds, setFavoriteIds] = useState<number[]>(() =>
    getFavoriteIds(),
  );

  const [profile, setProfile] = useState<ProfileInfo>(() => ({
    ...emptyProfile,
    ...readStorage<Partial<ProfileInfo>>(PROFILE_STORAGE_KEY, emptyProfile),
  }));

  const [address, setAddress] = useState<AddressInfo>(() => ({
    ...emptyAddress,
    ...readStorage<Partial<AddressInfo>>(ADDRESS_STORAGE_KEY, emptyAddress),
  }));

  const [orders, setOrders] = useState<Order[]>(readOrders);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Đồng bộ yêu thích, đơn hàng và dữ liệu khi quay lại tab.
  useEffect(() => {
    function updateFavorites() {
      setFavoriteIds(getFavoriteIds());
    }

    function updateOrders() {
      setOrders(readOrders());
    }

    function refreshData() {
      updateFavorites();
      updateOrders();
    }

    window.addEventListener("favoritesUpdated", updateFavorites);
    window.addEventListener("ordersUpdated", updateOrders);
    window.addEventListener("storage", refreshData);
    window.addEventListener("focus", refreshData);

    return () => {
      window.removeEventListener("favoritesUpdated", updateFavorites);
      window.removeEventListener("ordersUpdated", updateOrders);
      window.removeEventListener("storage", refreshData);
      window.removeEventListener("focus", refreshData);
    };
  }, []);

  const favoriteProducts = products.filter((product) =>
    favoriteIds.includes(product.id),
  );

  const inputClass =
    "h-10 w-full border border-[#cfc5bc] bg-white px-3 text-xs text-[#2d261f] outline-none transition placeholder:text-[#a59a91] focus:border-[#6e5a47]";

  const labelClass = "mb-1.5 block text-[11px] font-medium text-[#3b2f25]";

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function navigateToSection(section: SectionId) {
    setActiveSection(section);
    clearMessages();

    window.history.replaceState(null, "", `#${section}`);

    document.getElementById(`profile-${section}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function updateProfile(field: keyof ProfileInfo, value: string) {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateAddress(field: keyof AddressInfo, value: string) {
    setAddress((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

      setMessage("Thông tin cá nhân đã được lưu thành công.");
    } catch {
      setError("Không thể lưu thông tin. Vui lòng thử lại.");
    }
  }

  function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    try {
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(address));

      setMessage("Địa chỉ giao hàng đã được lưu thành công.");
    } catch {
      setError("Không thể lưu địa chỉ. Vui lòng thử lại.");
    }
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ các trường mật khẩu.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setError(
      "Website chưa có backend xác thực nên chưa thể thay đổi mật khẩu thật. Mật khẩu không được lưu vào trình duyệt.",
    );
  }

  function removeFavorite(productId: number) {
    toggleProductFavorite(productId);
    setFavoriteIds(getFavoriteIds());
    setMessage("Đã xóa sản phẩm khỏi danh sách yêu thích.");
    setError("");
  }

  function handleLogout() {
    const confirmed = window.confirm("Bạn muốn đăng xuất khỏi tài khoản?");

    if (!confirmed) {
      return;
    }

    setMessage(
      "Website hiện chưa có hệ thống đăng nhập. Khi tích hợp backend, bạn cần kết nối chức năng đăng xuất tại đây.",
    );
    setError("");
  }

  function getOrderItemProduct(item: OrderItem): Product | undefined {
    return products.find((product) => product.id === item.productId);
  }

  return (
    <main className="min-h-screen bg-[#f7f1ed] pb-14 md:pb-20">
      {/* TIÊU ĐỀ TRANG */}

      <section className="border-b border-[#e4d9cf] bg-[#f7f1ed] px-5 py-7 md:px-8 md:py-9">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] tracking-[0.2em] text-[#8c7a69]">
            NESTA FURNITURE
          </p>

          <h1 className="mt-2 font-serif text-2xl font-semibold text-[#2d261f] md:text-3xl">
            TRANG CÁ NHÂN
          </h1>
        </div>
      </section>

      {/* NỘI DUNG CHÍNH */}

      <section className="px-5 py-7 md:px-8 md:py-10">
        <div className="mx-auto grid max-w-6xl items-start gap-6 md:grid-cols-[190px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* SIDEBAR */}

          <aside className="h-fit border border-[#e1d7ce] bg-[#f1e9e2] p-4 md:sticky md:top-24 md:p-5">
            <h2 className="mb-4 border-b border-[#d8ccc1] pb-3 text-xs font-semibold uppercase tracking-wide text-[#2d261f]">
              Tài khoản cá nhân
            </h2>

            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSection(item.id)}
                  className={`border-l-2 px-3 py-2.5 text-left text-xs transition ${
                    activeSection === item.id
                      ? "border-[#3b2f25] bg-[#3b2f25] font-medium text-white"
                      : "border-transparent text-[#51463d] hover:border-[#9c8877] hover:bg-[#e8ddd3]"
                  }`}
                >
                  <span>{item.label}</span>

                  {item.id === "favorites" && (
                    <span className="ml-2 opacity-75">
                      ({favoriteProducts.length})
                    </span>
                  )}

                  {item.id === "orders" && (
                    <span className="ml-2 opacity-75">({orders.length})</span>
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 border-l-2 border-transparent px-3 py-2.5 text-left text-xs text-red-700 transition hover:bg-red-50"
              >
                Đăng xuất
              </button>
            </nav>
          </aside>

          {/* KHU VỰC NỘI DUNG */}

          <div className="min-w-0 space-y-7">
            {message && (
              <div
                role="status"
                className="border border-[#d2dfce] bg-[#f1f7ee] px-4 py-3 text-xs leading-5 text-[#45613f]"
              >
                {message}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="border border-[#e6c7c1] bg-[#fff4f1] px-4 py-3 text-xs leading-5 text-[#9b3930]"
              >
                {error}
              </div>
            )}

            {/* THÔNG TIN CÁ NHÂN */}

            <section
              id="profile-personal"
              className="scroll-mt-28 border border-[#ddd5cd] bg-white p-5 md:p-7"
            >
              <h2 className="border-b border-[#e5ddd6] pb-3 text-sm font-semibold text-[#2d261f]">
                THÔNG TIN CÁ NHÂN
              </h2>

              <form onSubmit={saveProfile} className="mt-5">
                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="fullName">
                      Họ và tên *
                    </label>
                    <input
                      id="fullName"
                      required
                      autoComplete="name"
                      value={profile.fullName}
                      onChange={(event) =>
                        updateProfile("fullName", event.target.value)
                      }
                      placeholder="Nhập họ và tên"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="email">
                      Email *
                    </label>
                    <input
                      id="email"
                      required
                      type="email"
                      autoComplete="email"
                      value={profile.email}
                      onChange={(event) =>
                        updateProfile("email", event.target.value)
                      }
                      placeholder="Nhập email"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="phone">
                      Số điện thoại
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={profile.phone}
                      onChange={(event) =>
                        updateProfile("phone", event.target.value)
                      }
                      placeholder="Nhập số điện thoại"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="birthday">
                      Ngày sinh
                    </label>
                    <input
                      id="birthday"
                      type="date"
                      value={profile.birthday}
                      onChange={(event) =>
                        updateProfile("birthday", event.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-5 bg-[#3b2f25] px-6 py-3 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638]"
                >
                  LƯU THAY ĐỔI
                </button>
              </form>
            </section>

            {/* ĐỔI MẬT KHẨU */}

            <section
              id="profile-password"
              className="scroll-mt-28 border border-[#ddd5cd] bg-white p-5 md:p-7"
            >
              <h2 className="border-b border-[#e5ddd6] pb-3 text-sm font-semibold text-[#2d261f]">
                THAY ĐỔI MẬT KHẨU
              </h2>

              <form
                onSubmit={changePassword}
                className="mt-5 max-w-xl space-y-4"
              >
                <div>
                  <label className={labelClass} htmlFor="currentPassword">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="newPassword">
                    Mật khẩu mới
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass} htmlFor="confirmPassword">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#3b2f25] px-6 py-3 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638]"
                >
                  CẬP NHẬT MẬT KHẨU
                </button>
              </form>
            </section>

            {/* ĐỊA CHỈ GIAO HÀNG */}

            <section
              id="profile-address"
              className="scroll-mt-28 border border-[#ddd5cd] bg-white p-5 md:p-7"
            >
              <h2 className="border-b border-[#e5ddd6] pb-3 text-sm font-semibold text-[#2d261f]">
                ĐỊA CHỈ GIAO HÀNG
              </h2>

              <form onSubmit={saveAddress} className="mt-5">
                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="recipient">
                      Họ và tên người nhận *
                    </label>
                    <input
                      id="recipient"
                      required
                      autoComplete="shipping name"
                      value={address.recipient}
                      onChange={(event) =>
                        updateAddress("recipient", event.target.value)
                      }
                      placeholder="Nhập họ và tên người nhận"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="addressPhone">
                      Số điện thoại *
                    </label>
                    <input
                      id="addressPhone"
                      required
                      type="tel"
                      autoComplete="shipping tel"
                      value={address.phone}
                      onChange={(event) =>
                        updateAddress("phone", event.target.value)
                      }
                      placeholder="Nhập số điện thoại nhận hàng"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="city">
                        Tỉnh/Thành phố *
                      </label>
                      <input
                        id="city"
                        required
                        autoComplete="shipping address-level1"
                        value={address.city}
                        onChange={(event) =>
                          updateAddress("city", event.target.value)
                        }
                        placeholder="Nhập tỉnh/thành phố"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="district">
                        Quận/Huyện *
                      </label>
                      <input
                        id="district"
                        required
                        autoComplete="shipping address-level2"
                        value={address.district}
                        onChange={(event) =>
                          updateAddress("district", event.target.value)
                        }
                        placeholder="Nhập quận/huyện"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="ward">
                      Phường/Xã
                    </label>
                    <input
                      id="ward"
                      autoComplete="shipping address-level3"
                      value={address.ward}
                      onChange={(event) =>
                        updateAddress("ward", event.target.value)
                      }
                      placeholder="Nhập phường/xã"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="address">
                      Địa chỉ cụ thể *
                    </label>
                    <input
                      id="address"
                      required
                      autoComplete="shipping street-address"
                      value={address.address}
                      onChange={(event) =>
                        updateAddress("address", event.target.value)
                      }
                      placeholder="Số nhà, tên đường..."
                      className={inputClass}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-5 bg-[#3b2f25] px-6 py-3 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638]"
                >
                  CẬP NHẬT ĐỊA CHỈ
                </button>
              </form>
            </section>

            {/* SẢN PHẨM YÊU THÍCH */}

            <section
              id="profile-favorites"
              className="scroll-mt-28 border border-[#ddd5cd] bg-white p-5 md:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ddd6] pb-3">
                <h2 className="text-sm font-semibold text-[#2d261f]">
                  SẢN PHẨM YÊU THÍCH
                </h2>

                <span className="text-[10px] text-[#756b63]">
                  {favoriteProducts.length} sản phẩm
                </span>
              </div>

              {favoriteProducts.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-3xl text-[#a99a8d]">♡</div>

                  <p className="mt-3 text-sm font-medium text-[#2d261f]">
                    Bạn chưa có sản phẩm yêu thích
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#756b63]">
                    Nhấn biểu tượng trái tim ở sản phẩm để lưu lại những món nội
                    thất bạn quan tâm.
                  </p>

                  <Link
                    to="/products"
                    className="mt-5 inline-flex bg-[#3b2f25] px-6 py-3 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638]"
                  >
                    KHÁM PHÁ SẢN PHẨM
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {favoriteProducts.map((product) => (
                      <article
                        key={product.id}
                        className="group relative min-w-0 overflow-hidden border border-[#e3dad2] bg-white"
                      >
                        <Link
                          to={`/products/${product.id}`}
                          className="block aspect-square overflow-hidden bg-[#f3eee9]"
                        >
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeFavorite(product.id)}
                          aria-label={`Bỏ yêu thích ${product.name}`}
                          title="Bỏ yêu thích"
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-lg text-red-600 transition hover:bg-red-50"
                        >
                          ♥
                        </button>

                        <div className="p-3">
                          <Link
                            to={`/products/${product.id}`}
                            className="line-clamp-2 min-h-8 text-xs font-medium leading-4 text-[#2d261f] hover:text-[#8c6c51]"
                          >
                            {product.name}
                          </Link>

                          <p className="mt-2 text-[11px] font-semibold text-[#3b2f25]">
                            {formatPrice(product.price)} VNĐ
                          </p>

                          <Link
                            to={`/products/${product.id}`}
                            className="mt-3 flex min-h-8 items-center justify-center border border-[#3b2f25] px-2 text-center text-[9px] font-medium tracking-wide text-[#3b2f25] transition hover:bg-[#3b2f25] hover:text-white"
                          >
                            XEM SẢN PHẨM
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>

                  <Link
                    to="/products"
                    className="mt-5 inline-flex border border-[#3b2f25] px-5 py-2.5 text-[10px] font-medium text-[#3b2f25] transition hover:bg-[#3b2f25] hover:text-white"
                  >
                    TIẾP TỤC KHÁM PHÁ
                  </Link>
                </>
              )}
            </section>

            {/* ĐƠN HÀNG */}

            <section
              id="profile-orders"
              className="scroll-mt-28 border border-[#ddd5cd] bg-white p-5 md:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5ddd6] pb-3">
                <h2 className="text-sm font-semibold text-[#2d261f]">
                  ĐƠN HÀNG CỦA TÔI
                </h2>

                <span className="text-[10px] text-[#756b63]">
                  {orders.length} đơn hàng
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="text-3xl text-[#a99a8d]">▤</div>

                  <p className="mt-3 text-sm font-medium text-[#2d261f]">
                    Bạn chưa có đơn hàng nào
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#756b63]">
                    Những đơn hàng đã đặt sẽ hiển thị tại đây.
                  </p>

                  <Link
                    to="/products"
                    className="mt-5 inline-flex bg-[#3b2f25] px-6 py-3 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638]"
                  >
                    MUA SẮM NGAY
                  </Link>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {orders.map((order) => (
                    <article
                      key={order.id}
                      className="border border-[#e3dad2] p-4 md:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e9e1da] pb-3">
                        <div className="min-w-0">
                          <p className="text-[10px] text-[#756b63]">
                            Mã đơn hàng
                          </p>

                          <p className="mt-1 break-all text-xs font-semibold text-[#2d261f]">
                            {order.id}
                          </p>

                          <p className="mt-1 text-[10px] text-[#756b63]">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 border px-2.5 py-1 text-[10px] ${getOrderStatusClass(order.status || "")}`}
                        >
                          {order.status || "Đã đặt hàng"}
                        </span>
                      </div>

                      {/* THÔNG TIN NHẬN HÀNG */}

                      {order.customer && (
                        <div className="border-b border-[#e9e1da] py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#3b2f25]">
                            Thông tin nhận hàng
                          </p>

                          <p className="mt-2 text-xs text-[#2d261f]">
                            {order.customer.fullName}
                          </p>

                          <p className="mt-1 text-[10px] text-[#756b63]">
                            {order.customer.phone}
                            {order.customer.email
                              ? ` · ${order.customer.email}`
                              : ""}
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-[#756b63]">
                            {[
                              order.customer.address,
                              order.customer.ward,
                              order.customer.district,
                              order.customer.city,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      )}

                      {/* DANH SÁCH SẢN PHẨM */}

                      <div className="divide-y divide-[#eee7e0]">
                        {order.items.map((item, index) => {
                          const product = getOrderItemProduct(item);
                          const image = item.image || product?.images[0];

                          return (
                            <div
                              key={`${item.productId}-${item.size ?? "default"}-${index}`}
                              className="flex items-center gap-3 py-3"
                            >
                              {image ? (
                                <img
                                  src={image}
                                  alt={item.name}
                                  loading="lazy"
                                  className="h-14 w-14 shrink-0 bg-[#f3eee9] object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-[#f3eee9] text-[9px] text-[#756b63]">
                                  NESTA
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-[#2d261f]">
                                  {item.name || product?.name || "Sản phẩm"}
                                </p>

                                <p className="mt-1 text-[10px] text-[#756b63]">
                                  Số lượng: {item.quantity}
                                  {item.size
                                    ? ` · Kích thước: ${item.size}`
                                    : ""}
                                </p>

                                <p className="mt-1 text-[10px] text-[#756b63]">
                                  {formatPrice(item.price)} VNĐ / sản phẩm
                                </p>
                              </div>

                              <p className="shrink-0 text-right text-[10px] font-semibold text-[#3b2f25]">
                                {formatPrice(item.price * item.quantity)} VNĐ
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* TỔNG TIỀN */}

                      <div className="space-y-2 border-t border-[#e9e1da] pt-3">
                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-[#756b63]">Tạm tính</span>
                          <span className="text-[#3b2f25]">
                            {formatPrice(order.subtotal)} VNĐ
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-[11px]">
                          <span className="text-[#756b63]">Phí vận chuyển</span>
                          <span className="text-[#3b2f25]">
                            {formatPrice(order.shipping)} VNĐ
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-[#e9e1da] pt-3">
                          <span className="text-xs font-semibold text-[#2d261f]">
                            Tổng đơn hàng
                          </span>

                          <span className="text-sm font-semibold text-[#3b2f25]">
                            {formatPrice(order.total)} VNĐ
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-[10px] text-[#756b63]">
                        Phương thức thanh toán:{" "}
                        {order.paymentMethod === "cod"
                          ? "Thanh toán khi nhận hàng"
                          : order.paymentMethod === "bank"
                            ? "Chuyển khoản ngân hàng"
                            : "Chưa cập nhật"}
                      </p>

                      {order.customer?.note && (
                        <p className="mt-2 text-[10px] leading-5 text-[#756b63]">
                          Ghi chú: {order.customer.note}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Profile;
