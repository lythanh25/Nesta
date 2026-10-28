import type { Product } from "../data/products";
import { getProducts } from "./productStorage";

// =========================================================
// 1. CONSTANTS & TYPES
// =========================================================

export const STOCK_STORAGE_KEY = "nesta-stock";
export const STOCK_UPDATED_EVENT = "stockUpdated";

export type StockMap = Record<string, number>;

export type StockChange = {
  productId: number;
  size?: string;
  previousStock: number;
  stock: number;
};

export type StockValidationResult = {
  valid: boolean;
  productId?: number;
  size?: string;
  requested?: number;
  available?: number;
  message?: string;
};

export type StockOrderItem = {
  productId: number;
  quantity: number;
  size?: string;
};

export type StockUpdate = {
  productId: number;
  quantity: number;
  size?: string;
};

// =========================================================
// 2. BASIC HELPERS
// =========================================================

function normalizeStock(value: unknown): number {
  const stock = Number(value);

  if (!Number.isFinite(stock)) {
    return 0;
  }

  return Math.max(0, Math.floor(stock));
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStockProduct(productId: number): Product | undefined {
  return getProducts().find((product) => product.id === productId);
}

/**
 * Khóa tồn kho:
 * - Có size:  productId::size
 * - Không có size: productId
 */
function getStockKey(productId: number, size?: string): string | null {
  const product = getStockProduct(productId);

  if (!product) {
    return null;
  }

  if (product.sizes?.length) {
    if (!size) {
      return null;
    }

    const matchedSize = product.sizes.find((item) => item.label === size);

    if (!matchedSize) {
      return null;
    }

    return `${productId}::${matchedSize.label}`;
  }

  // Sản phẩm không có size thì không sử dụng khóa theo size.
  if (size) {
    return null;
  }

  return String(productId);
}

/**
 * Lấy tồn kho mặc định từ danh sách sản phẩm hiện tại.
 *
 * Sản phẩm có size: lấy stock của đúng size.
 * Sản phẩm không có size: lấy product.stock.
 */

export function getInitialStock(productId: number, size?: string): number {
  const product = getStockProduct(productId);

  if (!product) {
    return 0;
  }

  // Sản phẩm đã được đánh dấu hết hàng thì tồn kho mặc định bằng 0.
  if (product.inStock === false) {
    return 0;
  }

  if (product.sizes?.length) {
    if (!size) {
      // Không có size cụ thể: tổng tồn kho các size.
      return product.sizes.reduce(
        (total, item) => total + normalizeStock(item.stock ?? 0),
        0,
      );
    }

    const matchedSize = product.sizes.find((item) => item.label === size);

    return matchedSize ? normalizeStock(matchedSize.stock ?? 0) : 0;
  }

  if (product.stock !== undefined) {
    return normalizeStock(product.stock);
  }

  return 10;
}

// =========================================================
// 3. READ & WRITE LOCAL STORAGE
// =========================================================

/**
 * Đọc tồn kho đã lưu.
 *
 * Với sản phẩm có size, chỉ chấp nhận khóa productId::size.
 * Dữ liệu cũ dạng productId sẽ bị bỏ qua cho các sản phẩm có size,
 * tránh lấy tồn kho tổng cũ áp dụng nhầm cho từng kích thước.
 */

export function getStockMap(): StockMap {
  if (!isBrowser()) return {};

  try {
    const raw = window.localStorage.getItem(STOCK_STORAGE_KEY);

    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    // Chỉ đọc danh mục một lần cho toàn bộ lượt kiểm tra.
    const products = getProducts();
    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    const result: StockMap = {};

    for (const [key, value] of Object.entries(parsed)) {
      const stock = Number(value);

      if (!Number.isFinite(stock) || stock < 0) continue;

      const normalized = Math.floor(stock);
      const sizeKeyMatch = key.match(/^(\d+)::(.+)$/);

      if (sizeKeyMatch) {
        const productId = Number(sizeKeyMatch[1]);
        const size = sizeKeyMatch[2];
        const product = productsById.get(productId);

        if (
          !product?.sizes?.length ||
          !product.sizes.some((item) => item.label === size)
        ) {
          continue;
        }

        result[key] = normalized;
        continue;
      }

      if (!/^\d+$/.test(key)) continue;

      const productId = Number(key);
      const product = productsById.get(productId);

      if (!product || product.sizes?.length) continue;

      result[key] = normalized;
    }

    return result;
  } catch (error) {
    console.error("Không thể đọc dữ liệu tồn kho NESTA:", error);
    return {};
  }
}

function persistStockMap(stockMap: StockMap): boolean {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockMap));

    return true;
  } catch (error) {
    console.error("Không thể lưu dữ liệu tồn kho NESTA:", error);
    return false;
  }
}

