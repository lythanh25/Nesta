import { Link } from "react-router-dom";
import banner from "../assets/banner.jpg";

function Hero() {
  return (
    <section className="relative">
      <div className="relative h-[420px] w-full overflow-hidden md:h-[600px]">
        <img
          src={banner}
          alt="Không gian nội thất Nesta"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />

        {/* Lam mo */}
        {/* <div className="absolute inset-0 bg-black/25" /> */}

        {/* Content */}
        <div className="absolute inset-0 flex mt-20 justify-center px-4">
          <div className="text-center text-black">
            <p className="font-display mb-3 text-2xl  md:text-4xl">NESTA.COM</p>

            <h1 className="text-base font-semibold md:text-xl">
              Mua sắm nội thất cao cấp
            </h1>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center justify-center rounded bg-[#5E4B39] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[#413123] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Mua sắm ngay
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
