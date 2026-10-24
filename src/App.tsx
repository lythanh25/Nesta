import { BrowserRouter, Route, Routes } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import MainLayout from "./components/layout/MainLayout";

import Home from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import Profile from "./pages/Profile/Profile";
import About from "./pages/About/About";
import RequireAdmin from "./components/auth/RequireAdmin";
import AdminLayout from "./components/layout/AdminLayout";
import AdminLogin from "./pages/Admin/Login";
import Dashboard from "./pages/Admin/Dashboard";
import UserLogin from "./pages/Auth/Login";
import UserRegister from "./pages/Auth/Register";

function App() {
  return (
    <BrowserRouter basename="/Nesta">
      <ScrollToTop />
      <Routes>
        {/* Tài khoản khách hàng */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />

        {/* Tài khoản Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Khu vực quản trị được bảo vệ */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            {/* Các route Admin sẽ bổ sung tại đây */}
          </Route>
        </Route>

        {/* Website khách hàng — giữ nguyên */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
