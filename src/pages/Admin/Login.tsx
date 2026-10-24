import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginAdmin } from "../../utils/adminAuth";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const success = loginAdmin(email, password);

    if (!success) {
      setError("Email hoặc mật khẩu không chính xác.");
      return;
    }

    navigate("/admin", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm sm:p-10">
        <Link
          to="/"
          className="block text-center font-serif text-3xl font-semibold tracking-wide text-[#3b2f25]"
        >
          NESTA
        </Link>

        <p className="mt-2 text-center text-sm text-[#8b8178]">
          ADMINISTRATION
        </p>

        <div className="mb-8 mt-8">
          <h1 className="text-2xl font-semibold text-[#2d261f]">
            Đăng nhập quản trị
          </h1>

          <p className="mt-2 text-sm text-[#8b8178]">
            Đăng nhập để quản lý hoạt động của cửa hàng NESTA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-medium text-[#2d261f]"
            >
              Email quản trị
            </label>

            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email quản trị"
              required
              className="w-full rounded-lg border border-[#ded8d1] px-4 py-3 text-sm outline-none transition focus:border-[#5a493d]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-medium text-[#2d261f]"
            >
              Mật khẩu
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              required
              className="w-full rounded-lg border border-[#ded8d1] px-4 py-3 text-sm outline-none transition focus:border-[#5a493d]"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-[#3b2f25] px-4 py-3 font-medium text-white transition hover:bg-[#5a493d]"
          >
            Đăng nhập
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8b8178]">
          <Link to="/" className="transition hover:text-[#3b2f25]">
            ← Quay lại cửa hàng
          </Link>
        </p>
      </div>
    </div>
  );
}

export default AdminLogin;
