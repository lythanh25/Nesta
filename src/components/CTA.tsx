import ThiCong from "../assets/ThiCong.jpg";
import ThietKe from "../assets/ThietKe.jpg";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-7 flex items-center justify-center gap-3">
      <span className="h-px w-12 bg-[#aaa19a] sm:w-20" />

      <h2
        className="
          text-[18px]
          font-semibold
          tracking-wide
          text-[#2d261f]
          sm:text-[20px]
        "
      >
        {children}
      </h2>

      <span className="h-px w-12 bg-[#aaa19a] sm:w-20" />
    </div>
  );
}

export default function CTA() {
  return (
    <>
      <section className=" text-black mb-5 bg-[#f7f1ed] border-t border-b">
        <div className=" grid  md:grid-cols-2">
          <div className="h-[300px] md:h-full">
            <img
              src={ThiCong}
              alt="Thi công nội thất"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center items-center px-6 py-12 md:px-12">
            <SectionTitle>DỊCH VỤ SẢN XUẤT - THI CÔNG</SectionTitle>
            <img
              src={ThietKe}
              alt="Thiết kế nội thất"
              className="h-full w-full object-cover"
            />
            <p className="mt-5 max-w-lg text-sm leading-7 text-black/80">
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
