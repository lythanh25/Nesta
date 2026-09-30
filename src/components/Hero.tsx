import banner from "../assets/banner.jpg";

function Hero() {
  return (
    <section className="relative">
      <div className="h-[420px] w-full overflow-hidden md:h-[600px]">
        <img
          src={banner}
          alt="Không gian nội thất Nesta"
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/25" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="mb-2 text-3xl italic">NESTA.COM</p>

            <h1 className="text-md italic md:text-2xl">
              Mua sắm nội thất cao cấp
            </h1>

            <button
              type="button"
              className="mt-6 bg-[#6E90FF] px-6 py-3 text-sm transition hover:bg-[#5f84fc] rounded"
            >
              Mua sắm ngay
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
