import { Link } from "react-router-dom";

function Checkout() {
  return (
    <section className="px-5 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-10 text-2xl font-semibold text-[#2d261f] md:text-3xl">
          THANH TOÁN
        </h1>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <form className="space-y-8">
            <div>
              <h2 className="mb-5 text-lg font-semibold">
                THÔNG TIN GIAO HÀNG
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  className="border border-[#d8d0c8] bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  className="border border-[#d8d0c8] bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  type="email"
                  placeholder="Email"
                  className="border border-[#d8d0c8] bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  type="text"
                  placeholder="Tỉnh / Thành phố"
                  className="border border-[#d8d0c8] bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  type="text"
                  placeholder="Quận / Huyện"
                  className="border border-[#d8d0c8] bg-white px-4 py-3 text-sm outline-none"
                />

                <input
                  type="text"
                  placeholder="Địa chỉ"
                  className="border border-[#d8d0c8] bg-white px-4 py-3 text-sm outline-none"
                />
              </div>

              <textarea
                placeholder="Ghi chú đơn hàng"
                rows={4}
                className="mt-4 w-full resize-none border border-[#d8d0c8] bg-white px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <h2 className="mb-5 text-lg font-semibold">
                PHƯƠNG THỨC THANH TOÁN
              </h2>

              <div className="space-y-3">
                <label className="flex cursor-pointer gap-3 border border-[#d8d0c8] bg-white p-4">
                  <input type="radio" name="payment" defaultChecked />
                  <span className="text-sm">Thanh toán khi nhận hàng</span>
                </label>

                <label className="flex cursor-pointer gap-3 border border-[#d8d0c8] bg-white p-4">
                  <input type="radio" name="payment" />
                  <span className="text-sm">Chuyển khoản ngân hàng</span>
                </label>
              </div>
            </div>
          </form>

          <aside className="h-fit bg-[#eeeae5] p-6">
            <h2 className="text-lg font-semibold">ĐƠN HÀNG</h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Tokyo Sofa × 1</span>
                <span>5.000.000 VNĐ</span>
              </div>

              <div className="flex justify-between">
                <span>Lounge Chair × 1</span>
                <span>3.200.000 VNĐ</span>
              </div>

              <div className="border-t border-[#d4cbc2] pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Tổng</span>
                  <span>8.230.000 VNĐ</span>
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="mt-6 block bg-[#3B2F25] px-6 py-3 text-center text-sm text-white"
            >
              Đặt hàng
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Checkout;
