import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import searchIcon from "../../assets/search.svg";
import cartIcon from "../../assets/shopping-cart.svg";
import userIcon from "../../assets/user-alt.svg";
import { products } from "../../data/products";

type CategoryMenu = {
  name: string;
  subcategories: string[];
};

/**
 * Chuẩn hóa chuỗi để so sánh category/subcategory.
 * Ví dụ:
 * "GHẾ"      -> "ghe"
 * "Ghế"      -> "ghe"
 * "GIƯỜNG"   -> "giuong"
 * "Giường"   -> "giuong"
 */
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

/**
 * Lấy category thực tế từ products.
 *
 * Quan trọng:
 * Header không tự tạo "GHẾ", "BÀN", ...
 * mà lấy giá trị thật đang có trong products.ts.
 *
 * Nhờ vậy URL luôn khớp với Products.tsx.
 */
const productMenu: CategoryMenu[] = Array.from(
  new Map(
    products.map(function (product) {
      return [
        normalizeText(product.category),
        {
          name: product.category,
          subcategories: [],
        },
      ];
    }),
  ).values(),
).map(function (category) {
  const subcategories = Array.from(
    new Set(
      products
        .filter(function (product) {
          return (
            normalizeText(product.category) === normalizeText(category.name)
          );
        })
        .map(function (product) {
          return product.subcategory;
        })
        .filter(Boolean),
    ),
  );

  return {
    name: category.name,
    subcategories,
  };
});

// Search

type SearchSuggestionsProps = {
  query: string;
  onSelect: () => void;
};

