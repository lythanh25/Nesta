import Hero from "../../components/Hero";
import SpacesSection from "../../components/SpacesSection";
import NewProducts from "../../components/NewProducts";
import CollectionSection from "../../components/CollectionSection";
import AboutSection from "../../components/AboutSection";
import CTA from "../../components/CTA";

function Home() {
  return (
    <>
      <Hero />
      <SpacesSection />
      <NewProducts />
      <CollectionSection />
      <CTA />
      <AboutSection />
    </>
  );
}

export default Home;
