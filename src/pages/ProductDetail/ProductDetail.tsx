import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Product3DViewer from "../../components/product/Product3DViewer";
import ProductGrid from "../../components/product/ProductGrid";
import { getProductById, products } from "../../data/products";
import {
  isProductFavorite,
  toggleProductFavorite,
} from "../../utils/favorites";

import type { Product } from "../../data/products";

const CART_STORAGE_KEY = "nesta-cart";

type CartItem = {
  productId: number;
  size?: string;
  quantity: number;
};

// =====================================================
// PRODUCT DETAIL
// =====================================================

function ProductDetail() {
  const { id } = useParams();

  const product = getProductById(Number(id));

  // ===================================================
  // KHÔNG TÌM THẤY SẢN PHẨM
  // ===================================================

  if (!product) {
    return (
      <section className="bg-[#f7f1ed] px-5 py-20">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-2xl font-semibold text-[#2d261f]">
            Không tìm thấy sản phẩm
          </h1>

          <p className="mt-3 text-sm text-[#806b56]">
            Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã được gỡ khỏi cửa
            hàng.
          </p>

          <Link
            to="/products"
            className="
              mt-6
              inline-block
              bg-[#3b2f25]
              px-6
              py-3
              text-sm
              text-white
              transition
              hover:bg-[#594638]
            "
          >
            Quay lại sản phẩm
          </Link>
        </div>
      </section>
    );
  }

  /*
   * Sau khi qua if trên, TypeScript biết chắc product
   * là Product.
   *
   * Toàn bộ Hooks nằm trong component con.
   */

  return <ProductDetailContent product={product} />;
}

// =====================================================
// PRODUCT DETAIL CONTENT
// =====================================================

type ProductDetailContentProps = {
  product: Product;
};

function ProductDetailContent({ product }: ProductDetailContentProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    undefined,
  );

  const [isFavorite, setIsFavorite] = useState(function () {
    return isProductFavorite(product.id);
  });

  const [show3D, setShow3D] = useState(false);

  // =====================================================
  // ĐỒNG BỘ FAVORITE
  // =====================================================

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

  // =====================================================
  // DATA
  // =====================================================

  const productImages = product.images;

  const safeSelectedImage =
    selectedImage >= 0 && selectedImage < productImages.length
      ? selectedImage
      : 0;

  const currentImage = productImages[safeSelectedImage];

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(product.price);

  // =====================================================
  // RELATED PRODUCTS
  // =====================================================

  const relatedProducts = products
    .filter(function (item) {
      return item.id !== product.id && item.category === product.category;
    })
    .slice(0, 4);

  // =====================================================
  // FAVORITE
  // =====================================================

  function handleToggleFavorite() {
    const nextFavorite = toggleProductFavorite(product.id);

    setIsFavorite(nextFavorite);
  }

  // =====================================================
  // PREVIOUS IMAGE
  // =====================================================

  function handlePreviousImage() {
    if (productImages.length <= 1) {
      return;
    }

    setSelectedImage(function (current) {
      if (current === 0) {
        return productImages.length - 1;
      }

      return current - 1;
    });
  }

  // =====================================================
  // NEXT IMAGE
  // =====================================================

  function handleNextImage() {
    if (productImages.length <= 1) {
      return;
    }

    setSelectedImage(function (current) {
      if (current === productImages.length - 1) {
        return 0;
      }

      return current + 1;
    });
  }

  // =====================================================
  // QUANTITY
  // =====================================================

  function decreaseQuantity() {
    setQuantity(function (current) {
      return Math.max(1, current - 1);
    });
  }

  function increaseQuantity() {
    setQuantity(function (current) {
      return current + 1;
    });
  }

  // =====================================================
  // ADD TO CART
  // =====================================================

  function addToCart() {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      window.alert("Vui lòng chọn kích thước sản phẩm.");
      return;
    }

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

    const existingItem = cartItems.find(function (item) {
      return item.productId === product.id && item.size === selectedSize;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cartItems.push({
        productId: product.id,
        size: selectedSize,
        quantity,
      });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));

    window.dispatchEvent(new Event("cartUpdated"));

    window.alert("Đã thêm sản phẩm vào giỏ hàng.");
  }

  // =====================================================
  // FORMAT SIZE
  // =====================================================

  function formatSize(size: {
    label: string;
    width: number;
    length: number;
    height: number;
  }) {
    return `${size.label} — ${size.width} × ${size.length} × ${size.height} cm`;
  }

  return (
    <section className="bg-[#f7f1ed] px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            BREADCRUMB
        ================================================= */}

        <div
          className="
          mb-8
          flex
          flex-wrap
          items-center
          gap-2
          text-xs
          text-[#806b56]
        "
        >
          <Link to="/" className="transition hover:text-[#3b2f25]">
            Trang chủ
          </Link>

          <span>/</span>

          <Link to="/products" className="transition hover:text-[#3b2f25]">
            Sản phẩm
          </Link>

          <span>/</span>

          <span className="text-[#3b2f25]">{product.name}</span>
        </div>

        {/* =================================================
            PRODUCT MAIN
        ================================================= */}

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* =================================================
              LEFT - IMAGES
          ================================================= */}

          <div>
            {/* MAIN IMAGE */}

            <div
              className="
              relative
              aspect-square
              overflow-hidden
              rounded-[6px]
              border
              border-[#aaa39d]
              bg-white
            "
            >
              <img
                src={currentImage}
                alt={product.name}
                className="
                  block
                  h-full
                  w-full
                  object-cover
                "
              />

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

              {/* PREVIOUS */}

              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousImage}
                  aria-label="Ảnh trước"
                  className="
                    absolute
                    left-4
                    top-1/2
                    flex
                    h-11
                    w-11
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    bg-white/90
                    text-2xl
                    text-[#3b2f25]
                    shadow-sm
                    transition
                    hover:bg-white
                  "
                >
                  ‹
                </button>
              )}

              {/* NEXT */}

              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Ảnh tiếp theo"
                  className="
                    absolute
                    right-4
                    top-1/2
                    flex
                    h-11
                    w-11
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    bg-white/90
                    text-2xl
                    text-[#3b2f25]
                    shadow-sm
                    transition
                    hover:bg-white
                  "
                >
                  ›
                </button>
              )}

              {/* IMAGE NUMBER */}

              {productImages.length > 1 && (
                <div
                  className="
                  absolute
                  bottom-4
                  left-1/2
                  -translate-x-1/2
                  rounded-full
                  bg-black/50
                  px-3
                  py-1.5
                  text-xs
                  text-white
                "
                >
                  {safeSelectedImage + 1} / {productImages.length}
                </div>
              )}
            </div>

            {/* THUMBNAILS */}

            {productImages.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {productImages.map(function (image, index) {
                  const isActive = safeSelectedImage === index;

                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={function () {
                        setSelectedImage(index);
                      }}
                      aria-label={`Chọn ảnh ${index + 1}`}
                      className={`
                        aspect-square
                        overflow-hidden
                        rounded-[4px]
                        bg-white
                        transition
                        ${
                          isActive
                            ? "border-2 border-[#3b2f25]"
                            : "border border-[#aaa39d] hover:border-[#3b2f25]"
                        }
                      `}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - ảnh ${index + 1}`}
                        className="
                          block
                          h-full
                          w-full
                          object-cover
                        "
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* =================================================
              RIGHT - INFORMATION
          ================================================= */}

          <div className="flex flex-col justify-center">
            {/* CATEGORY */}

            <p className="text-sm text-[#806b56]">
              {product.category}

              {product.subcategory && (
                <>
                  <span className="mx-2">/</span>
                  {product.subcategory}
                </>
              )}
            </p>

            {/* NAME */}

            <h1
              className="
              mt-3
              text-3xl
              font-semibold
              text-[#2d261f]
              md:text-4xl
            "
            >
              {product.name}
            </h1>

            {/* PRICE */}

            <p
              className="
              mt-5
              text-xl
              font-medium
              text-[#3b2f25]
            "
            >
              {formattedPrice} VNĐ
            </p>

            <div className="my-7 h-px bg-[#ded7d0]" />

            {/* DESCRIPTION */}

            <p
              className="
              text-sm
              leading-7
              text-[#6f6257]
            "
            >
              {product.description}
            </p>

            {/* SIZE */}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-7">
                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <label
                    className="
                      text-sm
                      font-medium
                      text-[#2d261f]
                    "
                  >
                    Kích thước
                  </label>

                  {selectedSize && (
                    <span
                      className="
                        text-sm
                        text-[#806b56]
                      "
                    >
                      {selectedSize}
                    </span>
                  )}
                </div>

                <div
                  className="
                    mt-3
                    grid
                    grid-cols-2
                    gap-3
                    sm:grid-cols-3
                  "
                >
                  {product.sizes.map(function (size) {
                    const isSelected = selectedSize === size.label;

                    return (
                      <button
                        key={size.label}
                        type="button"
                        onClick={function () {
                          setSelectedSize(size.label);
                        }}
                        className={`
                            border
                            px-3
                            py-3
                            text-left
                            text-sm
                            transition
                            ${
                              isSelected
                                ? "border-[#3b2f25] bg-[#3b2f25] text-white"
                                : "border-[#d8d0c8] bg-white text-[#3b2f25] hover:border-[#3b2f25]"
                            }
                          `}
                      >
                        <span
                          className="
                            block
                            font-medium
                          "
                        >
                          {size.label}
                        </span>

                        <span
                          className={`
                              mt-1
                              block
                              text-xs
                              ${isSelected ? "text-white/80" : "text-[#806b56]"}
                            `}
                        >
                          {formatSize(size)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUANTITY */}

            <div className="mt-7">
              <label
                className="
                text-sm
                font-medium
                text-[#2d261f]
              "
              >
                Số lượng
              </label>

              <div
                className="
                mt-3
                flex
                w-fit
                border
                border-[#d8d0c8]
                bg-white
              "
              >
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  aria-label="Giảm số lượng"
                  className="
                    px-4
                    py-2
                    transition
                    hover:bg-[#eeeae5]
                  "
                >
                  −
                </button>

                <span
                  className="
                  flex
                  min-w-12
                  items-center
                  justify-center
                  border-x
                  border-[#d8d0c8]
                  px-4
                  py-2
                  text-sm
                "
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  aria-label="Tăng số lượng"
                  className="
                    px-4
                    py-2
                    transition
                    hover:bg-[#eeeae5]
                  "
                >
                  +
                </button>
              </div>
            </div>

            {/* CART + FAVORITE */}

            <div className="mt-7 flex">
              <button
                type="button"
                onClick={addToCart}
                className="
                  flex-1
                  bg-[#3b2f25]
                  px-6
                  py-3
                  text-sm
                  text-white
                  transition
                  hover:bg-[#594638]
                "
              >
                Thêm vào giỏ hàng
              </button>
            </div>

            {/* 3D */}

            {product.model3D && (
              <button
                type="button"
                onClick={function () {
                  setShow3D(true);
                }}
                className="
                  mt-4
                  w-full
                  border
                  border-[#3b2f25]
                  px-6
                  py-3
                  text-sm
                  text-[#3b2f25]
                  transition
                  hover:bg-[#3b2f25]
                  hover:text-white
                "
              >
                Xem sản phẩm 3D
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            DETAIL INFORMATION
        ===================================================== */}

        <div
          className="
          mt-20
          border-t
          border-[#ded7d0]
          pt-12
        "
        >
          <div
            className="
            grid
            gap-12
            lg:grid-cols-3
          "
          >
            {/* MÔ TẢ CHI TIẾT */}

            <div className="lg:col-span-1">
              <h2
                className="
                text-xl
                font-semibold
                text-[#2d261f]
              "
              >
                Mô tả chi tiết
              </h2>

              <div
                className="
                mt-5
                space-y-4
                text-sm
                leading-7
                text-[#6f6257]
              "
              >
                <p>{product.detailDescription || product.description}</p>
              </div>
            </div>

            {/* THÔNG SỐ + ĐÁNH GIÁ */}

            <div className="lg:col-span-2">
              {/* THÔNG SỐ KỸ THUẬT */}

              <div>
                <h2
                  className="
                  text-xl
                  font-semibold
                  text-[#2d261f]
                "
                >
                  Thông số kỹ thuật
                </h2>

                {product.specifications &&
                Object.keys(product.specifications).length > 0 ? (
                  <div
                    className="
                    mt-5
                    overflow-hidden
                    border
                    border-[#ded7d0]
                    bg-white
                  "
                  >
                    {Object.entries(product.specifications).map(function ([
                      label,
                      value,
                    ]) {
                      return (
                        <div
                          key={label}
                          className="
                            grid
                            grid-cols-[130px_1fr]
                            border-b
                            border-[#ded7d0]
                            last:border-b-0
                            sm:grid-cols-[160px_1fr]
                          "
                        >
                          <div
                            className="
                            bg-[#eeeae5]
                            px-4
                            py-3
                            text-sm
                            font-medium
                            text-[#3b2f25]
                          "
                          >
                            {label}
                          </div>

                          <div
                            className="
                            px-4
                            py-3
                            text-sm
                            text-[#6f6257]
                          "
                          >
                            {value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p
                    className="
                    mt-5
                    text-sm
                    text-[#806b56]
                  "
                  >
                    Thông số kỹ thuật đang được cập nhật.
                  </p>
                )}
              </div>

              {/* REVIEWS */}

              <div className="mt-12">
                <h2
                  className="
                  text-xl
                  font-semibold
                  text-[#2d261f]
                "
                >
                  Đánh giá về sản phẩm
                </h2>

                <div
                  className="
                  mt-5
                  border
                  border-[#ded7d0]
                  bg-white
                  p-6
                "
                >
                  <div
                    className="
                    flex
                    flex-col
                    gap-6
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                  >
                    <div>
                      <div
                        className="
                        text-3xl
                        font-semibold
                        text-[#2d261f]
                      "
                      >
                        0.0
                      </div>

                      <div
                        className="
                          mt-1
                          tracking-wide
                          text-[#806b56]
                        "
                        aria-label="0 trên 5 sao"
                      >
                        ☆☆☆☆☆
                      </div>

                      <p
                        className="
                        mt-2
                        text-sm
                        text-[#806b56]
                      "
                      >
                        Chưa có đánh giá
                      </p>
                    </div>

                    <button
                      type="button"
                      className="
                        border
                        border-[#3b2f25]
                        px-6
                        py-3
                        text-sm
                        text-[#3b2f25]
                        transition
                        hover:bg-[#3b2f25]
                        hover:text-white
                      "
                    >
                      Viết đánh giá
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            RELATED PRODUCTS
        ===================================================== */}

        {relatedProducts.length > 0 && (
          <div
            className="
            mt-20
            border-t
            border-[#ded7d0]
            pt-12
          "
          >
            <div className="mb-8">
              <p
                className="
                text-xs
                uppercase
                tracking-[0.2em]
                text-[#806b56]
              "
              >
                {product.category}
              </p>

              <h2
                className="
                mt-2
                text-xl
                font-semibold
                text-[#2d261f]
              "
              >
                Sản phẩm tương tự
              </h2>

              <p
                className="
                mt-2
                text-sm
                text-[#806b56]
              "
              >
                Những sản phẩm khác cùng danh mục{" "}
                {product.category.toLowerCase()}.
              </p>
            </div>

            <ProductGrid products={relatedProducts} />
          </div>
        )}

        {/* =====================================================
            3D VIEWER
        ===================================================== */}

        {show3D && product.model3D && (
          <Product3DViewer
            modelUrl={product.model3D}
            onClose={function () {
              setShow3D(false);
            }}
          />
        )}
      </div>
    </section>
  );
}

export default ProductDetail;
