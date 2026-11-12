import { useState } from "react";

type FloatingContactProps = {
  onOpenChange: (isOpen: boolean) => void;
};

const CONTACTS = [
  {
    name: "Zalo",
    description: "Nhắn tin qua Zalo",
    icon: "Z",
    color: "bg-[#087FDD]",
    href: "https://zalo.me/0964757649",
  },
  {
    name: "Facebook",
    description: "Liên hệ qua Facebook",
    icon: "f",
    color: "bg-[#1877F2]",
    href: "https://facebook.com/pypqe",
  },
  {
    name: "Hotline",
    description: "Gọi điện tư vấn",
    icon: "☎",
    color: "bg-[#5a493d]",
    href: "tel:0964757649",
  },
  {
    name: "Email",
    description: "Gửi email cho NESTA",
    icon: "✉",
    color: "bg-[#806b56]",
    href: "mailto:giapquy0601@gmail.com",
  },
];

function FloatingContact({ onOpenChange }: FloatingContactProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleContact = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    onOpenChange(nextState);
  };

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end md:bottom-8 md:right-8">
      {/* Danh sách liên hệ */}
      <div
        className={`absolute bottom-[calc(100%+12px)] right-0 flex flex-col items-end gap-3 transition-all duration-300 ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        {CONTACTS.map((contact, index) => (
          <a
            key={contact.name}
            href={contact.href}
            target={
              contact.name === "Zalo" || contact.name === "Facebook"
                ? "_blank"
                : undefined
            }
            rel="noopener noreferrer"
            tabIndex={isOpen ? 0 : -1}
            className="group flex items-center gap-3 rounded-full bg-white py-2 pl-4 pr-2 shadow-lg transition-all duration-200 hover:-translate-x-1 hover:shadow-xl"
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
            }}
          >
            <span className="text-right">
              <span className="block text-sm font-semibold text-[#2d261f]">
                {contact.name}
              </span>
              <span className="block text-xs text-[#aaa19a]">
                {contact.description}
              </span>
            </span>

            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold text-white ${contact.color}`}
            >
              {contact.icon}
            </span>
          </a>
        ))}
      </div>

      {/* Nút mở / đóng */}
      <button
        type="button"
        onClick={toggleContact}
        aria-label={isOpen ? "Đóng liên hệ" : "Mở liên hệ"}
        aria-expanded={isOpen}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5a493d] text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#3b2f25] focus:outline-none focus:ring-4 focus:ring-[#5a493d]/20"
      >
        <span
          className={`text-2xl transition-transform duration-300 ${
            isOpen ? "rotate-45" : "rotate-0"
          }`}
        >
          +
        </span>
      </button>
    </div>
  );
}

export default FloatingContact;
