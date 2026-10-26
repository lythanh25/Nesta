import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ProductGrid from "../../components/product/ProductGrid";
import {
  getProductRooms,
  type Product,
  type ProductRoom,
} from "../../data/products";
import { getProducts, subscribeToProducts } from "../../utils/productStorage";

import Living from "../../assets/images/spaces/living-room.jpg";
import Bedroom from "../../assets/images/spaces/bedroom.jpg";
import Dining from "../../assets/images/spaces/dining-room.jpg";
import Office from "../../assets/images/spaces/office.jpg";

const spacePages = {
  "phong-khach": {
    name: "Phòng khách",
    title: "PHÒNG KHÁCH",
    image: Living,
    description:
      "Khám phá nội thất phòng khách tinh tế, kết hợp hài hòa giữa công năng và thẩm mỹ.",
  },
  "phong-ngu": {
    name: "Phòng ngủ",
    title: "PHÒNG NGỦ",
    image: Bedroom,
    description:
      "Tạo nên không gian nghỉ ngơi ấm áp, thư thái với những thiết kế nội thất tinh giản.",
  },
  "phong-an": {
    name: "Phòng ăn",
    title: "PHÒNG ĂN",
    image: Dining,
    description:
      "Hoàn thiện không gian sum họp với bàn ghế và nội thất phòng ăn thanh lịch.",
  },
  "phong-lam-viec": {
    name: "Phòng làm việc",
    title: "PHÒNG LÀM VIỆC",
    image: Office,
    description:
      "Khơi nguồn cảm hứng làm việc với những thiết kế tiện nghi và hiện đại.",
  },
};

const spaceOptions = [
  { label: "Tất cả", value: "" },
  { label: "Phòng khách", value: "phong-khach" },
  { label: "Phòng ngủ", value: "phong-ngu" },
  { label: "Phòng ăn", value: "phong-an" },
  { label: "Phòng làm việc", value: "phong-lam-viec" },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

/**
 * Tìm theo từ trong tên, danh mục và danh mục con.
 * Từ ngắn (1-2 ký tự) phải khớp nguyên từ: "tủ" không khớp "tượng".
 * Từ >= 3 ký tự có thể khớp đầu từ để hỗ trợ gợi ý khi đang gõ.
 */
function matchesKeyword(text: string, search: string): boolean {
  const words = normalizeText(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const searchWords = normalizeText(search)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  if (searchWords.length === 0) return false;

  return searchWords.every((searchWord) =>
    words.some(
      (word) =>
        word === searchWord ||
        (searchWord.length >= 3 && word.startsWith(searchWord)),
    ),
  );
}

function formatPriceInput(value: string): string {
  return value.replace(/\D/g, "");
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>(() => getProducts());

  useEffect(() => {
    const refreshProducts = () => {
      setProducts(getProducts());
    };

    const unsubscribe = subscribeToProducts(refreshProducts);

    return unsubscribe;
  }, []);

  // =========================================================
  // URL PARAMETERS
  // =========================================================

  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");
  const searchParam = searchParams.get("search") || "";
  // `space` là tên tham số thống nhất. Hỗ trợ URL cũ dùng `room`
  // để tránh làm hỏng liên kết đã được tạo từ phiên bản còn lại.
  const legacyRoomParam = searchParams.get("room") || "";
  const roomToSpace: Record<string, string> = {
    "Phòng khách": "phong-khach",
    "Phòng ngủ": "phong-ngu",
    "Phòng ăn": "phong-an",
    "Phòng làm việc": "phong-lam-viec",
    "phong-khach": "phong-khach",
    "phong-ngu": "phong-ngu",
    "phong-an": "phong-an",
    "phong-lam-viec": "phong-lam-viec",
  };
  const spaceParam =
    searchParams.get("space") || roomToSpace[legacyRoomParam] || "";

  const currentSpace = Object.prototype.hasOwnProperty.call(
    spacePages,
    spaceParam,
  )
    ? spacePages[spaceParam as keyof typeof spacePages]
    : undefined;

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
    // SPACE
    // =========================================================

    if (
      currentSpace &&
      !getProductRooms(product).includes(currentSpace.name as ProductRoom)
    ) {
      return false;
    }

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
      const searchableText = [
        product.name,
        product.category,
        product.subcategory,
      ]
        .filter(Boolean)
        .join(" ");

      if (!matchesKeyword(searchableText, normalizedSearch)) {
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
    Boolean(spaceParam) ||
    Boolean(legacyRoomParam) ||
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
    params.delete("room");

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

    if (spaceParam) {
      params.set("space", spaceParam);
    }

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
    const params = new URLSearchParams();

    if (spaceParam) {
      params.set("space", spaceParam);
    }

    setSearchParams(params);
  }

  // =========================================================
  // SHOW ALL PRODUCTS
  // =========================================================

  function handleShowAllProducts() {
    const params = new URLSearchParams();

    if (spaceParam) {
      params.set("space", spaceParam);
    }

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

    if (spaceParam) {
      params.set("space", spaceParam);
    }

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

  function handleSpaceChange(space: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("room");

    // Đổi không gian thì bỏ danh mục cũ
    params.delete("category");
    params.delete("subcategory");

    if (space) {
      params.set("space", space);
    } else {
      params.delete("space");
    }

    setSearchParams(params);
  }

  return (
    <>
      {/* BANNER KHÔNG GIAN - FULL CHIỀU NGANG */}
      {currentSpace && (
        <section className="w-full">
          <div className="relative h-[180px] w-full overflow-hidden sm:h-[220px] md:h-[275px]">
            <img
              src={currentSpace.image}
              alt={currentSpace.name}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />

            <div className="absolute inset-0 bg-black/35" />

            <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center text-white">
              <h1 className="font-serif text-2xl font-medium tracking-widest sm:text-3xl md:text-4xl">
                {currentSpace.title}
              </h1>

              <p className="mt-3 max-w-2xl text-xs leading-6 text-white/90 sm:text-sm">
                {currentSpace.description}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="px-5 pb-16 pt-10 md:pb-20 md:pt-12">
        <div className="mx-auto max-w-7xl">
          {/* =====================================================
              TITLE
          ====================================================== */}

          {!currentSpace && (
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
          )}

          {/* =====================================================
              SPACE SELECTOR
          ====================================================== */}
          <div className="mb-8 border-b border-[#DDD5CD] pb-6">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#756D66]">
              Khám phá theo không gian
            </p>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {spaceOptions.map(function (space) {
                const active = spaceParam === space.value;

                return (
                  <button
                    key={space.value || "all"}
                    type="button"
                    onClick={() => handleSpaceChange(space.value)}
                    aria-pressed={active}
                    className={`
              border px-4 py-2.5 text-xs font-medium
              transition-colors sm:px-6 sm:text-sm
              ${
                active
                  ? "border-[#3B2F25] bg-[#3B2F25] text-white"
                  : "border-[#D8D0C8] bg-white text-[#3B2F25] hover:border-[#3B2F25]"
              }
            `}
                  >
                    {space.label}
                  </button>
                );
              })}
            </div>
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
                    {!categoryParam && (
                      <span className="h-1.5 w-1.5 bg-white" />
                    )}
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
                    Không có sản phẩm nào phù hợp với bộ lọc hoặc từ khóa tìm
                    kiếm hiện tại.
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
    </>
  );
}

export default Products;