function notifyStockUpdated(changes: StockChange[]): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<StockChange[]>(STOCK_UPDATED_EVENT, {
      detail: changes,
    }),
  );
}

// =========================================================
// 4. GET STOCK
// =========================================================

/**
 * Lấy tồn kho hiện tại.
 *
 * - getStock(id, size): tồn kho của một size.
 * - getStock(id): tổng tồn kho các size nếu sản phẩm có size;
 *   nếu không có size thì trả về tồn kho của sản phẩm.
 *
 * Lưu ý: khi kiểm tra giỏ hàng hoặc checkout, sản phẩm có size
 * bắt buộc phải truyền size cụ thể.
 */
export function getStock(productId: number, size?: string): number {
  const product = getStockProduct(productId);

  if (!product) {
    return 0;
  }

  if (product.sizes?.length && !size) {
    return product.sizes.reduce(
      (total, item) => total + getStock(productId, item.label),
      0,
    );
  }

  const key = getStockKey(productId, size);

  if (!key) {
    return 0;
  }

  const stockMap = getStockMap();
  const savedStock = stockMap[key];

  if (savedStock !== undefined) {
    return savedStock;
  }

  return getInitialStock(productId, size);
}

export function getProductStock(productId: number, size?: string): number {
  return getStock(productId, size);
}

export function isInStock(productId: number, size?: string): boolean {
  return getStock(productId, size) > 0;
}

export function hasEnoughStock(
  productId: number,
  quantity: number,
  size?: string,
): boolean {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return false;
  }

  const product = getStockProduct(productId);

  if (!product) {
    return false;
  }

  if (product.sizes?.length && !size) {
    return false;
  }

  return getStock(productId, size) >= quantity;
}

/**
 * Trả về bản đồ tồn kho:
 * - Sản phẩm có size: khóa "productId::sizeLabel".
 * - Sản phẩm không có size: khóa "productId".
 */
export function getAllStock(): StockMap {
  const savedStock = getStockMap();
  const result: StockMap = {};

  for (const product of getProducts()) {
    if (product.sizes?.length) {
      for (const size of product.sizes) {
        const key = `${product.id}::${size.label}`;

        result[key] =
          savedStock[key] ?? getInitialStock(product.id, size.label);
      }
    } else {
      const key = String(product.id);

      result[key] = savedStock[key] ?? getInitialStock(product.id);
    }
  }

  return result;
}

// =========================================================
// 5. VALIDATE STOCK
// =========================================================

export function validateStock(
  productId: number,
  quantity: number,
  size?: string,
): StockValidationResult {
  const product = getStockProduct(productId);

  if (!product) {
    return {
      valid: false,
      productId,
      size,
      message: "Sản phẩm không tồn tại hoặc đã bị xóa.",
    };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return {
      valid: false,
      productId,
      size,
      requested: quantity,
      message: "Số lượng sản phẩm phải là số nguyên lớn hơn 0.",
    };
  }

  if (product.sizes?.length && !size) {
    return {
      valid: false,
      productId,
      requested: quantity,
      message: "Vui lòng chọn kích thước sản phẩm.",
    };
  }

  if (size && !getStockKey(productId, size)) {
    return {
      valid: false,
      productId,
      size,
      requested: quantity,
      message: "Kích thước sản phẩm không hợp lệ.",
    };
  }

  const available = getStock(productId, size);

  if (available <= 0) {
    return {
      valid: false,
      productId,
      size,
      requested: quantity,
      available,
      message: "Sản phẩm hoặc kích thước này hiện đã hết hàng.",
    };
  }

  if (quantity > available) {
    return {
      valid: false,
      productId,
      size,
      requested: quantity,
      available,
      message: `Chỉ còn ${available} sản phẩm trong kho.`,
    };
  }

  return {
    valid: true,
    productId,
    size,
    requested: quantity,
    available,
  };
}

