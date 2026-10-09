import { useSearchParams } from "react-router-dom";

import ProductGrid from "../../components/product/ProductGrid";
import { products } from "../../data/products";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatPriceInput(value: string): string {
  return value.replace(/\D/g, "");
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  // =========================================================
  // URL PARAMETERS
  // =========================================================

  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");
  const searchParam = searchParams.get("search") || "";

  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");

  const saleParam = searchParams.get("sale") === "true";
  const inStockParam = searchParams.get("inStock") === "true";

  // =========================================================
  // PRICE VALUES
  // =========================================================

  const minPrice = minPriceParam || "";
  const maxPrice = maxPriceParam || "";

  // =========================================================
  // CATEGORY
  // =========================================================

  const categories = Array.from(
    new Set(
      products.map(function (product) {
        return product.category;
      }),
    ),
  );

  // =========================================================
  // SUBCATEGORY THEO CATEGORY
  // =========================================================

  const subcategories = categoryParam
    ? Array.from(
        new Set(
          products
            .filter(function (product) {
              return (
                normalizeText(product.category) === normalizeText(categoryParam)
              );
            })
            .map(function (product) {
              return product.subcategory;
            })
            .filter(Boolean),
        ),
      )
    : [];

  // =========================================================
  // CURRENT CATEGORY
  // =========================================================

  const currentCategory = categories.find(function (category) {
    return normalizeText(category) === normalizeText(categoryParam || "");
  });

  // =========================================================
  // CURRENT SUBCATEGORY
  // =========================================================

  const currentSubcategory = subcategories.find(function (subcategory) {
    return normalizeText(subcategory) === normalizeText(subcategoryParam || "");
  });

  // =========================================================
  // FILTER PRODUCTS
  // =========================================================

  const normalizedSearch = normalizeText(searchParam);

  const minPriceNumber = minPriceParam ? Number(minPriceParam) : null;

  const maxPriceNumber = maxPriceParam ? Number(maxPriceParam) : null;

  const filteredProducts = products.filter(function (product) {
    // =========================================================
    // CATEGORY
    // =========================================================

    if (
      categoryParam &&
      normalizeText(product.category) !== normalizeText(categoryParam)
    ) {
      return false;
    }

    // =========================================================
    // SUBCATEGORY
    // =========================================================

    if (
      subcategoryParam &&
      normalizeText(product.subcategory) !== normalizeText(subcategoryParam)
    ) {
      return false;
    }

    // =========================================================
    // SEARCH
    // =========================================================

    if (normalizedSearch) {
      const searchableText = normalizeText(
        [
          product.name,
          product.category,
          product.subcategory,
          product.description,
        ]
          .filter(Boolean)
          .join(" "),
      );

      if (!searchableText.includes(normalizedSearch)) {
        return false;
      }
    }

    // =========================================================
    // MIN PRICE
    // =========================================================

    if (
      minPriceNumber !== null &&
      !Number.isNaN(minPriceNumber) &&
      product.price < minPriceNumber
    ) {
      return false;
    }

    // =========================================================
    // MAX PRICE
    // =========================================================

    if (
      maxPriceNumber !== null &&
      !Number.isNaN(maxPriceNumber) &&
      product.price > maxPriceNumber
    ) {
      return false;
    }

    // =========================================================
    // SALE
    // =========================================================

    if (saleParam) {
      const isOnSale =
        product.originalPrice !== undefined &&
        product.originalPrice > product.price;

      if (!isOnSale) {
        return false;
      }
    }

    // =========================================================
    // IN STOCK
    // =========================================================

    if (inStockParam && product.inStock !== true) {
      return false;
    }

    return true;
  });

  // =========================================================
  // PAGE TITLE
  // =========================================================

  let pageTitle = "DANH MỤC";

  if (searchParam) {
    pageTitle = `TÌM KIẾM: ${searchParam}`;
  } else if (currentSubcategory) {
    pageTitle = currentSubcategory.toUpperCase();
  } else if (currentCategory) {
    pageTitle = currentCategory.toUpperCase();
  }

  // =========================================================
  // HAS FILTER
  // =========================================================

  const hasFilter =
    Boolean(categoryParam) ||
    Boolean(subcategoryParam) ||
    Boolean(searchParam) ||
    Boolean(minPriceParam) ||
    Boolean(maxPriceParam) ||
    saleParam ||
    inStockParam;

  // =========================================================
  // UPDATE PARAM HELPER
  // =========================================================

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(function ([key, value]) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    setSearchParams(params);
  }

  // =========================================================
  // CATEGORY
  // =========================================================

  function handleCategoryChange(category: string) {
    const params = new URLSearchParams();

    params.set("category", category);

    if (searchParam) {
      params.set("search", searchParam);
    }

    if (minPriceParam) {
      params.set("minPrice", minPriceParam);
    }

    if (maxPriceParam) {
      params.set("maxPrice", maxPriceParam);
    }

    if (saleParam) {
      params.set("sale", "true");
    }

    if (inStockParam) {
      params.set("inStock", "true");
    }

    setSearchParams(params);
  }

  // =========================================================
  // SUBCATEGORY
  // =========================================================

  function handleSubcategoryChange(subcategory: string) {
    updateParams({
      subcategory,
    });
  }

  // =========================================================
  // PRICE
  // =========================================================

  function handleMinPriceChange(value: string) {
    const cleanedValue = formatPriceInput(value);

    updateParams({
      minPrice: cleanedValue || null,
    });
  }

  function handleMaxPriceChange(value: string) {
    const cleanedValue = formatPriceInput(value);

    updateParams({
      maxPrice: cleanedValue || null,
    });
  }

  // =========================================================
  // SALE
  // =========================================================

  function handleSaleChange() {
    updateParams({
      sale: saleParam ? null : "true",
    });
  }

  // =========================================================
  // STOCK
  // =========================================================

  function handleStockChange() {
    updateParams({
      inStock: inStockParam ? null : "true",
    });
  }

  // =========================================================
  // CLEAR ALL
  // =========================================================

  function handleClearFilters() {
    setSearchParams({});
  }

  // =========================================================
  // SHOW ALL PRODUCTS
  // =========================================================

  function handleShowAllProducts() {
    const params = new URLSearchParams();

    if (searchParam) {
      params.set("search", searchParam);
    }

    setSearchParams(params);
  }

  // =========================================================
  // SHOW ALL PRODUCTS IN CATEGORY
  // =========================================================

  function handleShowAllCategoryProducts() {
    const params = new URLSearchParams();

    if (currentCategory) {
      params.set("category", currentCategory);
    }

    if (searchParam) {
      params.set("search", searchParam);
    }

    if (minPriceParam) {
      params.set("minPrice", minPriceParam);
    }

    if (maxPriceParam) {
      params.set("maxPrice", maxPriceParam);
    }

    if (saleParam) {
      params.set("sale", "true");
    }

    if (inStockParam) {
      params.set("inStock", "true");
    }

    setSearchParams(params);
  }

  return (
    <section className="px-5 pb-16 pt-10 md:pb-20 md:pt-12">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            TITLE
        ====================================================== */}

        <div className="mb-10">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px w-20 bg-[#3B2F25]/40 sm:block" />

            <h1 className="font-serif text-[30px] font-medium tracking-wide text-[#2D261F] md:text-[34px]">
              {pageTitle}
            </h1>

            <span className="hidden h-px w-20 bg-[#3B2F25]/40 sm:block" />
          </div>

          {searchParam && (
            <p className="mt-3 text-center text-sm text-[#756D66]">
              Kết quả tìm kiếm cho "{searchParam}"
            </p>
          )}
        </div>

        {/* =====================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
          {/* ===================================================
              SIDEBAR FILTER
          ==================================================== */}

          <aside className="h-fit border border-[#D8D0C8] bg-[#F8F5F2] p-5 lg:sticky lg:top-[90px]">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#3B2F25]">
                Bộ lọc
              </h2>

              {hasFilter && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] text-[#756D66] underline underline-offset-4 transition-colors hover:text-[#3B2F25]"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* =================================================
                DANH MỤC
            ================================================== */}

            <div className="border-b border-[#DDD5CD] pb-5">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F25]">
                Danh mục
              </p>

              <button
                type="button"
                onClick={handleShowAllProducts}
                className={`mb-3 flex w-full items-center gap-2 text-left text-sm transition-colors ${
                  !categoryParam
                    ? "font-semibold text-[#3B2F25]"
                    : "text-[#756D66] hover:text-[#3B2F25]"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                    !categoryParam
                      ? "border-[#3B2F25] bg-[#3B2F25]"
                      : "border-[#AAA098]"
                  }`}
                >
                  {!categoryParam && <span className="h-1.5 w-1.5 bg-white" />}
                </span>
                Tất cả sản phẩm
              </button>

              <div className="space-y-3">
                {categories.map(function (category) {
                  const active =
                    normalizeText(category) ===
                    normalizeText(categoryParam || "");

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={function () {
                        handleCategoryChange(category);
                      }}
                      className={`flex w-full items-center gap-2 text-left text-sm transition-colors ${
                        active
                          ? "font-semibold text-[#3B2F25]"
                          : "text-[#756D66] hover:text-[#3B2F25]"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                          active
                            ? "border-[#3B2F25] bg-[#3B2F25]"
                            : "border-[#AAA098]"
                        }`}
                      >
                        {active && <span className="h-1.5 w-1.5 bg-white" />}
                      </span>

                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                KHOẢNG GIÁ
            ================================================== */}

            <div className="border-b border-[#DDD5CD] py-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F25]">
                Khoảng giá
              </p>

              <div className="flex items-center gap-2">
                {/* Min */}
                <div className="relative min-w-0 flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minPrice ? formatPrice(Number(minPrice)) : ""}
                    onChange={function (event) {
                      handleMinPriceChange(event.target.value);
                    }}
                    placeholder="Từ"
                    className="h-9 w-full border border-[#CFC6BE] bg-white px-2 pr-8 text-xs text-[#3B2F25] outline-none transition-colors placeholder:text-[#A59C94] focus:border-[#3B2F25]"
                  />

                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#8A817A]">
                    đ
                  </span>
                </div>

                <span className="shrink-0 text-xs text-[#8A817A]">—</span>

                {/* Max */}
                <div className="relative min-w-0 flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maxPrice ? formatPrice(Number(maxPrice)) : ""}
                    onChange={function (event) {
                      handleMaxPriceChange(event.target.value);
                    }}
                    placeholder="Đến"
                    className="h-9 w-full border border-[#CFC6BE] bg-white px-2 pr-8 text-xs text-[#3B2F25] outline-none transition-colors placeholder:text-[#A59C94] focus:border-[#3B2F25]"
                  />

                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#8A817A]">
                    đ
                  </span>
                </div>
              </div>

              {/* Price preview */}
              {(minPrice || maxPrice) && (
                <p className="mt-3 text-[10px] leading-4 text-[#8A817A]">
                  {minPrice
                    ? `Từ ${formatPrice(Number(minPrice))}đ`
                    : "Không giới hạn giá thấp"}{" "}
                  {" - "}
                  {maxPrice
                    ? `${formatPrice(Number(maxPrice))}đ`
                    : "Không giới hạn giá cao"}
                </p>
              )}
            </div>

            {/* =================================================
                DỊCH VỤ VÀ KHUYẾN MÃI
            ================================================== */}

            <div className="border-b border-[#DDD5CD] py-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F25]">
                Dịch vụ và khuyến mãi
              </p>

              <div className="space-y-3">
                {/* Sale */}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#756D66] transition-colors hover:text-[#3B2F25]">
                  <input
                    type="checkbox"
                    checked={saleParam}
                    onChange={handleSaleChange}
                    className="h-4 w-4 cursor-pointer accent-[#3B2F25]"
                  />

                  <span>Đang giảm giá</span>
                </label>

                {/* Stock */}
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#756D66] transition-colors hover:text-[#3B2F25]">
                  <input
                    type="checkbox"
                    checked={inStockParam}
                    onChange={handleStockChange}
                    className="h-4 w-4 cursor-pointer accent-[#3B2F25]"
                  />

                  <span>Hàng có sẵn</span>
                </label>
              </div>
            </div>

            {/* =================================================
                PHÂN LOẠI
            ================================================== */}

            {categoryParam && subcategories.length > 0 && (
              <div className="pt-6">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F25]">
                  Phân loại
                </p>

                <div className="space-y-3">
                  {subcategories.map(function (subcategory) {
                    const active =
                      normalizeText(subcategory) ===
                      normalizeText(subcategoryParam || "");

                    return (
                      <button
                        key={subcategory}
                        type="button"
                        onClick={function () {
                          handleSubcategoryChange(active ? "" : subcategory);
                        }}
                        className={`flex w-full items-start gap-2 text-left text-xs leading-5 transition-colors ${
                          active
                            ? "font-semibold text-[#3B2F25]"
                            : "text-[#756D66] hover:text-[#3B2F25]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center border ${
                            active
                              ? "border-[#3B2F25] bg-[#3B2F25]"
                              : "border-[#AAA098]"
                          }`}
                        >
                          {active && <span className="h-1 w-1 bg-white" />}
                        </span>

                        <span>{subcategory}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* ===================================================
              PRODUCT AREA
          ==================================================== */}

          <div className="min-w-0">
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[#DDD5CD] pb-4">
              <p className="text-xs text-[#756D66]">
                {filteredProducts.length} sản phẩm
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {categoryParam && (
                  <span className="text-xs text-[#756D66]">
                    {currentCategory || categoryParam}
                  </span>
                )}

                {subcategoryParam && (
                  <>
                    <span className="text-xs text-[#B3AAA2]">/</span>

                    <span className="text-xs text-[#756D66]">
                      {currentSubcategory || subcategoryParam}
                    </span>

                    <button
                      type="button"
                      onClick={handleShowAllCategoryProducts}
                      className="text-xs text-[#3B2F25] underline underline-offset-4"
                    >
                      Xem tất cả
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* =================================================
                PRODUCT GRID
            ================================================== */}

            {filteredProducts.length > 0 ? (
              <ProductGrid products={filteredProducts} />
            ) : (
              <div className="flex min-h-[350px] flex-col items-center justify-center border border-dashed border-[#D8D0C8] px-5 text-center">
                <h2 className="font-serif text-xl text-[#3B2F25]">
                  Không tìm thấy sản phẩm
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-[#756D66]">
                  Không có sản phẩm nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm
                  hiện tại.
                </p>

                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-6 border border-[#3B2F25] bg-[#3B2F25] px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-80"
                >
                  Xem tất cả sản phẩm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Products;
