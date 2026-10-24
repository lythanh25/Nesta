import { getCustomerSession } from "./customerAuth";

const REVIEWS_STORAGE_KEY = "nesta-reviews";
const ORDERS_STORAGE_KEY = "nesta-orders";

export type ProductReview = {
  id: string;
  productId: number;
  userId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type ReviewOrderItem = {
  productId?: number;
};

type ReviewOrder = {
  status?: string;
  items?: ReviewOrderItem[];
};

function readReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ProductReview[]) : [];
  } catch {
    return [];
  }
}

function readUserOrders(userId: string): ReviewOrder[] {
  try {
    const raw = localStorage.getItem(`${ORDERS_STORAGE_KEY}:${userId}`);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ReviewOrder[]) : [];
  } catch {
    return [];
  }
}

export function getProductReviews(productId: number): ProductReview[] {
  return readReviews()
    .filter((review) => review.productId === productId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getReviewSummary(productId: number) {
  const reviews = getProductReviews(productId);
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return {
    count: reviews.length,
    average,
  };
}

export function getMyProductReview(
  productId: number,
): ProductReview | undefined {
  const session = getCustomerSession();
  if (!session) return undefined;

  return readReviews().find(
    (review) => review.productId === productId && review.userId === session.id,
  );
}

export function canReviewProduct(productId: number): boolean {
  const session = getCustomerSession();
  if (!session) return false;

  // Mỗi tài khoản chỉ đánh giá một lần cho một sản phẩm.
  if (
    readReviews().some(
      (review) =>
        review.productId === productId && review.userId === session.id,
    )
  ) {
    return false;
  }

  return readUserOrders(session.id).some((order) => {
    if (order.status?.trim().toLowerCase() !== "đã giao hàng") {
      return false;
    }

    return order.items?.some((item) => item.productId === productId) ?? false;
  });
}

export function addProductReview(
  productId: number,
  rating: number,
  comment: string,
): ProductReview {
  const session = getCustomerSession();

  if (!session) {
    throw new Error("Vui lòng đăng nhập để viết đánh giá.");
  }

  if (!canReviewProduct(productId)) {
    throw new Error(
      "Bạn cần có đơn hàng đã giao thành công và chưa đánh giá sản phẩm này.",
    );
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Vui lòng chọn số sao từ 1 đến 5.");
  }

  const cleanedComment = comment.trim();
  if (!cleanedComment) {
    throw new Error("Vui lòng nhập nội dung đánh giá.");
  }

  const review: ProductReview = {
    id: `REVIEW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId,
    userId: session.id,
    customerName: session.fullName || "Khách hàng",
    rating,
    comment: cleanedComment,
    createdAt: new Date().toISOString(),
  };

  const reviews = readReviews();

  // Kiểm tra lần nữa trước khi lưu.
  if (
    reviews.some(
      (item) => item.productId === productId && item.userId === session.id,
    )
  ) {
    throw new Error("Bạn đã đánh giá sản phẩm này rồi.");
  }

  reviews.unshift(review);
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event("reviewsUpdated"));

  return review;
}
