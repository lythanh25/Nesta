import Hero from "../../components/Hero";
import FeaturedProducts from "../../components/FeaturedProducts";
import NewProducts from "../../components/NewProducts";
import CollectionSection from "../../components/CollectionSection";
import AboutSection from "../../components/AboutSection";
import CTA from "../../components/CTA";

function Home() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <NewProducts />
      <CollectionSection />
      <CTA />
      <AboutSection />
    </>
  );
}

export default Home;
