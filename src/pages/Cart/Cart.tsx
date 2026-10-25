import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import banner from "../../assets/banner.jpg";
import deleteIcon from "../../assets/Delete.svg";
import { getSizePrice, products, type Product } from "../../data/products";
import { getCartItems, saveCartItems, type CartItem } from "../../utils/cart";
import { getStock, subscribeToStock, validateStock } from "../../utils/stock";

const SHIPPING_FEE = 30_000;

type CartProduct = {
  product: Product;
  size?: string;
  quantity: number;
  unitPrice: number;
  stockAvailable: number;
  stockMessage?: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price);
}

// =========================================================
// CART HERO
// =========================================================

function CartHero() {
  return (
    <section className="relative h-[190px] overflow-hidden md:h-[210px]">
      <img
        src={banner}
        alt="NESTA - Giỏ hàng"
        className="h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-0 flex items-center justify-center">
        <h1 className="font-serif text-3xl font-semibold tracking-wide text-white md:text-4xl">
          GIỎ HÀNG
        </h1>
      </div>
    </section>
  );
}

// =========================================================
// CART COMPONENT
// =========================================================

function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const [stockVersion, setStockVersion] = useState(0);

  useEffect(() => {
    return subscribeToStock(() => {
      setStockVersion((current) => current + 1);
    });
  }, []);

  // =========================================================
  // LOAD CART
  // =========================================================

  useEffect(() => {
    function loadCart() {
      setCartItems(getCartItems());
    }

    loadCart();

    window.addEventListener("cartUpdated", loadCart);
    window.addEventListener("customerAuthUpdated", loadCart);
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
      window.removeEventListener("customerAuthUpdated", loadCart);
      window.removeEventListener("storage", loadCart);
    };
  }, []);

  // =========================================================
  // SAVE CART
  // =========================================================

  function saveCart(items: CartItem[]) {
    const saved = saveCartItems(items);

    if (saved) {
      setCartItems(items);
    }
  }

  // =========================================================
  // CHECK SAME CART ITEM
  // =========================================================

  function isSameCartItem(item: CartItem, productId: number, size?: string) {
    return item.productId === productId && item.size === size;
  }

  // =========================================================
  // INCREASE QUANTITY
  // =========================================================

  function increaseQuantity(productId: number, size?: string) {
    const currentItem = cartItems.find((item) =>
      isSameCartItem(item, productId, size),
    );

    if (!currentItem) return;

    const nextQuantity = currentItem.quantity + 1;

    const validation = validateStock(productId, nextQuantity, size);

    if (!validation.valid) {
      alert(validation.message || "Số lượng vượt quá tồn kho hiện có.");
      return;
    }

    const updatedItems = cartItems.map((item) => {
      if (isSameCartItem(item, productId, size)) {
        return {
          ...item,
          quantity: nextQuantity,
        };
      }

      return item;
    });

    saveCart(updatedItems);
  }

  // =========================================================
  // DECREASE QUANTITY
  // =========================================================

  function decreaseQuantity(productId: number, size?: string) {
    const updatedItems = cartItems
      .map((item) => {
        if (isSameCartItem(item, productId, size)) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }

        return item;
      })
      .filter((item) => item.quantity > 0);

    saveCart(updatedItems);
  }

  // =========================================================
  // REMOVE ITEM
  // =========================================================

  function removeItem(productId: number, size?: string) {
    const updatedItems = cartItems.filter(
      (item) => !isSameCartItem(item, productId, size),
    );

    saveCart(updatedItems);
  }

  // =========================================================
  // CART PRODUCTS
  // =========================================================

  void stockVersion;

  const cartProducts: CartProduct[] = cartItems.flatMap((item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    );

    if (!product) {
      return [];
    }

    const hasSizeOptions = Boolean(product.sizes?.length);

    const selectedSize = product.sizes?.find(
      (sizeOption) => sizeOption.label === item.size,
    );

    const hasInvalidSavedSize = hasSizeOptions && (!item.size || !selectedSize);

    const unitPrice = hasInvalidSavedSize
      ? product.price
      : getSizePrice(product, selectedSize);

    const stockAvailable = hasInvalidSavedSize
      ? 0
      : getStock(product.id, item.size);

    let stockMessage: string | undefined;

    if (hasInvalidSavedSize) {
      stockMessage = "Vui lòng chọn lại kích thước sản phẩm.";
    } else if (stockAvailable <= 0) {
      stockMessage = "Sản phẩm đã hết hàng.";
    } else if (item.quantity > stockAvailable) {
      stockMessage = `Giỏ hàng vượt tồn kho. Hiện chỉ còn ${stockAvailable} sản phẩm.`;
    }

    return [
      {
        product,
        size: item.size,
        quantity: item.quantity,
        unitPrice,
        stockAvailable,
        stockMessage,
      },
    ];
  });

  const hasStockIssue = cartProducts.some((item) => {
    return Boolean(item.stockMessage);
  });

  // =========================================================
  // PRICE SUMMARY
  // =========================================================

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const totalQuantity = cartProducts.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const shipping = cartProducts.length > 0 ? SHIPPING_FEE : 0;

  const total = subtotal + shipping;

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (cartProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f1ed]">
        <CartHero />

        <section className="px-5 py-20 md:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <div
              aria-hidden="true"
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d8d0c8] text-2xl text-[#6f6257]"
            >
              🛒
            </div>

            <h2 className="mt-6 text-xl font-semibold text-[#2d261f]">
              Giỏ hàng của bạn đang trống
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#756b63]">
              Hãy khám phá các sản phẩm nội thất của NESTA và chọn những món đồ
              phù hợp với không gian của bạn.
            </p>

            <Link
              to="/products"
              className="
                mt-8
                inline-flex
                items-center
                justify-center
                bg-[#3b2f25]
                px-8
                py-3
                text-xs
                font-medium
                tracking-wide
                text-white
                transition
                hover:bg-[#594638]
              "
            >
              TIẾP TỤC MUA HÀNG
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // CART PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f7f1ed]">
      <CartHero />

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* LEFT - CART ITEMS */}

            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[#cfc6be] pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2d261f]">
                  Sản phẩm
                </h2>

                <span className="text-xs text-[#756b63]">
                  {totalQuantity} sản phẩm
                </span>
              </div>

              <div>
                {cartProducts.map(function ({
                  product,
                  size,
                  quantity,
                  unitPrice,
                  stockAvailable,
                  stockMessage,
                }) {
                  return (
                    <article
                      key={`${product.id}-${size ?? "default"}`}
                      className="
                        relative
                        flex
                        gap-4
                        border-b
                        border-[#d5ccc4]
                        py-4
                        md:gap-5
                      "
                    >
                      {/* IMAGE */}

                      <Link
                        to={`/products/${product.id}`}
                        className="
                          h-[92px]
                          w-[92px]
                          shrink-0
                          overflow-hidden
                          rounded-[5px]
                          bg-white
                          md:h-[100px]
                          md:w-[100px]
                        "
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="block h-full w-full object-cover"
                        />
                      </Link>

                      {/* PRODUCT INFO */}

                      <div className="relative flex min-w-0 flex-1 items-center gap-4">
                        <div className="min-w-0 flex-1 pr-8 sm:pr-2">
                          <Link
                            to={`/products/${product.id}`}
                            className="
                              block
                              text-xs
                              font-semibold
                              uppercase
                              text-[#2d261f]
                              transition
                              hover:text-[#6e5a47]
                              md:text-sm
                            "
                          >
                            {product.name}
                          </Link>

                          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#756b63] md:text-xs">
                            {product.description}
                          </p>

                          {size && (
                            <p className="mt-1 text-[10px] text-[#756b63] md:text-xs">
                              Kích thước:{" "}
                              <span className="font-medium text-[#3f3832]">
                                {size}
                              </span>
                            </p>
                          )}

                          <p className="mt-1 text-[10px] font-medium text-[#3b2f25] md:text-xs">
                            {formatPrice(unitPrice)} VNĐ
                          </p>

                          <p
                            className={`mt-1 text-[10px] md:text-xs ${
                              stockMessage ? "text-red-600" : "text-[#477654]"
                            }`}
                          >
                            {stockMessage || `Còn ${stockAvailable} sản phẩm`}
                          </p>

                          <p className="mt-1 text-[10px] text-[#756b63] md:text-xs">
                            Thành tiền:{" "}
                            <span className="font-semibold text-[#3b2f25]">
                              {formatPrice(unitPrice * quantity)} VNĐ
                            </span>
                          </p>
                        </div>

                        {/* QUANTITY */}

                        <div className="absolute bottom-0 right-0 flex shrink-0 items-center rounded border border-[#bdb4ac] bg-white">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(product.id, size)}
                            className="
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              text-sm
                              text-[#3b2f25]
                              transition
                              hover:bg-[#eee8e3]
                            "
                            aria-label={`Giảm số lượng ${product.name}`}
                          >
                            −
                          </button>

                          <span
                            className="
                              flex
                              h-7
                              min-w-8
                              items-center
                              justify-center
                              border-x
                              border-[#bdb4ac]
                              px-2
                              text-[11px]
                              text-[#2d261f]
                            "
                            aria-live="polite"
                          >
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increaseQuantity(product.id, size)}
                            disabled={
                              Boolean(stockMessage) ||
                              quantity >= stockAvailable
                            }
                            className="
                              flex
                              h-7
                              w-7
                              items-center
                              justify-center
                              text-sm
                              text-[#3b2f25]
                              transition
                              hover:bg-[#eee8e3]
                              disabled:cursor-not-allowed
                              disabled:opacity-40
                            "
                            aria-label={`Tăng số lượng ${product.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* REMOVE */}

                      <button
                        type="button"
                        onClick={() => removeItem(product.id, size)}
                        className="
                          absolute
                          right-0
                          top-4
                          flex
                          h-7
                          w-7
                          cursor-pointer
                          items-center
                          justify-center
                          opacity-70
                          transition
                          hover:opacity-100
                        "
                        aria-label={`Xóa ${product.name} khỏi giỏ hàng`}
                      >
                        <img
                          src={deleteIcon}
                          alt=""
                          className="h-4 w-4 object-contain"
                        />
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* RIGHT - ORDER SUMMARY */}

            <aside className="border border-[#d5ccc4] bg-white p-5 md:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2d261f]">
                Tóm tắt đơn hàng
              </h2>

              {/* PRICE */}

              <div className="mt-5 space-y-3 text-[11px] text-[#4d443d]">
                <div className="flex items-center justify-between gap-4">
                  <span>Tạm tính</span>

                  <span className="font-medium text-[#2d261f]">
                    {formatPrice(subtotal)} VNĐ
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span>Phí vận chuyển</span>

                  <span className="font-medium text-[#2d261f]">
                    {formatPrice(shipping)} VNĐ
                  </span>
                </div>
              </div>

              {/* PROMOTION */}

              <div className="mt-5 border-t border-[#e1dad3] pt-5">
                <label
                  htmlFor="cart-promo-code"
                  className="mb-2 block text-[10px] font-medium text-[#3b2f25]"
                >
                  Mã giảm giá
                </label>

                <div className="flex h-8">
                  <input
                    id="cart-promo-code"
                    type="text"
                    placeholder="Nhập mã giảm giá"
                    disabled
                    className="
                      min-w-0
                      flex-1
                      border
                      border-[#d1c8c0]
                      bg-[#faf8f6]
                      px-2.5
                      text-[10px]
                      text-[#3b2f25]
                      outline-none
                      placeholder:text-[#aaa09a]
                      disabled:cursor-not-allowed
                    "
                  />

                  <button
                    type="button"
                    disabled
                    className="
                      w-[70px]
                      shrink-0
                      bg-[#3b2f25]
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-white
                      opacity-60
                    "
                  >
                    Sử dụng
                  </button>
                </div>

                <p className="mt-2 text-[10px] leading-relaxed text-[#81766e]">
                  Chức năng mã giảm giá chưa được kích hoạt.
                </p>
              </div>

              {/* TOTAL */}

              <div className="mt-5 border-t border-[#d5ccc4] pt-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-[#2d261f]">
                    Tổng cộng
                  </span>

                  <span className="text-sm font-semibold text-[#3b2f25]">
                    {formatPrice(total)} VNĐ
                  </span>
                </div>

                <p className="mt-2 text-[9px] leading-relaxed text-[#81766e]">
                  Đã bao gồm phí vận chuyển. Thuế và các khoản phí khác sẽ được
                  tính nếu có.
                </p>
              </div>

              {/* ACTIONS */}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Link
                  to="/products"
                  className="
                    flex
                    h-9
                    items-center
                    justify-center
                    border
                    border-[#3b2f25]
                    px-2
                    text-center
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-wide
                    text-[#3b2f25]
                    transition
                    hover:bg-[#3b2f25]
                    hover:text-white
                  "
                >
                  Tiếp tục mua hàng
                </Link>

                {hasStockIssue ? (
                  <button
                    type="button"
                    disabled
                    className="
      flex
      h-9
      cursor-not-allowed
      items-center
      justify-center
      bg-[#3b2f25]
      px-2
      text-center
      text-[9px]
      font-medium
      uppercase
      tracking-wide
      text-white
      opacity-50
    "
                    title="Vui lòng kiểm tra lại tồn kho trước khi đặt hàng"
                  >
                    Đặt hàng
                  </button>
                ) : (
                  <Link
                    to="/checkout"
                    className="
                      flex
                      h-9
                      items-center
                      justify-center
                      bg-[#3b2f25]
                      px-2
                      text-center
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-white
                      transition
                      hover:bg-[#594638]
                    "
                  >
                    Đặt hàng
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Cart;