/**
 * Gộp số lượng theo cặp productId + size.
 * Hai size khác nhau không bị gộp chung.
 */
function aggregateItems(
  items: StockOrderItem[],
): Map<string, StockOrderItem> | null {
  const aggregated = new Map<string, StockOrderItem>();

  for (const item of items) {
    if (
      !Number.isInteger(item.productId) ||
      item.productId <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      return null;
    }

    const product = getStockProduct(item.productId);

    if (!product) {
      return null;
    }

    if (product.sizes?.length) {
      if (
        !item.size ||
        !product.sizes.some((size) => size.label === item.size)
      ) {
        return null;
      }
    } else if (item.size) {
      return null;
    }

    const key = getStockKey(item.productId, item.size);

    if (!key) {
      return null;
    }

    const existing = aggregated.get(key);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      aggregated.set(key, { ...item });
    }
  }

  return aggregated;
}

export function validateStockItems(
  items: StockOrderItem[],
): StockValidationResult {
  if (items.length === 0) {
    return {
      valid: false,
      message: "Giỏ hàng hiện không có sản phẩm.",
    };
  }

  const aggregated = aggregateItems(items);

  if (!aggregated) {
    return {
      valid: false,
      message: "Thông tin sản phẩm, kích thước hoặc số lượng không hợp lệ.",
    };
  }

  for (const item of aggregated.values()) {
    const result = validateStock(item.productId, item.quantity, item.size);

    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

// =========================================================
// 6. SET STOCK - ADMIN
// =========================================================

export function setStock(
  productId: number,
  quantity: number,
  size?: string,
): boolean {
  const key = getStockKey(productId, size);

  if (!key) {
    console.error(
      "Không tìm thấy sản phẩm hoặc kích thước tồn kho không hợp lệ.",
    );
    return false;
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    console.error("Tồn kho phải là số nguyên không âm.");
    return false;
  }

  const previousStock = getStock(productId, size);
  const stockMap = getStockMap();

  stockMap[key] = quantity;

  if (!persistStockMap(stockMap)) {
    return false;
  }

  notifyStockUpdated([
    {
      productId,
      size,
      previousStock,
      stock: quantity,
    },
  ]);

  return true;
}

export function setMultipleStock(updates: StockUpdate[]): boolean {
  if (updates.length === 0) {
    return true;
  }

  const seen = new Set<string>();

  for (const update of updates) {
    const key = getStockKey(update.productId, update.size);

    if (
      !key ||
      !Number.isInteger(update.quantity) ||
      update.quantity < 0 ||
      seen.has(key)
    ) {
      return false;
    }

    seen.add(key);
  }

  const previousStocks = updates.map((update) => ({
    ...update,
    previousStock: getStock(update.productId, update.size),
  }));

  const stockMap = getStockMap();

  for (const update of updates) {
    const key = getStockKey(update.productId, update.size);

    if (!key) {
      return false;
    }

    stockMap[key] = update.quantity;
  }

  if (!persistStockMap(stockMap)) {
    return false;
  }

  notifyStockUpdated(
    previousStocks.map((update) => ({
      productId: update.productId,
      size: update.size,
      previousStock: update.previousStock,
      stock: update.quantity,
    })),
  );

  return true;
}

export function removeStockForProduct(productId: number): boolean {
  if (!isBrowser() || !Number.isInteger(productId) || productId <= 0) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(STOCK_STORAGE_KEY);

    if (!raw) {
      return true;
    }

    const parsed: unknown = JSON.parse(raw);

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return false;
    }

    const stockMap = { ...(parsed as Record<string, unknown>) };
    const prefix = `${productId}::`;
    const changes: StockChange[] = [];

    for (const [key, value] of Object.entries(stockMap)) {
      if (key !== String(productId) && !key.startsWith(prefix)) {
        continue;
      }

      const previousStock = normalizeStock(value);

      if (key.startsWith(prefix)) {
        changes.push({
          productId,
          size: key.slice(prefix.length),
          previousStock,
          stock: 0,
        });
      } else {
        changes.push({
          productId,
          previousStock,
          stock: 0,
        });
      }

      delete stockMap[key];
    }

    window.localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stockMap));

    notifyStockUpdated(changes);
    return true;
  } catch (error) {
    console.error("Không thể xóa dữ liệu tồn kho của sản phẩm:", error);
    return false;
  }
}

