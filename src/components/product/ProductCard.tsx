import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";

import type { Product } from "../../data/products";
import shoppingCart from "../../assets/shopping-cart.svg";

import {
  isProductFavorite,
  toggleProductFavorite,
} from "../../utils/favorites";

import { addCartItem } from "../../utils/cart";
import { getCustomerSession } from "../../utils/customerAuth";
import {
  getStock,
  isInStock,
  subscribeToStock,
  validateStock,
} from "../../utils/stock";

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  // =====================================================
  // FAVORITE
  // =====================================================

  const [isFavorite, setIsFavorite] = useState(() =>
    isProductFavorite(product.id),
  );

  useEffect(() => {
    function handleFavoritesUpdated() {
      setIsFavorite(isProductFavorite(product.id));
    }

    window.addEventListener("favoritesUpdated", handleFavoritesUpdated);

    return () => {
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdated);
    };
  }, [product.id]);

  function handleToggleFavorite(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const session = getCustomerSession();

    if (!session) {
      alert("Vui lòng đăng nhập để sử dụng danh sách yêu thích.");
      navigate("/login");
      return;
    }

    const nextFavorite = toggleProductFavorite(product.id);
    setIsFavorite(nextFavorite);
  }

  // =====================================================
  // PRODUCT DATA
  // =====================================================

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(product.price);

  const hasDiscount =
    product.originalPrice !== undefined &&
    product.originalPrice > product.price;

  const formattedOriginalPrice = hasDiscount
    ? new Intl.NumberFormat("vi-VN").format(product.originalPrice!)
    : null;

  const mainImage = product.images[0];
  const hoverImage = product.hoverImage;
  const hasSizes = Boolean(product.sizes?.length);

  // =====================================================
  // STOCK
  // =====================================================

  const [stockAvailable, setStockAvailable] = useState(() =>
    hasSizes
      ? product.sizes!.some((size) => getStock(product.id, size.label) > 0)
      : isInStock(product.id),
  );

  useEffect(() => {
    function refreshStock() {
      const available = product.sizes?.length
        ? product.sizes.some((size) => getStock(product.id, size.label) > 0)
        : isInStock(product.id);

      setStockAvailable(available);
    }

    refreshStock();

    return subscribeToStock(() => {
      refreshStock();
    });
  }, [product.id, product.sizes]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  function addToCart() {
    const session = getCustomerSession();

    if (!session) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    // Sản phẩm có size: yêu cầu người dùng chọn size ở trang chi tiết.
    if (hasSizes) {
      if (!stockAvailable) {
        alert("Sản phẩm hiện đã hết hàng.");
        return;
      }

      navigate(`/products/${product.id}`);
      return;
    }

    // Sản phẩm không có size: kiểm tra tồn kho trước khi thêm.
    const validation = validateStock(product.id, 1);

    if (!validation.valid) {
      alert(validation.message ?? "Sản phẩm hiện không đủ hàng.");
      return;
    }

    const success = addCartItem(product.id, undefined, 1);

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
    <article
      className="
        group
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
      {/* IMAGE */}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
        <Link
          to={`/products/${product.id}`}
          className="relative block h-full w-full overflow-hidden"
        >
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            className={`
              absolute inset-0 block h-full w-full object-cover
              transition-all duration-300
              ${
                hoverImage
                  ? "group-hover:scale-[1.03] group-hover:opacity-0"
                  : "group-hover:scale-[1.03]"
              }
            `}
          />

          {hoverImage && (
            <img
              src={hoverImage}
              alt={`${product.name} - ảnh góc khác`}
              loading="lazy"
              className="
                absolute inset-0 block h-full w-full
                scale-[1.02] object-cover opacity-0
                transition-all duration-300
                group-hover:scale-100 group-hover:opacity-100
              "
            />
          )}
        </Link>

        {/* FAVORITE */}

        <button
          type="button"
          aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          aria-pressed={isFavorite}
          onClick={handleToggleFavorite}
          className="
            absolute right-2 top-2 z-10
            flex h-7 w-7 cursor-pointer
            items-center justify-center
            rounded-full bg-white/85
            text-[18px] leading-none text-[#5e554e]
            transition-colors hover:text-red-500
          "
        >
          {isFavorite ? "♥" : "♡"}
        </button>

        {/* DISCOUNT */}

        {hasDiscount && (
          <span
            className="
              absolute left-2 top-2
              rounded-[3px] bg-[#5a493d]
              px-1.5 py-1 text-[9px]
              font-medium text-white
            "
          >
            Giảm giá
          </span>
        )}

        {/* OUT OF STOCK */}

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

      {/* PRODUCT INFORMATION */}

      <div
        className="
          flex h-[72px] shrink-0 flex-col justify-between
          px-2.5 py-2
          sm:h-[76px] sm:px-3 sm:py-2.5
        "
      >
        {/* PRODUCT NAME */}

        <Link to={`/products/${product.id}`} className="min-w-0">
          <h3
            className="
              line-clamp-2 min-h-[30px]
              text-[11px] font-medium leading-[1.35]
              text-[#2d261f]
              sm:text-[12px]
            "
          >
            {product.name}
          </h3>
        </Link>

        {/* PRICE + CART */}

        <div className="flex min-w-0 items-center justify-between gap-1.5">
          <div className="flex min-w-0 flex-col justify-center">
            <p
              className="
                truncate text-[9px] font-medium leading-tight
                text-[#5e554e] sm:text-[10px]
              "
            >
              {formattedPrice} VNĐ
            </p>

            {formattedOriginalPrice && (
              <p
                className="
                  truncate text-[8px] leading-tight
                  text-[#99918a] line-through
                  sm:text-[9px]
                "
              >
                {formattedOriginalPrice} VNĐ
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={addToCart}
            disabled={!stockAvailable}
            aria-label={
              !stockAvailable
                ? `${product.name} đã hết hàng`
                : hasSizes
                  ? `Chọn kích thước ${product.name}`
                  : `Thêm ${product.name} vào giỏ hàng`
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
  );
}

export default ProductCard;
