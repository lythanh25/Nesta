import { Link } from "react-router-dom";
import type { Product } from "../../data/products";

type ProductCardProps = {
  product: Product;
};

function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("vi-VN").format(
    product.price
  );

  const mainImage = product.images[0];

  return (
    <article className="group">
      <Link to={`/products/${product.id}`}>
        {/* Ảnh sản phẩm */}
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-[#eeeae5]">
          <img
            src={mainImage}
            alt={product.name}
            className="h-[88%] w-[88%] object-contain transition duration-300 group-hover:scale-105"
          />
        </div>

        {/* Thông tin */}
        <div className="mt-3">
          <h3 className="text-sm font-medium text-[#2d261f]">
            {product.name}
          </h3>

          <p className="mt-1 text-sm text-[#6f6257]">
            {formattedPrice} VNĐ
          </p>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;