import { useRef, useState, type FormEvent } from "react";
import {
  productCategories,
  productRooms,
  type Product,
  type ProductCategory,
  type ProductRoom,
  type ProductSize,
} from "../../data/products";
import {
  addProduct,
  getProducts,
  updateProduct,
} from "../../utils/productStorage";
import {
  getStock,
  setMultipleStock,
  type StockUpdate,
} from "../../utils/stock";

type AdminProductFormProps = {
  product: Product | null;
  onCancel: () => void;
  onSaved: () => void;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-[#e3dbd4] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#5a493d]";

const labelClass = "block text-sm font-medium text-[#4a3d33]";

function parseSpecifications(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of text.split("\n")) {
    const separator = line.indexOf(":");

    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key && value) result[key] = value;
  }

  return result;
}

function parseSizes(text: string): ProductSize[] | null {
  if (!text.trim()) return [];

  const sizes: ProductSize[] = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;

    const [rawLabel, rawWidth, rawLength, rawHeight, rawPrice, rawStock] = line
      .split(",")
      .map((value) => value.trim());

    const label = rawLabel;
    const width = Number(rawWidth);
    const length = Number(rawLength);
    const height = Number(rawHeight);
    const price = rawPrice ? Number(rawPrice) : undefined;
    const stock = Number(rawStock);

    if (
      !label ||
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(length) ||
      length <= 0 ||
      !Number.isFinite(height) ||
      height <= 0 ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      (price !== undefined && (!Number.isFinite(price) || price <= 0))
    ) {
      return null;
    }

    if (sizes.some((size) => size.label === label)) {
      return null;
    }

    sizes.push({
      label,
      width,
      length,
      height,
      ...(price !== undefined ? { price } : {}),
      stock,
    });
  }

  return sizes;
}

