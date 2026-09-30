import ThiCong from "../assets/ThiCong.jpg";
import ThietKe from "../assets/ThietKe.jpg";

export default function CTA() {
  return (
    <>
      <section className="bg-[#806b56] text-white mb-5">
        <div className="mx-auto grid max-w-7xl md:grid-cols-2">
          <div className="h-[300px] md:h-full">
            <img
              src={ThiCong}
              alt="Thi công nội thất"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center items-center px-6 py-12 md:px-12">
            <h2 className="text-2xl font-semibold md:text-3xl mb-5">
              DỊCH VỤ SẢN XUẤT - THI CÔNG
            </h2>
            <img
              src={ThietKe}
              alt="Thiết kế nội thất"
              className="h-full w-full object-cover"
            />
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/80">
              Chúng tôi luôn sẵn sàng hỗ trợ bạn giải quyết được những bài toán
              khó về kỹ thuật thi công nội thất, phối hợp nhiều chất liệu bằng
              tay nghề, công nghệ, kinh nghiệm và sáng tạo.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
