import { products, type Product } from "../data/products";

export const PRODUCT_STORAGE_KEY = "nesta-products";
export const PRODUCTS_UPDATED_EVENT = "productsUpdated";

let cachedRaw: string | null | undefined;
let cachedProducts: Product[] | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<Product>;

  return (
    Number.isInteger(item.id) &&
    Number(item.id) > 0 &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.category === "string" &&
    typeof item.subcategory === "string" &&
    Array.isArray(item.images)
  );
}

function normalizeProducts(value: unknown): Product[] | null {
  if (!Array.isArray(value) || !value.every(isProduct)) {
    return null;
  }

  const ids = new Set<number>();

  for (const product of value) {
    if (ids.has(product.id)) return null;
    ids.add(product.id);
  }

  return value as Product[];
}

function invalidateCache(): void {
  cachedRaw = undefined;
  cachedProducts = null;
}

/** Đọc danh sách sản phẩm, chỉ parse JSON khi dữ liệu lưu đã thay đổi. */
export function getProducts(): Product[] {
  if (!isBrowser()) return products;

  try {
    const raw = window.localStorage.getItem(PRODUCT_STORAGE_KEY);

    if (raw === cachedRaw && cachedProducts !== null) {
      return cachedProducts;
    }

    if (!raw) {
      cachedRaw = raw;
      cachedProducts = products;
      return products;
    }

    const parsed: unknown = JSON.parse(raw);
    const normalized = normalizeProducts(parsed);

    cachedRaw = raw;
    cachedProducts = normalized ?? products;

    return cachedProducts;
  } catch (error) {
    console.error("Không thể đọc danh sách sản phẩm NESTA:", error);
    invalidateCache();
    return products;
  }
}

export function getProductById(productId: number): Product | undefined {
  return getProducts().find((product) => product.id === productId);
}

function notifyProductsUpdated(): void {
  if (!isBrowser()) return;

  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT));
}

export function saveProducts(nextProducts: Product[]): boolean {
  if (!isBrowser()) return false;

  const normalized = normalizeProducts(nextProducts);

  if (!normalized) {
    console.error("Danh sách sản phẩm không hợp lệ hoặc bị trùng ID.");
    return false;
  }

  try {
    const raw = JSON.stringify(normalized);
    window.localStorage.setItem(PRODUCT_STORAGE_KEY, raw);

    cachedRaw = raw;
    cachedProducts = normalized;

    notifyProductsUpdated();
    return true;
  } catch (error) {
    console.error("Không thể lưu danh sách sản phẩm NESTA:", error);
    return false;
  }
}

export function addProduct(product: Product): boolean {
  if (!isProduct(product)) return false;

  const currentProducts = getProducts();

  if (currentProducts.some((item) => item.id === product.id)) {
    return false;
  }

  return saveProducts([...currentProducts, product]);
}

export function updateProduct(updatedProduct: Product): boolean {
  if (!isProduct(updatedProduct)) return false;

  const currentProducts = getProducts();
  const index = currentProducts.findIndex(
    (item) => item.id === updatedProduct.id,
  );

  if (index === -1) return false;

  const nextProducts = [...currentProducts];
  nextProducts[index] = updatedProduct;

  return saveProducts(nextProducts);
}

export function deleteProduct(productId: number): boolean {
  const currentProducts = getProducts();

  if (!currentProducts.some((item) => item.id === productId)) {
    return false;
  }

  return saveProducts(
    currentProducts.filter((product) => product.id !== productId),
  );
}

export function subscribeToProducts(callback: () => void): () => void {
  if (!isBrowser()) return () => {};

  const handleProductsUpdated = () => callback();

  const handleStorage = (event: StorageEvent) => {
    if (event.key === PRODUCT_STORAGE_KEY || event.key === null) {
      invalidateCache();
      callback();
    }
  };

  window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    window.removeEventListener("storage", handleStorage);
  };
}

export function resetProducts(): boolean {
  if (!isBrowser()) return false;

  try {
    window.localStorage.removeItem(PRODUCT_STORAGE_KEY);
    invalidateCache();
    notifyProductsUpdated();
    return true;
  } catch (error) {
    console.error("Không thể đặt lại danh sách sản phẩm NESTA:", error);
    return false;
  }
}
