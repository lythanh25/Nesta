import { useMemo, useState } from "react";
import type { Product } from "../../data/products";
import { setMultipleStock, type StockUpdate } from "../../utils/stock";
import { updateProduct } from "../../utils/productStorage";

type Props = {
  product: Product;
  stockMap: Record<string, number>;
  onClose: () => void;
  onSaved: () => void;
};

export default function AdminProductStockModal({
  product,
  stockMap,
  onClose,
  onSaved,
}: Props) {
  const hasSizes = Boolean(product.sizes?.length);

  const initialStock = useMemo(() => {
    if (hasSizes && product.sizes) {
      return Object.fromEntries(
        product.sizes.map((size) => [
          size.label,
          stockMap[`${product.id}::${size.label}`] ?? 0,
        ]),
      );
    }

    return {
      default: stockMap[String(product.id)] ?? 0,
    };
  }, [product, stockMap, hasSizes]);

  const [quantities, setQuantities] =
    useState<Record<string, number>>(initialStock);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const totalStock = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0,
  );

  const handleQuantityChange = (key: string, value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setQuantities((current) => ({
      ...current,
      [key]: value === "" ? 0 : Number(value),
    }));

    setError("");
  };

  const handleSetAllToZero = () => {
    setQuantities((current) =>
      Object.fromEntries(Object.keys(current).map((key) => [key, 0])),
    );
    setError("");
  };

  const handleSetSizeToZero = (sizeLabel: string) => {
    setQuantities((current) => ({
      ...current,
      [sizeLabel]: 0,
    }));
  };

  const handleSave = () => {
    const values = Object.values(quantities);

    if (
      values.some(
        (quantity) =>
          !Number.isFinite(quantity) ||
          !Number.isInteger(quantity) ||
          quantity < 0,
      )
    ) {
      setError("Số lượng tồn kho phải là số nguyên không âm.");
      return;
    }

    const updates: StockUpdate[] = hasSizes
      ? (product.sizes ?? []).map((size) => ({
          productId: product.id,
          size: size.label,
          quantity: quantities[size.label] ?? 0,
        }))
      : [
          {
            productId: product.id,
            quantity: quantities.default ?? 0,
          },
        ];

    setSaving(true);
    setError("");

    const stockSaved = setMultipleStock(updates);

    if (!stockSaved) {
      setSaving(false);
      setError("Không thể cập nhật tồn kho. Vui lòng thử lại.");
      return;
    }

    const updatedProduct: Product = {
      ...product,
      stock: totalStock,
      inStock: totalStock > 0,
      ...(hasSizes
        ? {
            sizes: product.sizes?.map((size) => ({
              ...size,
              stock: quantities[size.label] ?? 0,
            })),
          }
        : {}),
    };

    if (!updateProduct(updatedProduct)) {
      setSaving(false);
      setError(
        "Tồn kho đã được cập nhật nhưng không thể lưu thông tin sản phẩm. Vui lòng kiểm tra lại.",
      );
      return;
    }

    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#eee7e1] bg-white px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-[#9a8d82]">
              Quản lý sản phẩm
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#2d261f]">
              Quản lý tồn kho
            </h2>
            <p className="mt-1 text-sm text-[#8b8178]">
              {product.name} · Mã SP: {product.id}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Đóng cửa sổ"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[#8b8178] transition hover:bg-[#f7f5f2] hover:text-[#2d261f] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="rounded-xl bg-[#f8f5f2] p-4">
            <p className="text-sm text-[#8b8178]">Tổng tồn kho sau cập nhật</p>
            <p className="mt-1 text-2xl font-semibold text-[#2d261f]">
              {totalStock.toLocaleString("vi-VN")}
              <span className="ml-2 text-sm font-normal text-[#8b8178]">
                sản phẩm
              </span>
            </p>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-medium text-[#2d261f]">
                  {hasSizes ? "Tồn kho theo kích thước" : "Số lượng tồn kho"}
                </h3>
                <p className="mt-1 text-xs text-[#8b8178]">
                  Nhập số lượng thực tế hiện có trong kho.
                </p>
              </div>

              {hasSizes && (
                <button
                  type="button"
                  onClick={handleSetAllToZero}
                  className="text-xs font-medium text-red-600 underline underline-offset-4 transition hover:text-red-700"
                >
                  Đặt tất cả về 0
                </button>
              )}
            </div>

            <div className="space-y-3">
              {hasSizes ? (
                product.sizes?.map((size) => (
                  <div
                    key={size.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#eee7e1] p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#2d261f]">{size.label}</p>
                      <p className="mt-1 text-xs text-[#8b8178]">
                        {size.width} × {size.length} × {size.height} cm
                      </p>
                      <p className="mt-1 text-xs text-[#8b8178]">
                        Hiện có:{" "}
                        {(
                          stockMap[`${product.id}::${size.label}`] ?? 0
                        ).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={quantities[size.label] ?? 0}
                        onChange={(event) =>
                          handleQuantityChange(size.label, event.target.value)
                        }
                        aria-label={`Tồn kho kích thước ${size.label}`}
                        className="h-10 w-20 rounded-lg border border-[#e3dbd4] bg-[#fdfcfb] px-3 text-center text-sm outline-none focus:border-[#5a493d]"
                      />

                      <button
                        type="button"
                        onClick={() => handleSetSizeToZero(size.label)}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Hết
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-[#eee7e1] p-4">
                  <p className="mb-2 text-sm text-[#8b8178]">
                    Tồn kho hiện tại:{" "}
                    <strong className="text-[#2d261f]">
                      {(stockMap[String(product.id)] ?? 0).toLocaleString(
                        "vi-VN",
                      )}
                    </strong>
                  </p>

                  <label
                    htmlFor="product-stock-quantity"
                    className="mb-2 block text-sm font-medium text-[#2d261f]"
                  >
                    Số lượng mới
                  </label>

                  <input
                    id="product-stock-quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={quantities.default ?? 0}
                    onChange={(event) =>
                      handleQuantityChange("default", event.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-[#e3dbd4] bg-[#fdfcfb] px-4 text-sm outline-none focus:border-[#5a493d]"
                  />
                </div>
              )}
            </div>
          </div>

          {totalStock === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tồn kho bằng 0. Sản phẩm sẽ được hiển thị là hết hàng, nhưng vẫn
              được giữ lại trong danh mục quản trị.
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#eee7e1] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-10 rounded-lg border border-[#ddd2c8] px-5 py-2 text-sm font-medium text-[#5a493d] transition hover:bg-[#f7f5f2] disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-h-10 rounded-lg bg-[#5a493d] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#3b2f25] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
