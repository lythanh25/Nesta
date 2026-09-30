import { featuredProducts } from "../data/products";
import ProductCard from "./product/ProductCard";

function FeaturedProducts() {
  return (
    <section className="bg-[#f7f5f2] px-5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center text-xl font-semibold text-[#2d261f]">
          SẢN PHẨM NỔI BẬT
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featuredProducts.map(function (product) {
            return <ProductCard key={product.id} product={product} />;
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;
