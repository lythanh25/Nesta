import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import banner from "../../assets/banner.jpg";
import deleteIcon from "../../assets/Delete.svg";
import { products, type Product } from "../../data/products";

const CART_STORAGE_KEY = "nesta-cart";

type CartItem = {
  productId: number;
  size?: string;
  quantity: number;
};

type CartProduct = {
  product: Product;
  size?: string;
  quantity: number;
};

function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // =========================================================
  // LOAD CART
  // =========================================================

  useEffect(() => {
    function loadCart() {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (!savedCart) {
        setCartItems([]);
        return;
      }

      try {
        const parsed: unknown = JSON.parse(savedCart);

        if (!Array.isArray(parsed)) {
          setCartItems([]);
          return;
        }

        const validItems: CartItem[] = [];

        parsed.forEach((item: unknown) => {
          if (
            typeof item !== "object" ||
            item === null ||
            !("productId" in item) ||
            !("quantity" in item)
          ) {
            return;
          }

          const cartItem = item as {
            productId?: unknown;
            size?: unknown;
            quantity?: unknown;
          };

          if (
            typeof cartItem.productId !== "number" ||
            typeof cartItem.quantity !== "number" ||
            cartItem.quantity <= 0
          ) {
            return;
          }

          validItems.push({
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            size: typeof cartItem.size === "string" ? cartItem.size : undefined,
          });
        });

        setCartItems(validItems);
      } catch {
        setCartItems([]);
      }
    }

    loadCart();

    window.addEventListener("cartUpdated", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
    };
  }, []);

  // =========================================================
  // SAVE CART
  // =========================================================

  function saveCart(items: CartItem[]) {
    setCartItems(items);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

    window.dispatchEvent(new Event("cartUpdated"));
  }

  // =========================================================
  // CHECK SAME CART ITEM
  // =========================================================

  function isSameCartItem(item: CartItem, productId: number, size?: string) {
    return item.productId === productId && item.size === size;
  }

  // =========================================================
  // INCREASE
  // =========================================================

  function increaseQuantity(productId: number, size?: string) {
    const updatedItems = cartItems.map((item) => {
      if (isSameCartItem(item, productId, size)) {
        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }

      return item;
    });

    saveCart(updatedItems);
  }

  // =========================================================
  // DECREASE
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
  // REMOVE
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

  const cartProducts: CartProduct[] = cartItems.flatMap((item) => {
    const product = products.find((product) => product.id === item.productId);

    if (!product) {
      return [];
    }

    return [
      {
        product,
        size: item.size,
        quantity: item.quantity,
      },
    ];
  });

  // =========================================================
  // PRICE
  // =========================================================

  const subtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const shipping = cartProducts.length > 0 ? 30000 : 0;

  const total = subtotal + shipping;

  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price);
  }

  // =========================================================
  // EMPTY CART
  // =========================================================

  if (cartProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f1ed]">
        {/* =====================================================
            HERO
        ====================================================== */}

        <section className="relative h-[190px] overflow-hidden md:h-[210px]">
          <img
            src={banner}
            alt="NESTA"
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="font-serif text-3xl font-semibold tracking-wide text-white md:text-4xl">
              GIỎ HÀNG
            </h1>
          </div>
        </section>

        {/* =====================================================
            EMPTY
        ====================================================== */}

        <section className="px-5 py-20 md:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d8d0c8] text-2xl text-[#6f6257]">
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
      {/* =====================================================
          HERO
      ====================================================== */}

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

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* =================================================
                LEFT - CART ITEMS
            ================================================== */}

            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[#cfc6be] pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2d261f]">
                  Sản phẩm
                </h2>

                <span className="text-xs text-[#756b63]">
                  {cartProducts.length} sản phẩm
                </span>
              </div>

              <div>
                {cartProducts.map(function ({ product, size, quantity }) {
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
                      {/* =================================================
                          IMAGE
                      ================================================== */}

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

                      {/* =================================================
                          PRODUCT INFO
                      ================================================== */}

                      <div className="flex min-w-0 flex-1 items-center gap-4 relative">
                        <div className="min-w-0 flex-1 pr-2">
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
                            {formatPrice(product.price)} VNĐ
                          </p>
                        </div>

                        {/* =================================================
                            QUANTITY - BÊN PHẢI
                        ================================================== */}

                        <div className="flex shrink-0 items-center border border-[#bdb4ac] bg-white absolute right-0 bottom-0 rounded">
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
                            aria-label="Giảm số lượng"
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
                          >
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increaseQuantity(product.id, size)}
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
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* =================================================
                          REMOVE
                      ================================================== */}

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
                        aria-label={`Xóa ${product.name}`}
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

            {/* =================================================
                RIGHT - ORDER SUMMARY
            ================================================== */}

            <aside className="border border-[#d5ccc4] bg-white p-5 md:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#2d261f]">
                Tóm tắt đơn hàng
              </h2>

              {/* =================================================
                  PRICE
              ================================================== */}

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

              {/* =================================================
                  PROMOTION
              ================================================== */}

              <div className="mt-5 border-t border-[#e1dad3] pt-5">
                <p className="mb-2 text-[10px] font-medium text-[#3b2f25]">
                  Mã giảm giá
                </p>

                <div className="flex h-8">
                  <input
                    type="text"
                    placeholder="Nhập mã giảm giá"
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
                      focus:border-[#8c7a69]
                    "
                  />

                  <button
                    type="button"
                    className="
                      w-[70px]
                      shrink-0
                      bg-[#3b2f25]
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-wide
                      text-white
                      transition
                      hover:bg-[#594638]
                    "
                  >
                    Sử dụng
                  </button>
                </div>
              </div>

              {/* =================================================
                  TOTAL
              ================================================== */}

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

              {/* =================================================
                  ACTIONS
              ================================================== */}

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
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Cart;
