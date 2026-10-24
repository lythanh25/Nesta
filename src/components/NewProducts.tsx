import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { newProducts } from "../data/products";
import ProductCard from "./product/ProductCard";
import shoppingCart from "../assets/shopping-cart.svg";

import { isProductFavorite, toggleProductFavorite } from "../utils/favorites";
import { addCartItem } from "../utils/cart";
import { getCustomerSession } from "../utils/customerAuth";

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
  const navigate = useNavigate();
  const mainProduct = newProducts[0];
  const otherProducts = newProducts.slice(1, 5);

  const [isFavorite, setIsFavorite] = useState(() =>
    mainProduct ? isProductFavorite(mainProduct.id) : false,
  );

  useEffect(() => {
    if (!mainProduct) return;

    const updateFavorite = () => {
      setIsFavorite(isProductFavorite(mainProduct.id));
    };

    updateFavorite();

    window.addEventListener("favoritesUpdated", updateFavorite);
    window.addEventListener("customerAuthUpdated", updateFavorite);
    window.addEventListener("storage", updateFavorite);

    return () => {
      window.removeEventListener("favoritesUpdated", updateFavorite);
      window.removeEventListener("customerAuthUpdated", updateFavorite);
      window.removeEventListener("storage", updateFavorite);
    };
  }, [mainProduct?.id]);

  if (!mainProduct) return null;

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(
    mainProduct.price,
  );

  function handleToggleFavorite() {
    if (!getCustomerSession()) {
      alert("Vui lòng đăng nhập để sử dụng danh sách yêu thích.");
      navigate("/login");
      return;
    }

    toggleProductFavorite(mainProduct.id);
    setIsFavorite(isProductFavorite(mainProduct.id));
  }

  function addMainProductToCart() {
    if (!getCustomerSession()) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    // Sản phẩm có kích thước sẽ sử dụng kích thước mặc định đầu tiên.
    const defaultSize = mainProduct.sizes?.[0]?.label;

    const success = addCartItem(mainProduct.id, defaultSize, 1);

    if (!success) {
      alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      return;
    }

    alert("Đã thêm sản phẩm vào giỏ hàng.");
  }

  return (
    <section className="bg-[#f7f1ed] px-5 pb-8 md:px-8 md:pb-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle>SẢN PHẨM MỚI</SectionTitle>

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
          {/* SẢN PHẨM CHÍNH */}
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
            {/* ẢNH SẢN PHẨM */}
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

              {/* YÊU THÍCH */}
              <button
                type="button"
                aria-label={
                  isFavorite
                    ? "Xóa khỏi danh sách yêu thích"
                    : "Thêm vào danh sách yêu thích"
                }
                aria-pressed={isFavorite}
                onClick={handleToggleFavorite}
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
                <span className={isFavorite ? "text-red-500" : ""}>
                  {isFavorite ? "♥" : "♡"}
                </span>
              </button>
            </div>

            {/* THÔNG TIN SẢN PHẨM */}
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

              {/* GIÁ VÀ NÚT GIỎ HÀNG */}
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

          {/* BỐN SẢN PHẨM NHỎ */}
          {otherProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default NewProducts;
