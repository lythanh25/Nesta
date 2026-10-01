import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import searchIcon from "../../assets/search.svg";
import cartIcon from "../../assets/shopping-cart.svg";
import userIcon from "../../assets/user-alt.svg";

type Category = {
  name: string;
  subcategories?: string[];
};

const productMenu: Category[] = [
  {
    name: "SOFA",
    subcategories: ["Sofa đệm", "Gối sofa", "Sofa băng"],
  },
  {
    name: "GHẾ",
    subcategories: [
      "Ghế ăn",
      "Ghế ban công",
      "Ghế cà phê",
      "Ghế văn phòng",
      "Ghế bar",
    ],
  },
  {
    name: "BÀN",
    subcategories: ["Bàn ăn", "Bàn ban công", "Bàn cà phê", "Bàn văn phòng"],
  },
  {
    name: "TỦ",
    subcategories: ["Tủ tivi", "Tủ trang điểm", "Tủ quần áo"],
  },
  {
    name: "KỆ",
    subcategories: ["Kệ sách", "Kệ trang trí"],
  },
  {
    name: "TRANG TRÍ",
    subcategories: ["Bình hoa", "Khung tranh", "Đồng hồ"],
  },
  {
    name: "GIƯỜNG",
    subcategories: ["Giường", "Giường cho bé", "Giường cao cấp"],
  },
  {
    name: "ĐÈN",
    subcategories: ["Đèn ngủ", "Đèn treo tường", "Đèn LED"],
  },
  {
    name: "GƯƠNG",
    subcategories: ["Gương để bàn", "Gương trang trí"],
  },
];

