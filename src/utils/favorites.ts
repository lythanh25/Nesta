import { getCustomerSession } from "./customerAuth";

const FAVORITES_STORAGE_KEY = "nesta-favorites";
const LEGACY_FAVORITES_STORAGE_KEY = "nesta-favorites";

function getUserFavoritesKey(userId: string): string {
  return `${FAVORITES_STORAGE_KEY}:${userId}`;
}

function parseFavoriteIds(value: string | null): number[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return [
      ...new Set(
        parsed.filter(
          (id): id is number =>
            typeof id === "number" && Number.isInteger(id) && id > 0,
        ),
      ),
    ];
  } catch {
    return [];
  }
}

/**
 * Lấy danh sách yêu thích của tài khoản đang đăng nhập.
 * Dữ liệu cũ được chuyển sang tài khoản đầu tiên sử dụng cơ chế mới.
 */
export function getFavoriteIds(): number[] {
  try {
    const session = getCustomerSession();

    // Không hiển thị danh sách của tài khoản trước khi đăng nhập.
    if (!session) {
      return [];
    }

    const userKey = getUserFavoritesKey(session.id);
    const savedUserFavorites = localStorage.getItem(userKey);

    if (savedUserFavorites !== null) {
      return parseFavoriteIds(savedUserFavorites);
    }

    // Chuyển dữ liệu từ phiên bản cũ sang tài khoản hiện tại.
    const legacyFavorites = localStorage.getItem(LEGACY_FAVORITES_STORAGE_KEY);

    if (legacyFavorites === null) {
      return [];
    }

    const favoriteIds = parseFavoriteIds(legacyFavorites);

    localStorage.setItem(userKey, JSON.stringify(favoriteIds));
    localStorage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);

    return favoriteIds;
  } catch {
    return [];
  }
}

export function isProductFavorite(productId: number): boolean {
  return getFavoriteIds().includes(productId);
}

/**
 * Thêm hoặc xóa sản phẩm trong danh sách của tài khoản hiện tại.
 * Trả về true nếu sản phẩm được yêu thích sau thao tác.
 */
export function toggleProductFavorite(productId: number): boolean {
  const session = getCustomerSession();

  // Chưa đăng nhập thì không thay đổi dữ liệu yêu thích.
  if (!session) {
    return false;
  }

  if (!Number.isInteger(productId) || productId <= 0) {
    return false;
  }

  const favoriteIds = getFavoriteIds();
  const alreadyFavorite = favoriteIds.includes(productId);

  const nextFavorites = alreadyFavorite
    ? favoriteIds.filter((id) => id !== productId)
    : [...favoriteIds, productId];

  try {
    const userKey = getUserFavoritesKey(session.id);

    localStorage.setItem(userKey, JSON.stringify(nextFavorites));

    window.dispatchEvent(new Event("favoritesUpdated"));

    return !alreadyFavorite;
  } catch {
    return alreadyFavorite;
  }
}
