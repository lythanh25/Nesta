import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { getSizePrice, products, type Product } from "../../data/products";

const CART_STORAGE_KEY = "nesta-cart";
const PROFILE_STORAGE_KEY = "nesta-profile";
const ADDRESS_STORAGE_KEY = "nesta-address";
const ORDERS_STORAGE_KEY = "nesta-orders";
const SHIPPING_FEE = 30_000;

type CartItem = {
  productId: number;
  size?: string;
  quantity: number;
};

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

type CustomerInfo = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  ward: string;
  address: string;
  note: string;
};

type OrderItem = {
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
};

type Order = {
  id: string;
  createdAt: string;
  customer: CustomerInfo;
  paymentMethod: "cod" | "bank";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
};

type CartLine = {
  product: Product;
  size?: string;
  quantity: number;
  unitPrice: number;
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price);
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "number" &&
    Number.isFinite(item.productId) &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    (item.size === undefined || typeof item.size === "string")
  );
}

function readCartItems(): CartItem[] {
  const saved = readStorage<unknown>(CART_STORAGE_KEY, []);
  return Array.isArray(saved) ? saved.filter(isCartItem) : [];
}

function Checkout() {
  const [cartItems, setCartItems] = useState<CartItem[]>(readCartItems);
  const [customer, setCustomer] = useState<CustomerInfo>(() => {
    const profile = readStorage<ProfileInfo>(PROFILE_STORAGE_KEY, {
      fullName: "",
      email: "",
      phone: "",
      birthday: "",
    });
    const address = readStorage<AddressInfo>(ADDRESS_STORAGE_KEY, {
      recipient: "",
      phone: "",
      city: "",
      district: "",
      ward: "",
      address: "",
    });

    return {
      fullName: address.recipient || profile.fullName || "",
      phone: address.phone || profile.phone || "",
      email: profile.email || "",
      city: address.city || "",
      district: address.district || "",
      ward: address.ward || "",
      address: address.address || "",
      note: "",
    };
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank">("cod");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cartProducts: CartLine[] = cartItems.flatMap((item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    );
    if (!product) return [];

    const selectedSize = product.sizes?.find(
      (productSize) => productSize.label === item.size,
    );
    // Giá theo kích thước đã chọn phải đồng nhất với trang giỏ hàng.
    const unitPrice = getSizePrice(product, selectedSize);

    return [{ product, size: item.size, quantity: item.quantity, unitPrice }];
  });

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const shipping = cartProducts.length > 0 ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

  const inputClass =
    "h-9 w-full border border-[#cfc5bc] bg-white px-3 text-[11px] text-[#2d261f] outline-none transition placeholder:text-[#a59a91] focus:border-[#6e5a47] md:h-10";
  const labelClass = "mb-1.5 block text-[10px] font-medium text-[#3b2f25]";

  function updateCustomer(field: keyof CustomerInfo, value: string) {
    setCustomer((previous) => ({ ...previous, [field]: value }));
  }

  function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (cartProducts.length === 0) {
      setError("Giỏ hàng đang trống. Vui lòng chọn sản phẩm trước.");
      return;
    }

    if (!acceptedTerms) {
      setError("Vui lòng xác nhận đồng ý với điều khoản đặt hàng.");
      return;
    }

    const invalidSize = cartProducts.some(({ product, size }) => {
      if (!product.sizes?.length) return false;
      return !size || !product.sizes.some((option) => option.label === size);
    });

    if (invalidSize) {
      setError(
        "Có sản phẩm chưa chọn kích thước hợp lệ. Vui lòng quay lại giỏ hàng để kiểm tra.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems: OrderItem[] = cartProducts.map(
        ({ product, size, quantity, unitPrice }) => ({
          productId: product.id,
          name: product.name,
          image: product.images[0] ?? "",
          // Lưu giá đơn vị đã áp dụng kích thước để lịch sử đơn hàng đúng giá.
          price: unitPrice,
          quantity,
          ...(size ? { size } : {}),
        }),
      );

      const order: Order = {
        id: `NESTA-${Date.now()}`,
        createdAt: new Date().toISOString(),
        customer: { ...customer },
        paymentMethod,
        items: orderItems,
        subtotal,
        shipping,
        total,
        status: "Đã tiếp nhận",
      };

      const savedOrders = readStorage<unknown>(ORDERS_STORAGE_KEY, []);
      if (!Array.isArray(savedOrders)) {
        throw new Error("Không đọc được danh sách đơn hàng.");
      }

      localStorage.setItem(
        ORDERS_STORAGE_KEY,
        JSON.stringify([order, ...savedOrders]),
      );
      window.dispatchEvent(new Event("ordersUpdated"));

      const oldProfile = readStorage<ProfileInfo>(PROFILE_STORAGE_KEY, {
        fullName: "",
        email: "",
        phone: "",
        birthday: "",
      });
      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify({
          ...oldProfile,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
        }),
      );

      const addressToSave: AddressInfo = {
        recipient: customer.fullName,
        phone: customer.phone,
        city: customer.city,
        district: customer.district,
        ward: customer.ward,
        address: customer.address,
      };
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addressToSave));

      // Chỉ xóa giỏ hàng sau khi đơn hàng đã được ghi thành công.
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      setCartItems([]);
      window.dispatchEvent(new Event("cartUpdated"));
      setSuccessOrder(order);
    } catch {
      setError(
        "Chưa thể lưu đơn hàng. Vui lòng kiểm tra bộ nhớ trình duyệt và thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cartProducts.length === 0 && !successOrder) {
    return (
      <main className="min-h-[65vh] bg-[#f7f1ed] px-5 pb-16 pt-28">
        <div className="mx-auto max-w-3xl border border-[#ddd5cd] bg-white px-5 py-14 text-center md:py-20">
          <h1 className="font-serif text-2xl font-semibold text-[#2d261f]">
            Giỏ hàng đang trống
          </h1>
          <p className="mt-3 text-xs leading-6 text-[#756b63]">
            Bạn cần có sản phẩm trong giỏ hàng trước khi tiến hành thanh toán.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex bg-[#3b2f25] px-7 py-3 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638]"
          >
            TIẾP TỤC MUA HÀNG
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f1ed] pb-14 pt-[70px] md:pb-20">
      <section className="px-5 pb-5 pt-6 md:px-8 md:pb-7 md:pt-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] tracking-[0.18em] text-[#8c7a69]">
            NESTA FURNITURE
          </p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-[#2d261f] md:text-3xl">
            THANH TOÁN
          </h1>
        </div>
      </section>

      <section className="px-5 md:px-8">
        <div className="mx-auto grid max-w-6xl items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <form
            id="checkout-form"
            onSubmit={handlePlaceOrder}
            className="min-w-0 space-y-8"
          >
            <section>
              <h2 className="mb-4 text-xs font-semibold text-[#2d261f] md:text-sm">
                ĐỊA CHỈ GIAO HÀNG
              </h2>
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor="fullName">
                    Họ và tên *
                  </label>
                  <input
                    id="fullName"
                    required
                    autoComplete="name"
                    value={customer.fullName}
                    onChange={(e) => updateCustomer("fullName", e.target.value)}
                    placeholder="Nhập họ và tên"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="phone">
                    Số điện thoại *
                  </label>
                  <input
                    id="phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    pattern="[0-9+() .-]{9,20}"
                    value={customer.phone}
                    onChange={(e) => updateCustomer("phone", e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="email">
                    Địa chỉ email *
                  </label>
                  <input
                    id="email"
                    required
                    type="email"
                    autoComplete="email"
                    value={customer.email}
                    onChange={(e) => updateCustomer("email", e.target.value)}
                    placeholder="Nhập email"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="city">
                    Tỉnh/Thành phố *
                  </label>
                  <input
                    id="city"
                    required
                    autoComplete="address-level1"
                    value={customer.city}
                    onChange={(e) => updateCustomer("city", e.target.value)}
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
                    autoComplete="address-level2"
                    value={customer.district}
                    onChange={(e) => updateCustomer("district", e.target.value)}
                    placeholder="Nhập quận/huyện"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="ward">
                    Phường/Xã
                  </label>
                  <input
                    id="ward"
                    autoComplete="address-level3"
                    value={customer.ward}
                    onChange={(e) => updateCustomer("ward", e.target.value)}
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
                    autoComplete="street-address"
                    value={customer.address}
                    onChange={(e) => updateCustomer("address", e.target.value)}
                    placeholder="Số nhà, tên đường"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-2 text-xs font-semibold text-[#2d261f]">
                THÔNG TIN THÊM
              </h2>
              <label
                htmlFor="note"
                className="mb-2 block text-[10px] text-[#756b63]"
              >
                Lưu ý cho đơn hàng (tùy chọn)
              </label>
              <textarea
                id="note"
                rows={3}
                value={customer.note}
                onChange={(e) => updateCustomer("note", e.target.value)}
                placeholder="Nhập ghi chú nếu có..."
                className="w-full resize-y border border-[#cfc5bc] bg-white px-3 py-2.5 text-[11px] text-[#2d261f] outline-none transition placeholder:text-[#a59a91] focus:border-[#6e5a47]"
              />
            </section>

            <section>
              <h2 className="mb-4 text-xs font-semibold text-[#2d261f] md:text-sm">
                PHƯƠNG THỨC THANH TOÁN
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={`flex min-h-[66px] cursor-pointer items-center gap-3 border p-4 transition ${paymentMethod === "cod" ? "border-[#3b2f25] bg-[#f3ece6]" : "border-[#d8d0c8] bg-white hover:border-[#a99a8d]"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="accent-[#3b2f25]"
                  />
                  <span className="text-[11px] text-[#3b2f25]">
                    <span className="block font-medium">
                      Thanh toán khi nhận hàng
                    </span>
                    <span className="mt-1 block text-[10px] text-[#756b63]">
                      Thanh toán trực tiếp khi nhận sản phẩm
                    </span>
                  </span>
                </label>
                <label
                  className={`flex min-h-[66px] cursor-pointer items-center gap-3 border p-4 transition ${paymentMethod === "bank" ? "border-[#3b2f25] bg-[#f3ece6]" : "border-[#d8d0c8] bg-white hover:border-[#a99a8d]"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === "bank"}
                    onChange={() => setPaymentMethod("bank")}
                    className="accent-[#3b2f25]"
                  />
                  <span className="text-[11px] text-[#3b2f25]">
                    <span className="block font-medium">
                      Chuyển khoản ngân hàng
                    </span>
                    <span className="mt-1 block text-[10px] text-[#756b63]">
                      Hướng dẫn thanh toán sau khi đặt hàng
                    </span>
                  </span>
                </label>
              </div>
            </section>
          </form>

          <aside className="h-fit border border-[#d5ccc4] bg-white p-4 md:p-5 lg:sticky lg:top-24">
            <h2 className="border-b border-[#e4dcd5] pb-3 text-xs font-semibold text-[#2d261f] md:text-sm">
              TÓM TẮT ĐƠN HÀNG
            </h2>
            <div className="divide-y divide-[#e2d9d1]">
              {cartProducts.map(({ product, size, quantity, unitPrice }) => (
                <div
                  key={`${product.id}-${size ?? "default"}`}
                  className="flex gap-3 py-4"
                >
                  <Link
                    to={`/products/${product.id}`}
                    className="h-[58px] w-[58px] shrink-0 overflow-hidden bg-[#f2ece6]"
                  >
                    <img
                      src={product.images[0] ?? ""}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/products/${product.id}`}
                      className="block text-[10px] font-medium text-[#2d261f] transition hover:text-[#8c7a69]"
                    >
                      {product.name} × {quantity}
                    </Link>
                    {size && (
                      <p className="mt-1 text-[9px] text-[#756b63]">
                        Kích thước: {size}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] font-medium text-[#3b2f25]">
                      {formatPrice(unitPrice * quantity)} VNĐ
                    </p>
                    <p className="mt-1 text-[9px] text-[#756b63]">
                      Đơn giá: {formatPrice(unitPrice)} VNĐ
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-[#d5ccc4] pt-4 text-[10px] text-[#51463d]">
              <div className="flex items-center justify-between gap-3">
                <span>Tạm tính</span>
                <span>{formatPrice(subtotal)} VNĐ</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Vận chuyển</span>
                <span>{formatPrice(shipping)} VNĐ</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[#e4dcd5] pt-3 text-xs font-semibold text-[#2d261f]">
                <span>TỔNG CỘNG</span>
                <span>{formatPrice(total)} VNĐ</span>
              </div>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-2 text-[9px] leading-4 text-[#756b63]">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 accent-[#3b2f25]"
              />
              <span>
                Tôi đã đọc và đồng ý với các điều khoản, điều kiện của cửa hàng.
              </span>
            </label>
            {error && (
              <p
                role="alert"
                className="mt-3 border border-[#e6c7c1] bg-[#fff4f1] p-2.5 text-[10px] leading-5 text-[#9b3930]"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="mt-4 flex h-10 w-full items-center justify-center bg-[#3b2f25] px-4 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "ĐANG XỬ LÝ..." : "ĐẶT MUA"}
            </button>
            <Link
              to="/cart"
              className="mt-3 block text-center text-[10px] text-[#756b63] underline underline-offset-4 transition hover:text-[#3b2f25]"
            >
              Quay lại giỏ hàng
            </Link>
          </aside>
        </div>
      </section>

      {successOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-success-title"
        >
          <div className="w-full max-w-md border border-[#ded4ca] bg-[#fffdfb] px-6 py-8 text-center shadow-2xl md:px-9 md:py-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#c9d9c5] bg-[#f2f7f0] text-2xl text-[#45613f]">
              ✓
            </div>
            <p className="mt-5 text-[10px] tracking-[0.2em] text-[#8c7a69]">
              NESTA FURNITURE
            </p>
            <h2
              id="order-success-title"
              className="mt-2 font-serif text-2xl font-semibold text-[#2d261f]"
            >
              Đặt hàng thành công!
            </h2>
            <p className="mt-3 text-xs leading-6 text-[#756b63]">
              Cảm ơn bạn đã tin tưởng và lựa chọn NESTA. Đơn hàng của bạn đã
              được ghi nhận.
            </p>
            <div className="mt-5 border-y border-[#e4dcd5] py-4 text-left text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#756b63]">Mã đơn hàng</span>
                <span className="font-semibold text-[#3b2f25]">
                  {successOrder.id}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[#756b63]">Tổng thanh toán</span>
                <span className="font-semibold text-[#3b2f25]">
                  {formatPrice(successOrder.total)} VNĐ
                </span>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                to="/profile"
                className="flex min-h-10 items-center justify-center bg-[#3b2f25] px-3 py-3 text-[10px] font-medium tracking-wide text-white transition hover:bg-[#594638]"
              >
                XEM ĐƠN HÀNG
              </Link>
              <Link
                to="/"
                className="flex min-h-10 items-center justify-center border border-[#3b2f25] px-3 py-3 text-[10px] font-medium tracking-wide text-[#3b2f25] transition hover:bg-[#f3ece6]"
              >
                VỀ TRANG CHỦ
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Checkout;
