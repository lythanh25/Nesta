import { Link } from "react-router-dom";
import Living from "../assets/images/spaces/living-room.jpg";
import Bedroom from "../assets/images/spaces/bedroom.jpg";
import Dining from "../assets/images/spaces/dining-room.jpg";
import Office from "../assets/images/spaces/office.jpg";

const spaces = [
  {
    name: "Phòng khách",
    image: Living,
    category: "Phòng khách",
  },
  {
    name: "Phòng ngủ",
    image: Bedroom,
    category: "Phòng ngủ",
  },
  {
    name: "Phòng ăn",
    image: Dining,
    category: "Phòng ăn",
  },
  {
    name: "Phòng làm việc",
    image: Office,
    category: "Phòng làm việc",
  },
];

function SpacesSection() {
  return (
    <section className="bg-[#f7f5f2] px-5 py-12 md:py-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center text-xl font-semibold text-[#2d261f]">
          THEO KHÔNG GIAN
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 ">
          {spaces.map(function (space) {
            return (
              <Link
                key={space.name}
                to={`/products?category=${encodeURIComponent(space.category)}`}
                className="group"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#e9e4de]">
                  <img
                    src={space.image}
                    alt={space.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 rounded-2xl overflow-hidden"
                  />
                </div>

                <h3 className="mt-4 text-center text-sm font-medium text-[#2d261f] transition-colors group-hover:text-[#6e5a47]">
                  {space.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SpacesSection;
