import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProducts,
  subscribeToProducts,
  updateProduct,
} from "../../utils/productStorage";
import { getAllStock, subscribeToStock } from "../../utils/stock";
import { productCategories, type Product } from "../../data/products";
import { useFeedback } from "../../components/feedback/useFeedback";
import AdminProductForm from "./AdminProductForm";
import AdminProductStockModal from "./AdminProductStockModal";

const LOW_STOCK_THRESHOLD = 5;

type ProductStatus =
  | "Còn hàng"
  | "Sắp hết hàng"
  | "Hết hàng"
  | "Ngừng kinh doanh";

const STATUS_OPTIONS: ProductStatus[] = [
  "Còn hàng",
  "Sắp hết hàng",
  "Hết hàng",
  "Ngừng kinh doanh",
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function getProductStock(
  product: Product,
  stockMap: Record<string, number>,
): number {
  if (product.sizes?.length) {
    return product.sizes.reduce(
      (total, size) => total + (stockMap[`${product.id}::${size.label}`] ?? 0),
      0,
    );
  }

  return stockMap[String(product.id)] ?? 0;
}

function getProductStatus(
  product: Product,
  stockMap: Record<string, number>,
): ProductStatus {
  if (product.discontinued) return "Ngừng kinh doanh";

  const stock = getProductStock(product, stockMap);

  if (stock <= 0) return "Hết hàng";
  if (stock <= LOW_STOCK_THRESHOLD) return "Sắp hết hàng";

  return "Còn hàng";
}

function getStatusClass(status: ProductStatus): string {
  switch (status) {
    case "Còn hàng":
      return "bg-green-50 text-green-700";
    case "Sắp hết hàng":
      return "bg-amber-50 text-amber-700";
    case "Hết hàng":
      return "bg-red-50 text-red-700";
    case "Ngừng kinh doanh":
      return "bg-gray-100 text-gray-600";
  }
}

export default function AdminProducts() {
  const { toast, confirm } = useFeedback();

  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [stockMap, setStockMap] = useState(() => getAllStock());

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [stockStatus, setStockStatus] = useState("Tất cả");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refreshProducts = useCallback(() => {
    setProducts(getProducts());
  }, []);

  const refreshStock = useCallback(() => {
    setStockMap(getAllStock());
  }, []);

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts(refreshProducts);
    const unsubscribeStock = subscribeToStock(refreshStock);

    return () => {
      unsubscribeProducts();
      unsubscribeStock();
    };
  }, [refreshProducts, refreshStock]);

  const filteredProducts = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);

    return products.filter((product) => {
      const matchesKeyword =
        !normalizedKeyword ||
        normalizeText(product.name).includes(normalizedKeyword) ||
        String(product.id).includes(normalizedKeyword) ||
        normalizeText(product.category).includes(normalizedKeyword) ||
        normalizeText(product.subcategory).includes(normalizedKeyword);

      const matchesCategory =
        category === "Tất cả" || product.category === category;

      const status = getProductStatus(product, stockMap);
      const matchesStatus = stockStatus === "Tất cả" || status === stockStatus;

      return matchesKeyword && matchesCategory && matchesStatus;
    });
  }, [products, stockMap, keyword, category, stockStatus]);

  const openCreateForm = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    refreshProducts();
    refreshStock();
  };

  const handleToggleDiscontinued = async (product: Product) => {
    const isDiscontinued = product.discontinued === true;

    const confirmed = await confirm({
      title: isDiscontinued
        ? "Khôi phục kinh doanh?"
        : "Ngừng kinh doanh sản phẩm?",
      message: isDiscontinued
        ? `Bạn có chắc muốn khôi phục "${product.name}"? Sản phẩm sẽ được hiển thị trở lại tại cửa hàng nếu còn hàng.`
        : `Bạn có chắc muốn ngừng kinh doanh "${product.name}"? Sản phẩm sẽ không còn được hiển thị để khách hàng mua, nhưng thông tin và tồn kho vẫn được giữ lại.`,
      confirmText: isDiscontinued ? "Khôi phục kinh doanh" : "Ngừng kinh doanh",
      danger: !isDiscontinued,
    });

    if (!confirmed) return;

    const updatedProduct: Product = {
      ...product,
      discontinued: !isDiscontinued,
    };

    if (!updateProduct(updatedProduct)) {
      toast(
        "Không thể cập nhật trạng thái sản phẩm. Vui lòng thử lại.",
        "error",
      );
      return;
    }

    refreshProducts();

    toast(
      isDiscontinued
        ? `Đã khôi phục kinh doanh "${product.name}".`
        : `Đã ngừng kinh doanh "${product.name}".`,
      "success",
    );
  };

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + getProductStock(product, stockMap),
    0,
  );

  const statusCounts = useMemo(() => {
    const counts: Record<ProductStatus, number> = {
      "Còn hàng": 0,
      "Sắp hết hàng": 0,
      "Hết hàng": 0,
      "Ngừng kinh doanh": 0,
    };

    products.forEach((product) => {
      counts[getProductStatus(product, stockMap)] += 1;
    });

    return counts;
  }, [products, stockMap]);

  const clearFilters = () => {
    setKeyword("");
    setCategory("Tất cả");
    setStockStatus("Tất cả");
  };

  const hasActiveFilters =
    keyword !== "" || category !== "Tất cả" || stockStatus !== "Tất cả";

  return (
    <div className="min-w-0 space-y-6 text-[#2d261f]">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-[#8b8178]">Quản trị / Sản phẩm</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
            Quản lý sản phẩm
          </h1>
          <p className="mt-2 text-sm text-[#8b8178]">
            Quản lý danh mục, giá bán và tình trạng tồn kho của NESTA.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#5a493d] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3b2f25]"
        >
          <span className="text-lg leading-none">+</span>
          Thêm sản phẩm
        </button>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e9e1da] bg-white p-5">
          <p className="text-sm text-[#8b8178]">Tổng sản phẩm</p>
          <p className="mt-2 text-2xl font-semibold">{totalProducts}</p>
          <p className="mt-1 text-xs text-[#8b8178]">
            Bao gồm cả sản phẩm ngừng kinh doanh
          </p>
        </div>

        <div className="rounded-xl border border-[#e9e1da] bg-white p-5">
          <p className="text-sm text-[#8b8178]">Tổng tồn kho</p>
          <p className="mt-2 text-2xl font-semibold">
            {totalStock.toLocaleString("vi-VN")}
          </p>
          <p className="mt-1 text-xs text-[#8b8178]">
            Tổng số lượng của các sản phẩm và kích thước
          </p>
        </div>

        <div className="rounded-xl border border-[#e9e1da] bg-white p-5">
          <p className="text-sm text-[#8b8178]">Sản phẩm cần bổ sung kho</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {statusCounts["Sắp hết hàng"] + statusCounts["Hết hàng"]}
          </p>
          <p className="mt-1 text-xs text-[#8b8178]">
            {statusCounts["Hết hàng"]} sản phẩm hết hàng
          </p>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="rounded-xl border border-[#e9e1da] bg-white p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-1">
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, mã hoặc danh mục..."
              className="min-h-11 w-full rounded-lg border border-[#e3dbd4] bg-[#fdfcfb] px-4 text-sm outline-none transition focus:border-[#5a493d]"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="min-h-11 rounded-lg border border-[#e3dbd4] bg-[#fdfcfb] px-4 text-sm outline-none focus:border-[#5a493d]"
          >
            <option value="Tất cả">Tất cả danh mục</option>
            {productCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={stockStatus}
            onChange={(event) => setStockStatus(event.target.value)}
            className="min-h-11 rounded-lg border border-[#e3dbd4] bg-[#fdfcfb] px-4 text-sm outline-none focus:border-[#5a493d]"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#8b8178]">
            Tìm thấy{" "}
            <strong className="text-[#2d261f]">
              {filteredProducts.length}
            </strong>{" "}
            / {totalProducts} sản phẩm
          </p>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-[#5a493d] underline underline-offset-4"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Bảng sản phẩm */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-y border-[#eee7e1] bg-[#faf8f6] text-[#71665d]">
                <th className="px-4 py-3 font-medium">Sản phẩm</th>
                <th className="px-4 py-3 font-medium">Danh mục</th>
                <th className="px-4 py-3 font-medium">Giá bán</th>
                <th className="px-4 py-3 font-medium">Tồn kho</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => {
                const stock = getProductStock(product, stockMap);
                const status = getProductStatus(product, stockMap);
                const image = product.images?.[0];

                return (
                  <tr
                    key={product.id}
                    className="border-b border-[#f0ebe6] transition hover:bg-[#fdfbf9]"
                  >
                    <td className="px-4 py-4">
                      <div className="flex min-w-[230px] items-center gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                            className="h-14 w-14 shrink-0 rounded-lg border border-[#eee7e1] bg-[#f7f5f2] object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#f7f5f2] text-xs text-[#8b8178]">
                            Không ảnh
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-medium text-[#2d261f]">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-[#8b8178]">
                            Mã SP: {product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <p>{product.category}</p>
                      <p className="mt-1 text-xs text-[#8b8178]">
                        {product.subcategory}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-medium">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={
                          stock <= 0
                            ? "font-medium text-red-600"
                            : stock <= LOW_STOCK_THRESHOLD
                              ? "font-medium text-amber-700"
                              : ""
                        }
                      >
                        {stock.toLocaleString("vi-VN")}
                      </span>
                      <span className="ml-1 text-xs text-[#8b8178]">sp</span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(status)}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(product)}
                          className="rounded-md border border-[#ddd2c8] px-3 py-2 text-xs font-medium text-[#5a493d] transition hover:bg-[#f7f1ed]"
                        >
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => setStockProduct(product)}
                          className="whitespace-nowrap rounded-md border border-[#ddd2c8] px-3 py-2 text-xs font-medium text-[#5a493d] transition hover:bg-[#f7f1ed]"
                        >
                          Quản lý kho
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDiscontinued(product)}
                          className={`whitespace-nowrap rounded-md border px-3 py-2 text-xs font-medium transition ${
                            product.discontinued
                              ? "border-green-200 text-green-700 hover:bg-green-50"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {product.discontinued
                            ? "Khôi phục"
                            : "Ngừng kinh doanh"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="font-medium">Không tìm thấy sản phẩm</p>
                    <p className="mt-1 text-sm text-[#8b8178]">
                      Hãy thử từ khóa khác hoặc thay đổi bộ lọc.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <AdminProductForm
          product={editingProduct}
          onCancel={closeForm}
          onSaved={() => {
            const wasEditing = Boolean(editingProduct);
            closeForm();
            toast(
              wasEditing ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm mới.",
              "success",
            );
          }}
        />
      )}

      {stockProduct && (
        <AdminProductStockModal
          product={stockProduct}
          stockMap={stockMap}
          onClose={() => setStockProduct(null)}
          onSaved={() => {
            setStockProduct(null);
            refreshProducts();
            refreshStock();
            toast("Đã cập nhật tồn kho sản phẩm.", "success");
          }}
        />
      )}
    </div>
  );
}
