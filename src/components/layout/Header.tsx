import { useState } from "react";
import { Link } from "react-router-dom";

import searchIcon from "../../assets/search.svg";
import shoppingCart from "../../assets/shopping-cart.svg";
import userAlt from "../../assets/user-alt.svg";

const productMenu = [
  {
    name: "Ghế",
    subcategories: [
      {
        name: "Ghế thư giãn",
        category: "Ghế",
        subcategory: "Ghế thư giãn",
      },
      {
        name: "Ghế ăn",
        category: "Ghế",
        subcategory: "Ghế ăn",
      },
      {
        name: "Ghế làm việc",
        category: "Ghế",
        subcategory: "Ghế làm việc",
      },
    ],
  },
  {
    name: "Bàn",
    subcategories: [
      {
        name: "Bàn ăn",
        category: "Bàn",
        subcategory: "Bàn ăn",
      },
      {
        name: "Bàn làm việc",
        category: "Bàn",
        subcategory: "Bàn làm việc",
      },
      {
        name: "Bàn trà",
        category: "Bàn",
        subcategory: "Bàn trà",
      },
    ],
  },
  {
    name: "Giường",
    subcategories: [
      {
        name: "Giường ngủ",
        category: "Giường",
        subcategory: "Giường ngủ",
      },
      {
        name: "Giường đôi",
        category: "Giường",
        subcategory: "Giường đôi",
      },
    ],
  },
  {
    name: "Tủ",
    subcategories: [
      {
        name: "Tủ quần áo",
        category: "Tủ",
        subcategory: "Tủ quần áo",
      },
      {
        name: "Tủ đầu giường",
        category: "Tủ",
        subcategory: "Tủ đầu giường",
      },
      {
        name: "Tủ trang trí",
        category: "Tủ",
        subcategory: "Tủ trang trí",
      },
    ],
  },
];

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mobile
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  function handleProductToggle() {
    setIsProductOpen(!isProductOpen);

    // Nếu đóng Sản phẩm thì đóng luôn category
    if (isProductOpen) {
      setOpenCategory(null);
    }
  }

  function handleCategoryToggle(categoryName: string) {
    if (openCategory === categoryName) {
      setOpenCategory(null);
    } else {
      setOpenCategory(categoryName);
    }
  }

  function closeMobileMenu() {
    setIsMenuOpen(false);
    setIsProductOpen(false);
    setOpenCategory(null);
  }

  return (
    <header className="relative bg-[#3B2F25] text-white">
      {/* =================================================
          HEADER BAR
      ================================================= */}

      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        {/* LOGO */}

        <Link to="/" className="text-lg font-semibold tracking-wide">
          NESTA.COM
        </Link>

        {/* =================================================
            DESKTOP NAV
        ================================================= */}

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm transition hover:opacity-70">
            Trang chủ
          </Link>

          {/* PRODUCT MENU */}

          <div className="group relative">
            <Link
              to="/products"
              className="flex items-center gap-1 py-2 text-sm transition hover:opacity-70"
            >
              Sản phẩm
              <span className="text-xs">▾</span>
            </Link>

            {/* DESKTOP DROPDOWN */}

            <div className="invisible absolute left-1/2 top-full z-50 w-[700px] -translate-x-1/2 translate-y-2 bg-white text-[#3B2F25] opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
              <div className="grid grid-cols-4 gap-8 p-8">
                {productMenu.map(function (category) {
                  return (
                    <div key={category.name}>
                      <Link
                        to={`/products?category=${encodeURIComponent(
                          category.name,
                        )}`}
                        className="block border-b border-[#e5dfd9] pb-3 text-sm font-semibold"
                      >
                        {category.name}
                      </Link>

                      <div className="mt-3 flex flex-col gap-3">
                        {category.subcategories.map(function (subcategory) {
                          return (
                            <Link
                              key={subcategory.name}
                              to={`/products?category=${encodeURIComponent(
                                subcategory.category,
                              )}&subcategory=${encodeURIComponent(
                                subcategory.subcategory,
                              )}`}
                              className="text-sm text-[#6f6257] transition hover:text-[#3B2F25]"
                            >
                              {subcategory.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#e5dfd9] px-8 py-4">
                <Link
                  to="/products"
                  className="text-sm font-medium hover:underline"
                >
                  Xem tất cả sản phẩm →
                </Link>
              </div>
            </div>
          </div>

          <Link to="/about" className="text-sm transition hover:opacity-70">
            Về chúng tôi
          </Link>
        </nav>

        {/* =================================================
            DESKTOP ACTIONS
        ================================================= */}

        <div className="hidden items-center gap-4 md:flex">
          <button type="button">
            <img
              src={searchIcon}
              alt="Tìm kiếm"
              className="h-5 w-5 brightness-0 invert"
            />
          </button>

          <Link to="/cart">
            <img
              src={shoppingCart}
              alt="Giỏ hàng"
              className="h-5 w-5 brightness-0 invert"
            />
          </Link>

          <Link to="/profile">
            <img
              src={userAlt}
              alt="Tài khoản"
              className="h-5 w-5 brightness-0 invert"
            />
          </Link>
        </div>

        {/* =================================================
            MOBILE MENU BUTTON
        ================================================= */}

        <button
          type="button"
          className="text-xl md:hidden"
          onClick={function () {
            setIsMenuOpen(!isMenuOpen);

            if (isMenuOpen) {
              setIsProductOpen(false);
              setOpenCategory(null);
            }
          }}
          aria-label="Mở menu"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* =================================================
          MOBILE MENU
      ================================================= */}

      {isMenuOpen && (
        <div className="border-t border-white/10 px-5 pb-6 md:hidden">
          <nav className="flex flex-col pt-4">
            {/* TRANG CHỦ */}

            <Link to="/" onClick={closeMobileMenu} className="py-3 text-base">
              Trang chủ
            </Link>

            {/* =================================================
                SẢN PHẨM
            ================================================= */}

            <div className="border-t border-white/10">
              <div className="flex items-center justify-between py-3">
                {/* Click chữ → toàn bộ sản phẩm */}

                <Link
                  to="/products"
                  onClick={closeMobileMenu}
                  className="text-base"
                >
                  Sản phẩm
                </Link>

                {/* Click mũi tên → mở danh mục */}

                <button
                  type="button"
                  onClick={handleProductToggle}
                  className="flex h-8 w-8 items-center justify-center text-lg"
                  aria-label="Mở danh mục sản phẩm"
                >
                  {isProductOpen ? "−" : "+"}
                </button>
              </div>

              {/* =================================================
                  PRODUCT CATEGORIES
              ================================================= */}

              {isProductOpen && (
                <div className="pb-3 pl-4">
                  {productMenu.map(function (category) {
                    const isOpen = openCategory === category.name;

                    return (
                      <div key={category.name}>
                        {/* CATEGORY */}

                        <div className="flex items-center justify-between">
                          <Link
                            to={`/products?category=${encodeURIComponent(
                              category.name,
                            )}`}
                            onClick={closeMobileMenu}
                            className="py-2 text-sm font-medium"
                          >
                            {category.name}
                          </Link>

                          <button
                            type="button"
                            onClick={function () {
                              handleCategoryToggle(category.name);
                            }}
                            className="flex h-8 w-8 items-center justify-center text-sm"
                            aria-label={`Mở ${category.name}`}
                          >
                            {isOpen ? "−" : "+"}
                          </button>
                        </div>

                        {/* SUBCATEGORIES */}

                        {isOpen && (
                          <div className="mb-2 ml-4 border-l border-white/20 pl-4">
                            {category.subcategories.map(function (subcategory) {
                              return (
                                <Link
                                  key={subcategory.name}
                                  to={`/products?category=${encodeURIComponent(
                                    subcategory.category,
                                  )}&subcategory=${encodeURIComponent(
                                    subcategory.subcategory,
                                  )}`}
                                  onClick={closeMobileMenu}
                                  className="block py-2 text-sm text-white/70 transition hover:text-white"
                                >
                                  {subcategory.name}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ALL PRODUCTS */}

                  <Link
                    to="/products"
                    onClick={closeMobileMenu}
                    className="mt-2 block border-t border-white/10 pt-4 text-sm font-medium"
                  >
                    Xem tất cả sản phẩm →
                  </Link>
                </div>
              )}
            </div>

            {/* VỀ CHÚNG TÔI */}

            <Link
              to="/about"
              onClick={closeMobileMenu}
              className="border-t border-white/10 py-3 text-base"
            >
              Về chúng tôi
            </Link>

            {/* =================================================
                MOBILE ACTIONS
            ================================================= */}

            <div className="flex gap-5 border-t border-white/10 pt-5">
              <button type="button">
                <img
                  src={searchIcon}
                  alt="Tìm kiếm"
                  className="h-5 w-5 brightness-0 invert"
                />
              </button>

              <Link to="/cart">
                <img
                  src={shoppingCart}
                  alt="Giỏ hàng"
                  className="h-5 w-5 brightness-0 invert"
                />
              </Link>

              <Link to="/profile">
                <img
                  src={userAlt}
                  alt="Tài khoản"
                  className="h-5 w-5 brightness-0 invert"
                />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