/**
 * Thay thế toàn bộ dữ liệu tồn kho của một sản phẩm.
 *
 * - Sản phẩm có size: chỉ lưu tồn kho theo từng size hiện tại.
 * - Sản phẩm không có size: chỉ lưu tồn kho chung.
 * - Xóa các khóa cũ khi size bị đổi tên hoặc xóa.
 * - Giữ nguyên tồn kho của các sản phẩm khác.
 */
export function replaceStockForProduct(
  productId: number,
  updates: StockUpdate[],
): boolean {
  if (!isBrowser() || !Number.isInteger(productId) || productId <= 0) {
    return false;
  }

  const product = getStockProduct(productId);

  if (!product) {
    return false;
  }

  const seen = new Set<string>();

  // Kiểm tra dữ liệu trước khi thay đổi.
  for (const update of updates) {
    if (
      update.productId !== productId ||
      !Number.isInteger(update.quantity) ||
      update.quantity < 0
    ) {
      return false;
    }

    const key = getStockKey(update.productId, update.size);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
  }

  // Bắt buộc cung cấp đủ tồn kho cho cấu trúc sản phẩm hiện tại.
  if (product.sizes?.length) {
    if (
      updates.length !== product.sizes.length ||
      product.sizes.some(
        (size) => !updates.some((update) => update.size === size.label),
      )
    ) {
      return false;
    }
  } else if (updates.length !== 1 || updates[0].size !== undefined) {
    return false;
  }

  try {
    const raw = window.localStorage.getItem(STOCK_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};

    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return false;
    }

    const stockMap: StockMap = {};

    for (const [key, value] of Object.entries(parsed)) {
      const stock = Number(value);

      if (Number.isFinite(stock) && stock >= 0) {
        stockMap[key] = Math.floor(stock);
      }
    }
    const prefix = `${productId}::`;

    // Lấy tồn kho cũ để phát thông báo chính xác.
    const previousStock = new Map<string, number>();

    for (const [key, value] of Object.entries(stockMap)) {
      if (key === String(productId) || key.startsWith(prefix)) {
        previousStock.set(key, normalizeStock(value));
        delete stockMap[key];
      }
    }

    const changes: StockChange[] = [];

    for (const update of updates) {
      const key = update.size
        ? `${productId}::${update.size}`
        : String(productId);

      const oldStock = previousStock.get(key);

      stockMap[key] = update.quantity;

      changes.push({
        productId,
        size: update.size,
        previousStock:
          oldStock ??
          (update.size
            ? normalizeStock(
                product.sizes?.find((size) => size.label === update.size)
                  ?.stock ?? 0,
              )
            : normalizeStock(product.stock ?? 0)),
        stock: update.quantity,
      });
    }

    if (!window.localStorage.setItem || !persistStockMap(stockMap)) {
      return false;
    }

    // Thông báo các size cũ đã bị xóa hoặc đổi tên.
    for (const [key, oldStock] of previousStock) {
      const stillExists = updates.some((update) => {
        const updateKey = update.size
          ? `${productId}::${update.size}`
          : String(productId);

        return updateKey === key;
      });

      if (!stillExists) {
        changes.push({
          productId,
          size: key.startsWith(prefix) ? key.slice(prefix.length) : undefined,
          previousStock: oldStock,
          stock: 0,
        });
      }
    }

    notifyStockUpdated(changes);
    return true;
  } catch (error) {
    console.error("Không thể đồng bộ tồn kho sản phẩm:", error);
    return false;
  }
}

