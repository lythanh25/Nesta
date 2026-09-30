type SectionTitleProps = {
  children: string;
};

function SectionTitle({ children }: SectionTitleProps) {
  return (
    <h1 className="mb-10 text-center text-2xl font-semibold text-[#2d261f] md:text-3xl">
      {children}
    </h1>
  );
}

export default SectionTitle;
