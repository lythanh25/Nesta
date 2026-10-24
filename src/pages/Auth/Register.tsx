import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerCustomer } from "../../utils/customerAuth";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    const result = registerCustomer({
      fullName,
      email,
      phone,
      password,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/profile", { replace: true });
  }

  const inputClass =
    "w-full rounded-lg border border-[#ded8d1] px-4 py-3 text-sm outline-none transition focus:border-[#5a493d]";

  const labelClass = "mb-2 block text-sm font-medium text-[#2d261f]";

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
          <h1 className="text-2xl font-semibold text-[#2d261f]">
            Tạo tài khoản
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#8b8178]">
            Đăng ký để lưu thông tin và theo dõi đơn hàng của bạn.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="register-name" className={labelClass}>
              Họ và tên
            </label>
            <input
              id="register-name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Nhập họ và tên"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="register-email" className={labelClass}>
              Email
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="register-phone" className={labelClass}>
              Số điện thoại
            </label>
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Nhập số điện thoại"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="register-password" className={labelClass}>
              Mật khẩu
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              minLength={8}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className={labelClass}>
              Xác nhận mật khẩu
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu"
              minLength={8}
              required
              className={inputClass}
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
            Đăng ký
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#756d66]">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-medium text-[#5a493d] underline underline-offset-4 hover:text-[#8c6c51]"
          >
            Đăng nhập
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

export default Register;