function SearchSuggestions({ query, onSelect }: SearchSuggestionsProps) {
  const navigate = useNavigate();
  const keyword = normalizeText(query);

  const results = useMemo(() => {
    if (!keyword) {
      return { categories: [], subcategories: [], products: [] };
    }

    // Chỉ tìm trên tên và danh mục; không tìm trong mô tả dài.
    const matchedProducts = products.filter((product) => {
      const searchableText = [
        product.name,
        product.category,
        product.subcategory,
      ]
        .filter(Boolean)
        .join(" ");

      return matchesKeyword(searchableText, keyword);
    });

    const matchedCategories = Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter((category) => matchesKeyword(category, keyword)),
      ),
    );

    const matchedSubcategories = Array.from(
      new Map(
        products
          .filter(
            (product) =>
              product.subcategory &&
              matchesKeyword(product.subcategory, keyword),
          )
          .map((product) => [
            `${product.category}|${product.subcategory}`,
            {
              category: product.category,
              subcategory: product.subcategory,
            },
          ]),
      ).values(),
    );

    return {
      categories: matchedCategories,
      subcategories: matchedSubcategories,
      products: matchedProducts.slice(0, 5),
    };
  }, [keyword]);

  function goToSearch() {
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    onSelect();
  }

  function goToCategory(category: string) {
    navigate(`/products?category=${encodeURIComponent(category)}`);
    onSelect();
  }

  function goToSubcategory(category: string, subcategory: string) {
    navigate(
      `/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`,
    );
    onSelect();
  }

  function goToProduct(productId: number) {
    navigate(`/products/${productId}`);
    onSelect();
  }

  const hasResults =
    results.categories.length > 0 ||
    results.subcategories.length > 0 ||
    results.products.length > 0;

  if (!keyword) return null;

  return (
    <div
      className="absolute left-0 right-0 top-full z-[100] mt-2
        max-h-[min(70vh,520px)] overflow-y-auto rounded-md
        border border-[#E5E0DA] bg-white text-[#2D261F]
        shadow-xl"
    >
      {!hasResults ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm font-medium">Không tìm thấy kết quả phù hợp</p>
          <p className="mt-1 text-xs text-[#756D66]">
            Thử tên sản phẩm hoặc danh mục khác nhé.
          </p>
        </div>
      ) : (
        <>
          {/* DANH MỤC */}
          {(results.categories.length > 0 ||
            results.subcategories.length > 0) && (
            <section className="p-3">
              <p
                className="mb-2 px-1 text-[11px] font-semibold
                uppercase tracking-wider text-[#8A7A6D]"
              >
                Danh mục phù hợp
              </p>

              <div className="space-y-1">
                {results.categories.map((category) => (
                  <button
                    key={`category-${category}`}
                    type="button"
                    onClick={() => goToCategory(category)}
                    className="flex w-full items-center justify-between
                      rounded px-2 py-2 text-left text-sm
                      transition-colors hover:bg-[#F7F5F2]"
                  >
                    <span>{category}</span>
                    <span className="text-xs text-[#8A7A6D]">Danh mục →</span>
                  </button>
                ))}

                {results.subcategories.map((item) => (
                  <button
                    key={`${item.category}-${item.subcategory}`}
                    type="button"
                    onClick={() =>
                      goToSubcategory(item.category, item.subcategory)
                    }
                    className="flex w-full items-center justify-between
                      rounded px-2 py-2 text-left text-sm
                      transition-colors hover:bg-[#F7F5F2]"
                  >
                    <span>{item.subcategory}</span>
                    <span className="ml-2 shrink-0 text-xs text-[#8A7A6D]">
                      {item.category}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* SẢN PHẨM */}
          {results.products.length > 0 && (
            <section className="border-t border-[#E5E0DA] p-3">
              <p
                className="mb-2 px-1 text-[11px] font-semibold
                uppercase tracking-wider text-[#8A7A6D]"
              >
                Sản phẩm gợi ý
              </p>

              <div className="space-y-1">
                {results.products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => goToProduct(product.id)}
                    className="flex w-full items-center gap-3
                      rounded-md p-2 text-left transition-colors
                      hover:bg-[#F7F5F2]"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-14 w-14 shrink-0 rounded-sm
                        bg-[#F7F5F2] object-cover"
                      loading="lazy"
                    />

                    <span className="min-w-0 flex-1">
                      <span
                        className="block line-clamp-2 text-sm
                        font-medium text-[#2D261F]"
                      >
                        {product.name}
                      </span>

                      <span className="mt-1 block text-xs text-[#756D66]">
                        {product.category}
                        {product.subcategory ? ` · ${product.subcategory}` : ""}
                      </span>

                      <span
                        className="mt-1 block text-sm font-semibold
                        text-[#5A493D]"
                      >
                        {product.price.toLocaleString("vi-VN")} ₫
                      </span>
                    </span>

                    <span className="shrink-0 text-[#8A7A6D]">→</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* XEM TẤT CẢ */}
          <button
            type="button"
            onClick={goToSearch}
            className="w-full border-t border-[#E5E0DA] px-4 py-3
              text-center text-sm font-medium text-[#5A493D]
              transition-colors hover:bg-[#F7F5F2]"
          >
            Xem tất cả kết quả cho “{query.trim()}” →
          </button>
        </>
      )}
    </div>
  );
}

function Header() {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  //Badge
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    function updateCartCount() {
      try {
        const savedCart = localStorage.getItem("nesta-cart");
        const cartItems: unknown = savedCart ? JSON.parse(savedCart) : [];

        if (!Array.isArray(cartItems)) {
          setCartCount(0);
          return;
        }

        // Đếm số productId khác nhau, không cộng quantity.
        const uniqueProducts = new Set<string>();

        cartItems.forEach((item) => {
          if (
            item &&
            typeof item === "object" &&
            "productId" in item &&
            typeof item.productId === "number"
          ) {
            const size =
              "size" in item && typeof item.size === "string" ? item.size : "";

            uniqueProducts.add(`${item.productId}-${size}`);
          }
        });

        setCartCount(uniqueProducts.size);
      } catch {
        setCartCount(0);
      }
    }

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  /**
   * Tính số lượng category.
   * Không bắt buộc nhưng giúp menu luôn ổn định.
   */
  const categories = useMemo(function () {
    return productMenu;
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  function handleSearch() {
    const keyword = searchValue.trim();

    if (!keyword) {
      navigate("/products");
      setIsMenuOpen(false);
      setIsProductOpen(false);
      return;
    }

    navigate(`/products?search=${encodeURIComponent(keyword)}`);

    setIsMenuOpen(false);
    setIsProductOpen(false);
    setOpenCategory(null);
  }

  // Đóng gợi ý khi bấm ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
      setIsSearchOpen(false);
    }

    if (event.key === "Escape") {
      setIsSearchOpen(false);
    }
  }

  // =========================================================
  // CATEGORY
  // =========================================================

  function handleCategoryToggle(categoryName: string) {
    setOpenCategory(function (current) {
      return current === categoryName ? null : categoryName;
    });
  }

  function closeDesktopProductMenu() {
    if (closeMenuTimeout.current !== null) {
      clearTimeout(closeMenuTimeout.current);
      closeMenuTimeout.current = null;
    }

    setIsProductOpen(false);
    setOpenCategory(null);
  }

  function closeMobileMenu() {
    setIsMenuOpen(false);
    setIsProductOpen(false);
    setOpenCategory(null);
  }

  // =========================================================
  // URL
  // =========================================================

  function getCategoryUrl(category: string) {
    return `/products?category=${encodeURIComponent(category)}`;
  }

  function getSubcategoryUrl(category: string, subcategory: string) {
    return `/products?category=${encodeURIComponent(
      category,
    )}&subcategory=${encodeURIComponent(subcategory)}`;
  }

  // Danh muc
  const closeMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleProductMouseEnter() {
    if (closeMenuTimeout.current !== null) {
      clearTimeout(closeMenuTimeout.current);
      closeMenuTimeout.current = null;
    }

    setIsProductOpen(true);
  }

  function handleProductMouseLeave() {
    if (closeMenuTimeout.current !== null) {
      clearTimeout(closeMenuTimeout.current);
    }

    closeMenuTimeout.current = setTimeout(() => {
      setIsProductOpen(false);
      setOpenCategory(null);
      closeMenuTimeout.current = null;
    }, 250);
  }

  function handleProductClick() {
    if (closeMenuTimeout.current !== null) {
      clearTimeout(closeMenuTimeout.current);
      closeMenuTimeout.current = null;
    }

    setIsProductOpen((current) => !current);
    setOpenCategory(null);
  }

  return (
    <header className="fixed left-0 top-0 z-50 w-full bg-[#3B2F25] text-white">
      {/* =========================================================
          DESKTOP HEADER
      ========================================================== */}
      <div className="mx-auto hidden h-[70px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 lg:grid">
        {/* =====================================================
            LOGO
        ====================================================== */}
        <Link
          to="/"
          className="justify-self-start shrink-0 font-serif text-xl tracking-wide text-white transition-opacity hover:opacity-80"
        >
          NESTA.COM
        </Link>

        {/* =====================================================
            MAIN NAVIGATION
        ====================================================== */}
        <nav className="flex h-full items-center gap-8">
          {/* Trang chủ */}
          <Link
            to="/"
            className="flex h-full items-center whitespace-nowrap text-sm font-medium transition-colors hover:text-white/70"
          >
            Trang chủ
          </Link>

          {/* =================================================
              DANH MỤC SẢN PHẨM
          ================================================== */}
          <div
            className="relative h-full"
            onMouseEnter={handleProductMouseEnter}
            onMouseLeave={handleProductMouseLeave}
          >
            <button
              type="button"
              onClick={handleProductClick}
              aria-expanded={isProductOpen}
              aria-haspopup="true"
              className="
                relative
                flex
                h-full
                items-center
                whitespace-nowrap
                py-2
                text-sm
                font-medium
                transition-colors
                hover:text-white/70
                after:absolute
                after:inset-x-0
                after:-bottom-1
                after:h-2
                after:content-['']
              "
            >
              Danh mục sản phẩm
              <svg
                className={`ml-2 h-3.5 w-3.5 transition-transform ${
                  isProductOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* MEGA MENU */}
            {isProductOpen && (
              <div
                className="
                  absolute
                  left-1/2
                  top-full
                  z-50
                  w-[900px]
                  max-w-[calc(100vw-32px)]
                  -translate-x-1/2
                  pt-2
                "
              >
                {/* Vùng đệm phía trên giúp chuột di chuyển dễ hơn */}
                <div
                  className="
                    border-t
                    border-[#E5E0DA]
                    bg-white
                    text-[#2D261F]
                    shadow-xl
                  "
                >
                  <div className="grid grid-cols-5 gap-x-10 gap-y-8 p-8">
                    {categories.map(function (category) {
                      return (
                        <div key={category.name}>
                          {/* Category */}
                          <Link
                            to={getCategoryUrl(category.name)}
                            onClick={closeDesktopProductMenu}
                            className="
                              mb-3
                              block
                              text-sm
                              font-semibold
                              uppercase
                              tracking-wide
                              transition-colors
                              hover:text-[#6E5A47]
                            "
                          >
                            {category.name}
                          </Link>

                          {/* Subcategory */}
                          {category.subcategories.length > 0 && (
                            <ul className="space-y-2">
                              {category.subcategories.map(
                                function (subcategory) {
                                  return (
                                    <li key={subcategory}>
                                      <Link
                                        to={getSubcategoryUrl(
                                          category.name,
                                          subcategory,
                                        )}
                                        onClick={closeDesktopProductMenu}
                                        className="
                                          block
                                          text-xs
                                          text-[#756D66]
                                          transition-colors
                                          hover:text-[#2D261F]
                                        "
                                      >
                                        {subcategory}
                                      </Link>
                                    </li>
                                  );
                                },
                              )}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Xem tất cả */}
                  <div className="border-t border-[#E5E0DA] px-8 py-4">
                    <Link
                      to="/products"
                      onClick={closeDesktopProductMenu}
                      className="
                        inline-flex
                        items-center
                        text-sm
                        font-medium
                        transition-colors
                        hover:text-[#6E5A47]
                      "
                    >
                      Xem tất cả sản phẩm
                      <span className="ml-2">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Về chúng tôi */}
          <Link
            to="/about"
            className="flex h-full items-center whitespace-nowrap text-sm font-medium transition-colors hover:text-white/70"
          >
            Về chúng tôi
          </Link>
        </nav>

        {/* =====================================================
            RIGHT ACTIONS
        ====================================================== */}
        <div className="flex items-center justify-self-end gap-3">
          {/* Search desktop */}
          <div
            ref={searchContainerRef}
            className="relative flex h-9 w-[230px] items-center
            overflow-visible rounded border border-white/50 bg-white/10"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(event) => {
                setSearchValue(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm kiếm sản phẩm..."
              className="min-w-0 flex-1 bg-transparent px-3 text-xs
      text-white outline-none placeholder:text-white/60"
              aria-label="Tìm kiếm sản phẩm"
              aria-expanded={isSearchOpen && Boolean(searchValue.trim())}
            />

            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  setIsSearchOpen(false);
                }}
                className="flex h-full w-6 shrink-0 items-center
        justify-center text-white/70 hover:text-white"
                aria-label="Xóa nội dung tìm kiếm"
              >
                ×
              </button>
            )}

            <button
              type="button"
              onClick={handleSearch}
              className="flex h-full w-9 shrink-0 items-center
      justify-center transition-colors hover:bg-white/10"
              aria-label="Tìm kiếm"
            >
              <img
                src={searchIcon}
                alt=""
                className="h-4 w-4 brightness-0 invert"
              />
            </button>

            {isSearchOpen && searchValue.trim() && (
              <SearchSuggestions
                query={searchValue}
                onSelect={() => setIsSearchOpen(false)}
              />
            )}
          </div>

          {/* Cart desktop */}
          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center
    transition-opacity hover:opacity-80"
            aria-label={`Giỏ hàng, ${cartCount} sản phẩm khác nhau`}
          >
            <img
              src={cartIcon}
              alt=""
              className="h-5 w-5 brightness-0 invert"
            />

            {cartCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5
        flex h-[18px] min-w-[18px] items-center
        justify-center rounded-full bg-red-600
        px-1 text-[10px] font-bold leading-none text-white
        ring-1 ring-[#3B2F25]"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link
            to="/profile"
            className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-70"
            aria-label="Tài khoản"
          >
            <img
              src={userIcon}
              alt=""
              className="h-5 w-5 brightness-0 invert"
            />
          </Link>
        </div>
      </div>

      {/* =========================================================
          MOBILE HEADER
      ========================================================== */}
      <div className="flex h-[70px] items-center px-4 lg:hidden">
        {/* Hamburger */}
        <button
          type="button"
          onClick={function () {
            setIsMenuOpen(function (current) {
              return !current;
            });
          }}
          className="flex h-10 w-10 items-center justify-start"
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        {/* Logo */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="absolute left-1/2 -translate-x-1/2 font-serif text-lg tracking-wide"
        >
          NESTA.COM
        </Link>

        {/* Mobile Actions */}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={function () {
              setIsMenuOpen(true);
              setIsProductOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="Tìm kiếm"
          >
            <img
              src={searchIcon}
              alt=""
              className="h-5 w-5 brightness-0 invert"
            />
          </button>

          {/* Cart mobile */}
          <Link
            to="/cart"
            onClick={closeMobileMenu}
            className="relative flex h-10 w-10 items-center justify-center"
            aria-label={`Giỏ hàng, ${cartCount} sản phẩm khác nhau`}
          >
            <img
              src={cartIcon}
              alt=""
              className="h-5 w-5 brightness-0 invert"
            />

            {cartCount > 0 && (
              <span
                className="absolute right-0.5 top-0.5
        flex h-[18px] min-w-[18px] items-center
        justify-center rounded-full bg-red-600
        px-1 text-[10px] font-bold leading-none text-white
        ring-1 ring-[#3B2F25]"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* =========================================================
          MOBILE MENU
      ========================================================== */}
      {isMenuOpen && (
        <div className="absolute left-0 top-[70px] w-full border-t border-white/10 bg-[#3B2F25] lg:hidden">
          <div className="max-h-[calc(100vh-70px)] overflow-y-auto px-5 pb-8">
            {/* Search mobile */}
            <div className="border-b border-white/10 py-5">
              <div
                ref={searchContainerRef}
                className="relative flex h-10 items-center
      rounded border border-white/40 bg-white/10"
              >
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm
        text-white outline-none placeholder:text-white/60"
                  aria-label="Tìm kiếm sản phẩm"
                />

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex h-full w-11 shrink-0 items-center justify-center"
                  aria-label="Tìm kiếm"
                >
                  <img
                    src={searchIcon}
                    alt=""
                    className="h-4 w-4 brightness-0 invert"
                  />
                </button>

                {isSearchOpen && searchValue.trim() && (
                  <SearchSuggestions
                    query={searchValue}
                    onSelect={() => {
                      setIsSearchOpen(false);
                      closeMobileMenu();
                    }}
                  />
                )}
              </div>
            </div>

            {/* Trang chủ */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="block border-b border-white/10 py-4 text-sm font-medium"
            >
              Trang chủ
            </Link>

            {/* =================================================
                DANH MỤC
            ================================================== */}
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={function () {
                  setIsProductOpen(function (current) {
                    return !current;
                  });
                }}
                className="flex w-full items-center justify-between py-4 text-left text-sm font-medium"
              >
                <span>Danh mục sản phẩm</span>

                <svg
                  className={`h-4 w-4 transition-transform ${
                    isProductOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isProductOpen && (
                <div className="pb-3">
                  {categories.map(function (category) {
                    return (
                      <div
                        key={category.name}
                        className="border-t border-white/5"
                      >
                        {category.subcategories.length > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={function () {
                                handleCategoryToggle(category.name);
                              }}
                              className="flex w-full items-center justify-between py-3 pl-3 text-left text-sm text-white/90"
                            >
                              <span>{category.name}</span>

                              <svg
                                className={`mr-1 h-3.5 w-3.5 transition-transform ${
                                  openCategory === category.name
                                    ? "rotate-180"
                                    : ""
                                }`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>

                            {openCategory === category.name && (
                              <div className="pb-2 pl-6">
                                <Link
                                  to={getCategoryUrl(category.name)}
                                  onClick={closeMobileMenu}
                                  className="block py-2 text-xs text-white/60"
                                >
                                  Tất cả {category.name.toLowerCase()}
                                </Link>

                                {category.subcategories.map(
                                  function (subcategory) {
                                    return (
                                      <Link
                                        key={subcategory}
                                        to={getSubcategoryUrl(
                                          category.name,
                                          subcategory,
                                        )}
                                        onClick={closeMobileMenu}
                                        className="block py-2 text-xs text-white/60 transition-colors hover:text-white"
                                      >
                                        {subcategory}
                                      </Link>
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            to={getCategoryUrl(category.name)}
                            onClick={closeMobileMenu}
                            className="block py-3 pl-3 text-sm text-white/90"
                          >
                            {category.name}
                          </Link>
                        )}
                      </div>
                    );
                  })}

                  <Link
                    to="/products"
                    onClick={closeMobileMenu}
                    className="mt-2 block px-3 py-3 text-sm font-medium"
                  >
                    Xem tất cả sản phẩm →
                  </Link>
                </div>
              )}
            </div>

            {/* Về chúng tôi */}
            <Link
              to="/about"
              onClick={closeMobileMenu}
              className="block border-b border-white/10 py-4 text-sm font-medium"
            >
              Về chúng tôi
            </Link>

            {/* Account */}
            <Link
              to="/profile"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 py-4 text-sm font-medium"
            >
              <img
                src={userIcon}
                alt=""
                className="h-5 w-5 brightness-0 invert"
              />
              Tài khoản
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
