const FAVORITES_STORAGE_KEY = "nesta-favorites";

export function getFavoriteIds(): number[] {
  const savedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);

  if (!savedFavorites) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(savedFavorites);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(function (id): id is number {
      return typeof id === "number";
    });
  } catch {
    return [];
  }
}

export function isProductFavorite(productId: number): boolean {
  return getFavoriteIds().includes(productId);
}

export function toggleProductFavorite(productId: number): boolean {
  const favoriteIds = getFavoriteIds();

  const alreadyFavorite = favoriteIds.includes(productId);

  const nextFavorites = alreadyFavorite
    ? favoriteIds.filter(function (id) {
        return id !== productId;
      })
    : [...favoriteIds, productId];

  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));

  window.dispatchEvent(new Event("favoritesUpdated"));

  return !alreadyFavorite;
}
