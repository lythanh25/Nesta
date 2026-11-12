import { useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import FloatingContact from "../FloatingContact";
import BackToTop from "../BackToTop";

function MainLayout() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <Header />

      <main className="pt-[70px]">
        <Outlet />
      </main>

      <Footer />

      <BackToTop isContactOpen={isContactOpen} />

      <FloatingContact onOpenChange={setIsContactOpen} />
    </div>
  );
}

export default MainLayout;
