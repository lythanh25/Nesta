import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Product3DViewer from "../../components/product/Product3DViewer";
import ProductGrid from "../../components/product/ProductGrid";
import {
  getProductById,
  getSizePrice,
  getSizeOriginalPrice,
  products,
} from "../../data/products";
import {
  isProductFavorite,
  toggleProductFavorite,
} from "../../utils/favorites";
import { addCartItem } from "../../utils/cart";
import { getCustomerSession } from "../../utils/customerAuth";
import {
  addProductReview,
  canReviewProduct,
  getMyProductReview,
  getProductReviews,
  getReviewSummary,
  type ProductReview,
} from "../../utils/reviews";

import type { Product } from "../../data/products";

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

  return <ProductDetailContent key={product.id} product={product} />;
}

// =====================================================
// PRODUCT DETAIL CONTENT
// =====================================================

type ProductDetailContentProps = {
  product: Product;
};

function ProductDetailContent({ product }: ProductDetailContentProps) {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  const [quantity, setQuantity] = useState(1);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    undefined,
  );

  const [isFavorite, setIsFavorite] = useState(function () {
    return isProductFavorite(product.id);
  });

  const [show3D, setShow3D] = useState(false);

  const [reviews, setReviews] = useState<ProductReview[]>(() =>
    getProductReviews(product.id),
  );

  const [reviewSummary, setReviewSummary] = useState(() =>
    getReviewSummary(product.id),
  );

  const [myReview, setMyReview] = useState<ProductReview | undefined>(() =>
    getMyProductReview(product.id),
  );

  const [canWriteReview, setCanWriteReview] = useState(() =>
    canReviewProduct(product.id),
  );
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  const refreshReviews = useCallback(() => {
    setReviews(getProductReviews(product.id));
    setReviewSummary(getReviewSummary(product.id));
    setMyReview(getMyProductReview(product.id));
    setCanWriteReview(canReviewProduct(product.id));
  }, [product.id]);

  useEffect(() => {
    function handleReviewsUpdated() {
      setReviews(getProductReviews(product.id));
      setReviewSummary(getReviewSummary(product.id));
      setMyReview(getMyProductReview(product.id));
      setCanWriteReview(canReviewProduct(product.id));
    }

    function handleOrdersUpdated() {
      handleReviewsUpdated();
    }

    function handleAuthUpdated() {
      handleReviewsUpdated();
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === null ||
        event.key === "nesta-reviews" ||
        event.key?.startsWith("nesta-orders:") ||
        event.key === "customer-session"
      ) {
        handleReviewsUpdated();
      }
    }

    window.addEventListener("reviewsUpdated", handleReviewsUpdated);
    window.addEventListener("ordersUpdated", handleOrdersUpdated);
    window.addEventListener("customerAuthUpdated", handleAuthUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("reviewsUpdated", handleReviewsUpdated);
      window.removeEventListener("ordersUpdated", handleOrdersUpdated);
      window.removeEventListener("customerAuthUpdated", handleAuthUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [product.id]);

  function handleSubmitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    try {
      addProductReview(product.id, reviewRating, reviewComment);
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
      setReviewSuccess("Đánh giá của bạn đã được gửi thành công.");
      refreshReviews();
    } catch (error) {
      setReviewError(
        error instanceof Error
          ? error.message
          : "Không thể gửi đánh giá. Vui lòng thử lại.",
      );
    }
  }

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

  // Giá hiển thị được tính theo kích thước đang chọn.
  const selectedSizeOption =
    product.sizes?.find(function (size) {
      return size.label === selectedSize;
    }) ?? product.sizes?.[0];

  const currentPrice = getSizePrice(product, selectedSizeOption);
  const originalPrice = getSizeOriginalPrice(product, selectedSizeOption);
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(currentPrice);
  const formattedOriginalPrice =
    originalPrice !== undefined
      ? new Intl.NumberFormat("vi-VN").format(originalPrice)
      : undefined;
  const hasDiscount =
    originalPrice !== undefined && originalPrice > currentPrice;

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
    // Kiểm tra kích thước trước khi thêm sản phẩm.
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      window.alert("Vui lòng chọn kích thước sản phẩm.");
      return;
    }

    // Chỉ cho phép thêm vào giỏ hàng khi đã đăng nhập.
    const session = getCustomerSession();

    if (!session) {
      window.alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      navigate("/login");
      return;
    }

    // Lưu sản phẩm vào giỏ hàng riêng của tài khoản hiện tại.
    const success = addCartItem(product.id, selectedSize, quantity);

    if (!success) {
      window.alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      return;
    }

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

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <p className="text-xl font-medium text-[#3b2f25]">
                {formattedPrice} VNĐ
              </p>

              {hasDiscount && formattedOriginalPrice && (
                <p className="text-sm text-[#8c8178] line-through">
                  {formattedOriginalPrice} VNĐ
                </p>
              )}
            </div>

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
                        aria-pressed={isSelected}
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

                        <span
                          className={`
                            mt-2
                            block
                            text-sm
                            font-medium
                            ${isSelected ? "text-white" : "text-[#3b2f25]"}
                          `}
                        >
                          {new Intl.NumberFormat("vi-VN").format(
                            getSizePrice(product, size),
                          )}{" "}
                          VNĐ
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
                <h2 className="text-xl font-semibold text-[#2d261f]">
                  Đánh giá về sản phẩm
                </h2>

                <div className="mt-5 border border-[#ded7d0] bg-white p-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-3xl font-semibold text-[#2d261f]">
                        {reviewSummary.average.toFixed(1)}
                      </div>

                      <div
                        className="mt-1 tracking-wide text-[#b18a45]"
                        aria-label={`${reviewSummary.average.toFixed(1)} trên 5 sao`}
                      >
                        {"★".repeat(Math.round(reviewSummary.average))}
                        {"☆".repeat(5 - Math.round(reviewSummary.average))}
                      </div>

                      <p className="mt-2 text-sm text-[#806b56]">
                        {reviewSummary.count > 0
                          ? `${reviewSummary.count} đánh giá`
                          : "Chưa có đánh giá"}
                      </p>
                    </div>

                    {canWriteReview && !myReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowReviewForm((current) => !current);
                          setReviewError("");
                          setReviewSuccess("");
                        }}
                        className="border border-[#3b2f25] px-6 py-3 text-sm text-[#3b2f25] transition hover:bg-[#3b2f25] hover:text-white"
                      >
                        {showReviewForm ? "Đóng biểu mẫu" : "Viết đánh giá"}
                      </button>
                    )}
                  </div>

                  {!getCustomerSession() && (
                    <p className="mt-5 text-sm leading-6 text-[#806b56]">
                      Vui lòng{" "}
                      <Link
                        to="/login"
                        className="font-medium underline underline-offset-4 hover:text-[#3b2f25]"
                      >
                        đăng nhập
                      </Link>{" "}
                      để kiểm tra điều kiện viết đánh giá.
                    </p>
                  )}

                  {getCustomerSession() && !canWriteReview && !myReview && (
                    <p className="mt-5 text-sm leading-6 text-[#806b56]">
                      Bạn có thể viết đánh giá sau khi đơn hàng chứa sản phẩm
                      này được giao thành công.
                    </p>
                  )}

                  {myReview && (
                    <p className="mt-5 text-sm leading-6 text-[#806b56]">
                      Bạn đã đánh giá sản phẩm này. Cảm ơn bạn đã chia sẻ trải
                      nghiệm!
                    </p>
                  )}

                  {reviewSuccess && (
                    <p role="status" className="mt-4 text-sm text-green-700">
                      {reviewSuccess}
                    </p>
                  )}

                  {reviewError && (
                    <p role="alert" className="mt-4 text-sm text-red-700">
                      {reviewError}
                    </p>
                  )}

                  {showReviewForm && canWriteReview && !myReview && (
                    <form
                      onSubmit={handleSubmitReview}
                      className="mt-6 border-t border-[#ded7d0] pt-6"
                    >
                      <label className="block text-sm font-medium text-[#2d261f]">
                        Mức độ hài lòng
                      </label>

                      <div
                        className="mt-2 flex gap-2"
                        role="group"
                        aria-label="Chọn số sao"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            aria-label={`${star} sao`}
                            aria-pressed={reviewRating === star}
                            className={`text-2xl transition ${
                              star <= reviewRating
                                ? "text-[#b18a45]"
                                : "text-[#cfc5bc]"
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      <label
                        htmlFor="product-review-comment"
                        className="mt-5 block text-sm font-medium text-[#2d261f]"
                      >
                        Nội dung đánh giá
                      </label>

                      <textarea
                        id="product-review-comment"
                        required
                        minLength={3}
                        maxLength={1000}
                        rows={4}
                        value={reviewComment}
                        onChange={(event) =>
                          setReviewComment(event.target.value)
                        }
                        placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                        className="mt-2 w-full resize-y border border-[#d8d0c8] bg-white px-3 py-3 text-sm text-[#2d261f] outline-none transition placeholder:text-[#a59a91] focus:border-[#3b2f25]"
                      />

                      <button
                        type="submit"
                        className="mt-4 bg-[#3b2f25] px-6 py-3 text-sm text-white transition hover:bg-[#594638]"
                      >
                        Gửi đánh giá
                      </button>
                    </form>
                  )}
                </div>

                <div className="mt-5 space-y-4">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="border border-[#ded7d0] bg-white p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#2d261f]">
                            {review.customerName}
                          </p>
                          <p className="mt-1 text-xs text-[#806b56]">
                            {new Date(review.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>

                        <span
                          className="tracking-wide text-[#b18a45]"
                          aria-label={`${review.rating} trên 5 sao`}
                        >
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </span>
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#6f6257]">
                        {review.comment}
                      </p>
                    </article>
                  ))}

                  {reviews.length === 0 && (
                    <p className="py-4 text-sm text-[#806b56]">
                      Sản phẩm chưa có đánh giá nào.
                    </p>
                  )}
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
