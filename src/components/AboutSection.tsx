import bannerInfo from "../assets/banner-timhieu.jpg";

function AboutSection() {
  return (
    <section className="bg-[#806b56] text-white mb-5">
      <div className="mx-auto grid max-w-7xl md:grid-cols-2">
        <div className="flex flex-col justify-center px-6 py-12 md:px-12">
          <p className="mb-3 text-sm uppercase tracking-[0.2em]">
            Tìm hiểu thêm về
          </p>

          <h2 className="text-2xl font-semibold md:text-3xl">Công ty Nesta</h2>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/80">
            NESTA tự hào là thương hiệu nội thất cao cấp hàng đầu, chuyên cung
            cấp các sản phẩm có thiết kế tinh tế và chất lượng vượt trội. Chúng
            tôi cam kết mang đến những giải pháp không gian sống hiện đại, đẳng
            cấp và bền bỉ với thời gian cho ngôi nhà của bạn.
          </p>

          <button
            type="button"
            className="mt-6 w-fit border border-white px-5 py-2 text-sm transition hover:bg-white hover:text-[#806b56]"
          >
            Xem thêm
          </button>
        </div>

        <div className="h-[300px] md:h-full">
          <img
            src={bannerInfo}
            alt="Không gian nội thất"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