// =========================================================
// 7. DEDUCT STOCK - CHECKOUT
// =========================================================

/**
 * Kiểm tra toàn bộ đơn hàng trước khi trừ kho.
 * Chỉ lưu thay đổi khi tất cả sản phẩm và size đều đủ hàng.
 */
export function deductStock(items: StockOrderItem[]): StockValidationResult {
  if (items.length === 0) {
    return {
      valid: false,
      message: "Không có sản phẩm để trừ tồn kho.",
    };
  }

  const aggregated = aggregateItems(items);

  if (!aggregated) {
    return {
      valid: false,
      message: "Thông tin sản phẩm, kích thước hoặc số lượng không hợp lệ.",
    };
  }

  const currentStock = getAllStock();

  // Kiểm tra tất cả dòng hàng trước khi thay đổi tồn kho.
  for (const [key, item] of aggregated) {
    const available = currentStock[key] ?? 0;

    if (available < item.quantity) {
      return {
        valid: false,
        productId: item.productId,
        size: item.size,
        requested: item.quantity,
        available,
        message:
          available <= 0
            ? "Sản phẩm hoặc kích thước này hiện đã hết hàng."
            : `Chỉ còn ${available} sản phẩm trong kho.`,
      };
    }
  }

  const nextStock: StockMap = { ...currentStock };
  const changes: StockChange[] = [];

  for (const [key, item] of aggregated) {
    const previousStock = currentStock[key] ?? 0;
    const stock = previousStock - item.quantity;

    nextStock[key] = stock;

    changes.push({
      productId: item.productId,
      size: item.size,
      previousStock,
      stock,
    });
  }

  if (!persistStockMap(nextStock)) {
    return {
      valid: false,
      message: "Không thể lưu tồn kho. Vui lòng thử lại.",
    };
  }

  notifyStockUpdated(changes);

  return { valid: true };
}

// =========================================================
// 8. RESTOCK - CANCEL ORDER / RETURN
// =========================================================

export function increaseStock(
  productId: number,
  quantity: number,
  size?: string,
): boolean {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return false;
  }

  const key = getStockKey(productId, size);

  if (!key) {
    return false;
  }

  return setStock(productId, getStock(productId, size) + quantity, size);
}

// =========================================================
// 9. SUBSCRIBE TO STOCK CHANGES
// =========================================================

export function subscribeToStock(
  callback: (changes?: StockChange[]) => void,
): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const handleStockUpdated = (event: Event) => {
    const customEvent = event as CustomEvent<StockChange[]>;
    callback(customEvent.detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STOCK_STORAGE_KEY) {
      callback();
    }
  };

  window.addEventListener(STOCK_UPDATED_EVENT, handleStockUpdated);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(STOCK_UPDATED_EVENT, handleStockUpdated);
    window.removeEventListener("storage", handleStorage);
  };
}

// =========================================================
// 10. RESET STOCK - DEVELOPMENT / TESTING
// =========================================================

/**
 * Xóa dữ liệu tồn kho đã lưu.
 * Lần đọc tiếp theo sẽ dùng lại giá trị mặc định của danh sách sản phẩm hiện tại.
 */
export function resetStock(): boolean {
  if (!isBrowser()) {
    return false;
  }

  const previousStock = getAllStock();

  try {
    window.localStorage.removeItem(STOCK_STORAGE_KEY);

    const changes: StockChange[] = [];

    for (const product of getProducts()) {
      if (product.sizes?.length) {
        for (const size of product.sizes) {
          const key = `${product.id}::${size.label}`;

          changes.push({
            productId: product.id,
            size: size.label,
            previousStock: previousStock[key] ?? 0,
            stock: normalizeStock(size.stock ?? 0),
          });
        }
      } else {
        changes.push({
          productId: product.id,
          previousStock: previousStock[String(product.id)] ?? 0,
          stock: getInitialStock(product.id),
        });
      }
    }

    notifyStockUpdated(changes);

    return true;
  } catch (error) {
    console.error("Không thể đặt lại tồn kho NESTA:", error);
    return false;
  }
}
