const ADMIN_SESSION_KEY = "nesta-admin-session";

// Tài khoản demo dành riêng cho đồ án.
// Không sử dụng cách lưu mật khẩu này cho website thực tế.
const DEMO_ADMIN = {
  email: "admin@nesta.com",
  password: "Nesta@123",
};

// Nhận diện email Admin để chọn đúng luồng xác thực.
export function isAdminAccountEmail(email: string): boolean {
  return email.trim().toLowerCase() === DEMO_ADMIN.email;
}

export function loginAdmin(email: string, password: string): boolean {
  if (!isAdminAccountEmail(email) || password !== DEMO_ADMIN.password) {
    return false;
  }

  try {
    localStorage.setItem(
      ADMIN_SESSION_KEY,
      JSON.stringify({
        email: DEMO_ADMIN.email,
        role: "admin",
        loggedInAt: new Date().toISOString(),
      }),
    );

    return true;
  } catch {
    return false;
  }
}

export function isAdminLoggedIn(): boolean {
  try {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);

    if (!session) return false;

    const parsed = JSON.parse(session);

    return parsed?.role === "admin";
  } catch {
    return false;
  }
}

export function logoutAdmin(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}
