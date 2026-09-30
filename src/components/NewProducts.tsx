import { newProducts } from "../data/products";
import ProductCard from "./product/ProductCard";
import shoppingCart from "../assets/shopping-cart.svg";

function NewProducts() {
  const mainProduct = newProducts[0];
  const otherProducts = newProducts.slice(1, 5);

  return (
    <section className="bg-[#f7f5f2] px-5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center text-xl font-semibold text-[#2d261f]">
          SẢN PHẨM MỚI
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <article className="group">
            <div className="aspect-square overflow-hidden bg-[#eeeae5]">
              <img
                src={mainProduct.images[0]}
                alt={mainProduct.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </div>

            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-lg font-medium text-[#2d261f]">
                  {mainProduct.name}
                </h3>

                <p className="mt-1 text-sm text-[#6f6257]">
                  {new Intl.NumberFormat("vi-VN").format(mainProduct.price)} VNĐ
                </p>
              </div>

              <button
                type="button"
                className=" flex gap-3 mt-4 bg-[#3B2F25] px-5 py-2 text-sm text-white transition hover:bg-[#594638]"
              >
                <span>Giỏ hàng</span>
                <img
                  src={shoppingCart}
                  alt="shopping"
                  className="h-5 w-5 brightness-0 invert"
                />
              </button>
            </div>
          </article>

          <div className="grid grid-cols-2 gap-4">
            {otherProducts.map(function (product) {
              return <ProductCard key={product.id} product={product} />;
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default NewProducts;
