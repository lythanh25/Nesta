import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import ProductGrid from "../../components/product/ProductGrid";
import SectionTitle from "../../components/common/SectionTitle";
import { products } from "../../data/products";

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");

  // =====================================================
  // LẤY DANH SÁCH CATEGORY
  // =====================================================

  const categories = useMemo(function () {
    const uniqueCategories = Array.from(
      new Set(
        products.map(function (product) {
          return product.category;
        }),
      ),
    );

    return ["Tất cả", ...uniqueCategories];
  }, []);

  // =====================================================
  // CATEGORY HIỆN TẠI
  // =====================================================

  const currentCategory = categoryParam || "Tất cả";

  // =====================================================
  // LỌC SẢN PHẨM
  // =====================================================

  const filteredProducts = useMemo(
    function () {
      return products.filter(function (product) {
        // Không chọn category
        if (!categoryParam) {
          return true;
        }

        // Lọc theo category
        if (product.category !== categoryParam) {
          return false;
        }

        // Nếu có subcategory thì lọc tiếp
        if (subcategoryParam && product.subcategory !== subcategoryParam) {
          return false;
        }

        return true;
      });
    },
    [categoryParam, subcategoryParam],
  );

  // =====================================================
  // ĐỔI CATEGORY
  // =====================================================

  function handleCategoryChange(category: string) {
    if (category === "Tất cả") {
      setSearchParams({});
      return;
    }

    setSearchParams({
      category: category,
    });
  }

  // =====================================================
  // TIÊU ĐỀ
  // =====================================================

  let pageTitle = "TẤT CẢ SẢN PHẨM";

  if (subcategoryParam) {
    pageTitle = subcategoryParam.toUpperCase();
  } else if (categoryParam) {
    pageTitle = categoryParam.toUpperCase();
  }

  return (
    <section className="px-5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        {/* ===============================================
            TITLE
        =============================================== */}

        <SectionTitle>{pageTitle}</SectionTitle>

        {/* ===============================================
            BREADCRUMB / MÔ TẢ DANH MỤC
        =============================================== */}

        {(categoryParam || subcategoryParam) && (
          <div className="mb-8 text-center text-sm text-[#6f6257]">
            {subcategoryParam ? (
              <p>
                {categoryParam} / {subcategoryParam}
              </p>
            ) : (
              <p>Sản phẩm thuộc danh mục {categoryParam}</p>
            )}
          </div>
        )}

        {/* ===============================================
            CATEGORY FILTER
        =============================================== */}

        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {categories.map(function (item) {
            const active = currentCategory === item;

            return (
              <button
                key={item}
                type="button"
                onClick={function () {
                  handleCategoryChange(item);
                }}
                className={`border px-5 py-2 text-sm transition ${
                  active
                    ? "border-[#3B2F25] bg-[#3B2F25] text-white"
                    : "border-[#d8d0c8] text-[#3B2F25] hover:bg-[#3B2F25] hover:text-white"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* ===============================================
            RESULT INFO
        =============================================== */}

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[#6f6257]">
            {filteredProducts.length} sản phẩm
          </p>

          {subcategoryParam && (
            <button
              type="button"
              onClick={function () {
                setSearchParams({
                  category: categoryParam || "",
                });
              }}
              className="text-sm text-[#3B2F25] underline underline-offset-4"
            >
              Xem tất cả {categoryParam}
            </button>
          )}
        </div>

        {/* ===============================================
            PRODUCT LIST
        =============================================== */}

        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="py-20 text-center">
            <p className="text-[#6f6257]">Không tìm thấy sản phẩm phù hợp.</p>

            <button
              type="button"
              onClick={function () {
                setSearchParams({});
              }}
              className="mt-4 border border-[#3B2F25] bg-[#3B2F25] px-5 py-2 text-sm text-white transition hover:opacity-80"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default Products;
