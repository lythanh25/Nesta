import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteProduct,
  getProducts,
  subscribeToProducts,
  updateProduct,
} from "../../utils/productStorage";
import {
  getAllStock,
  removeStockForProduct,
  setMultipleStock,
  subscribeToStock,
  type StockUpdate,
} from "../../utils/stock";
import { productCategories, type Product } from "../../data/products";
import AdminProductForm from "./AdminProductForm";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);

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

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [stockMap, setStockMap] = useState(() => getAllStock());
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
    const normalizedKeyword = keyword.trim().toLowerCase();

    return products.filter((product) => {
      const matchesKeyword =
        !normalizedKeyword ||
        product.name.toLowerCase().includes(normalizedKeyword) ||
        String(product.id).includes(normalizedKeyword) ||
        product.subcategory.toLowerCase().includes(normalizedKeyword);

      const matchesCategory =
        category === "Tất cả" || product.category === category;

      return matchesKeyword && matchesCategory;
    });
  }, [products, keyword, category]);

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

  const handleMarkOutOfStock = (product: Product) => {
    if (product.sizes?.length) {
      const updates: StockUpdate[] = product.sizes.map((size) => ({
        productId: product.id,
        size: size.label,
        quantity: 0,
      }));

      if (!setMultipleStock(updates)) {
        window.alert("Không thể cập nhật tồn kho. Vui lòng thử lại.");
        return;
      }
    } else if (!setMultipleStock([{ productId: product.id, quantity: 0 }])) {
      window.alert("Không thể cập nhật tồn kho. Vui lòng thử lại.");
      return;
    }

    const updatedProduct: Product = {
      ...product,
      stock: 0,
      inStock: false,
      ...(product.sizes?.length
        ? {
            sizes: product.sizes.map((size) => ({
              ...size,
              stock: 0,
            })),
          }
        : {}),
    };

    if (!updateProduct(updatedProduct)) {
      // Tồn kho đã được đặt về 0; thông báo nếu không lưu được thông tin sản phẩm.
      refreshProducts();
      refreshStock();
      window.alert(
        "Tồn kho đã được đặt về 0, nhưng không thể lưu trạng thái sản phẩm. Vui lòng kiểm tra lại.",
      );
      return;
    }

    refreshProducts();
    refreshStock();
    window.alert(`Đã đánh dấu "${product.name}" hết hàng.`);
  };

  const handleDelete = (product: Product) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn XÓA HẲN "${product.name}" khỏi danh mục sản phẩm không? Thao tác này không thể hoàn tác bằng nút Sửa.`,
    );

    if (!confirmed) return;

    if (!deleteProduct(product.id)) {
      refreshProducts();
      refreshStock();
      window.alert("Không thể xóa sản phẩm. Vui lòng thử lại.");
      return;
    }

    const stockRemoved = removeStockForProduct(product.id);

    refreshProducts();
    refreshStock();

    if (!stockRemoved) {
      window.alert(
        "Sản phẩm đã được xóa nhưng dữ liệu tồn kho cũ chưa được dọn sạch.",
      );
      return;
    }

    window.alert("Đã xóa hẳn sản phẩm khỏi danh mục ứng dụng.");
  };

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (total, product) => total + getProductStock(product, stockMap),
    0,
  );

  const outOfStock = products.filter(
    (product) => getProductStock(product, stockMap) <= 0,
  ).length;

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#e9e1da] bg-white p-5">
          <p className="text-sm text-[#8b8178]">Tổng sản phẩm</p>
          <p className="mt-2 text-2xl font-semibold">{totalProducts}</p>
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
          <p className="text-sm text-[#8b8178]">Sản phẩm hết hàng</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">
            {outOfStock}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#e9e1da] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên, mã hoặc danh mục phụ..."
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
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-[#8b8178]">
            Tìm thấy{" "}
            <strong className="text-[#2d261f]">
              {filteredProducts.length}
            </strong>{" "}
            sản phẩm
          </p>

          {(keyword || category !== "Tất cả") && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setCategory("Tất cả");
              }}
              className="text-sm font-medium text-[#5a493d] underline underline-offset-4"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

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
                const image = product.images[0];

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
                        className={stock <= 0 ? "font-medium text-red-600" : ""}
                      >
                        {stock}
                      </span>
                      <span className="ml-1 text-xs text-[#8b8178]">sp</span>
                    </td>

                    <td className="px-4 py-4">
                      {stock > 0 ? (
                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          Còn hàng
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                          Hết hàng
                        </span>
                      )}
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

                        {stock > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMarkOutOfStock(product)}
                            className="whitespace-nowrap rounded-md border border-amber-200 px-3 py-2 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                          >
                            Hết hàng
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Xóa hẳn
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
                      Hãy thử từ khóa khác hoặc thay đổi danh mục.
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
            refreshProducts();
            refreshStock();
            closeForm();
          }}
        />
      )}
    </div>
  );
}
