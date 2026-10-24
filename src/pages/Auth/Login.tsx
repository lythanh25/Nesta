import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginCustomer } from "../../utils/customerAuth";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const result = loginCustomer(email, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/profile", { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-sm sm:p-10">
        <Link
          to="/"
          className="block text-center font-serif text-3xl font-semibold tracking-wide text-[#3b2f25]"
        >
          NESTA.COM
        </Link>

        <p className="mt-2 text-center text-xs tracking-[0.2em] text-[#8b8178]">
          FURNITURE & LIVING
        </p>

        <div className="mb-7 mt-8">
          <h1 className="text-2xl font-semibold text-[#2d261f]">Đăng nhập</h1>
          <p className="mt-2 text-sm leading-6 text-[#8b8178]">
            Chào mừng bạn quay lại với NESTA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="user-email"
              className="mb-2 block text-sm font-medium text-[#2d261f]"
            >
              Email
            </label>
            <input
              id="user-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email của bạn"
              required
              className="w-full rounded-lg border border-[#ded8d1] px-4 py-3 text-sm outline-none transition focus:border-[#5a493d]"
            />
          </div>

          <div>
            <label
              htmlFor="user-password"
              className="mb-2 block text-sm font-medium text-[#2d261f]"
            >
              Mật khẩu
            </label>
            <input
              id="user-password"
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
            className="w-full rounded-lg bg-[#3b2f25] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#5a493d]"
          >
            Đăng nhập
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#756d66]">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-medium text-[#5a493d] underline underline-offset-4 hover:text-[#8c6c51]"
          >
            Đăng ký ngay
          </Link>
        </p>

        <p className="mt-5 text-center text-sm text-[#8b8178]">
          <Link to="/" className="transition hover:text-[#3b2f25]">
            ← Quay lại cửa hàng
          </Link>
        </p>
      </div>
    </main>
  );
}

export default Login;
