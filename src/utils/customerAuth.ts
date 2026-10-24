const USERS_KEY = "nesta-demo-users";
const SESSION_KEY = "nesta-user-session";

export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export type CustomerSession = {
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

type AuthResult = { success: true } | { success: false; message: string };

function readUsers(): Customer[] {
  try {
    const value = localStorage.getItem(USERS_KEY);
    if (!value) return [];

    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Customer[]) : [];
  } catch {
    return [];
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function registerCustomer(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): AuthResult {
  const fullName = data.fullName.trim();
  const email = normalizeEmail(data.email);
  const phone = data.phone.trim();

  if (!fullName || !email || !phone || !data.password) {
    return {
      success: false,
      message: "Vui lòng nhập đầy đủ thông tin.",
    };
  }

  const users = readUsers();

  if (users.some((user) => normalizeEmail(user.email) === email)) {
    return {
      success: false,
      message: "Email này đã được đăng ký.",
    };
  }

  const newUser: Customer = {
    id: `customer-${Date.now()}`,
    fullName,
    email,
    phone,
    password: data.password,
  };

  try {
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));

    localStorage.setItem(
      "nesta-profile",
      JSON.stringify({
        fullName,
        email,
        phone,
        birthday: "",
      }),
    );

    localStorage.setItem(
      "nesta-address",
      JSON.stringify({
        recipient: fullName,
        phone,
        city: "",
        district: "",
        ward: "",
        address: "",
      }),
    );

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: { id: newUser.id, fullName, email },
      } satisfies CustomerSession),
    );

    window.dispatchEvent(new Event("customerAuthUpdated"));

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Không thể lưu tài khoản trên trình duyệt. Vui lòng thử lại.",
    };
  }
}

export function loginCustomer(
  emailInput: string,
  password: string,
): AuthResult {
  const email = normalizeEmail(emailInput);
  const user = readUsers().find(
    (item) =>
      normalizeEmail(item.email) === email && item.password === password,
  );

  if (!user) {
    return {
      success: false,
      message: "Email hoặc mật khẩu không chính xác.",
    };
  }

  try {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        },
      } satisfies CustomerSession),
    );

    localStorage.setItem(
      "nesta-profile",
      JSON.stringify({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        birthday: "",
      }),
    );

    window.dispatchEvent(new Event("customerAuthUpdated"));

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Không thể đăng nhập lúc này. Vui lòng thử lại.",
    };
  }
}

export function logoutCustomer() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("customerAuthUpdated"));
}

export function getCustomerSession(): CustomerSession["user"] | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved) as CustomerSession;

    if (
      !parsed.user ||
      typeof parsed.user.id !== "string" ||
      typeof parsed.user.email !== "string" ||
      typeof parsed.user.fullName !== "string"
    ) {
      return null;
    }

    return parsed.user;
  } catch {
    return null;
  }
}

export function changeCustomerPassword(
  currentPassword: string,
  newPassword: string,
): AuthResult {
  const session = getCustomerSession();

  if (!session) {
    return {
      success: false,
      message: "Vui lòng đăng nhập để đổi mật khẩu.",
    };
  }

  if (!currentPassword || !newPassword) {
    return {
      success: false,
      message: "Vui lòng nhập đầy đủ mật khẩu.",
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      message: "Mật khẩu mới phải có ít nhất 8 ký tự.",
    };
  }

  const users = readUsers();
  const userIndex = users.findIndex((user) => user.id === session.id);

  if (userIndex === -1) {
    return {
      success: false,
      message: "Không tìm thấy tài khoản.",
    };
  }

  if (users[userIndex].password !== currentPassword) {
    return {
      success: false,
      message: "Mật khẩu hiện tại không chính xác.",
    };
  }

  try {
    const updatedUsers = [...users];

    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: newPassword,
    };

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: "Không thể đổi mật khẩu lúc này. Vui lòng thử lại.",
    };
  }
}


export function updateCustomerProfile(data: {
  fullName: string;
  email: string;
  phone: string;
}): AuthResult {
  const session = getCustomerSession();

  if (!session) {
    return {
      success: false,
      message: "Vui lòng đăng nhập để cập nhật thông tin.",
    };
  }

  const fullName = data.fullName.trim();
  const email = normalizeEmail(data.email);
  const phone = data.phone.trim();

  if (!fullName || !email) {
    return {
      success: false,
      message: "Họ tên và email không được để trống.",
    };
  }

  const users = readUsers();
  const userIndex = users.findIndex((user) => user.id === session.id);

  if (userIndex === -1) {
    return {
      success: false,
      message: "Không tìm thấy tài khoản.",
    };
  }

  const emailExists = users.some(
    (user) =>
      user.id !== session.id &&
      normalizeEmail(user.email) === email,
  );

  if (emailExists) {
    return {
      success: false,
      message: "Email này đã được sử dụng bởi tài khoản khác.",
    };
  }

  try {
    const updatedUsers = [...users];

    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      fullName,
      email,
      phone,
    };

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user: {
          id: session.id,
          fullName,
          email,
        },
      } satisfies CustomerSession),
    );

    const savedProfile = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("nesta-profile") || "{}",
        ) as Record<string, unknown>;
      } catch {
        return {};
      }
    })();

    localStorage.setItem(
      "nesta-profile",
      JSON.stringify({
        ...savedProfile,
        fullName,
        email,
        phone,
      }),
    );

    window.dispatchEvent(new Event("customerAuthUpdated"));

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Không thể cập nhật thông tin. Vui lòng thử lại.",
    };
  }
}
