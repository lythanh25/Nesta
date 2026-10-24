import { getCustomerSession } from "./customerAuth";

const CART_STORAGE_KEY = "nesta-cart";

export type CartItem = {
  productId: number;
  size?: string;
  quantity: number;
};

function getUserCartKey(userId: string): string {
  return `${CART_STORAGE_KEY}:${userId}`;
}

function parseCart(value: string | null): CartItem[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((value: unknown): CartItem[] => {
      if (typeof value !== "object" || value === null) {
        return [];
      }

      const item = value as Record<string, unknown>;

      if (
        typeof item.productId !== "number" ||
        !Number.isInteger(item.productId) ||
        item.productId <= 0 ||
        typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity) ||
        item.quantity < 1
      ) {
        return [];
      }

      return [
        {
          productId: item.productId,
          quantity: Math.floor(item.quantity),
          size: typeof item.size === "string" ? item.size : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

/**
 * Đọc giỏ hàng của tài khoản hiện tại.
 * Dữ liệu cũ được chuyển sang tài khoản đầu tiên sử dụng cơ chế mới.
 */
export function getCartItems(): CartItem[] {
  try {
    const session = getCustomerSession();

    if (!session) {
      return [];
    }

    const userKey = getUserCartKey(session.id);
    const savedUserCart = localStorage.getItem(userKey);

    if (savedUserCart !== null) {
      return parseCart(savedUserCart);
    }

    const legacyCart = localStorage.getItem(CART_STORAGE_KEY);

    if (legacyCart === null) {
      return [];
    }

    const items = parseCart(legacyCart);

    localStorage.setItem(userKey, JSON.stringify(items));
    localStorage.removeItem(CART_STORAGE_KEY);

    return items;
  } catch {
    return [];
  }
}

/**
 * Lưu giỏ hàng cho tài khoản hiện tại.
 */
export function saveCartItems(items: CartItem[]): boolean {
  const session = getCustomerSession();

  if (!session) {
    return false;
  }

  try {
    localStorage.setItem(getUserCartKey(session.id), JSON.stringify(items));

    window.dispatchEvent(new Event("cartUpdated"));

    return true;
  } catch {
    return false;
  }
}

/**
 * Thêm sản phẩm vào giỏ hàng.
 * Cùng sản phẩm và cùng kích thước sẽ tăng số lượng.
 */
export function addCartItem(
  productId: number,
  size?: string,
  quantity = 1,
): boolean {
  const session = getCustomerSession();

  if (
    !session ||
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    return false;
  }

  const items = getCartItems();
  const existingIndex = items.findIndex(
    (item) => item.productId === productId && item.size === size,
  );

  const nextItems =
    existingIndex >= 0
      ? items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      : [...items, { productId, size, quantity }];

  return saveCartItems(nextItems);
}

/**
 * Đếm số sản phẩm khác nhau trong giỏ hàng,
 * không cộng tổng số lượng của từng sản phẩm.
 */
export function getCartProductCount(): number {
  const items = getCartItems();

  return new Set(items.map((item) => item.productId)).size;
}
