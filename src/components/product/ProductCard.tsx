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

  const [isFavorite, setIsFavorite] = useState(function () {
    return isProductFavorite(product.id);
  });

  /*
   * Chỉ SUBSCRIBE vào thay đổi từ bên ngoài.
   *
   * Không gọi setState trực tiếp trong thân effect.
   */

  useEffect(
    function () {
      function handleFavoritesUpdated() {
        setIsFavorite(isProductFavorite(product.id));
      }

      window.addEventListener("favoritesUpdated", handleFavoritesUpdated);

      return function () {
        window.removeEventListener("favoritesUpdated", handleFavoritesUpdated);
      };
    },
    [product.id],
  );

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(product.price);

  const mainImage = product.images[0];

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
          cartItems = parsed.filter(function (item): item is CartItem {
            return (
              typeof item === "object" &&
              item !== null &&
              "productId" in item &&
              typeof item.productId === "number" &&
              "quantity" in item &&
              typeof item.quantity === "number"
            );
          });
        }
      } catch {
        cartItems = [];
      }
    }

    /*
     * Nếu sản phẩm có nhiều size:
     * ProductCard dùng size đầu tiên làm mặc định.
     *
     * Lưu LABEL của size, không lưu cả object ProductSize.
     */

    const defaultSize = product.sizes?.[0]?.label;

    const existingItem = cartItems.find(function (item) {
      return item.productId === product.id && item.size === defaultSize;
    });

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartItems.push({
        productId: product.id,
        size: defaultSize,
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
      {/* =================================================
          IMAGE
      ================================================== */}

      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
        <Link to={`/products/${product.id}`} className="block h-full w-full">
          <img
            src={mainImage}
            alt={product.name}
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
          aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
          aria-pressed={isFavorite}
          onClick={handleToggleFavorite}
          className="
            absolute
            right-2
            top-2
            z-10
            flex
            h-7
            w-7
            cursor-pointer
            items-center
            justify-center
            rounded-full
            bg-white/85
            text-[18px]
            leading-none
            text-[#5e554e]
            transition-colors
            hover:text-red-500
          "
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>

      {/* =================================================
          INFORMATION
      ================================================== */}

      <div
        className="
          flex
          h-[72px]
          shrink-0
          flex-col
          justify-between
          px-2.5
          py-2
          sm:h-[76px]
          sm:px-3
          sm:py-2.5
        "
      >
        {/* PRODUCT NAME */}

        <Link to={`/products/${product.id}`} className="min-w-0">
          <h3
            className="
              line-clamp-2
              min-h-[30px]
              text-[11px]
              font-medium
              leading-[1.35]
              text-[#2d261f]
              sm:text-[12px]
            "
          >
            {product.name}
          </h3>
        </Link>

        {/* PRICE + CART */}

        <div className="flex items-center justify-between gap-2">
          <p
            className="
              min-w-0
              truncate
              text-[9px]
              font-medium
              leading-none
              text-[#5e554e]
              sm:text-[10px]
            "
          >
            {formattedPrice} VNĐ
          </p>

          <button
            type="button"
            onClick={addToCart}
            className="
              flex
              h-[24px]
              shrink-0
              cursor-pointer
              items-center
              justify-center
              gap-1
              rounded-[3px]
              bg-[#5a493d]
              px-2
              text-[8px]
              font-medium
              leading-none
              text-white
              transition-colors
              hover:bg-[#3b2f25]
              sm:h-[25px]
              sm:px-2.5
              sm:text-[9px]
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