import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Product3DViewer from "../../components/product/Product3DViewer";
import { getProductById, products } from "../../data/products";
import ProductGrid from "../../components/product/ProductGrid";

function ProductDetail() {
  const { id } = useParams();

  // Mở / đóng viewer 3D
  const [show3D, setShow3D] = useState(false);

  // Ảnh đang chọn
  const [selectedImage, setSelectedImage] = useState(0);

  const product = getProductById(Number(id));

  // Không tìm thấy sản phẩm
  if (!product) {
    return (
      <section className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">
          Không tìm thấy sản phẩm
        </h1>

        <Link
          to="/products"
          className="mt-6 inline-block bg-[#3B2F25] px-6 py-3 text-sm text-white"
        >
          Quay lại sản phẩm
        </Link>
      </section>
    );
  }

  // Lưu tham chiếu sau khi đã kiểm tra product tồn tại
  const productImages = product.images;

  const formattedPrice = new Intl.NumberFormat("vi-VN").format(
    product.price
  );

  const relatedProducts = products
    .filter(function (item) {
      return item.id !== product.id;
    })
    .slice(0, 4);

  // Đảm bảo chỉ số ảnh luôn hợp lệ
  const safeSelectedImage =
    selectedImage >= 0 && selectedImage < productImages.length
      ? selectedImage
      : 0;

  const currentImage = productImages[safeSelectedImage];

  // Ảnh trước
  function handlePreviousImage() {
    setSelectedImage(function (current) {
      if (current === 0) {
        return productImages.length - 1;
      }

      return current - 1;
    });
  }

  // Ảnh tiếp theo
  function handleNextImage() {
    setSelectedImage(function (current) {
      if (current === productImages.length - 1) {
        return 0;
      }

      return current + 1;
    });
  }

  return (
    <section className="px-5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            SẢN PHẨM
        ===================================================== */}
        <div className="grid gap-10 md:grid-cols-2">
          {/* ===================================================
              HÌNH ẢNH
          =================================================== */}
          <div>
            {/* ẢNH LỚN */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#eeeae5]">
              <img
                src={currentImage}
                alt={product.name}
                className="h-[85%] w-[85%] object-contain"
              />

              {/* NÚT TRÁI */}
              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousImage}
                  aria-label="Ảnh trước"
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl font-light text-[#3B2F25] shadow-md transition hover:bg-white"
                >
                  ‹
                </button>
              )}

              {/* NÚT PHẢI */}
              {productImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Ảnh tiếp theo"
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-3xl font-light text-[#3B2F25] shadow-md transition hover:bg-white"
                >
                  ›
                </button>
              )}

              {/* SỐ ẢNH */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs text-white">
                  {safeSelectedImage + 1} / {productImages.length}
                </div>
              )}
            </div>

            {/* =================================================
                THUMBNAIL
            ================================================= */}
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
                    aria-label={`Xem ảnh ${index + 1}`}
                    className={`flex aspect-square items-center justify-center overflow-hidden bg-[#eeeae5] transition ${
                      isActive
                        ? "border-2 border-[#3B2F25]"
                        : "border border-transparent hover:border-[#d8d0c8]"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - góc ${index + 1}`}
                      className="h-full w-full object-contain p-2"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================================
              THÔNG TIN SẢN PHẨM
          =================================================== */}
          <div className="flex flex-col justify-center">
            <p className="text-sm text-[#806b56]">
              {product.category}
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-[#2d261f] md:text-4xl">
              {product.name}
            </h1>

            <p className="mt-5 text-xl text-[#3B2F25]">
              {formattedPrice} VNĐ
            </p>

            <div className="my-8 h-px bg-[#ded7d0]" />

            <p className="text-sm leading-7 text-[#6f6257]">
              {product.description}
            </p>

            {/* =================================================
                SỐ LƯỢNG
            ================================================= */}
            <div className="mt-8">
              <label
                htmlFor="quantity"
                className="text-sm font-medium"
              >
                Số lượng
              </label>

              <div className="mt-3 flex w-fit border border-[#d8d0c8]">
                <button
                  type="button"
                  className="px-4 py-2 transition hover:bg-[#eeeae5]"
                >
                  −
                </button>

                <span className="border-x border-[#d8d0c8] px-5 py-2">
                  1
                </span>

                <button
                  type="button"
                  className="px-4 py-2 transition hover:bg-[#eeeae5]"
                >
                  +
                </button>
              </div>
            </div>

            {/* =================================================
                GIỎ HÀNG
            ================================================= */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                className="flex-1 bg-[#3B2F25] px-6 py-3 text-sm text-white transition hover:bg-[#594638]"
              >
                Thêm vào giỏ hàng
              </button>

              <button
                type="button"
                className="border border-[#3B2F25] px-5 py-3 text-sm text-[#3B2F25] transition hover:bg-[#3B2F25] hover:text-white"
              >
                ♡
              </button>
            </div>

            {/* =================================================
                XEM 3D
            ================================================= */}
            {product.model3D && (
              <button
                type="button"
                onClick={function () {
                  setShow3D(true);
                }}
                className="mt-4 w-full border border-[#3B2F25] px-6 py-3 text-sm text-[#3B2F25] transition hover:bg-[#3B2F25] hover:text-white"
              >
                Xem sản phẩm 3D
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            MÔ TẢ
        ===================================================== */}
        <div className="mt-20">
          <h2 className="mb-6 text-xl font-semibold">
            Mô tả sản phẩm
          </h2>

          <p className="max-w-3xl text-sm leading-7 text-[#6f6257]">
            Sản phẩm được thiết kế với sự cân bằng giữa công năng,
            tính thẩm mỹ và trải nghiệm sử dụng. Đây là khu vực có thể
            mở rộng thêm thông tin chất liệu, kích thước và hướng dẫn
            bảo quản.
          </p>
        </div>

        {/* =====================================================
            SẢN PHẨM LIÊN QUAN
        ===================================================== */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-8 text-xl font-semibold">
              Sản phẩm liên quan
            </h2>

            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </div>

      {/* =======================================================
          VIEWER 3D
      ======================================================= */}
      {show3D && product.model3D && (
        <Product3DViewer
          modelUrl={product.model3D}
          onClose={function () {
            setShow3D(false);
          }}
        />
      )}
    </section>
  );
}

export default ProductDetail;