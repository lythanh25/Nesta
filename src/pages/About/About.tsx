function About() {
  return (
    <section>
      <div className="bg-[#806b56] px-5 py-16 text-white md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm uppercase tracking-[0.25em]">Về Nesta</p>

          <h1 className="mt-4 text-3xl font-semibold md:text-5xl">
            Kiến tạo không gian sống
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/80">
            Chúng tôi tin rằng một không gian sống đẹp không chỉ nằm ở những món
            đồ nội thất riêng lẻ, mà nằm ở cách chúng kết hợp để tạo nên trải
            nghiệm phù hợp với người sử dụng.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl md:grid-cols-2">
        <div className="p-6 md:p-14">
          <p className="text-sm uppercase tracking-[0.2em] text-[#806b56]">
            Câu chuyện
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[#2d261f]">
            Không gian dành cho bạn
          </h2>

          <p className="mt-6 text-sm leading-7 text-[#6f6257]">
            Nesta hướng đến việc mang đến trải nghiệm lựa chọn nội thất đơn
            giản, trực quan và phù hợp với từng phong cách sống.
          </p>

          <p className="mt-4 text-sm leading-7 text-[#6f6257]">
            Từ những sản phẩm tối giản đến các bộ sưu tập được tuyển chọn, chúng
            tôi muốn giúp người dùng dễ dàng hình dung sản phẩm trong chính
            không gian của mình.
          </p>
        </div>

        <div className="min-h-[350px]">
          <img
            src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1200&q=80"
            alt="Không gian nội thất"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="bg-[#f7f5f2] px-5 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-[#2d261f]">
            Giá trị của chúng tôi
          </h2>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="bg-white p-7">
              <h3 className="font-semibold">Tối giản</h3>

              <p className="mt-3 text-sm leading-6 text-[#6f6257]">
                Tập trung vào những sản phẩm thực sự cần thiết và phù hợp với
                không gian.
              </p>
            </div>

            <div className="bg-white p-7">
              <h3 className="font-semibold">Chất lượng</h3>

              <p className="mt-3 text-sm leading-6 text-[#6f6257]">
                Chú trọng chất liệu, thiết kế và trải nghiệm sử dụng lâu dài.
              </p>
            </div>

            <div className="bg-white p-7">
              <h3 className="font-semibold">Cá nhân hóa</h3>

              <p className="mt-3 text-sm leading-6 text-[#6f6257]">
                Giúp người dùng tìm được sản phẩm phù hợp với phong cách và nhu
                cầu riêng.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