export default function AdminProductForm({
  product,
  onCancel,
  onSaved,
}: AdminProductFormProps) {
  const isEditing = product !== null;

  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [originalPrice, setOriginalPrice] = useState(
    product?.originalPrice !== undefined ? String(product.originalPrice) : "",
  );
  const [category, setCategory] = useState<ProductCategory>(
    product?.category ?? productCategories[0],
  );
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");
  const [rooms, setRooms] = useState<ProductRoom[]>(
    product?.rooms ? [...product.rooms] : [],
  );
  const [imagesText, setImagesText] = useState(
    product?.images.join("\n") ?? "",
  );
  const [hoverImage, setHoverImage] = useState(product?.hoverImage ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [detailDescription, setDetailDescription] = useState(
    product?.detailDescription ?? "",
  );
  const [specificationsText, setSpecificationsText] = useState(
    Object.entries(product?.specifications ?? {})
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n"),
  );
  const [sizesText, setSizesText] = useState(
    product?.sizes
      ?.map((size) => {
        const stock = getStock(product.id, size.label);
        return [
          size.label,
          size.width,
          size.length,
          size.height,
          size.price ?? "",
          stock,
        ].join(", ");
      })
      .join("\n") ?? "",
  );
  const [stockText, setStockText] = useState(
    String(product && !product.sizes?.length ? getStock(product.id) : 10),
  );
  const initialSizesTextRef = useRef(sizesText);
  const initialStockTextRef = useRef(stockText);

  const [model3D, setModel3D] = useState(product?.model3D ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleRoom = (room: ProductRoom) => {
    setRooms((current) =>
      current.includes(room)
        ? current.filter((item) => item !== room)
        : [...current, room],
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const parsedPrice = Number(price);
    const parsedOriginalPrice = originalPrice.trim()
      ? Number(originalPrice)
      : undefined;
    const parsedStock = Number(stockText);

    const stockWasEdited =
      sizesText !== initialSizesTextRef.current ||
      stockText !== initialStockTextRef.current;

    if (!trimmedName) {
      setError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Giá bán phải lớn hơn 0.");
      return;
    }

    if (
      parsedOriginalPrice !== undefined &&
      (!Number.isFinite(parsedOriginalPrice) ||
        parsedOriginalPrice < parsedPrice)
    ) {
      setError("Giá gốc phải lớn hơn hoặc bằng giá bán.");
      return;
    }

    if (!subcategory.trim()) {
      setError("Vui lòng nhập danh mục phụ.");
      return;
    }

    const parsedSizes = parseSizes(sizesText);

    if (parsedSizes === null) {
      setError(
        "Thông tin kích thước không hợp lệ. Hãy kiểm tra định dạng từng dòng.",
      );
      return;
    }

    if (
      parsedSizes.length === 0 &&
      (!Number.isInteger(parsedStock) || parsedStock < 0)
    ) {
      setError("Tồn kho phải là số nguyên không âm.");
      return;
    }

    const images = imagesText
      .split("\n")
      .map((image) => image.trim())
      .filter(Boolean);

    const existingProducts = getProducts();

    const id =
      product?.id ??
      existingProducts.reduce((max, item) => Math.max(max, item.id), 0) + 1;

    const totalSizeStock = parsedSizes.reduce(
      (total, size) => total + (size.stock ?? 0),
      0,
    );

    const nextProduct: Product = {
      ...(product ?? {}),
      id,
      name: trimmedName,
      price: parsedPrice,
      ...(parsedOriginalPrice !== undefined
        ? { originalPrice: parsedOriginalPrice }
        : { originalPrice: undefined }),
      category,
      subcategory: subcategory.trim(),
      rooms,
      images,
      ...(hoverImage.trim()
        ? { hoverImage: hoverImage.trim() }
        : { hoverImage: undefined }),
      description: description.trim(),
      ...(detailDescription.trim()
        ? { detailDescription: detailDescription.trim() }
        : { detailDescription: undefined }),
      ...(Object.keys(parseSpecifications(specificationsText)).length
        ? { specifications: parseSpecifications(specificationsText) }
        : { specifications: undefined }),
      ...(parsedSizes.length ? { sizes: parsedSizes } : { sizes: undefined }),
      ...(model3D.trim()
        ? { model3D: model3D.trim() }
        : { model3D: undefined }),
      stock:
        isEditing && !stockWasEdited
          ? product.stock
          : parsedSizes.length
            ? totalSizeStock
            : parsedStock,

      inStock:
        isEditing && !stockWasEdited
          ? product.inStock
          : parsedSizes.length
            ? totalSizeStock > 0
            : parsedStock > 0,
    };

    setSaving(true);

    try {
      const saved = isEditing
        ? updateProduct(nextProduct)
        : addProduct(nextProduct);

      if (!saved) {
        setError(
          isEditing
            ? "Không thể cập nhật sản phẩm. Hãy kiểm tra lại dữ liệu."
            : "Không thể thêm sản phẩm. Có thể mã sản phẩm đã tồn tại.",
        );
        return;
      }

      if (stockWasEdited || !isEditing) {
        const stockUpdates: StockUpdate[] = parsedSizes.length
          ? parsedSizes.map((size) => ({
              productId: id,
              size: size.label,
              quantity: size.stock ?? 0,
            }))
          : [{ productId: id, quantity: parsedStock }];

        if (!setMultipleStock(stockUpdates)) {
          setError(
            "Thông tin sản phẩm đã lưu nhưng chưa cập nhật được tồn kho. Vui lòng kiểm tra lại tồn kho.",
          );
          return;
        }
      }

      onSaved();
    } catch (saveError) {
      console.error("Lỗi lưu sản phẩm:", saveError);
      setError("Đã xảy ra lỗi khi lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/45 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onCancel();
        }
      }}
    >
      <div className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-[#fdfcfb] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#e9e1da] px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8b8178]">
              NESTA ADMIN
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#2d261f] sm:text-2xl">
              {isEditing ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h2>
            <p className="mt-1 text-sm text-[#8b8178]">
              Nhập thông tin sản phẩm bên dưới.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Đóng biểu mẫu"
            className="rounded-lg px-3 py-2 text-xl text-[#71665d] hover:bg-[#f1ebe5] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <section>
            <h3 className="mb-4 font-semibold">Thông tin cơ bản</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className={labelClass}>
                Tên sản phẩm *
                <input
                  className={inputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  maxLength={200}
                  placeholder="Ví dụ: Sofa vải hiện đại"
                />
              </label>

              <label className={labelClass}>
                Danh mục *
                <select
                  className={inputClass}
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as ProductCategory)
                  }
                >
                  {productCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClass}>
                Danh mục phụ *
                <input
                  className={inputClass}
                  value={subcategory}
                  onChange={(event) => setSubcategory(event.target.value)}
                  required
                  placeholder="Ví dụ: Sofa băng"
                />
              </label>

              <label className={labelClass}>
                Giá bán (VNĐ) *
                <input
                  className={inputClass}
                  type="number"
                  min="1"
                  step="1"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  required
                />
              </label>

              <label className={labelClass}>
                Giá gốc (VNĐ)
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="1"
                  value={originalPrice}
                  onChange={(event) => setOriginalPrice(event.target.value)}
                  placeholder="Để trống nếu không giảm giá"
                />
              </label>

              <label className={labelClass}>
                Tồn kho (sản phẩm không có kích thước)
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="1"
                  value={stockText}
                  onChange={(event) => setStockText(event.target.value)}
                  disabled={sizesText.trim().length > 0}
                />
              </label>
            </div>

            <div className="mt-5">
              <p className={labelClass}>Không gian sử dụng</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {productRooms.map((room) => (
                  <label
                    key={room}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e9e1da] px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={rooms.includes(room)}
                      onChange={() => toggleRoom(room)}
                      className="accent-[#5a493d]"
                    />
                    {room}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-[#e9e1da] pt-5">
            <h3 className="mb-1 font-semibold">Hình ảnh sản phẩm</h3>
            <p className="mb-3 text-xs leading-5 text-[#8b8178]">
              Nhập đường dẫn ảnh, mỗi dòng một ảnh. Có thể dùng URL ảnh hoặc
              đường dẫn ảnh đã được ứng dụng cung cấp. Không nhập đường dẫn máy
              tính cá nhân như C:\...
            </p>

            <label className={labelClass}>
              Danh sách ảnh
              <textarea
                className={inputClass}
                rows={4}
                value={imagesText}
                onChange={(event) => setImagesText(event.target.value)}
                placeholder={
                  "https://example.com/product-1.jpg\nhttps://example.com/product-2.jpg"
                }
              />
            </label>

            <label className={`${labelClass} mt-4`}>
              Ảnh khi rê chuột (không bắt buộc)
              <input
                className={inputClass}
                value={hoverImage}
                onChange={(event) => setHoverImage(event.target.value)}
                placeholder="URL hoặc đường dẫn ảnh"
              />
            </label>

            {imagesText.trim() && (
              <div className="mt-3 flex flex-wrap gap-3">
                {imagesText
                  .split("\n")
                  .map((image) => image.trim())
                  .filter(Boolean)
                  .slice(0, 5)
                  .map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`Ảnh xem trước ${index + 1}`}
                      className="h-20 w-20 rounded-lg border border-[#e9e1da] object-cover"
                      onError={(event) => {
                        event.currentTarget.style.opacity = "0.25";
                      }}
                    />
                  ))}
              </div>
            )}
          </section>

          <section className="border-t border-[#e9e1da] pt-5">
            <h3 className="mb-1 font-semibold">Kích thước và tồn kho</h3>
            <p className="mb-3 text-xs leading-5 text-[#8b8178]">
              Mỗi dòng nhập theo thứ tự:
              <code className="mx-1 rounded bg-[#f1ebe5] px-1">
                Tên size, rộng, dài, cao, giá riêng, tồn kho
              </code>
              . Các số đo dùng đơn vị cm. Giá riêng có thể bỏ trống để dùng cơ
              chế tính giá theo kích thước của ứng dụng. Nếu sản phẩm không có
              size, để trống ô bên dưới và nhập tồn kho ở phần cơ bản.
            </p>

            <label className={labelClass}>
              Danh sách kích thước
              <textarea
                className={`${inputClass} font-mono`}
                rows={5}
                value={sizesText}
                onChange={(event) => setSizesText(event.target.value)}
                placeholder={
                  "1m6, 160, 200, 100, , 5\n1m8, 180, 200, 100, 6000000, 8"
                }
              />
            </label>
          </section>

          <section className="border-t border-[#e9e1da] pt-5">
            <h3 className="mb-4 font-semibold">Mô tả và thông số kỹ thuật</h3>

            <label className={labelClass}>
              Mô tả ngắn
              <textarea
                className={inputClass}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Mô tả ngắn hiển thị tại trang sản phẩm..."
              />
            </label>

            <label className={`${labelClass} mt-4`}>
              Mô tả chi tiết
              <textarea
                className={inputClass}
                rows={4}
                value={detailDescription}
                onChange={(event) => setDetailDescription(event.target.value)}
                placeholder="Thông tin chi tiết về chất liệu, thiết kế, cách sử dụng..."
              />
            </label>

            <label className={`${labelClass} mt-4`}>
              Thông số kỹ thuật
              <p className="mt-1 text-xs font-normal text-[#8b8178]">
                Mỗi dòng một thông số theo dạng: Tên thông số: Giá trị
              </p>
              <textarea
                className={`${inputClass} font-mono`}
                rows={4}
                value={specificationsText}
                onChange={(event) => setSpecificationsText(event.target.value)}
                placeholder={
                  "Chất liệu: Gỗ công nghiệp\nMàu sắc: Nâu gỗ\nBảo hành: 12 tháng"
                }
              />
            </label>

            <label className={`${labelClass} mt-4`}>
              Đường dẫn mô hình 3D (không bắt buộc)
              <input
                className={inputClass}
                value={model3D}
                onChange={(event) => setModel3D(event.target.value)}
                placeholder="Đường dẫn model GLB đã được ứng dụng cung cấp"
              />
            </label>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e9e1da] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="min-h-11 rounded-lg border border-[#ddd2c8] px-5 py-2.5 text-sm font-medium text-[#5a493d] hover:bg-[#f7f1ed] disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={saving}
              className="min-h-11 rounded-lg bg-[#5a493d] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#3b2f25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Đang lưu..."
                : isEditing
                  ? "Lưu thay đổi"
                  : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
