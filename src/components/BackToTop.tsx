import { useEffect, useState } from "react";

type BackToTopProps = {
  isContactOpen: boolean;
};

function BackToTop({ isContactOpen }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Quay lại đầu trang"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      className={`
        fixed right-5 z-40
        flex h-11 w-11 items-center justify-center
        rounded-full border border-[#d8cec5]
        bg-white text-[#5a493d]
        shadow-md
        transition-all duration-500
        hover:-translate-y-1 hover:bg-[#5a493d]
        hover:text-white hover:shadow-lg
        focus:outline-none focus:ring-2
        focus:ring-[#5a493d]/30
        md:right-8
        ${
          isContactOpen
            ? "bottom-[23rem] md:bottom-[26rem]"
            : "bottom-[5.5rem] md:bottom-[6rem]"
        }
        ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  );
}

export default BackToTop;
