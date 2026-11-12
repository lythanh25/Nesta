import { collectionProducts } from "../data/products";
import ProductGrid from "./product/ProductGrid";
import ScrollReveal from "./ScrollReveal";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-[#aaa19a] sm:w-30" />

      <h2 className="text-[18px] font-semibold tracking-wide text-[#2d261f] sm:text-[32px]">
        {children}
      </h2>

      <span className="h-px w-12 bg-[#aaa19a] sm:w-30" />
    </div>
  );
}

function CollectionSection() {
  return (
    <section className="bg-[#f7f1ed] px-5 pb-12 pt-5 md:px-8 md:pb-16 md:pt-6">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <SectionTitle>BỘ SƯU TẬP</SectionTitle>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <ProductGrid products={collectionProducts} />
        </ScrollReveal>
      </div>
    </section>
  );
}

export default CollectionSection;