function Header() {
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = () => {
    const keyword = searchValue.trim();

    if (!keyword) {
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(keyword)}`);
    setIsMenuOpen(false);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleCategoryToggle = (categoryName: string) => {
    setOpenCategory((current) =>
      current === categoryName ? null : categoryName,
    );
  };

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsProductOpen(false);
    setOpenCategory(null);
  };

  return (
    <header className="relative z-50 bg-[#3B2F25] text-white">
      {/* =========================================================
          DESKTOP HEADER
      ========================================================== */}
      <div className="mx-auto hidden h-[70px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 lg:grid">
        {/* Logo */}
        <Link
          to="/"
          className="justify-self-start shrink-0 font-serif text-xl tracking-wide text-white transition-opacity hover:opacity-80"
        >
          NESTA.COM
        </Link>

        {/* Main Navigation */}
        <nav className="flex h-full items-center gap-8">
          {/* Trang chủ */}
          <Link
            to="/"
            className="flex h-full items-center text-sm font-medium transition-colors hover:text-white/70"
          >
            Trang chủ
          </Link>

          {/* Danh mục sản phẩm */}
          <div
            className="relative h-full"
            onMouseEnter={() => setIsProductOpen(true)}
            onMouseLeave={() => setIsProductOpen(false)}
          >
            <button
              type="button"
              onClick={() => setIsProductOpen((current) => !current)}
              className="flex h-full items-center text-sm font-medium transition-colors hover:text-white/70"
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
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Mega Menu */}
            {isProductOpen && (
              <div className="absolute left-1/2 top-[70px] w-[900px] -translate-x-1/2 border-t border-white/10 bg-white text-[#2D261F] shadow-xl">
                <div className="grid grid-cols-5 gap-x-10 gap-y-8 p-8">
                  {productMenu.map((category) => (
                    <div key={category.name}>
                      <Link
                        to={`/products?category=${encodeURIComponent(
                          category.name,
                        )}`}
                        onClick={() => setIsProductOpen(false)}
                        className="mb-3 block text-sm font-semibold tracking-wide transition-colors hover:text-[#6E5A47]"
                      >
                        {category.name}
                      </Link>

                      {category.subcategories &&
                        category.subcategories.length > 0 && (
                          <ul className="space-y-2">
                            {category.subcategories.map((subcategory) => (
                              <li key={subcategory}>
                                <Link
                                  to={`/products?category=${encodeURIComponent(
                                    category.name,
                                  )}&subcategory=${encodeURIComponent(
                                    subcategory,
                                  )}`}
                                  onClick={() => setIsProductOpen(false)}
                                  className="block text-xs text-[#756D66] transition-colors hover:text-[#2D261F]"
                                >
                                  {subcategory}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  ))}
                </div>

                {/* View all */}
                <div className="border-t border-[#E5E0DA] px-8 py-4">
                  <Link
                    to="/products"
                    onClick={() => setIsProductOpen(false)}
                    className="inline-flex items-center text-sm font-medium transition-colors hover:text-[#6E5A47]"
                  >
                    Xem tất cả sản phẩm
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Về chúng tôi */}
          <Link
            to="/about"
            className="flex h-full items-center text-sm font-medium transition-colors hover:text-white/70"
          >
            Về chúng tôi
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center justify-self-end gap-4">
          {/* Search */}
          <div className="flex h-9 w-[230px] items-center overflow-hidden rounded border border-white/50 bg-white/10">
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Tìm kiếm sản phẩm..."
              className="min-w-0 flex-1 bg-transparent px-3 text-xs text-white outline-none placeholder:text-white/60"
              aria-label="Tìm kiếm sản phẩm"
            />

            <button
              type="button"
              onClick={handleSearch}
              className="flex h-full w-9 shrink-0 items-center justify-center transition-colors hover:bg-white/10"
              aria-label="Tìm kiếm"
            >
              <img
                src={searchIcon}
                alt=""
                className="h-4 w-4 brightness-0 invert"
              />
            </button>
          </div>

          {/* Cart */}
          <Link
            to="/cart"
            className="flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-70"
            aria-label="Giỏ hàng"
          >
            <img
              src={cartIcon}
              alt=""
              className="h-5 w-5 brightness-0 invert"
            />
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
          onClick={() => setIsMenuOpen((current) => !current)}
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
            onClick={() => {
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

          <Link
            to="/cart"
            onClick={closeMobileMenu}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="Giỏ hàng"
          >
            <img
              src={cartIcon}
              alt=""
              className="h-5 w-5 brightness-0 invert"
            />
          </Link>
        </div>
      </div>

      {/* =========================================================
          MOBILE MENU
      ========================================================== */}
      {isMenuOpen && (
        <div className="absolute left-0 top-[70px] w-full border-t border-white/10 bg-[#3B2F25] lg:hidden">
          <div className="max-h-[calc(100vh-70px)] overflow-y-auto px-5 pb-8">
            {/* Search */}
            <div className="border-b border-white/10 py-5">
              <div className="flex h-10 overflow-hidden rounded border border-white/40 bg-white/10">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/60"
                  aria-label="Tìm kiếm sản phẩm"
                />

                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex w-11 items-center justify-center"
                  aria-label="Tìm kiếm"
                >
                  <img
                    src={searchIcon}
                    alt=""
                    className="h-4 w-4 brightness-0 invert"
                  />
                </button>
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

            {/* Danh mục */}
            <div className="border-b border-white/10">
              <button
                type="button"
                onClick={() => setIsProductOpen((current) => !current)}
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
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isProductOpen && (
                <div className="pb-3">
                  {productMenu.map((category) => (
                    <div
                      key={category.name}
                      className="border-t border-white/5"
                    >
                      {category.subcategories &&
                      category.subcategories.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCategoryToggle(category.name)}
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
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25-4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>

                          {openCategory === category.name && (
                            <div className="pb-2 pl-6">
                              <Link
                                to={`/products?category=${encodeURIComponent(
                                  category.name,
                                )}`}
                                onClick={closeMobileMenu}
                                className="block py-2 text-xs text-white/60"
                              >
                                Tất cả {category.name.toLowerCase()}
                              </Link>

                              {category.subcategories.map((subcategory) => (
                                <Link
                                  key={subcategory}
                                  to={`/products?category=${encodeURIComponent(
                                    category.name,
                                  )}&subcategory=${encodeURIComponent(
                                    subcategory,
                                  )}`}
                                  onClick={closeMobileMenu}
                                  className="block py-2 text-xs text-white/60 transition-colors hover:text-white"
                                >
                                  {subcategory}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <Link
                          to={`/products?category=${encodeURIComponent(
                            category.name,
                          )}`}
                          onClick={closeMobileMenu}
                          className="block py-3 pl-3 text-sm text-white/90"
                        >
                          {category.name}
                        </Link>
                      )}
                    </div>
                  ))}

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
