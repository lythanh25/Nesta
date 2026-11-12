import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: boolean;
};

function ScrollReveal({
  children,
  className = "",
  delay = 0,
  stagger = false,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) return;

    // Không chạy hiệu ứng nếu người dùng bật chế độ giảm chuyển động.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={[
        "scroll-reveal",
        isVisible ? "is-visible" : "",
        stagger ? "scroll-reveal-stagger" : "",
        className,
      ].join(" ")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}

      <style>
        {`
          .scroll-reveal {
            opacity: 0;
            transform: translateY(24px);
            transition:
              opacity 700ms ease,
              transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .scroll-reveal.is-visible {
            opacity: 1;
            transform: translateY(0);
          }

          .scroll-reveal-stagger > * {
            opacity: 0;
            transform: translateY(20px);
            transition:
              opacity 650ms ease,
              transform 650ms cubic-bezier(0.22, 1, 0.36, 1);
          }

          .scroll-reveal-stagger.is-visible > * {
            opacity: 1;
            transform: translateY(0);
          }

          .scroll-reveal-stagger.is-visible > *:nth-child(1) {
            transition-delay: 80ms;
          }

          .scroll-reveal-stagger.is-visible > *:nth-child(2) {
            transition-delay: 160ms;
          }

          .scroll-reveal-stagger.is-visible > *:nth-child(3) {
            transition-delay: 240ms;
          }

          .scroll-reveal-stagger.is-visible > *:nth-child(4) {
            transition-delay: 320ms;
          }

          .scroll-reveal-stagger.is-visible > *:nth-child(5) {
            transition-delay: 400ms;
          }

          @media (prefers-reduced-motion: reduce) {
            .scroll-reveal,
            .scroll-reveal-stagger > * {
              opacity: 1 !important;
              transform: none !important;
              transition: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default ScrollReveal;
