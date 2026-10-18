import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { MouseEvent } from "react";

import type { Product } from "../../data/products";
import shoppingCart from "../../assets/shopping-cart.svg";
import {
  isProductFavorite,
  toggleProductFavorite,
} from "../../utils/favorites";

type CartItem = {
  productId: number;
  size?: string;
  quantity: number;
};

type ProductCardProps = {
  product: Product;
};

const CART_STORAGE_KEY = "nesta-cart";

function ProductCard({ product }: ProductCardProps) {
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

  // =====================================================
  // FAVORITE
  // =====================================================

  function handleToggleFavorite(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const nextFavorite = toggleProductFavorite(product.id);
    setIsFavorite(nextFavorite);
  }

  // =====================================================
  // ADD TO CART
  // =====================================================

  function addToCart() {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    let cartItems: CartItem[] = [];

    if (savedCart) {
      try {
        const parsed: unknown = JSON.parse(savedCart);

        if (Array.isArray(parsed)) {
          cartItems = parsed.filter(
            (item): item is CartItem =>
              typeof item === "object" &&
              item !== null &&
              "productId" in item &&
              typeof item.productId === "number" &&
              "quantity" in item &&
              typeof item.quantity === "number" &&
              Number.isFinite(item.quantity) &&
              item.quantity > 0 &&
              (!("size" in item) ||
                item.size === undefined ||
                typeof item.size === "string"),
          );
        }
      } catch {
        cartItems = [];
      }
    }

    // Nếu sản phẩm có nhiều size, dùng size đầu tiên làm mặc định.
    // Chỉ lưu label của size để tương thích với Cart và ProductDetail.
    const defaultSize = product.sizes?.[0]?.label;

    const existingItem = cartItems.find(
      (item) => item.productId === product.id && item.size === defaultSize,
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        productId: product.id,
        ...(defaultSize !== undefined ? { size: defaultSize } : {}),
        quantity: 1,
      });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));

    window.dispatchEvent(new Event("cartUpdated"));
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
          {/* Ảnh chính */}

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

          {/* Ảnh thay thế khi hover */}

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
            aria-label={`Thêm ${product.name} vào giỏ hàng`}
            className="
              flex h-[24px] shrink-0 cursor-pointer
              items-center justify-center gap-1
              rounded-[3px] bg-[#5a493d]
              px-2 text-[8px] font-medium leading-none
              text-white transition-colors
              hover:bg-[#3b2f25]
              sm:h-[25px] sm:px-2.5 sm:text-[9px]
            "
          >
            <span>Giỏ hàng</span>

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
