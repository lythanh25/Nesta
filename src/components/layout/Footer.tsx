import Telegram from "../../assets/telegram.svg";
import Instagram from "../../assets/instagram.svg";
import Facebook from "../../assets/facebook-square.svg";
import Youtube from "../../assets/youtube.svg";

function Footer() {
  return (
    <footer className="bg-[#15120f] px-5 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h4 className="text-lg font-semibold ">Về công ty</h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
              <a href="/">Giới thiệu</a>
              <a href="/">Thông tin báo chí</a>
              <a href="/">Tuyển dụng</a>
              <a href="/">Đổi trả hàng</a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Chăm sóc khách hàng</h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
              <a href="/">Các câu hỏi thường gặp</a>
              <a href="/">Hướng dẫn mua sắm</a>
              <a href="/">Thông tin vận chuyển</a>
              <a href="/">Liên hệ qua email</a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Điều khoản và chính sách</h4>

            <div className="mt-4 flex flex-col gap-3 text-sm text-white/60">
              <a href="/">Điều khoản sử dụng</a>
              <a href="/">Điều khoản bán hàng</a>
              <a href="/">Chính sách bảo mật</a>
              <a href="/">Thuật ngữ cửa hàng</a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold">Đăng kí mới</h4>

            <p className="mt-4 text-sm leading-6 text-white/60">
              Nhận giảm giá 5% khi đăng ký mới!
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

            <div className="flex gap-3 mt-3">
              <img
                src={Telegram}
                alt="telegram"
                className="cursor-pointer hover:scale-110"
              />
              <img
                src={Instagram}
                alt="instagram"
                className="cursor-pointer hover:scale-110"
              />
              <img
                src={Facebook}
                alt="facebook"
                className="cursor-pointer hover:scale-110"
              />
              <img
                src={Youtube}
                alt="youtube"
                className="cursor-pointer hover:scale-110"
              />
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
