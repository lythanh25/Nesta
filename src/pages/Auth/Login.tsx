import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import { isAdminAccountEmail, loginAdmin } from "../../utils/adminAuth";
import { loginCustomer } from "../../utils/customerAuth";
import { useFeedback } from "../../components/feedback/useFeedback";

function Login() {
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();

  const adminDestination = location.state?.from?.pathname?.startsWith("/admin")
    ? location.state.from.pathname
    : "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    // Luồng đăng nhập Admin.
    if (isAdminAccountEmail(normalizedEmail)) {
      const success = loginAdmin(normalizedEmail, password);

      if (!success) {
        setError("Email hoặc mật khẩu quản trị không chính xác.");
        return;
      }

      toast(
        "Đăng nhập quản trị thành công. Chào mừng đến với NESTA!",
        "success",
      );
      navigate(adminDestination, { replace: true });
      return;
    }

    // Luồng đăng nhập khách hàng.
    const result = loginCustomer(normalizedEmail, password);

    if (!result.success) {
      setError(result.message);
      return;
    }

    toast("Đăng nhập thành công. Chào mừng bạn quay lại NESTA!", "success");
    navigate("/profile", { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#eee8e2] bg-white p-7 shadow-sm sm:p-10">
        {/* Brand */}
        <Link
          to="/"
          className="block text-center font-serif text-3xl font-semibold tracking-wide text-[#3b2f25]"
        >
          NESTA.COM
        </Link>

        <p className="mt-2 text-center text-xs tracking-[0.2em] text-[#8b8178]">
          FURNITURE & LIVING
        </p>

        {/* Heading */}
        <div className="mb-7 mt-8">
          <h1 className="text-2xl font-semibold text-[#2d261f]">Đăng nhập</h1>

          <p className="mt-2 text-sm leading-6 text-[#8b8178]">
            Chào mừng bạn quay lại với NESTA.
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-medium text-[#2d261f]"
            >
              Email
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              placeholder="Nhập email của bạn"
              required
              className="w-full rounded-lg border border-[#ded8d1] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa19a] focus:border-[#5a493d] focus:ring-2 focus:ring-[#8b7765]/10"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-medium text-[#2d261f]"
            >
              Mật khẩu
            </label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError("");
              }}
              placeholder="Nhập mật khẩu"
              required
              className="w-full rounded-lg border border-[#ded8d1] px-4 py-3 text-sm outline-none transition placeholder:text-[#aaa19a] focus:border-[#5a493d] focus:ring-2 focus:ring-[#8b7765]/10"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-[#3b2f25] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#5a493d] focus:outline-none focus:ring-2 focus:ring-[#8b7765] focus:ring-offset-2"
          >
            Đăng nhập
          </button>
        </form>

        {/* Register */}
        <p className="mt-6 text-center text-sm text-[#756d66]">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-medium text-[#5a493d] underline underline-offset-4 transition hover:text-[#8c6c51]"
          >
            Đăng ký ngay
          </Link>
        </p>

        {/* Back to store */}
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
