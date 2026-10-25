import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import {
  changeCustomerPassword,
  getCustomerSession,
  logoutCustomer,
  updateCustomerProfile,
} from "../../utils/customerAuth";

import { products } from "../../data/products";
import type { Product } from "../../data/products";
import { getFavoriteIds, toggleProductFavorite } from "../../utils/favorites";
import { getStock, setMultipleStock } from "../../utils/stock";
import type { StockUpdate } from "../../utils/stock";

const PROFILE_STORAGE_KEY = "nesta-profile";
const ADDRESS_STORAGE_KEY = "nesta-address";
const ORDERS_STORAGE_KEY = "nesta-orders";

function getUserStorageKey(key: string, userId: string) {
  return `${key}:${userId}`;
}

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

function readOrders(userId: string, userEmail: string): Order[] {
  const userOrdersKey = getUserStorageKey(ORDERS_STORAGE_KEY, userId);
  const saved = readStorage<unknown>(userOrdersKey, null);

  // Ưu tiên lịch sử đơn hàng riêng của tài khoản.
  if (Array.isArray(saved)) {
    return saved.filter((value): value is Order => {
      if (!isRecord(value)) return false;

      return (
        typeof value.id === "string" &&
        typeof value.createdAt === "string" &&
        Array.isArray(value.items) &&
        typeof value.total === "number"
      );
    });
  }

  // Chỉ lấy đơn hàng cũ có email trùng với tài khoản hiện tại.
  // Không chuyển toàn bộ đơn hàng dùng chung sang một tài khoản.
  const legacyOrders = readStorage<unknown>(ORDERS_STORAGE_KEY, []);

  if (!Array.isArray(legacyOrders)) {
    return [];
  }

  const matchingOrders = legacyOrders.filter((value): value is Order => {
    if (!isRecord(value) || !isRecord(value.customer)) {
      return false;
    }

    return (
      typeof value.id === "string" &&
      typeof value.createdAt === "string" &&
      Array.isArray(value.items) &&
      typeof value.total === "number" &&
      typeof value.customer.email === "string" &&
      value.customer.email.toLowerCase() === userEmail.toLowerCase()
    );
  });

  // Lưu các đơn hàng khớp email vào tài khoản hiện tại.
  try {
    if (matchingOrders.length > 0) {
      localStorage.setItem(userOrdersKey, JSON.stringify(matchingOrders));
    }
  } catch {
    // Vẫn hiển thị dữ liệu đã đọc được nếu không ghi được bộ nhớ.
  }

  return matchingOrders;
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

function canCancelOrder(status: string): boolean {
  const normalized = status.trim().toLocaleLowerCase("vi-VN");

  return [
    "đã tiếp nhận",
    "chờ xác nhận",
    "đang xử lý",
    "đang chuẩn bị hàng",
  ].includes(normalized);
}

function Profile() {
  const navigate = useNavigate();
  const session = getCustomerSession();

  const [activeSection, setActiveSection] = useState<SectionId>("personal");

  const [favoriteIds, setFavoriteIds] = useState<number[]>(() =>
    getFavoriteIds(),
  );

  const [profile, setProfile] = useState<ProfileInfo>(() => {
    if (!session) return { ...emptyProfile };

    const saved = readStorage<Partial<ProfileInfo>>(
      getUserStorageKey(PROFILE_STORAGE_KEY, session.id),
      {},
    );

    return {
      ...emptyProfile,
      ...saved,
      fullName: saved.fullName || session.fullName,
      email: saved.email || session.email,
    };
  });

  const [address, setAddress] = useState<AddressInfo>(() => {
    if (!session) return { ...emptyAddress };

    return {
      ...emptyAddress,
      ...readStorage<Partial<AddressInfo>>(
        getUserStorageKey(ADDRESS_STORAGE_KEY, session.id),
        {},
      ),
    };
  });

  const [orders, setOrders] = useState<Order[]>(() =>
    session ? readOrders(session.id, session.email) : [],
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function refreshData() {
      const currentSession = getCustomerSession();

      setFavoriteIds(getFavoriteIds());

      if (!currentSession) {
        setProfile({ ...emptyProfile });
        setAddress({ ...emptyAddress });
        setOrders([]);
        return;
      }

      const savedProfile = readStorage<Partial<ProfileInfo>>(
        getUserStorageKey(PROFILE_STORAGE_KEY, currentSession.id),
        {},
      );

      setProfile({
        ...emptyProfile,
        ...savedProfile,
        fullName: savedProfile.fullName || currentSession.fullName,
        email: savedProfile.email || currentSession.email,
      });

      setAddress({
        ...emptyAddress,
        ...readStorage<Partial<AddressInfo>>(
          getUserStorageKey(ADDRESS_STORAGE_KEY, currentSession.id),
          {},
        ),
      });

      setOrders(readOrders(currentSession.id, currentSession.email));
    }

    refreshData();

    window.addEventListener("customerAuthUpdated", refreshData);
    window.addEventListener("favoritesUpdated", refreshData);
    window.addEventListener("ordersUpdated", refreshData);
    window.addEventListener("storage", refreshData);
    window.addEventListener("focus", refreshData);

    return () => {
      window.removeEventListener("customerAuthUpdated", refreshData);
      window.removeEventListener("favoritesUpdated", refreshData);
      window.removeEventListener("ordersUpdated", refreshData);
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

    const result = updateCustomerProfile({
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (!session) {
      setError("Vui lòng đăng nhập để cập nhật thông tin cá nhân.");
      return;
    }

    try {
      localStorage.setItem(
        getUserStorageKey(PROFILE_STORAGE_KEY, session.id),
        JSON.stringify(profile),
      );

      setMessage("Thông tin cá nhân đã được cập nhật thành công.");
    } catch {
      setError("Không thể lưu thông tin cá nhân. Vui lòng thử lại.");
    }
  }

  function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    if (!session) {
      setError("Vui lòng đăng nhập để cập nhật địa chỉ.");
      return;
    }

    try {
      localStorage.setItem(
        getUserStorageKey(ADDRESS_STORAGE_KEY, session.id),
        JSON.stringify(address),
      );

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

    const result = changeCustomerPassword(currentPassword, newPassword);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setMessage("Đổi mật khẩu thành công.");
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

    logoutCustomer();
    navigate("/login", { replace: true });
  }

  function handleCancelOrder(orderId: string) {
    clearMessages();

    if (!session) {
      setError("Vui lòng đăng nhập để hủy đơn hàng.");
      return;
    }

    const confirmed = window.confirm(
      "Bạn có chắc chắn muốn hủy đơn hàng này không? Số lượng sản phẩm sẽ được hoàn lại kho.",
    );

    if (!confirmed) return;

    const userOrdersKey = getUserStorageKey(ORDERS_STORAGE_KEY, session.id);

    // Đọc lại dữ liệu mới nhất để tránh hủy đơn đã được xử lý trước đó.
    const latestOrders = readOrders(session.id, session.email);
    const targetOrder = latestOrders.find((order) => order.id === orderId);

    if (!targetOrder) {
      setError("Không tìm thấy đơn hàng cần hủy.");
      return;
    }

    if (!canCancelOrder(targetOrder.status || "")) {
      setError("Đơn hàng này không còn được phép hủy.");
      setOrders(latestOrders);
      return;
    }

    // Gộp sản phẩm trùng ID và kích thước.
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
        setError(
          "Không thể hoàn kho vì thông tin sản phẩm trong đơn hàng không hợp lệ.",
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

    // Lưu tồn kho hiện tại để có thể khôi phục nếu không lưu được đơn.
    const previousStock: StockUpdate[] = [];
    const nextStock: StockUpdate[] = [];

    for (const item of quantityMap.values()) {
      const currentStock = getStock(item.productId, item.size);

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

    // Hoàn kho trước, chỉ cập nhật đơn nếu thao tác thành công.
    if (nextStock.length > 0 && !setMultipleStock(nextStock)) {
      setError("Không thể hoàn lại tồn kho. Vui lòng thử lại.");
      return;
    }

    const updatedOrders = latestOrders.map((order) =>
      order.id === orderId ? { ...order, status: "Đã hủy" } : order,
    );

    try {
      localStorage.setItem(userOrdersKey, JSON.stringify(updatedOrders));

      setOrders(updatedOrders);
      setMessage(
        "Đã hủy đơn hàng thành công. Số lượng sản phẩm đã được hoàn lại kho.",
      );

      window.dispatchEvent(new Event("ordersUpdated"));
    } catch {
      // Nếu không lưu được trạng thái đơn, khôi phục tồn kho cũ.
      const restored = setMultipleStock(previousStock);

      setError(
        restored
          ? "Không thể lưu trạng thái đơn hàng. Tồn kho đã được khôi phục, vui lòng thử lại."
          : "Không thể lưu trạng thái đơn hàng và khôi phục tồn kho tự động. Vui lòng kiểm tra lại dữ liệu tồn kho.",
      );
    }
  }

  function getOrderItemProduct(item: OrderItem): Product | undefined {
    return products.find((product) => product.id === item.productId);
  }

  if (!session) {
    return <Navigate to="/login" replace />;
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

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span
                            className={`shrink-0 border px-2.5 py-1 text-[10px] ${getOrderStatusClass(order.status || "")}`}
                          >
                            {order.status || "Đã đặt hàng"}
                          </span>

                          {canCancelOrder(order.status || "") && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order.id)}
                              className="border border-red-300 px-3 py-1.5 text-[10px] font-medium text-red-700 transition hover:bg-red-50"
                            >
                              HỦY ĐƠN HÀNG
                            </button>
                          )}
                        </div>
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
