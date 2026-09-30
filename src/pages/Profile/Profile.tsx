function Profile() {
  return (
    <section className="px-5 py-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-10 text-2xl font-semibold text-[#2d261f] md:text-3xl">
          TRANG CÁ NHÂN
        </h1>

        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="bg-[#eeeae5] p-5">
            <div className="flex flex-col gap-3 text-sm">
              <button className="bg-[#3B2F25] px-4 py-3 text-left text-white">
                Thông tin cá nhân
              </button>

              <button className="px-4 py-3 text-left">Đơn hàng của tôi</button>

              <button className="px-4 py-3 text-left">Địa chỉ</button>

              <button className="px-4 py-3 text-left">Đổi mật khẩu</button>

              <button className="px-4 py-3 text-left text-red-700">
                Đăng xuất
              </button>
            </div>
          </aside>

          <div className="border border-[#ddd5cd] bg-white p-6 md:p-8">
            <h2 className="text-lg font-semibold">THÔNG TIN CÁ NHÂN</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm">Họ và tên</label>

                <input
                  type="text"
                  defaultValue="Nguyễn Văn A"
                  className="w-full border border-[#d8d0c8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Email</label>

                <input
                  type="email"
                  defaultValue="example@gmail.com"
                  className="w-full border border-[#d8d0c8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Số điện thoại</label>

                <input
                  type="tel"
                  defaultValue="0123456789"
                  className="w-full border border-[#d8d0c8] px-4 py-3 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm">Ngày sinh</label>

                <input
                  type="date"
                  className="w-full border border-[#d8d0c8] px-4 py-3 text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              className="mt-8 bg-[#3B2F25] px-6 py-3 text-sm text-white"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
