import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { products } from "../../data/products";

const CART_STORAGE_KEY = "nesta-cart";

type CartItem = {
  productId: number;
  quantity: number;
};

function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // =====================================================
  // LOAD CART
  // =====================================================

  useEffect(function () {
    function loadCart() {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (!savedCart) {
        setCartItems([]);
        return;
      }

      try {
        const parsedCart: CartItem[] = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch {
        setCartItems([]);
      }
    }

    loadCart();

    window.addEventListener("cartUpdated", loadCart);

    return function () {
      window.removeEventListener("cartUpdated", loadCart);
    };
  }, []);

  // =====================================================
  // SAVE CART
  // =====================================================

  function saveCart(items: CartItem[]) {
    setCartItems(items);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));

    window.dispatchEvent(new Event("cartUpdated"));
  }

  // =====================================================
  // INCREASE
  // =====================================================

  function increaseQuantity(productId: number) {
    const updatedItems = cartItems.map(function (item) {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: item.quantity + 1,
        };
      }

      return item;
    });

    saveCart(updatedItems);
  }

  // =====================================================
  // DECREASE
  // =====================================================

  function decreaseQuantity(productId: number) {
    const updatedItems = cartItems
      .map(function (item) {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }

        return item;
      })
      .filter(function (item) {
        return item.quantity > 0;
      });

    saveCart(updatedItems);
  }

  // =====================================================
  // REMOVE
  // =====================================================

  function removeItem(productId: number) {
    const updatedItems = cartItems.filter(function (item) {
      return item.productId !== productId;
    });

    saveCart(updatedItems);
  }

  // =====================================================
  // CART PRODUCTS
  // =====================================================

  const cartProducts = cartItems
    .map(function (item) {
      const product = products.find(function (product) {
        return product.id === item.productId;
      });

      if (!product) {
        return null;
      }

      return {
        product,
        quantity: item.quantity,
      };
    })
    .filter(function (item): item is {
      product: (typeof products)[number];
      quantity: number;
    } {
      return item !== null;
    });

  // =====================================================
  // TOTAL
  // =====================================================

  const subtotal = cartProducts.reduce(function (total, item) {
    return total + item.product.price * item.quantity;
  }, 0);

  const shipping = cartProducts.length > 0 ? 30000 : 0;

  const total = subtotal + shipping;

  const formatPrice = function (price: number) {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  // =====================================================
  // EMPTY CART
  // =====================================================

  if (cartProducts.length === 0) {
    return (
      <section className="min-h-[60vh] bg-[#f7f1ed] px-5 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-2xl font-semibold text-[#2d261f]">GIỎ HÀNG</h1>

          <p className="mt-6 text-sm text-[#6f6257]">
            Giỏ hàng của bạn đang trống.
          </p>

          <Link
            to="/products"
            className="mt-8 inline-block bg-[#3b2f25] px-7 py-3 text-sm text-white transition hover:bg-[#594638]"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </section>
    );
  }

  // =====================================================
  // CART PAGE
  // =====================================================

  return (
    <section className="bg-[#f7f1ed] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* TITLE */}
        <h1 className="mb-10 text-2xl font-semibold text-[#2d261f] md:text-3xl">
          GIỎ HÀNG
        </h1>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* =================================================
              CART ITEMS
          ================================================== */}

          <div>
            {cartProducts.map(function ({ product, quantity }) {
              return (
                <article
                  key={product.id}
                  className="flex gap-4 border-b border-[#ddd5cd] py-5"
                >
                  {/* IMAGE */}

                  <Link
                    to={`/products/${product.id}`}
                    className="h-28 w-28 shrink-0 overflow-hidden bg-[#eeeae5]"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-full w-full object-contain p-2"
                    />
                  </Link>

                  {/* INFO */}

                  <div className="flex min-w-0 flex-1 justify-between gap-5">
                    <div className="min-w-0">
                      <Link
                        to={`/products/${product.id}`}
                        className="font-medium text-[#2d261f] hover:underline"
                      >
                        {product.name}
                      </Link>

                      <p className="mt-2 text-sm text-[#6f6257]">
                        {formatPrice(product.price)} VNĐ
                      </p>

                      {/* QUANTITY */}

                      <div className="mt-4 flex w-fit border border-[#d8d0c8]">
                        <button
                          type="button"
                          onClick={function () {
                            decreaseQuantity(product.id);
                          }}
                          className="px-3 py-1 transition hover:bg-[#eeeae5]"
                        >
                          −
                        </button>

                        <span className="flex min-w-10 items-center justify-center border-x border-[#d8d0c8] px-3 py-1">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={function () {
                            increaseQuantity(product.id);
                          }}
                          className="px-3 py-1 transition hover:bg-[#eeeae5]"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={function () {
                        removeItem(product.id);
                      }}
                      className="shrink-0 text-sm text-[#806b56] transition hover:text-[#3b2f25]"
                    >
                      Xóa
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================== */}

          <aside className="h-fit bg-[#eeeae5] p-6">
            <h2 className="text-lg font-semibold text-[#2d261f]">
              TÓM TẮT ĐƠN HÀNG
            </h2>

            <div className="mt-6 space-y-4 text-sm text-[#3f3832]">
              {/* SUBTOTAL */}

              <div className="flex justify-between gap-5">
                <span>Tạm tính</span>

                <span>{formatPrice(subtotal)} VNĐ</span>
              </div>

              {/* SHIPPING */}

              <div className="flex justify-between gap-5">
                <span>Phí vận chuyển</span>

                <span>{formatPrice(shipping)} VNĐ</span>
              </div>

              {/* TOTAL */}

              <div className="border-t border-[#d4cbc2] pt-4">
                <div className="flex justify-between gap-5 font-semibold text-[#2d261f]">
                  <span>Tổng cộng</span>

                  <span>{formatPrice(total)} VNĐ</span>
                </div>
              </div>
            </div>

            {/* CHECKOUT */}

            <Link
              to="/checkout"
              className="mt-6 block bg-[#3b2f25] px-6 py-3 text-center text-sm text-white transition hover:bg-[#594638]"
            >
              Tiến hành thanh toán
            </Link>

            {/* CONTINUE SHOPPING */}

            <Link
              to="/products"
              className="mt-3 block border border-[#3b2f25] px-6 py-3 text-center text-sm text-[#3b2f25] transition hover:bg-[#3b2f25] hover:text-white"
            >
              Tiếp tục mua sắm
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Cart;
