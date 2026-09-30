import { newProducts } from "../data/products";
import ProductGrid from "./product/ProductGrid";

function CollectionSection() {


  return (
    <section className="bg-[#f7f5f2] px-5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center text-xl font-semibold text-[#2d261f]">
          BỘ SƯU TẬP
        </h2>

        

        <ProductGrid products={newProducts} />

        <div className="mt-8 text-center">
          <button
            type="button"
            className="border border-[#3B2F25] px-6 py-2 text-sm text-[#3B2F25] transition hover:bg-[#3B2F25] hover:text-white"
          >
            Xem tất cả
          </button>
        </div>
      </div>
    </section>
  );
}

export default CollectionSection;
