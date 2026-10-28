import type { Customer } from "./customerAuth";

export const ADMIN_STORAGE_KEYS = {
  users: "nesta-demo-users",
  orders: "nesta-orders",
  products: "nesta-products",
  stock: "nesta-stock",
  employees: "nesta-admin-employees",
  articles: "nesta-admin-articles",
  adminProfile: "nesta-admin-profile",
  customerProfile: "nesta-profile",
  customerAddress: "nesta-address",
} as const;

export type CustomerInfo = {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  ward: string;
  address: string;
  note: string;
};

export type OrderItem = {
  productId: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
};

export type OrderStatus =
  | "Đã tiếp nhận"
  | "Đang xử lý"
  | "Đang giao hàng"
  | "Đã hoàn thành"
  | "Đã hủy";

export type AdminOrder = {
  id: string;
  createdAt: string;
  customer: CustomerInfo;
  paymentMethod: "cod" | "bank";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
};

export type AdminEmployee = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: "Đang làm việc" | "Tạm nghỉ";
  createdAt: string;
};

export type AdminArticle = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  status: "Bản nháp" | "Đã xuất bản";
  createdAt: string;
  updatedAt: string;
};

export type AdminProfile = {
  fullName: string;
  email: string;
  phone: string;
  position: string;
};

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed: unknown = JSON.parse(raw);
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("adminDataUpdated"));
    return true;
  } catch {
    return false;
  }
}

export function readCustomers(): Customer[] {
  const users = readStorage<unknown>(ADMIN_STORAGE_KEYS.users, []);

  if (!Array.isArray(users)) return [];

  return users.filter((item): item is Customer => {
    if (!item || typeof item !== "object") return false;

    const user = item as Partial<Customer>;

    return (
      typeof user.id === "string" &&
      typeof user.fullName === "string" &&
      typeof user.email === "string"
    );
  });
}

/**
 * Checkout đang lưu đơn theo khóa nesta-orders:${userId}.
 * Hàm này đọc cả khóa riêng từng khách và khóa nesta-orders cũ.
 */
export function readAllOrders(): AdminOrder[] {
  const users = readCustomers();
  const ordersById = new Map<string, AdminOrder>();

  for (const user of users) {
    const customerOrders = readStorage<unknown>(
      `${ADMIN_STORAGE_KEYS.orders}:${user.id}`,
      [],
    );

    if (!Array.isArray(customerOrders)) continue;

    for (const value of customerOrders) {
      if (!isAdminOrder(value)) continue;

      ordersById.set(value.id, {
        ...value,
        customer: {
          ...value.customer,
          fullName: value.customer?.fullName || user.fullName,
          email: value.customer?.email || user.email,
          phone: value.customer?.phone || user.phone || "",
        },
      });
    }
  }

  // Hỗ trợ dữ liệu đơn hàng cũ được lưu ở khóa chung.
  const legacyOrders = readStorage<unknown>(ADMIN_STORAGE_KEYS.orders, []);

  if (Array.isArray(legacyOrders)) {
    for (const value of legacyOrders) {
      if (isAdminOrder(value)) {
        ordersById.set(value.id, value);
      }
    }
  }

  return [...ordersById.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function isAdminOrder(value: unknown): value is AdminOrder {
  if (!value || typeof value !== "object") return false;

  const order = value as Partial<AdminOrder>;

  return (
    typeof order.id === "string" &&
    typeof order.createdAt === "string" &&
    Array.isArray(order.items) &&
    typeof order.total === "number"
  );
}

/**
 * Cập nhật đúng bản ghi đơn hàng trong khóa đã lưu.
 * Không chuyển tất cả đơn hàng sang một khóa chung vì sẽ làm thay đổi
 * cách Checkout hiện tại đọc dữ liệu theo từng tài khoản.
 */
export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): boolean {
  const users = readCustomers();
  let updated = false;

  for (const user of users) {
    const key = `${ADMIN_STORAGE_KEYS.orders}:${user.id}`;
    const orders = readStorage<unknown>(key, []);

    if (!Array.isArray(orders)) continue;

    const index = orders.findIndex(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as Partial<AdminOrder>).id === orderId,
    );

    if (index === -1) continue;

    const nextOrders = [...orders];
    nextOrders[index] = {
      ...(nextOrders[index] as AdminOrder),
      status,
    };

    try {
      localStorage.setItem(key, JSON.stringify(nextOrders));
      updated = true;
    } catch {
      return false;
    }
  }

  const legacyOrders = readStorage<unknown>(ADMIN_STORAGE_KEYS.orders, []);

  if (Array.isArray(legacyOrders)) {
    const index = legacyOrders.findIndex(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as Partial<AdminOrder>).id === orderId,
    );

    if (index !== -1) {
      const nextOrders = [...legacyOrders];
      nextOrders[index] = {
        ...(nextOrders[index] as AdminOrder),
        status,
      };

      try {
        localStorage.setItem(
          ADMIN_STORAGE_KEYS.orders,
          JSON.stringify(nextOrders),
        );
        updated = true;
      } catch {
        return false;
      }
    }
  }

  if (updated) {
    window.dispatchEvent(new Event("ordersUpdated"));
    window.dispatchEvent(new Event("adminDataUpdated"));
  }

  return updated;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getOrderStatusClass(status: string): string {
  switch (status) {
    case "Đã hoàn thành":
      return "bg-green-100 text-green-800";
    case "Đang giao hàng":
      return "bg-blue-100 text-blue-800";
    case "Đang xử lý":
      return "bg-amber-100 text-amber-800";
    case "Đã hủy":
      return "bg-red-100 text-red-800";
    default:
      return "bg-stone-100 text-stone-700";
  }
}
