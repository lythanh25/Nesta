import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { newProducts } from "../data/products";
import ProductCard from "./product/ProductCard";
import shoppingCart from "../assets/shopping-cart.svg";

import { isProductFavorite, toggleProductFavorite } from "../utils/favorites";

import { addCartItem } from "../utils/cart";
import { getCustomerSession } from "../utils/customerAuth";

import {
  getStock,
  isInStock,
  subscribeToStock,
  validateStock,
} from "../utils/stock";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-[#aaa19a] sm:w-30" />

      <h2
        className="
          text-[18px] font-semibold tracking-wide text-[#2d261f]
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

  const hasSizes = Boolean(mainProduct?.sizes?.length);

  const [stockAvailable, setStockAvailable] = useState(() =>
    mainProduct
      ? mainProduct.sizes?.length
        ? mainProduct.sizes.some(
            (size) => getStock(mainProduct.id, size.label) > 0,
          )
        : isInStock(mainProduct.id)
      : false,
  );

  // =====================================================
  // FAVORITE
  // =====================================================

  useEffect(() => {
    if (!mainProduct) return;

    function updateFavorite() {
      setIsFavorite(isProductFavorite(mainProduct.id));
    }

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

  // =====================================================
  // STOCK
  // =====================================================

  useEffect(() => {
    if (!mainProduct) return;

    function refreshStock() {
      const available = mainProduct.sizes?.length
        ? mainProduct.sizes.some(
            (size) => getStock(mainProduct.id, size.label) > 0,
          )
        : isInStock(mainProduct.id);

      setStockAvailable(available);
    }

    refreshStock();

    return subscribeToStock(refreshStock);
  }, [mainProduct?.id, mainProduct?.sizes]);

  if (!mainProduct) return null;

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(
    mainProduct.price,
  );

  // =====================================================
  // TOGGLE FAVORITE
  // =====================================================

  function handleToggleFavorite() {
    if (!getCustomerSession()) {
      alert("Vui lòng đăng nhập để sử dụng danh sách yêu thích.");
      navigate("/login");
      return;
    }

    toggleProductFavorite(mainProduct.id);
    setIsFavorite(isProductFavorite(mainProduct.id));
  }

  // =====================================================
  // ADD TO CART
  // Đồng bộ cách xử lý với ProductCard
  // =====================================================

  function addMainProductToCart() {
    if (!getCustomerSession()) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    // Sản phẩm có size: chuyển đến trang chi tiết để chọn size.
    if (hasSizes) {
      if (!stockAvailable) {
        alert("Sản phẩm hiện đã hết hàng.");
        return;
      }

      navigate(`/products/${mainProduct.id}`);
      return;
    }

    // Sản phẩm không có size: kiểm tra tồn kho trước khi thêm.
    const validation = validateStock(mainProduct.id, 1);

    if (!validation.valid) {
      alert(validation.message ?? "Sản phẩm hiện không đủ hàng.");
      return;
    }

    const success = addCartItem(mainProduct.id, undefined, 1);

    if (!success) {
      alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      return;
    }

    alert("Đã thêm sản phẩm vào giỏ hàng!");
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="bg-[#f7f1ed] px-5 pb-8 md:px-8 md:pb-10">
      <div className="mx-auto max-w-7xl">
        <SectionTitle>SẢN PHẨM MỚI</SectionTitle>

        <div
          className="
            grid grid-cols-2 gap-2
            sm:grid-cols-4 sm:grid-rows-2 sm:gap-2
          "
        >
          {/* SẢN PHẨM CHÍNH */}

          <article
            className="
              group col-span-2 row-span-2
              flex aspect-square min-w-0 flex-col
              overflow-hidden rounded-[6px]
              border border-[#aaa39d] bg-white
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
                    block h-full w-full object-cover
                    transition-transform duration-300
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
                  absolute right-2 top-2 z-10
                  flex h-7 w-7 cursor-pointer
                  items-center justify-center
                  rounded-full bg-white/85
                  text-[18px] leading-none text-[#5e554e]
                  transition-colors hover:text-red-500
                  sm:right-2.5 sm:top-2.5 sm:h-8 sm:w-8
                "
              >
                <span className={isFavorite ? "text-red-500" : ""}>
                  {isFavorite ? "♥" : "♡"}
                </span>
              </button>

              {/* HẾT HÀNG */}

              {!stockAvailable && (
                <span
                  className="
                    absolute bottom-2 left-2
                    rounded-[3px] bg-black/70
                    px-2 py-1 text-[9px]
                    font-medium text-white
                  "
                >
                  Hết hàng
                </span>
              )}
            </div>

            {/* THÔNG TIN SẢN PHẨM */}

            <div
              className="
                flex h-[72px] shrink-0 flex-col justify-between
                px-2.5 py-2
                sm:h-[76px] sm:px-3 sm:py-2.5
              "
            >
              <Link to={`/products/${mainProduct.id}`} className="min-w-0">
                <h3
                  className="
                    line-clamp-2 min-h-[30px]
                    text-[11px] font-medium leading-[1.35]
                    text-[#2d261f]
                    sm:text-[12px]
                  "
                >
                  {mainProduct.name}
                </h3>
              </Link>

              {/* GIÁ VÀ NÚT GIỎ HÀNG */}

              <div className="flex min-w-0 items-center justify-between gap-1.5">
                <p
                  className="
                    min-w-0 truncate
                    text-[9px] font-medium leading-tight
                    text-[#5e554e]
                    sm:text-[10px]
                  "
                >
                  {formattedPrice} VNĐ
                </p>

                <button
                  type="button"
                  onClick={addMainProductToCart}
                  disabled={!stockAvailable}
                  aria-label={
                    !stockAvailable
                      ? `${mainProduct.name} đã hết hàng`
                      : hasSizes
                        ? `Chọn kích thước ${mainProduct.name}`
                        : `Thêm ${mainProduct.name} vào giỏ hàng`
                  }
                  className="
                    flex h-[24px] shrink-0 cursor-pointer
                    items-center justify-center gap-1
                    rounded-[3px] bg-[#5a493d]
                    px-2 text-[8px] font-medium leading-none
                    text-white transition-colors
                    hover:bg-[#3b2f25]
                    disabled:cursor-not-allowed disabled:opacity-50
                    sm:h-[25px] sm:px-2.5 sm:text-[9px]
                  "
                >
                  <span>{hasSizes ? "Chọn size" : "Giỏ hàng"}</span>

                  <img
                    src={shoppingCart}
                    alt=""
                    className="h-[11px] w-[11px] brightness-0 invert"
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
