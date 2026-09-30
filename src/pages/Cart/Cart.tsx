import { Link } from "react-router-dom";
import { products } from "../../data/products";

function Cart() {
  const cartItems = products.slice(0, 2);

  const subtotal = cartItems.reduce(function (total, product) {
    return total + product.price;
  }, 0);

  const shipping = 30000;
  const total = subtotal + shipping;

  return (
    <section className="px-5 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-10 text-2xl font-semibold text-[#2d261f] md:text-3xl">
          GIỎ HÀNG
        </h1>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {cartItems.map(function (product) {
              return (
                <article
                  key={product.id}
                  className="flex gap-4 border-b border-[#ddd5cd] py-5"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-28 w-28 object-cover"
                  />

                  <div className="flex flex-1 justify-between gap-5">
                    <div>
                      <h2 className="font-medium">{product.name}</h2>

                      <p className="mt-2 text-sm text-[#6f6257]">
                        {new Intl.NumberFormat("vi-VN").format(product.price)}{" "}
                        VNĐ
                      </p>

                      <div className="mt-4 flex w-fit border border-[#d8d0c8]">
                        <button className="px-3 py-1">−</button>

                        <span className="border-x border-[#d8d0c8] px-4 py-1">
                          1
                        </span>

                        <button className="px-3 py-1">+</button>
                      </div>
                    </div>

                    <button className="text-sm text-[#806b56]">Xóa</button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit bg-[#eeeae5] p-6">
            <h2 className="text-lg font-semibold">TÓM TẮT ĐƠN HÀNG</h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>
                  {new Intl.NumberFormat("vi-VN").format(subtotal)} VNĐ
                </span>
              </div>

              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>
                  {new Intl.NumberFormat("vi-VN").format(shipping)} VNĐ
                </span>
              </div>

              <div className="border-t border-[#d4cbc2] pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Tổng cộng</span>
                  <span>
                    {new Intl.NumberFormat("vi-VN").format(total)} VNĐ
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-6 block bg-[#3B2F25] px-6 py-3 text-center text-sm text-white"
            >
              Tiến hành thanh toán
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default Cart;
