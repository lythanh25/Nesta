function Footer() {
  return (
    <footer className="bg-[#15120f] px-5 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h3 className="text-lg font-semibold tracking-wide">
              NESTA.COM
            </h3>

            <p className="mt-4 max-w-xs text-sm leading-6 text-white/60">
              Nội thất cho một không gian sống tinh tế và phù hợp
              với phong cách của bạn.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">
              KHÁM PHÁ
            </h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
              <a href="/">Trang chủ</a>
              <a href="/">Sản phẩm</a>
              <a href="/">Bộ sưu tập</a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">
              HỖ TRỢ
            </h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
              <a href="/">Liên hệ</a>
              <a href="/">Chính sách</a>
              <a href="/">Điều khoản</a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold">
              ĐĂNG KÝ NHẬN TIN
            </h4>

            <p className="mt-4 text-sm leading-6 text-white/60">
              Nhận thông tin mới nhất về sản phẩm và bộ sưu tập.
            </p>

            <div className="mt-4 flex">
              <input
                type="email"
                placeholder="Email của bạn"
                className="min-w-0 flex-1 border border-white/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-white/40"
              />

              <button
                type="button"
                className="bg-white px-4 text-sm text-[#15120f]"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © 2026 Nesta.com. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;