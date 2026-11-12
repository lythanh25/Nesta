import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import banner1 from "../assets/banner.jpg";
import banner2 from "../assets/ThiCong.jpg";
import banner3 from "../assets/ThietKe.jpg";

const slides = [
  {
    image: banner1,
    alt: "Không gian phòng khách và bếp hiện đại của Nesta",
    subtitle: "Mua sắm nội thất cao cấp",
    description: "Kiến tạo không gian sống theo phong cách riêng",
  },
  {
    image: banner2,
    alt: "Không gian phòng khách sang trọng với tông màu be",
    subtitle: "Không gian sống tinh tế",
    description: "Nâng tầm tổ ấm với những thiết kế hiện đại",
  },
  {
    image: banner3,
    alt: "Không gian nội thất hiện đại với chất liệu gỗ ấm áp",
    subtitle: "Cảm hứng từ sự tối giản",
    description: "Hoàn thiện ngôi nhà bằng những lựa chọn hoàn hảo",
  },
];

const AUTOPLAY_INTERVAL = 3000;

function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Tự động chuyển slide
  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <section
      className="relative w-full"
      aria-label="Banner giới thiệu Nesta"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="relative h-[420px] w-full overflow-hidden md:h-[600px]">
        {/* Background slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? "z-10 opacity-100" : "z-0 opacity-0"
            }`}
            aria-hidden={currentSlide !== index}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              fetchPriority={index === 0 ? "high" : "auto"}
              loading={index === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover"
            />
          </div>
        ))}

        {/* Overlay */}
        <div className="absolute inset-0 z-20 bg-black/25" />

        {/* Main content */}
        <div className="absolute inset-0 z-30 flex items-center justify-center px-5">
          <div
            key={currentSlide}
            className="max-w-3xl text-center text-white animate-[heroFadeIn_0.8s_ease]"
          >
            <p className="font-display mb-4 text-3xl tracking-[0.12em] md:text-5xl">
              NESTA.COM
            </p>

            <h1 className="text-xl font-semibold md:text-3xl">
              {slides[currentSlide].subtitle}
            </h1>

            <p className="mt-3 text-sm text-white/90 md:text-base">
              {slides[currentSlide].description}
            </p>

            <Link
              to="/products"
              className="mt-8 inline-flex items-center justify-center rounded bg-[#5E4B39] px-8 py-3 text-sm font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#413123] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Mua sắm ngay
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>

        {/* Previous button */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Ảnh trước"
          className="absolute left-4 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#2d261f] md:left-8 md:h-12 md:w-12"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* Next button */}
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Ảnh tiếp theo"
          className="absolute right-4 top-1/2 z-40 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#2d261f] md:right-8 md:h-12 md:w-12"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        {/* Pagination dots */}
        <div className="absolute bottom-7 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Chuyển đến ảnh ${index + 1}`}
              aria-current={currentSlide === index ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "w-8 bg-white"
                  : "w-2.5 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Animation */}
      <style>
        {`
          @keyframes heroFadeIn {
            from {
              opacity: 0;
              transform: translateY(12px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .transition-opacity {
              transition-duration: 0.01ms !important;
            }
          }
        `}
      </style>
    </section>
  );
}

export default Hero;
