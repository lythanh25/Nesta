import { Link } from "react-router-dom";
import { newProducts } from "../data/products";
import ProductCard from "./product/ProductCard";
import shoppingCart from "../assets/shopping-cart.svg";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-[#aaa19a] sm:w-30" />

      <h2
        className="
          text-[18px]
          font-semibold
          tracking-wide
          text-[#2d261f]
          sm:text-[32px]
        "
      >
        {children}
      </h2>

      <span className="h-px w-12 bg-[#aaa19a] sm:w-30" />
    </div>
  );
}

function NewProducts() {
  const mainProduct = newProducts[0];
  const otherProducts = newProducts.slice(1, 5);

  if (!mainProduct) return null;

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(
    mainProduct.price,
  );

  function addMainProductToCart() {
    const savedCart = localStorage.getItem("nesta-cart");

    let cartItems: {
      productId: number;
      quantity: number;
    }[] = [];

    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        cartItems = Array.isArray(parsed) ? parsed : [];
      } catch {
        cartItems = [];
      }
    }

    const existingItem = cartItems.find(
      (item) => item.productId === mainProduct.id,
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        productId: mainProduct.id,
        quantity: 1,
      });
    }

    localStorage.setItem("nesta-cart", JSON.stringify(cartItems));

    window.dispatchEvent(new Event("cartUpdated"));
  }

  return (
    <section className="bg-[#f7f1ed] px-5 pb-8 md:px-8 md:pb-10 ">
      <div className="mx-auto max-w-7xl">
        <SectionTitle>SẢN PHẨM MỚI</SectionTitle>

        {/* =========================================
            4 COLUMNS × 2 ROWS

            MAIN:
            2 columns × 2 rows

            SMALL:
            1 column × 1 row
        ========================================== */}
        <div
          className="
            grid
            grid-cols-2
            gap-2
            sm:grid-cols-4
            sm:grid-rows-2
            sm:gap-2
          "
        >
          {/* =========================================
              MAIN PRODUCT
          ========================================== */}
          <article
            className="
              group
              col-span-2
              row-span-2
              flex
              aspect-square
              min-w-0
              flex-col
              overflow-hidden
              rounded-[6px]
              border
              border-[#aaa39d]
              bg-white
            "
          >
            {/* MAIN IMAGE */}
            <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
              <Link
                to={`/products/${mainProduct.id}`}
                className="block h-full w-full"
              >
                <img
                  src={mainProduct.images[0]}
                  alt={mainProduct.name}
                  loading="lazy"
                  className="
                    block
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-300
                    group-hover:scale-[1.03]
                  "
                />
              </Link>

              {/* FAVORITE */}
              <button
                type="button"
                aria-label="Thêm vào yêu thích"
                className="
                  absolute
                  right-2.5
                  top-2.5
                  z-10
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  bg-white/85
                  text-[20px]
                  leading-none
                  text-[#5e554e]
                  transition-colors
                  hover:text-red-500
                  cursor-pointer
                "
              >
                ♡
              </button>
            </div>

            {/* MAIN INFORMATION */}
            <div
              className="
                flex
                h-[78px]
                shrink-0
                flex-col
                justify-between
                px-3
                py-2.5
                sm:h-[82px]
                sm:px-3.5
                sm:py-3
              "
            >
              {/* NAME */}
              <Link to={`/products/${mainProduct.id}`} className="min-w-0">
                <h3
                  className="
                    line-clamp-2
                    min-h-[30px]
                    text-[14px]
                    font-semibold
                    leading-[1.3]
                    text-[#2d261f]
                    sm:text-[16px]
                  "
                >
                  {mainProduct.name}
                </h3>
              </Link>

              {/* PRICE + CART */}
              <div className="flex items-center justify-between gap-2">
                <p
                  className="
                    min-w-0
                    truncate
                    text-[11px]
                    font-semibold
                    text-[#2d261f]
                    sm:text-[13px]
                  "
                >
                  {formattedPrice} VNĐ
                </p>

                <button
                  type="button"
                  onClick={addMainProductToCart}
                  className="
                    flex
                    h-[27px]
                    shrink-0
                    items-center
                    justify-center
                    gap-1.5
                    rounded-[3px]
                    bg-[#5a493d]
                    px-2.5
                    text-[9px]
                    font-medium
                    text-white
                    transition-colors
                    hover:bg-[#3b2f25]
                    cursor-pointer
                    sm:h-[29px]
                    sm:px-3
                    sm:text-[10px]
                  "
                >
                  <span>Giỏ hàng</span>

                  <img
                    src={shoppingCart}
                    alt=""
                    className="h-3 w-3 brightness-0 invert"
                  />
                </button>
              </div>
            </div>
          </article>

          {/* =========================================
              FOUR SMALL PRODUCTS
          ========================================== */}
          {otherProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default NewProducts;
