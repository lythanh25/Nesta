import banner from "../../assets/banner-timhieu.jpg";

function About() {
  return (
    <section className="bg-[#f7f1ed] px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        <section>
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-wide text-[#2d261f] md:text-3xl">
            VỀ CÔNG TY
          </h2>

          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="space-y-6 text-sm leading-7 text-[#4f4842] md:text-[15px]">
              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  1. Giới thiệu
                </h3>

                <p>
                  Nội thất Nesta được thành lập với sứ mệnh mang lại những giải
                  pháp không gian sống hiện đại, tinh tế và tối ưu trải nghiệm
                  người dùng.
                </p>

                <p className="mt-2">
                  Chúng tôi kết hợp giữa thẩm mỹ thiết kế đương đại và sự thấu
                  hiểu sâu sắc về thói quen sinh hoạt của gia đình Việt, giúp
                  mỗi ngôi nhà trở thành tổ ấm thực thụ.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  2. Thông tin báo chí
                </h3>

                <p>
                  Cập nhật các bài viết, đánh giá từ các tạp chí kiến trúc,
                  thiết kế nội thất và phong cách sống nói về thương hiệu Nesta,
                  cũng như các xu hướng không gian sống mới nhất.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  3. Tuyển dụng
                </h3>

                <p>
                  Đồng hành cùng Nesta! Chúng tôi luôn tìm kiếm những tài năng
                  trẻ ở các vị trí Thiết kế nội thất, Chuyên viên UX/UI, Tư vấn
                  viên và Phát triển kinh doanh.
                </p>

                <p className="mt-2">
                  Khám phá cơ hội nghề nghiệp và môi trường làm việc sáng tạo
                  của chúng tôi tại đây.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  4. Đổi trả hàng
                </h3>

                <p>
                  Chính sách đổi trả linh hoạt trong vòng 7 ngày kể từ khi nhận
                  hàng đối với các sản phẩm lỗi từ nhà sản xuất hoặc không đúng
                  mô tả, đảm bảo quyền lợi tối đa cho khách hàng mua sắm trực
                  tuyến.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-md">
              <img
                src={banner}
                alt="Nội thất Nesta"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="mt-16 border-t border-[#d8cec6] pt-12 md:mt-20 md:pt-16">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-wide text-[#2d261f] md:text-3xl">
            CHĂM SÓC KHÁCH HÀNG
          </h2>

          <div className="space-y-10 text-sm leading-7 text-[#4f4842] md:text-[15px]">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-[#2d261f] md:text-xl">
                1. Các câu hỏi thường gặp (FAQ)
              </h3>

              <p className="mb-6">
                Tổng hợp những thắc mắc phổ biến của khách hàng về thời gian
                giao hàng, cách bảo quản đồ gỗ/vải bọc, chính sách bảo hành và
                hình thức thanh toán khi mua hàng tại Nesta.
              </p>

              <div className="space-y-6 pl-0 md:pl-4">
                <div>
                  <h4 className="mb-2 font-semibold text-[#2d261f]">
                    1.1. Thời gian giao hàng và lắp đặt tại nhà mất bao lâu?
                  </h4>

                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Thời gian giao hàng tiêu chuẩn đối với các sản phẩm có sẵn
                      dao động từ 3 - 5 ngày làm việc đối với khu vực nội thành.
                    </li>
                    <li>
                      Đối với các đơn hàng ở tỉnh hoặc sản phẩm đặt thiết kế
                      riêng, thời gian sẽ từ 7 - 10 ngày.
                    </li>
                    <li>
                      Đội ngũ kỹ thuật của Nesta sẽ liên hệ trước khi giao hàng
                      để sắp xếp thời gian phù hợp nhất với bạn.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-[#2d261f]">
                    1.2. Chính sách bảo hành sản phẩm nội thất như thế nào?
                  </h4>

                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Tất cả sản phẩm nội thất của Nesta đều được bảo hành kỹ
                      thuật từ 12 đến 24 tháng tùy theo danh mục sản phẩm (gỗ,
                      sofa, phụ kiện).
                    </li>
                    <li>
                      Chúng tôi hỗ trợ bảo trì trọn đời và xử lý các vấn đề phát
                      sinh do lỗi nhà sản xuất trong thời gian sớm nhất.
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-2 font-semibold text-[#2d261f]">
                    1.3. Tôi có thể đổi trả sản phẩm nếu không ưng ý không?
                  </h4>

                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Nesta hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng
                      nếu sản phẩm gặp lỗi kỹ thuật từ nhà sản xuất, sai kích
                      thước hoặc không đúng mô tả trên website.
                    </li>
                    <li>
                      Sản phẩm đổi trả cần giữ nguyên vẹn 100% hiện trạng ban
                      đầu.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-[#2d261f] md:text-xl">
                2. Hướng dẫn mua sắm
              </h3>

              <p className="mb-5">
                Hướng dẫn chi tiết 4 bước mua hàng đơn giản trên website:
              </p>

              <div className="space-y-5 pl-0 md:pl-4">
                <div>
                  <h4 className="font-semibold text-[#2d261f]">
                    Bước 1: Khám phá cảm hứng & lựa chọn sản phẩm
                  </h4>
                  <p className="mt-1">
                    Truy cập vào danh mục sản phẩm hoặc trang Blog của Nesta để
                    tìm kiếm phong cách nội thất phù hợp với ngôi nhà của bạn.
                    Sử dụng bộ lọc thông minh theo không gian (Phòng khách,
                    Phòng ngủ, Phòng bếp) hoặc theo chất liệu, mức giá để thu
                    hẹp lựa chọn.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#2d261f]">
                    Bước 2: Xem chi tiết thông số & thêm vào giỏ hàng
                  </h4>
                  <p className="mt-1">
                    Nhấp vào sản phẩm bạn quan tâm để xem hình ảnh sắc nét từ
                    nhiều góc độ, thông số kích thước chi tiết và mô tả chất
                    liệu. Chọn số lượng cần mua và nhấn nút "Thêm vào giỏ hàng"
                    hoặc "Mua ngay".
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#2d261f]">
                    Bước 3: Điền thông tin giao hàng & chọn thanh toán
                  </h4>
                  <p className="mt-1">
                    Kiểm tra lại danh sách sản phẩm trong giỏ hàng. Điền đầy đủ
                    thông tin nhận hàng bao gồm họ tên, số điện thoại, địa chỉ
                    giao nhận và ghi chú đặc biệt cho đơn hàng (nếu có).
                  </p>

                  <p className="mt-2">
                    Lựa chọn phương thức thanh toán thuận tiện nhất: Thanh toán
                    khi nhận hàng COD, chuyển khoản ngân hàng hoặc thẻ tín dụng
                    bảo mật.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#2d261f]">
                    Bước 4: Xác nhận đơn hàng & nhận lắp đặt
                  </h4>
                  <p className="mt-1">
                    Sau khi hoàn tất, hệ thống sẽ gửi mã đơn hàng cho bạn qua
                    màn hình và email xác nhận. Đội ngũ chăm sóc khách hàng của
                    Nesta sẽ gọi điện xác nhận lại đơn hàng, thông báo lịch vận
                    chuyển và tiến hành lắp đặt tận nơi miễn phí theo đúng thỏa
                    thuận.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-[#2d261f] md:text-xl">
                3. Thông tin vận chuyển
              </h3>

              <p>
                Nesta cung cấp dịch vụ giao hàng và lắp đặt tận nhà trên toàn
                quốc. Miễn phí vận chuyển cho các đơn hàng nội thành trong bán
                kính giới hạn. Thời gian giao hàng tiêu chuẩn từ 3 - 5 ngày làm
                việc.
              </p>
            </div>

            <div>
              <h3 className="mb-3 text-lg font-semibold text-[#2d261f] md:text-xl">
                4. Liên hệ qua email
              </h3>

              <p>
                Gửi thắc mắc hoặc yêu cầu tư vấn trực tiếp cho đội ngũ hỗ trợ
                qua hòm thư:
              </p>

              <p className="mt-2 font-medium text-[#5a493d]">
                support@nesta.com
              </p>

              <p className="mt-1">
                Hoặc để lại lời nhắn, chúng tôi sẽ phản hồi trong vòng 24 giờ.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 border-t border-[#d8cec6] pt-12 md:mt-20 md:pt-16">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-wide text-[#2d261f] md:text-3xl">
            ĐIỀU KHOẢN VÀ CHÍNH SÁCH
          </h2>

          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            <div className="overflow-hidden rounded-md">
              <img
                src={banner}
                alt="Điều khoản và chính sách Nesta"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>

            <div className="space-y-6 text-sm leading-7 text-[#4f4842] md:text-[15px]">
              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  1. Điều khoản sử dụng
                </h3>

                <p>
                  Quy định về quyền và nghĩa vụ của người dùng khi truy cập,
                  đăng ký tài khoản và thực hiện các giao dịch thương mại điện
                  tử trên website chính thức của Nesta.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  2. Điều khoản bán hàng
                </h3>

                <p>
                  Các cam kết về chất lượng sản phẩm, tiêu chuẩn kỹ thuật, báo
                  giá, thuế VAT và các điều kiện ràng buộc pháp lý trong quá
                  trình giao dịch mua bán giữa Nesta và khách hàng.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  3. Chính sách bảo mật
                </h3>

                <p>
                  Cam kết bảo mật thông tin cá nhân của khách hàng theo luật
                  pháp hiện hành. Nesta sử dụng mã hóa dữ liệu tiên tiến để đảm
                  bảo an toàn cho thông tin thanh toán và lịch sử giao dịch của
                  bạn.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-base font-semibold text-[#2d261f] md:text-lg">
                  4. Thuật ngữ của cửa hàng
                </h3>

                <p>
                  Giải thích các thuật ngữ chuyên ngành được sử dụng trên
                  website như chất liệu Bouclé, phong cách Grandmillennial,
                  thông số kích thước tiêu chuẩn hoặc các khái niệm về thiết kế
                  nội thất để khách hàng dễ dàng tra cứu.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default About;
