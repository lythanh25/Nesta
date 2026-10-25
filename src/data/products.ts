// Tài nguyên giữ lại từ phiên bản products.ts cũ.
const legacyBedImages = [
  new URL("../assets/images/spaces/Bed-1-1.jpg", import.meta.url).href,
  new URL("../assets/images/spaces/Bed-1-2.jpg", import.meta.url).href,
  new URL("../assets/images/spaces/Bed-1-3.jpg", import.meta.url).href,
  new URL("../assets/images/spaces/Bed-1-4.jpg", import.meta.url).href,
];
const legacyBedModel = new URL("../assets/models/Bed-1.glb", import.meta.url)
  .href;

const imageFiles = import.meta.glob(
  "../assets/images/spaces/*.{jpg,jpeg,png,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
) as Record<string, string>;

function getImage(filename: string): string {
  const path = `../assets/images/spaces/${filename}`;
  const image = imageFiles[path];

  if (!image) {
    throw new Error(`Không tìm thấy ảnh: ${filename} (đường dẫn: ${path})`);
  }

  return image;
}

function getGallery(prefix: string): string[] {
  return [1, 2, 3, 4].map((index) => getImage(`${prefix}_${index}.jpg`));
}

function getHoverImage(prefix: string): string {
  return getImage(`${prefix}_5.jpg`);
}

const modelFiles = import.meta.glob("../assets/models/*.glb", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function getModel(filename: string): string | undefined {
  return modelFiles[`../assets/models/${filename}`];
}

// =====================================================
// 9 DANH MỤC CHÍNH - NESTA
// Luôn lấy danh sách này để hiển thị đủ danh mục,
// kể cả khi chưa có sản phẩm thuộc danh mục đó.
// =====================================================

export const productCategories = [
  "Giường",
  "Sofa",
  "Ghế",
  "Bàn",
  "Tủ",
  "Đèn",
  "Kệ",
  "Gương",
  "Trang trí",
] as const;

export type ProductCategory = (typeof productCategories)[number];

// Một sản phẩm có thể phù hợp với nhiều không gian phòng.
export const productRooms = [
  "Phòng khách",
  "Phòng ngủ",
  "Phòng ăn",
  "Phòng làm việc",
] as const;

export type ProductRoom = (typeof productRooms)[number];

// =====================================================
// PRODUCT TYPE
// =====================================================

export type ProductSize = {
  label: string;
  width: number;
  length: number;
  height: number;

  // Giá riêng của kích thước, nếu có.
  price?: number;

  // Số lượng tồn kho của riêng kích thước này.
  stock?: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;

  // Giá gốc để xác định chương trình giảm giá.
  originalPrice?: number;

  // Trạng thái còn hàng, được đồng bộ với dữ liệu tồn kho.
  inStock?: boolean;

  // Tồn kho của sản phẩm không có các lựa chọn kích thước.
  // Với sản phẩm có sizes, tồn kho được quản lý theo từng size.
  stock?: number;

  category: ProductCategory;
  subcategory: string;

  // Một sản phẩm có thể xuất hiện ở nhiều không gian.
  rooms?: ProductRoom[];

  images: string[];
  hoverImage?: string;

  description: string;
  detailDescription?: string;
  specifications?: Record<string, string>;

  sizes?: ProductSize[];
  model3D?: string;
};

// =====================================================
// HELPER - TẠO SIZE
// =====================================================

function createSize(
  label: string,
  width: number,
  length: number,
  height: number,
  price?: number,
  stock: number = 5,
): ProductSize {
  return {
    label,
    width,
    length,
    height,
    ...(price !== undefined ? { price } : {}),
    stock: Math.max(0, Math.floor(stock)),
  };
}

// =====================================================
// SIZE PRICING
// =====================================================

/**
 * Quy tắc giá dùng chung cho tất cả sản phẩm có kích thước:
 * - Product.price là giá cơ sở của size nhỏ nhất.
 * - Nếu ProductSize.price được khai báo, dùng giá riêng đó.
 * - Nếu không, tự tính theo tỷ lệ chiều rộng so với size nhỏ nhất.
 * - Làm tròn đến 100.000 VNĐ gần nhất.
 *
 * Khi một sản phẩm có cách định giá riêng (không tỷ lệ theo chiều rộng),
 * hãy truyền giá cụ thể làm tham số thứ 5 của createSize(..., price).
 */
const PRICE_ROUNDING_STEP = 100_000;

function roundProductPrice(price: number): number {
  return Math.round(price / PRICE_ROUNDING_STEP) * PRICE_ROUNDING_STEP;
}

function getSmallestSize(product: Product): ProductSize | undefined {
  if (!product.sizes?.length) return undefined;

  return product.sizes.reduce((smallest, size) =>
    size.width < smallest.width ? size : smallest,
  );
}

/** Tính giá bán theo size đã chọn. Dùng hàm này ở trang chi tiết/giỏ hàng. */
export function getSizePrice(
  product: Product,
  selectedSize?: ProductSize,
): number {
  if (!selectedSize || !product.sizes?.length) return product.price;

  // Giá riêng được ưu tiên nếu sản phẩm đã khai báo.
  if (selectedSize.price !== undefined) return selectedSize.price;

  const baseSize = getSmallestSize(product);
  if (!baseSize || baseSize.width <= 0 || selectedSize.width <= 0) {
    return product.price;
  }

  return roundProductPrice(
    product.price * (selectedSize.width / baseSize.width),
  );
}

/** Tính giá gốc theo size, dùng để hiển thị giá khuyến mãi nhất quán. */
export function getSizeOriginalPrice(
  product: Product,
  selectedSize?: ProductSize,
): number | undefined {
  if (product.originalPrice === undefined) return undefined;
  if (!selectedSize || !product.sizes?.length) return product.originalPrice;

  const baseSize = getSmallestSize(product);
  if (!baseSize || baseSize.width <= 0 || selectedSize.width <= 0) {
    return product.originalPrice;
  }

  return roundProductPrice(
    product.originalPrice * (selectedSize.width / baseSize.width),
  );
}

// =====================================================
// PRODUCTS
// =====================================================

export const products: Product[] = [
  // ===================================================
  // GIƯỜNG
  // ===================================================

  {
    id: 1,
    name: "Giường nệm xám",
    price: 5000000,
    originalPrice: 6000000,
    inStock: true,
    stock: 10,

    category: "Giường",
    subcategory: "Giường ngủ",
    rooms: ["Phòng ngủ"],

    images: getGallery("Bed_1"),
    hoverImage: getHoverImage("Bed_1"),

    description:
      "Giường ngủ hiện đại với khung gỗ nâu vân gỗ, đầu giường bọc nệm xám, kết hợp ga giường xám và chăn màu kem trang nhã.",

    detailDescription:
      "Giường gỗ nâu bọc nệm xám mang phong cách hiện đại và tối giản. Khung giường có tông nâu trầm với vân gỗ tự nhiên, kết hợp đầu giường gồm hai tấm đệm bọc vải màu xám tạo điểm nhấn tinh tế. Bộ ga giường xám cùng chăn màu kem giúp tổng thể hài hòa, phù hợp với nhiều không gian phòng ngủ hiện đại.",

    specifications: {
      "Chất liệu": "Gỗ công nghiệp và vải bọc nệm",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Nâu gỗ, xám và kem",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("1m6", 160, 200, 100),
      createSize("1m8", 180, 200, 100, undefined, 8),
      createSize("2m0", 200, 200, 100, undefined, 10),
    ],

    model3D: getModel("Bed_1.glb"),
  },

  {
    id: 2,
    name: "Giường khung bo tròn xám rêu",
    price: 9800000,
    inStock: false,
    stock: 0,

    category: "Giường",
    subcategory: "Giường ngủ",
    rooms: ["Phòng ngủ"],

    images: getGallery("Bed_2"),
    hoverImage: getHoverImage("Bed_2"),

    description:
      "Giường ngủ khung gỗ bo tròn màu vàng nâu, đầu giường bọc nệm xám rêu, ga xám xanh nhạt và chăn nâu xám.",

    detailDescription:
      "Mẫu giường có khung gỗ bo tròn với phần kệ hai bên liền khung, đầu giường bọc nệm màu xám rêu và bộ ga xám xanh nhạt. Chăn nâu xám tạo điểm nhấn tương phản, phù hợp với không gian phòng ngủ hiện đại và tối giản.",

    specifications: {
      "Chất liệu": "Khung gỗ và vải bọc nệm",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Gỗ vàng nâu, xám rêu, xám xanh và nâu xám",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },

    sizes: [createSize("1m6", 160, 200, 100), createSize("1m8", 180, 200, 100)],

    model3D: getModel("Bed_2.glb"),
  },

  {
    id: 3,
    name: "Giường vải ",
    price: 8500000,
    stock: 20,

    category: "Giường",
    subcategory: "Giường đôi",
    rooms: ["Phòng ngủ"],

    images: getGallery("Bed_3"),
    hoverImage: getHoverImage("Bed_3"),
    model3D: getModel("Bed_3.glb"),

    description:
      "Giường đôi bọc vải than đậm, kết hợp ga xám xanh rêu và gối trắng xám, tạo vẻ hiện đại và thanh lịch.",

    detailDescription:
      "Giường bọc vải than đậm có thiết kế hiện đại với đầu giường bo góc mềm mại và khung giường đồng bộ. Bộ ga phủ màu xám xanh rêu kết hợp gối trắng xám tạo sự tương phản nhẹ nhàng, phù hợp với phòng ngủ theo phong cách tối giản và hiện đại.",

    specifications: {
      "Chất liệu": "Khung giường bọc vải",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Than đậm, xám xanh rêu, trắng xám",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },

    sizes: [createSize("1m6", 160, 200, 100), createSize("1m8", 180, 200, 100)],
  },

  {
    id: 4,
    name: "Modern Leather Sofa",
    price: 6500000,
    stock: 2,

    category: "Sofa",
    subcategory: "Sofa phòng khách",
    rooms: ["Phòng khách"],

    images: getGallery("Sofa_1"),
    hoverImage: getHoverImage("Sofa_1"),
    model3D: getModel("Sofa_1.glb"),

    description:
      "Sofa da đỏ nâu phong cách hiện đại, nổi bật với họa tiết chần quả trám sang trọng.",

    detailDescription:
      "Modern Leather Sofa sở hữu thiết kế ba chỗ ngồi với phần tay vịn rộng, đệm tựa chần nút và bề mặt da màu đỏ nâu trầm. Những đường may hình quả trám tạo điểm nhấn tinh tế, phù hợp với phòng khách hiện đại, không gian sang trọng hoặc nội thất phong cách cổ điển đương đại.",

    specifications: {
      "Chất liệu": "Da bọc và khung ghế",
      "Phong cách": "Hiện đại pha cổ điển",
      "Màu sắc": "Đỏ nâu",
      "Số chỗ ngồi": "3 chỗ",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("180 cm", 180, 90, 80),
      createSize("220 cm", 220, 90, 80),
      createSize("260 cm", 260, 90, 80),
    ],
  },

  {
    id: 5,
    name: "Cream Fabric Sofa",
    price: 6500000,
    stock: 5,

    category: "Sofa",
    subcategory: "Sofa phòng khách",
    rooms: ["Phòng khách"],

    images: getGallery("Sofa_2"),
    hoverImage: getHoverImage("Sofa_2"),
    model3D: getModel("Sofa_2.glb"),

    description:
      "Sofa vải màu kem với thiết kế hiện đại, đệm ngồi rộng và gối tựa rời.",

    detailDescription:
      "Cream Fabric Sofa nổi bật với gam màu kem nhẹ nhàng, bề mặt vải dệt có kết cấu tự nhiên và phần đệm ngồi êm ái. Thiết kế tay vịn bo mềm, gối tựa rời và thân ghế bọc vải tạo cảm giác ấm cúng, phù hợp với phòng khách hiện đại và phong cách nội thất tối giản.",

    specifications: {
      "Chất liệu": "Vải dệt",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Kem",
    },

    sizes: [
      createSize("180 cm", 180, 90, 80),
      createSize("220 cm", 220, 90, 80),
      createSize("260 cm", 260, 90, 80),
    ],
  },

  {
    id: 6,
    name: "Modern Blue Gray Sofa",
    price: 8500000,
    stock: 1,

    category: "Sofa",
    subcategory: "Sofa phòng khách",
    rooms: ["Phòng khách"],

    images: getGallery("Sofa_3"),
    hoverImage: getHoverImage("Sofa_3"),
    model3D: getModel("Sofa_3.glb"),

    description:
      "Sofa vải xám xanh hiện đại với đệm ngồi êm ái và chân kim loại thanh mảnh.",

    detailDescription:
      "Modern Blue Gray Sofa nổi bật với gam màu xám xanh lạnh, chất liệu vải dệt có kết cấu tự nhiên và thiết kế thấp hiện đại. Phần tay vịn vuông vức, đệm ngồi và tựa lưng tách riêng kết hợp cùng chân kim loại sáng tạo cảm giác thanh thoát, phù hợp với phòng khách hiện đại và phong cách Scandinavian.",

    specifications: {
      "Chất liệu": "Vải dệt và khung kim loại",
      "Phong cách": "Hiện đại, Scandinavian",
      "Màu sắc": "Xám xanh",
      "Chân ghế": "Kim loại sáng",
    },

    sizes: [
      createSize("180 cm", 180, 90, 80, 8500000),
      createSize("220 cm", 220, 90, 80, 10000000),
      createSize("260 cm", 260, 90, 80, 11500000),
      createSize("300 cm", 300, 90, 80, 13000000),
    ],
  },

  // ===================================================
  // GHẾ
  // ===================================================

  // Khôi phục sản phẩm Modern Chair từ thông tin đã cung cấp.
  // Dùng id 16 để không trùng với Sofa_3 (id 6).
  {
    id: 16,
    name: "Modern Chair",
    price: 2800000,

    category: "Ghế",
    subcategory: "Ghế ăn",
    rooms: ["Phòng ăn", "Phòng khách", "Phòng làm việc"],

    // Giữ ảnh gốc; khi có Chair_1_1.jpg...Chair_1_5.jpg
    // có thể thay bằng getGallery("Chair_1") và getHoverImage("Chair_1").
    images: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80",
    ],

    description:
      "Modern Chair phù hợp cho phòng khách, phòng đọc sách hoặc không gian làm việc.",

    detailDescription:
      "Modern Chair có thiết kế đơn giản và thanh lịch, dễ dàng kết hợp với nhiều loại bàn và không gian nội thất khác nhau.",

    specifications: {
      "Chất liệu": "Gỗ và vải",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Nâu",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },

    sizes: [createSize("Tiêu chuẩn", 50, 55, 80)],
  },

  // ===================================================
  // BÀN
  // ===================================================

  {
    id: 7,
    name: "Mahogany Table",
    price: 7200000,

    category: "Bàn",
    subcategory: "Bàn làm việc",
    rooms: ["Phòng làm việc", "Phòng ăn"],

    images: getGallery("Table_1"),
    hoverImage: getHoverImage("Table_1"),
    model3D: getModel("Table_1.glb"),

    description:
      "Bàn gỗ mahogany màu nâu đỏ với mặt bàn bo góc và chân tiện cổ điển.",

    detailDescription:
      "Mahogany Table nổi bật với mặt gỗ nâu đỏ bóng, đường viền bo mềm và phần chân bàn tiện chi tiết theo phong cách cổ điển. Các chi tiết kim loại màu đồng ở chân tạo điểm nhấn sang trọng, phù hợp với phòng làm việc, phòng đọc sách hoặc không gian nội thất truyền thống.",

    specifications: {
      "Chất liệu": "Gỗ mahogany",
      "Phong cách": "Cổ điển",
      "Màu sắc": "Nâu đỏ",
      "Chi tiết chân": "Kim loại màu đồng",
    },

    sizes: [
      createSize("120 cm", 120, 70, 75),
      createSize("140 cm", 140, 80, 75),
      createSize("160 cm", 160, 90, 75),
    ],
  },

  {
    id: 8,
    name: "Coffee Table",
    price: 4200000,

    category: "Bàn",
    subcategory: "Bàn trà",
    rooms: ["Phòng khách"],

    images: getGallery("Table_2"),
    hoverImage: getHoverImage("Table_2"),
    model3D: getModel("Table_2.glb"),

    description:
      "Bàn trà gỗ nâu với mặt bàn dáng hữu cơ, đường cong mềm mại và chân khung gỗ thanh thoát.",

    detailDescription:
      "Coffee Table nổi bật với mặt bàn thuôn dài, một đầu bo tròn rộng và các đường cong bất đối xứng tự nhiên. Bề mặt gỗ nâu ấm có vân gỗ rõ nét, kết hợp hệ chân khung gỗ dạng vòng tạo nên vẻ đẹp hiện đại, tối giản. Sản phẩm phù hợp với phòng khách có sofa thấp và không gian nội thất đương đại.",

    specifications: {
      "Chất liệu": "Gỗ",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Nâu gỗ",
      "Kiểu dáng": "Mặt bàn hữu cơ bo cong",
    },

    sizes: [
      createSize("100 cm", 100, 55, 35),
      createSize("140 cm", 140, 70, 35),
    ],
  },

  {
    id: 9,
    name: "Wooden Round Table",
    price: 5200000,

    category: "Bàn",
    subcategory: "Bàn tròn",
    rooms: ["Phòng khách", "Phòng ăn"],

    images: getGallery("Table_3"),
    hoverImage: getHoverImage("Table_3"),
    model3D: getModel("Table_3.glb"),

    description:
      "Bàn tròn cổ điển với mặt kính nâu khói và chân trụ gỗ chạm khắc tinh xảo.",

    detailDescription:
      "Wooden Round Table gây ấn tượng với mặt bàn tròn màu nâu khói bóng, cho phép nhìn thấy một phần kết cấu chân trụ bên dưới. Phần đế gỗ màu nâu đậm được tạo hình uốn cong, kết hợp các chi tiết chạm khắc cổ điển và lớp hoàn thiện bóng nhẹ. Sản phẩm phù hợp với không gian nội thất sang trọng, phòng tiếp khách hoặc phòng đọc sách.",

    specifications: {
      "Chất liệu": "Kính màu nâu khói và gỗ",
      "Phong cách": "Cổ điển",
      "Màu sắc": "Nâu khói, nâu gỗ",
      "Kiểu dáng": "Bàn tròn chân trụ chạm khắc",
    },

    sizes: [
      createSize("Ø 80 cm", 80, 80, 75),
      createSize("Ø 120 cm", 120, 120, 75),
    ],
  },

  {
    id: 10,
    name: "Dikkies Closet",
    price: 6000000,

    category: "Tủ",
    subcategory: "Tủ quần áo",
    rooms: ["Phòng ngủ"],

    images: getGallery("Closet_1"),
    hoverImage: getHoverImage("Closet_1"),
    model3D: getModel("Closet_1.glb"),

    description:
      "Tủ quần áo gỗ nâu đỏ phong cách cổ điển, kết hợp cánh gương và chi tiết kính trang trí.",

    detailDescription:
      "Dikkies Closet mang vẻ đẹp cổ điển với thân tủ gỗ nâu đỏ, vân gỗ nổi bật và phần nóc cong mềm mại. Thiết kế gồm một cánh gỗ có ô kính trang trí, một cánh gương lớn và hai ngăn kéo phía dưới. Các chi tiết tay nắm màu đồng tạo điểm nhấn sang trọng, phù hợp với phòng ngủ hoặc không gian nội thất phong cách vintage.",

    specifications: {
      "Chất liệu": "Gỗ hoàn thiện màu nâu đỏ",
      "Phong cách": "Cổ điển, vintage",
      "Màu sắc": "Nâu đỏ",
      "Chi tiết": "Cánh gương, ô kính trang trí, hai ngăn kéo",
    },

    sizes: [
      createSize("100 cm", 100, 60, 200),
      createSize("120 cm", 120, 60, 200),
      createSize("140 cm", 140, 60, 200),
    ],
  },

  {
    id: 11,
    name: "Closet Venice",
    price: 4500000,

    category: "Tủ",
    subcategory: "Tủ quần áo",
    rooms: ["Phòng ngủ"],

    images: getGallery("Closet_2"),
    hoverImage: getHoverImage("Closet_2"),
    model3D: getModel("Closet_2.glb"),

    description:
      "Closet Venice với thiết kế hiện đại màu xám than, nhiều ngăn tủ và 4 ngăn kéo tiện dụng.",

    detailDescription:
      "Closet Venice sở hữu thiết kế hình khối hiện đại với bề mặt xám than, đường viền tối màu và tay nắm kim loại thanh mảnh. Cấu trúc tủ gồm các khoang lưu trữ phân tầng, cánh tủ kích thước khác nhau và bốn ngăn kéo ở phía dưới bên phải, giúp sắp xếp quần áo và đồ dùng gọn gàng. Sản phẩm phù hợp với phòng ngủ hiện đại và không gian nội thất tối giản.",

    specifications: {
      "Chất liệu": "Gỗ công nghiệp hoàn thiện vân gỗ",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Xám than",
      "Ngăn kéo": "4 ngăn",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("160 cm", 160, 60, 220),
      createSize("180 cm", 180, 60, 220),
      createSize("200 cm", 200, 60, 220),
    ],
  },

  {
    id: 12,
    name: "Light Ash Wardrobe",
    price: 3500000,

    category: "Tủ",
    subcategory: "Tủ quần áo",
    rooms: ["Phòng ngủ"],

    images: getGallery("Closet_3"),
    hoverImage: getHoverImage("Closet_3"),
    model3D: getModel("Closet_3.glb"),

    description:
      "Tủ quần áo gỗ xám-be sáng với thiết kế 8 cánh, 4 ngăn kéo và tay nắm bạc hiện đại.",

    detailDescription:
      "Light Ash Wardrobe sở hữu thiết kế tối giản với bề mặt vân gỗ màu xám-be sáng và các đường nét hình học gọn gàng. Hệ thống 8 cánh tủ kết hợp 4 ngăn kéo ở trung tâm phía dưới tạo không gian lưu trữ tiện dụng. Tay nắm kim loại màu bạc làm nổi bật vẻ thanh lịch, phù hợp với phòng ngủ hiện đại và phong cách Scandinavian.",

    specifications: {
      "Chất liệu": "Gỗ hoàn thiện vân gỗ",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Xám-be sáng",
      "Số cánh": "8 cánh",
      "Ngăn kéo": "4 ngăn",
      "Tay nắm": "Kim loại màu bạc",
    },

    sizes: [
      createSize("180 cm", 180, 55, 200),
      createSize("200 cm", 200, 55, 200),
      createSize("220 cm", 220, 60, 220),
    ],
  },

  {
    id: 13,
    name: "Rustic Wooden Chair",
    price: 800000,

    category: "Ghế",
    subcategory: "Ghế ăn",
    rooms: ["Phòng ăn", "Phòng làm việc"],

    images: getGallery("Chair_1"),
    hoverImage: getHoverImage("Chair_1"),
    model3D: getModel("Chair_1.glb"),

    description:
      "Ghế gỗ nâu mộc mạc với tựa lưng nan dọc, thiết kế cổ điển và thanh giằng chắc chắn.",

    detailDescription:
      "Rustic Wooden Chair mang phong cách nội thất đồng quê với chất liệu gỗ màu nâu ấm, phần tựa lưng cao gồm các thanh nan tiện tròn và mặt ngồi gỗ uốn cong nhẹ. Hệ thống chân ghế kết hợp thanh giằng tạo cảm giác vững chãi, phù hợp cho phòng ăn gia đình, quán cà phê hoặc không gian nội thất phong cách vintage và rustic.",

    specifications: {
      "Chất liệu": "Gỗ",
      "Phong cách": "Rustic, cổ điển",
      "Màu sắc": "Nâu gỗ",
      "Tựa lưng": "Nan gỗ dọc",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("Tiêu chuẩn", 45, 48, 88),
      createSize("Lớn", 50, 52, 92),
    ],
  },

  // ===================================================
  // TRANG TRÍ
  // ===================================================

  // ===================================================
  // GHẾ - CHAIR_2, CHAIR_3
  // ===================================================

  {
    id: 17,
    name: "Modern Gray Armchair",
    price: 3200000,

    category: "Ghế",
    subcategory: "Ghế thư giãn",
    rooms: ["Phòng khách", "Phòng ngủ", "Phòng làm việc"],

    images: getGallery("Chair_2"),
    hoverImage: getHoverImage("Chair_2"),
    model3D: getModel("Chair_2.glb"),

    description:
      "Ghế thư giãn bọc vải xám với lưng tựa cao, tay vịn liền thân và chân gỗ nâu thanh mảnh.",

    detailDescription:
      "Modern Gray Armchair mang phong cách hiện đại với phần thân bọc vải dệt màu xám, bề mặt có kết cấu sợi tự nhiên. Lưng tựa bo cong kết hợp tay vịn rộng và đệm ngồi êm ái tạo cảm giác thoải mái. Chân gỗ nâu thanh mảnh mang đến vẻ đẹp thanh lịch, phù hợp với phòng khách, phòng đọc sách hoặc góc thư giãn.",

    specifications: {
      "Chất liệu": "Vải dệt và chân gỗ",
      "Phong cách": "Hiện đại, Scandinavian",
      "Màu sắc": "Xám và nâu gỗ",
      "Kiểu dáng": "Ghế đơn có tay vịn",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("Tiêu chuẩn", 75, 78, 90, 3200000),
      createSize("Lớn", 85, 85, 95, 3800000),
    ],
  },

  {
    id: 18,
    name: "Modern Velvet Chair",
    price: 3500000,

    category: "Ghế",
    subcategory: "Ghế thư giãn",
    rooms: ["Phòng khách", "Phòng ngủ"],

    images: getGallery("Chair_3"),
    hoverImage: getHoverImage("Chair_3"),
    model3D: getModel("Chair_3.glb"),

    description:
      "Ghế đơn bọc vải nhung xám sáng với tựa lưng cong hình vỏ sò và chân gỗ nâu đỏ.",

    detailDescription:
      "Modern Velvet Chair sở hữu kiểu dáng mềm mại với phần lưng tựa bo tròn ôm lấy người ngồi. Các đường chia múi dọc tạo điểm nhấn cho bề mặt bọc vải màu xám sáng. Đệm ngồi rộng kết hợp chân gỗ nâu đỏ tạo nên thiết kế thanh lịch, phù hợp với phòng khách, phòng ngủ hoặc góc đọc sách hiện đại.",

    specifications: {
      "Chất liệu": "Vải nhung và chân gỗ",
      "Phong cách": "Hiện đại, thanh lịch",
      "Màu sắc": "Xám sáng và nâu đỏ",
      "Kiểu dáng": "Ghế đơn lưng cong",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("Tiêu chuẩn", 75, 75, 80, 3500000),
      createSize("Lớn", 85, 80, 85, 4200000),
    ],
  },

  // ===================================================
  // ĐÈN - LAMP_1, LAMP_2, LAMP_3
  // ===================================================

  {
    id: 19,
    name: "Adjustable Desk Lamp",
    price: 950000,

    category: "Đèn",
    subcategory: "Đèn bàn",
    rooms: ["Phòng làm việc", "Phòng ngủ"],

    images: getGallery("Lamp_1"),
    hoverImage: getHoverImage("Lamp_1"),
    model3D: getModel("Lamp_1.glb"),

    description:
      "Đèn bàn kim loại màu đen với tay đèn có thể điều chỉnh linh hoạt và chụp đèn hình chuông.",

    detailDescription:
      "Adjustable Desk Lamp mang phong cách công nghiệp hiện đại với thiết kế tay đèn gồm nhiều khớp nối và lò xo hỗ trợ điều chỉnh góc chiếu sáng. Thân đèn kim loại màu đen nhám kết hợp chân đế tròn chắc chắn, phù hợp cho bàn học, bàn làm việc và không gian nội thất tối giản.",

    specifications: {
      "Chất liệu": "Kim loại",
      "Phong cách": "Công nghiệp, hiện đại",
      "Màu sắc": "Đen",
      "Kiểu đèn": "Đèn bàn điều chỉnh",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("Tiêu chuẩn", 18, 35, 55, 950000),
      createSize("Lớn", 20, 40, 65, 1200000),
    ],
  },

  {
    id: 20,
    name: "Classic Table Lamp",
    price: 1850000,

    category: "Đèn",
    subcategory: "Đèn bàn",
    rooms: ["Phòng ngủ", "Phòng khách"],

    images: getGallery("Lamp_2"),
    hoverImage: getHoverImage("Lamp_2"),
    model3D: getModel("Lamp_2.glb"),

    description:
      "Đèn bàn cổ điển với chân đèn màu đen bóng và chụp đèn màu kem tạo ánh sáng ấm áp.",

    detailDescription:
      "Classic Table Lamp mang phong cách cổ điển với chân đèn màu đen bóng có hình dáng thon dài, kết hợp các chi tiết kim loại trang trí. Phần chụp đèn màu kem dạng loe nhẹ giúp khuếch tán ánh sáng dịu, thích hợp đặt trên bàn đầu giường, bàn trang trí hoặc tủ phòng khách.",

    specifications: {
      "Chất liệu": "Kim loại và chụp đèn vải",
      "Phong cách": "Cổ điển",
      "Màu sắc": "Đen và kem",
      "Ánh sáng": "Vàng ấm",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("Tiêu chuẩn", 30, 30, 55, 1850000),
      createSize("Lớn", 35, 35, 65, 2300000),
    ],
  },

  {
    id: 21,
    name: "Classic Brass Wall Lamp",
    price: 2100000,

    category: "Đèn",
    subcategory: "Đèn tường",
    rooms: ["Phòng ngủ", "Phòng khách"],

    images: getGallery("Lamp_3"),
    hoverImage: getHoverImage("Lamp_3"),
    model3D: getModel("Lamp_3.glb"),

    description:
      "Đèn tường cổ điển với khung kim loại màu đồng và chụp đèn vải màu kem.",

    detailDescription:
      "Classic Brass Wall Lamp nổi bật với phần giá đỡ kim loại màu đồng có thiết kế uốn cong mềm mại. Chụp đèn hình nón bằng vải màu kem tạo nên vẻ đẹp sang trọng và ấm cúng. Sản phẩm phù hợp để trang trí phòng ngủ, hành lang hoặc phòng khách theo phong cách cổ điển và tân cổ điển.",

    specifications: {
      "Chất liệu": "Kim loại màu đồng và vải",
      "Phong cách": "Cổ điển, tân cổ điển",
      "Màu sắc": "Đồng vàng và kem",
      "Kiểu đèn": "Đèn gắn tường",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("Tiêu chuẩn", 22, 30, 45, 2100000),
      createSize("Lớn", 28, 35, 55, 2600000),
    ],
  },

  // ===================================================
  // KỆ - SHELF_1, SHELF_2, SHELF_3
  // ===================================================

  {
    id: 22,
    name: "Industrial Wooden Bookshelf",
    price: 4200000,

    category: "Kệ",
    subcategory: "Kệ sách",
    rooms: ["Phòng khách", "Phòng làm việc"],

    images: getGallery("Shelf_1"),
    hoverImage: getHoverImage("Shelf_1"),
    model3D: getModel("Shelf_1.glb"),

    description:
      "Kệ sách hiện đại kết hợp khung kim loại đen và các mặt kệ gỗ nâu bố trí bất đối xứng.",

    detailDescription:
      "Industrial Wooden Bookshelf sở hữu thiết kế khung kim loại hình chữ nhật kết hợp các tấm gỗ màu nâu tự nhiên. Những tầng kệ được phân chia theo bố cục bất đối xứng tạo nên vẻ đẹp độc đáo và hiện đại. Sản phẩm thích hợp để sách, chậu cây nhỏ và vật dụng trang trí trong phòng khách hoặc phòng làm việc.",

    specifications: {
      "Chất liệu": "Kim loại và gỗ",
      "Phong cách": "Industrial, hiện đại",
      "Màu sắc": "Đen và nâu gỗ",
      "Kiểu dáng": "Kệ nhiều tầng bất đối xứng",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("100 cm", 100, 30, 120, 4200000),
      createSize("120 cm", 120, 35, 140, 5000000),
      createSize("140 cm", 140, 40, 160, 5900000),
    ],
  },

  {
    id: 23,
    name: "Classic Wooden Storage Shelf",
    price: 6800000,

    category: "Kệ",
    subcategory: "Kệ lưu trữ",
    rooms: ["Phòng ăn", "Phòng khách", "Phòng làm việc"],

    images: getGallery("Shelf_2"),
    hoverImage: getHoverImage("Shelf_2"),
    model3D: getModel("Shelf_2.glb"),

    description:
      "Kệ gỗ màu kem cổ điển kết hợp các ngăn trưng bày, hai ngăn kéo và tủ cửa phía dưới.",

    detailDescription:
      "Classic Wooden Storage Shelf mang phong cách nội thất đồng quê với bề mặt gỗ sơn màu kem nhẹ nhàng. Phần trên gồm các ô kệ để sách và đồ trang trí, khu vực giữa có khoảng trống trưng bày rộng. Phía dưới tích hợp hai ngăn kéo và hai cánh tủ giúp tối ưu không gian lưu trữ, phù hợp cho phòng ăn, phòng khách hoặc phòng làm việc.",

    specifications: {
      "Chất liệu": "Gỗ hoàn thiện sơn",
      "Phong cách": "Cổ điển, Farmhouse",
      "Màu sắc": "Kem ngà",
      "Ngăn kéo": "2 ngăn",
      "Cánh tủ": "2 cánh",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("100 cm", 100, 40, 180, 6800000),
      createSize("120 cm", 120, 45, 190, 7900000),
    ],
  },

  {
    id: 24,
    name: "Modern Geometric Wall Shelf",
    price: 2900000,

    category: "Kệ",
    subcategory: "Kệ trang trí",
    rooms: ["Phòng khách", "Phòng làm việc"],

    images: getGallery("Shelf_3"),
    hoverImage: getHoverImage("Shelf_3"),
    model3D: getModel("Shelf_3.glb"),

    description:
      "Kệ trang trí màu đen với thiết kế hình học độc đáo, các đường kệ đan xen tạo thành họa tiết vuông.",

    detailDescription:
      "Modern Geometric Wall Shelf gây ấn tượng với kết cấu hình học gồm nhiều khung vuông và đường thẳng bố trí đan xen. Thiết kế màu đen mang vẻ đẹp tối giản nhưng cá tính, thích hợp làm điểm nhấn trang trí trên tường phòng khách, phòng làm việc hoặc không gian hiện đại.",

    specifications: {
      "Chất liệu": "Gỗ hoàn thiện màu đen",
      "Phong cách": "Hiện đại, hình học",
      "Màu sắc": "Đen",
      "Kiểu dáng": "Kệ trang trí hình học",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("80 cm", 80, 20, 80, 2900000),
      createSize("100 cm", 100, 25, 100, 3500000),
    ],
  },

  // ===================================================
  // GƯƠNG - MIRROR_1, MIRROR_2, MIRROR_3
  // ===================================================

  {
    id: 25,
    name: "Modern Table Mirror",
    price: 950000,

    category: "Gương",
    subcategory: "Gương để bàn",
    rooms: ["Phòng ngủ"],

    images: getGallery("Mirror_1"),
    hoverImage: getHoverImage("Mirror_1"),
    model3D: getModel("Mirror_1.glb"),

    description:
      "Gương tròn để bàn với khung và chân đế kim loại màu bạc, thiết kế nhỏ gọn hiện đại.",

    detailDescription:
      "Modern Table Mirror sở hữu mặt gương hình tròn kết hợp khung kim loại màu bạc sáng. Phần khớp nối hai bên cho phép điều chỉnh góc nghiêng, trong khi chân trụ và đế tròn tạo sự ổn định khi sử dụng. Sản phẩm phù hợp với bàn trang điểm, phòng ngủ hoặc phòng tắm hiện đại.",

    specifications: {
      "Chất liệu": "Kính gương và kim loại",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Bạc",
      "Kiểu dáng": "Gương tròn để bàn",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("20 cm", 20, 15, 35, 950000),
      createSize("25 cm", 25, 18, 40, 1200000),
    ],
  },

  {
    id: 26,
    name: "Classic Vanity Mirror Table",
    price: 7500000,

    category: "Gương",
    subcategory: "Bàn trang điểm có gương",
    rooms: ["Phòng ngủ"],

    images: getGallery("Mirror_2"),
    hoverImage: getHoverImage("Mirror_2"),
    model3D: getModel("Mirror_2.glb"),

    description:
      "Bàn trang điểm cổ điển màu kem với gương bầu dục, ngăn kéo và chân bàn uốn cong thanh lịch.",

    detailDescription:
      "Classic Vanity Mirror Table mang phong cách cổ điển châu Âu với phần gương hình bầu dục được bao quanh bởi khung gỗ trang trí. Mặt bàn bo cong mềm mại kết hợp các ngăn kéo nhỏ giúp lưu trữ mỹ phẩm và phụ kiện. Chân bàn thanh mảnh cùng lớp hoàn thiện màu kem tạo nên vẻ đẹp sang trọng cho phòng ngủ và khu vực trang điểm.",

    specifications: {
      "Chất liệu": "Gỗ, kính gương và kim loại",
      "Phong cách": "Cổ điển châu Âu",
      "Màu sắc": "Kem ngà",
      "Kiểu dáng": "Bàn trang điểm kèm gương",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("100 cm", 100, 45, 155, 7500000),
      createSize("120 cm", 120, 50, 165, 8800000),
    ],
  },

  {
    id: 27,
    name: "Upholstered Wall Mirror",
    price: 3200000,

    category: "Gương",
    subcategory: "Gương treo tường",
    rooms: ["Phòng ngủ", "Phòng khách"],

    images: getGallery("Mirror_3"),
    hoverImage: getHoverImage("Mirror_3"),
    model3D: getModel("Mirror_3.glb"),

    description:
      "Gương chữ nhật với khung bọc vải màu trắng kem và các chi tiết đinh tán kim loại trang trí.",

    detailDescription:
      "Upholstered Wall Mirror sở hữu thiết kế hình chữ nhật đứng với phần khung rộng bọc chất liệu màu trắng kem. Các đinh tán kim loại nhỏ được bố trí đều dọc theo viền ngoài và viền trong, tạo điểm nhấn tinh tế. Sản phẩm phù hợp với phòng ngủ, phòng thay đồ hoặc không gian nội thất hiện đại pha nét sang trọng.",

    specifications: {
      "Chất liệu": "Kính gương và khung bọc vải",
      "Phong cách": "Hiện đại, sang trọng",
      "Màu sắc": "Trắng kem",
      "Chi tiết": "Đinh tán kim loại",
      "Bảo hành": "12 tháng",
    },

    sizes: [
      createSize("70 x 120 cm", 70, 5, 120, 3200000),
      createSize("100 x 170 cm", 100, 5, 170, 4200000),
    ],
  },

  // ===================================================
  // TRANG TRÍ - DECOR_1, DECOR_2, DECOR_3
  // ===================================================

  {
    id: 28,
    name: "Abstract Wall Art",
    price: 1800000,

    category: "Trang trí",
    subcategory: "Tranh trang trí",
    rooms: ["Phòng khách", "Phòng làm việc"],

    images: getGallery("Decor_1"),
    hoverImage: getHoverImage("Decor_1"),
    model3D: getModel("Decor_1.glb"),

    description:
      "Tranh trừu tượng với gam màu xanh đen, nâu trầm và dải vàng ánh kim trên nền chất liệu có kết cấu nghệ thuật.",

    detailDescription:
      "Abstract Wall Art mang phong cách nghệ thuật đương đại với sự kết hợp của những mảng màu xanh đen và nâu trầm. Một dải màu vàng ánh kim chạy ngang tạo điểm nhấn nổi bật cho bố cục. Khung tranh màu đen thanh mảnh giúp tôn lên vẻ hiện đại, phù hợp để trang trí phòng khách, phòng làm việc hoặc không gian trưng bày nghệ thuật.",

    specifications: {
      "Chất liệu": "Bề mặt tranh và khung trang trí",
      "Phong cách": "Trừu tượng, đương đại",
      "Màu sắc": "Xanh đen, nâu và vàng",
      "Kiểu dáng": "Tranh hình chữ nhật",
      "Bảo hành": "6 tháng",
    },

    sizes: [
      createSize("60 x 80 cm", 60, 4, 80, 1800000),
      createSize("80 x 100 cm", 80, 4, 100, 2400000),
    ],
  },

  {
    id: 29,
    name: "Green Abstract Sculpture",
    price: 2500000,

    category: "Trang trí",
    subcategory: "Tượng trang trí",
    rooms: ["Phòng khách", "Phòng làm việc"],

    images: getGallery("Decor_2"),
    hoverImage: getHoverImage("Decor_2"),
    model3D: getModel("Decor_2.glb"),

    description:
      "Tượng trang trí trừu tượng màu xanh ngọc với các lớp hình khối uốn cong xếp chồng độc đáo.",

    detailDescription:
      "Green Abstract Sculpture sở hữu thiết kế nghệ thuật với nhiều lớp khối cong được sắp xếp chồng lên nhau tạo chuyển động mềm mại. Bề mặt màu xanh ngọc có những đường vân sáng tự nhiên, mang cảm giác như chất liệu đá cẩm thạch. Sản phẩm thích hợp làm điểm nhấn trên bàn trà, kệ sách hoặc tủ trang trí hiện đại.",

    specifications: {
      "Chất liệu": "Vật liệu hoàn thiện giả đá",
      "Phong cách": "Trừu tượng, nghệ thuật",
      "Màu sắc": "Xanh ngọc",
      "Kiểu dáng": "Điêu khắc nhiều lớp",
      "Bảo hành": "6 tháng",
    },

    sizes: [
      createSize("35 cm", 35, 18, 20, 2500000),
      createSize("45 cm", 45, 22, 26, 3200000),
    ],
  },

  {
    id: 30,
    name: "Antique Decorative Shield",
    price: 4800000,

    category: "Trang trí",
    subcategory: "Đồ trang trí cổ điển",
    rooms: ["Phòng khách", "Phòng làm việc"],

    images: getGallery("Decor_3"),
    hoverImage: getHoverImage("Decor_3"),
    model3D: getModel("Decor_3.glb"),

    description:
      "Khiên kim loại trang trí cổ điển với mặt trước chạm nổi hình chiến binh và mặt sau màu đỏ sẫm có dây đeo.",

    detailDescription:
      "Antique Decorative Shield mang cảm hứng từ nghệ thuật chế tác khiên cổ với thiết kế hình tròn và bề mặt kim loại chạm nổi tinh xảo. Các họa tiết chiến binh và ngựa được bố trí xung quanh họa tiết trung tâm, tạo nên vẻ đẹp mạnh mẽ và cổ kính. Mặt sau có tông đỏ sẫm cùng hệ thống dây đeo, phù hợp trưng bày trong phòng làm việc, thư viện hoặc không gian nội thất cổ điển.",

    specifications: {
      "Chất liệu": "Kim loại và dây đeo trang trí",
      "Phong cách": "Cổ điển, lịch sử",
      "Màu sắc": "Kim loại xám đậm và đỏ sẫm",
      "Kiểu dáng": "Khiên tròn chạm nổi",
      "Bảo hành": "6 tháng",
    },

    sizes: [
      createSize("60 cm", 60, 8, 60, 4800000),
      createSize("80 cm", 80, 10, 80, 6200000),
    ],
  },

  {
    id: 31,
    name: "Giường gỗ mộc Rustic",
    price: 4200000,
    category: "Giường",
    subcategory: "Giường đơn",
    rooms: ["Phòng ngủ"],

    images: getGallery("Bed_4"),
    hoverImage: getHoverImage("Bed_4"),
    model3D: getModel("Bed_4.glb"),

    description:
      "Giường gỗ nâu trầm có bốn trụ vuông chắc chắn, đầu và cuối giường bằng gỗ, chăn họa tiết nâu cùng gối màu kem.",
    detailDescription:
      "Thiết kế Rustic mộc mạc với khung gỗ vân nâu sẫm, bốn chân trụ vuông cao và những tấm ván đầu, cuối giường liền khung. Phối cùng nệm sáng màu, gối kem và chăn dệt họa tiết nâu, thích hợp phòng ngủ ấm cúng theo phong cách tự nhiên.",
    specifications: {
      "Chất liệu": "Khung gỗ, nệm và vải dệt",
      "Phong cách": "Rustic, mộc mạc",
      "Màu sắc": "Nâu gỗ đậm, nâu dệt và kem",
      "Kiểu dáng": "Giường có bốn trụ vuông",
    },
    sizes: [
      createSize("1m0", 100, 200, 95, 4200000),
      createSize("1m2", 120, 200, 95, 4800000),
      createSize("1m4", 140, 200, 95, 5400000),
    ],
  },

  {
    id: 32,
    name: "Bed Sagara",
    price: 3800000,
    category: "Giường",
    subcategory: "Giường đôi",
    rooms: ["Phòng ngủ"],

    images: getGallery("Bed_5"),
    hoverImage: getHoverImage("Bed_5"),
    model3D: getModel("Bed_5.glb"),

    description:
      "Giường đôi hiện đại với đầu giường kéo dài vân gỗ xám sọc ngang, hai kệ nhỏ liền đầu giường, gối trắng và chăn xám nhạt.",
    detailDescription:
      "Bed Sagara có khung giường thấp màu nâu đen, đầu giường dạng tấm lớn vân gỗ xám trải rộng sang hai bên, kết hợp cặp kệ nổi mặt tối màu. Nệm và gối trắng phối chăn xám tạo vẻ tối giản, thanh lịch và phù hợp phòng ngủ hiện đại.",
    specifications: {
      "Chất liệu": "Khung gỗ, nệm và vải",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Xám vân gỗ, nâu đen và trắng",
      "Kiểu dáng": "Giường thấp với kệ đầu giường tích hợp",
    },
    sizes: [
      createSize("1m6", 160, 200, 95, 3800000),
      createSize("1m8", 180, 200, 95, 4200000),
      createSize("2m0", 200, 200, 95, 4800000),
    ],
  },

  {
    id: 33,
    name: "Giường gỗ cổ điển đỏ rượu",
    price: 8200000,
    category: "Giường",
    subcategory: "Giường gỗ cổ điển",
    rooms: ["Phòng ngủ"],

    images: getGallery("Bed_6"),
    hoverImage: getHoverImage("Bed_6"),
    model3D: getModel("Bed_6.glb"),

    description:
      "Giường gỗ nâu chạm khắc kiểu cổ điển, bốn trụ lớn, đầu giường vòm cong và chăn đỏ rượu nổi bật.",
    detailDescription:
      "Mẫu giường phong cách cổ điển mang tông gỗ nâu sẫm, đầu giường uốn vòm có đường nét trang trí và bốn trụ vuông với họa tiết chạm trên đỉnh. Chăn màu đỏ rượu cùng gối đỏ cam tạo điểm nhấn ấm áp cho phòng ngủ mang cảm hứng truyền thống.",
    specifications: {
      "Chất liệu": "Khung gỗ và vải phủ",
      "Phong cách": "Cổ điển",
      "Màu sắc": "Nâu gỗ đậm, đỏ rượu và đỏ cam",
      "Kiểu dáng": "Đầu giường vòm, bốn trụ chạm trang trí",
    },
    sizes: [
      createSize("1m2", 120, 200, 115, 8200000),
      createSize("1m4", 140, 200, 115, 9400000),
      createSize("1m6", 160, 200, 115, 10800000),
    ],
  },

  {
    id: 34,
    name: "Sofa vải xám 2 chỗ",
    price: 2700000,
    inStock: true,
    category: "Sofa",
    subcategory: "Sofa 2 chỗ",
    rooms: ["Phòng khách", "Phòng làm việc"],
    images: getGallery("Sofa_4"),
    hoverImage: getHoverImage("Sofa_4"),
    model3D: getModel("Sofa_4.glb"),
    description:
      "Sofa vải dệt màu xám trung tính, ba gối tựa lưng rời, hai đệm ngồi và tay vịn vuông, chân gỗ thấp.",
    detailDescription:
      "Mẫu sofa có thiết kế cân đối với phần thân bọc vải màu xám, ba gối tựa lưng lớn, hai đệm ngồi riêng biệt và tay vịn dày bo nhẹ ở góc. Chân ghế thấp màu nâu gỗ tạo cảm giác ấm áp, phù hợp phòng khách tối giản hoặc khu vực tiếp khách tại phòng làm việc.",
    specifications: {
      "Chất liệu": "Vải dệt và chân gỗ",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Xám trung tính, nâu gỗ",
      "Kiểu dáng": "Sofa thẳng, 2 đệm ngồi, 3 gối tựa",
    },
    sizes: [
      createSize("160 cm", 160, 85, 85, 2700000),
      createSize("180 cm", 180, 88, 85, 3400000),
      createSize("200 cm", 200, 90, 85, 4200000),
    ],
  },

  {
    id: 35,
    name: "Sofa da đen tối giản",
    price: 4200000,
    inStock: true,
    category: "Sofa",
    subcategory: "Sofa 2 chỗ",
    rooms: ["Phòng khách", "Phòng làm việc"],
    images: getGallery("Sofa_5"),
    hoverImage: getHoverImage("Sofa_5"),
    model3D: getModel("Sofa_5.glb"),
    description:
      "Sofa da đen với hai tấm lưng tựa vuông, mặt ngồi dài liền khối, tay vịn lớn và hai gối trang trí xám.",
    detailDescription:
      "Thiết kế sofa hai chỗ nổi bật với bề mặt da đen, hai khối tựa lưng vuông rõ nét và đệm ngồi liền mang đường may ngang tinh tế. Hai gối trang trí xám làm mềm các đường nét vuông vức, phù hợp phòng khách hiện đại, tối giản hoặc không gian tiếp khách chuyên nghiệp.",
    specifications: {
      "Chất liệu": "Bọc da, khung ghế",
      "Phong cách": "Hiện đại, tối giản",
      "Màu sắc": "Đen, gối xám",
      "Kiểu dáng": "Sofa thẳng, hai tựa lưng",
    },
    sizes: [
      createSize("170 cm", 170, 88, 85, 4200000),
      createSize("190 cm", 190, 90, 85, 4800000),
      createSize("210 cm", 210, 92, 85, 5400000),
    ],
  },

  {
    id: 36,
    name: "Sofa góc chữ L xanh xám",
    price: 1900000,
    inStock: true,
    category: "Sofa",
    subcategory: "Sofa góc",
    rooms: ["Phòng khách"],
    images: getGallery("Sofa_6"),
    hoverImage: getHoverImage("Sofa_6"),
    model3D: getModel("Sofa_6.glb"),
    description:
      "Sofa góc chữ L bọc vải xanh xám, ghế dài chaise phía trái khi nhìn chính diện, ba đệm tựa lưng và chân gỗ sáng.",
    detailDescription:
      "Sofa góc chữ L gồm một phần ghế dài duỗi chân phía trái, ba vị trí ngồi rộng với tựa lưng phân tầng, tay vịn bo mềm và khung chân gỗ sáng màu thấp. Lớp vải xanh xám dịu mắt thích hợp cho phòng khách hiện đại, Scandinavian hoặc không gian sinh hoạt chung có diện tích rộng.",
    specifications: {
      "Chất liệu": "Vải dệt và chân gỗ",
      "Phong cách": "Hiện đại, Scandinavian",
      "Màu sắc": "Xanh xám, nâu gỗ sáng",
      "Kiểu dáng": "Sofa chữ L, chaise bên trái nhìn chính diện",
    },
    sizes: [
      createSize("240 cm", 240, 160, 86, 1900000),
      createSize("270 cm", 270, 170, 86, 2100000),
      createSize("300 cm", 300, 180, 86, 2300000),
    ],
  },

  // ===================================================
  // SẢN PHẨM GIỮ LẠI TỪ PHIÊN BẢN CŨ (ID 35-49)
  // Các sản phẩm này được giữ riêng, không ghi đè dữ liệu mới.
  // ===================================================
  {
    id: 37,
    name: "Giường 1",
    price: 5000000,
    originalPrice: 6000000,
    inStock: true,
    category: "Giường",
    subcategory: "Giường ngủ",
    rooms: ["Phòng ngủ"],
    images: legacyBedImages,
    hoverImage: legacyBedImages[1],
    description:
      "Giường ngủ hiện đại với thiết kế mềm mại, phù hợp cho nhiều không gian phòng ngủ.",
    detailDescription:
      "Giường 1 mang phong cách hiện đại với thiết kế tối giản, đường nét mềm mại và khả năng kết hợp linh hoạt với nhiều phong cách nội thất. Sản phẩm được thiết kế nhằm mang lại sự thoải mái trong quá trình sử dụng đồng thời tạo điểm nhấn tinh tế cho không gian phòng ngủ.",
    specifications: {
      "Chất liệu": "Gỗ công nghiệp cao cấp",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Nâu gỗ",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("1m6", 160, 200, 100),
      createSize("1m8", 180, 200, 100),
      createSize("2m0", 200, 200, 100),
    ],
    model3D: legacyBedModel,
  },
  {
    id: 38,
    name: "Minimal Bed",
    price: 9800000,
    inStock: false,
    category: "Giường",
    subcategory: "Giường ngủ",
    rooms: ["Phòng ngủ"],
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Giường ngủ tối giản với thiết kế hiện đại, tạo cảm giác thoải mái cho phòng ngủ.",
    detailDescription:
      "Minimal Bed sở hữu thiết kế tối giản, tập trung vào sự cân bằng giữa công năng và thẩm mỹ. Kiểu dáng thanh thoát giúp sản phẩm dễ dàng kết hợp với nhiều phong cách phòng ngủ hiện đại.",
    specifications: {
      "Chất liệu": "Gỗ công nghiệp",
      "Phong cách": "Tối giản",
      "Màu sắc": "Nâu sáng",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [createSize("1m6", 160, 200, 100), createSize("1m8", 180, 200, 100)],
  },
  {
    id: 39,
    name: "Wooden Bed",
    price: 8500000,
    category: "Giường",
    subcategory: "Giường đôi",
    rooms: ["Phòng ngủ"],
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Giường gỗ mang lại cảm giác ấm áp và tự nhiên cho không gian nghỉ ngơi.",
    detailDescription:
      "Wooden Bed mang vẻ đẹp tự nhiên với chất liệu gỗ và thiết kế chắc chắn. Sản phẩm phù hợp với những không gian phòng ngủ theo phong cách ấm áp, tối giản và gần gũi.",
    specifications: {
      "Chất liệu": "Gỗ tự nhiên",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Nâu gỗ",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [createSize("1m6", 160, 200, 100), createSize("1m8", 180, 200, 100)],
  },
  {
    id: 40,
    name: "Modern Sofa",
    price: 6500000,
    category: "Sofa",
    subcategory: "Sofa phòng khách",
    rooms: ["Phòng khách"],
    images: [
      "https://images.unsplash.com/photo-1550254478-ead40cc54513?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Modern Sofa với kiểu dáng hiện đại, phù hợp cho không gian phòng khách rộng.",
    detailDescription:
      "Modern Sofa mang phong cách hiện đại với thiết kế cân đối và đường nét tinh gọn. Sản phẩm phù hợp cho phòng khách gia đình, căn hộ hoặc các không gian nội thất theo phong cách đương đại.",
    specifications: {
      "Chất liệu": "Vải cao cấp và gỗ",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Be",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("180 cm", 180, 90, 80),
      createSize("220 cm", 220, 90, 80),
      createSize("260 cm", 260, 90, 80),
    ],
  },
  {
    id: 41,
    name: "Lounge Chair",
    price: 3200000,
    category: "Ghế",
    subcategory: "Ghế thư giãn",
    rooms: ["Phòng khách", "Phòng làm việc"],
    images: [
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Lounge Chair mang đến cảm giác thoải mái và thư giãn với kiểu dáng thanh lịch.",
    detailDescription:
      "Lounge Chair được thiết kế dành cho những khoảnh khắc nghỉ ngơi và thư giãn. Kiểu dáng thanh lịch giúp sản phẩm phù hợp với phòng khách, phòng đọc sách hoặc các góc thư giãn trong nhà.",
    specifications: {
      "Chất liệu": "Vải và gỗ",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Be",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [createSize("Tiêu chuẩn", 70, 75, 80)],
  },
  {
    id: 42,
    name: "Modern Chair",
    price: 2800000,
    category: "Ghế",
    subcategory: "Ghế ăn",
    rooms: ["Phòng khách", "Phòng ăn", "Phòng làm việc"],
    images: [
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Modern Chair phù hợp cho phòng khách, phòng đọc sách hoặc không gian làm việc.",
    detailDescription:
      "Modern Chair có thiết kế đơn giản và thanh lịch, dễ dàng kết hợp với nhiều loại bàn và không gian nội thất khác nhau.",
    specifications: {
      "Chất liệu": "Gỗ và vải",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Nâu",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [createSize("Tiêu chuẩn", 50, 55, 80)],
  },
  {
    id: 43,
    name: "Nordic Coffee Table",
    price: 3600000,
    category: "Bàn",
    subcategory: "Bàn trà",
    rooms: ["Phòng khách"],
    images: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
    ],
    description: "Bàn trà phong cách Bắc Âu với thiết kế gọn gàng và tinh tế.",
    detailDescription:
      "Nordic Coffee Table mang cảm hứng Bắc Âu với thiết kế đơn giản, nhỏ gọn và dễ dàng kết hợp với sofa trong phòng khách.",
    specifications: {
      "Chất liệu": "Gỗ",
      "Phong cách": "Bắc Âu",
      "Màu sắc": "Nâu gỗ",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("100 cm", 100, 50, 40),
      createSize("120 cm", 120, 60, 40),
    ],
  },
  {
    id: 44,
    name: "Oak Dining Table",
    price: 7200000,
    category: "Bàn",
    subcategory: "Bàn ăn",
    rooms: ["Phòng ăn"],
    images: [
      "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Bàn ăn gỗ sồi với thiết kế chắc chắn, phù hợp cho không gian gia đình.",
    detailDescription:
      "Oak Dining Table được thiết kế với kiểu dáng chắc chắn và tối giản. Mặt bàn rộng tạo sự thoải mái khi sử dụng trong những bữa ăn gia đình.",
    specifications: {
      "Chất liệu": "Gỗ sồi",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Nâu gỗ",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("140 cm", 140, 80, 75),
      createSize("160 cm", 160, 80, 75),
      createSize("180 cm", 180, 90, 75),
    ],
  },
  {
    id: 45,
    name: "Oak Wardrobe",
    price: 11500000,
    category: "Tủ",
    subcategory: "Tủ quần áo",
    rooms: ["Phòng ngủ"],
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Tủ quần áo gỗ sồi với nhiều không gian lưu trữ và thiết kế hiện đại.",
    detailDescription:
      "Oak Wardrobe kết hợp giữa công năng lưu trữ và vẻ đẹp tự nhiên của gỗ. Thiết kế rộng rãi giúp sắp xếp quần áo và phụ kiện một cách khoa học.",
    specifications: {
      "Chất liệu": "Gỗ sồi",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Nâu sáng",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("120 cm", 120, 60, 200),
      createSize("160 cm", 160, 60, 200),
    ],
  },
  {
    id: 46,
    name: "Minimal Cabinet",
    price: 6200000,
    category: "Tủ",
    subcategory: "Tủ trang trí",
    rooms: ["Phòng khách", "Phòng ngủ", "Phòng làm việc"],
    images: [
      "https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Tủ cabinet tối giản phù hợp cho phòng khách, phòng ngủ hoặc phòng làm việc.",
    detailDescription:
      "Minimal Cabinet có thiết kế tối giản, phù hợp để lưu trữ và trưng bày đồ dùng trong nhiều không gian khác nhau.",
    specifications: {
      "Chất liệu": "Gỗ công nghiệp",
      "Phong cách": "Tối giản",
      "Màu sắc": "Nâu",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("120 cm", 120, 40, 80),
      createSize("160 cm", 160, 40, 80),
    ],
  },
  {
    id: 47,
    name: "Nordic Floor Lamp",
    price: 2400000,
    category: "Đèn",
    subcategory: "Đèn sàn",
    rooms: ["Phòng khách", "Phòng ngủ", "Phòng làm việc"],
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Đèn cây phong cách Bắc Âu tạo ánh sáng ấm áp và không gian thư giãn.",
    detailDescription:
      "Nordic Floor Lamp mang phong cách Bắc Âu với thiết kế thanh lịch. Ánh sáng dịu giúp tạo cảm giác ấm áp và thư giãn cho không gian.",
    specifications: {
      "Chất liệu": "Kim loại và vải",
      "Phong cách": "Bắc Âu",
      "Màu sắc": "Trắng",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [createSize("Tiêu chuẩn", 35, 35, 150)],
  },
  {
    id: 48,
    name: "Wooden Shelf",
    price: 3200000,
    category: "Kệ",
    subcategory: "Kệ trang trí",
    rooms: ["Phòng khách", "Phòng làm việc"],
    images: [
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Kệ gỗ nhiều tầng phù hợp để sách, đồ trang trí và các vật dụng nhỏ.",
    detailDescription:
      "Wooden Shelf có thiết kế nhiều tầng giúp tối ưu không gian lưu trữ. Sản phẩm phù hợp để sách, cây nhỏ và các vật dụng trang trí.",
    specifications: {
      "Chất liệu": "Gỗ",
      "Phong cách": "Tối giản",
      "Màu sắc": "Nâu gỗ",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("80 cm", 80, 30, 160),
      createSize("100 cm", 100, 30, 180),
    ],
  },
  {
    id: 49,
    name: "Round Wall Mirror",
    price: 1800000,
    category: "Gương",
    subcategory: "Gương treo tường",
    rooms: ["Phòng khách", "Phòng ngủ"],
    images: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Gương tròn thiết kế thanh lịch, phù hợp cho phòng ngủ và phòng khách.",
    detailDescription:
      "Round Wall Mirror sở hữu thiết kế tròn đơn giản và thanh lịch. Sản phẩm giúp không gian trở nên rộng rãi và sáng hơn.",
    specifications: {
      "Chất liệu": "Kính và khung gỗ",
      "Phong cách": "Hiện đại",
      "Màu sắc": "Nâu",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "12 tháng",
    },
    sizes: [
      createSize("60 cm", 60, 60, 3),
      createSize("80 cm", 80, 80, 3),
      createSize("100 cm", 100, 100, 3),
    ],
  },
  {
    id: 50,
    name: "Decor Vase",
    price: 850000,
    category: "Trang trí",
    subcategory: "Lọ trang trí",
    rooms: ["Phòng khách"],
    images: [
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Lọ trang trí mang phong cách tối giản, phù hợp với nhiều không gian nội thất.",
    detailDescription:
      "Decor Vase là món đồ trang trí nhỏ gọn giúp tạo điểm nhấn cho bàn trà, kệ hoặc tủ trang trí.",
    specifications: {
      "Chất liệu": "Gốm",
      "Phong cách": "Tối giản",
      "Màu sắc": "Trắng",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "Không áp dụng",
    },
  },
  {
    id: 51,
    name: "Decor Plant",
    price: 1200000,
    category: "Trang trí",
    subcategory: "Cây trang trí",
    rooms: ["Phòng khách", "Phòng ngủ", "Phòng làm việc"],
    images: [
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=800&q=80",
    ],
    description:
      "Cây trang trí giúp không gian trở nên xanh mát và gần gũi với thiên nhiên.",
    detailDescription:
      "Decor Plant mang màu xanh tự nhiên vào không gian sống, phù hợp để đặt tại phòng khách, phòng làm việc hoặc phòng ngủ.",
    specifications: {
      "Chất liệu": "Cây và chậu",
      "Phong cách": "Tự nhiên",
      "Màu sắc": "Xanh",
      "Xuất xứ": "Việt Nam",
      "Bảo hành": "Không áp dụng",
    },
  },
];

/**
 * Chuẩn hóa tồn kho ban đầu.
 *
 * - Sản phẩm có sizes: quản lý tồn kho riêng từng kích thước.
 * - Sản phẩm không có sizes: dùng product.stock.
 * - DEFAULT_INITIAL_STOCK và DEFAULT_SIZE_STOCK chỉ là dữ liệu mẫu.
 * - Tồn kho thực tế trong localStorage sẽ được stock.ts quản lý.
 */
const DEFAULT_INITIAL_STOCK = 10;
const DEFAULT_SIZE_STOCK = 5;

for (const product of products) {
  if (product.sizes?.length) {
    // Khởi tạo và chuẩn hóa tồn kho riêng của từng size.
    for (const size of product.sizes) {
      if (size.stock === undefined) {
        size.stock = DEFAULT_SIZE_STOCK;
      }

      size.stock = Math.max(0, Math.floor(size.stock));
    }

    // Còn hàng nếu có ít nhất một size có tồn kho lớn hơn 0.
    product.inStock = product.sizes.some((size) => (size.stock ?? 0) > 0);

    continue;
  }

  // Sản phẩm không có kích thước lựa chọn.
  if (product.stock === undefined) {
    product.stock = product.inStock === false ? 0 : DEFAULT_INITIAL_STOCK;
  }

  product.stock = Math.max(0, Math.floor(product.stock));
  product.inStock = product.stock > 0;
}

// =====================================================
// GET PRODUCT BY ID
// =====================================================

export function getProductById(id: number): Product | undefined {
  return products.find(function (product) {
    return product.id === id;
  });
}

// =====================================================
// HOME PRODUCTS
// =====================================================

export const featuredProducts: Product[] = [
  products[0],
  products[1],
  products[2],
  products[3],
];

// =====================================================
// SẢN PHẨM MỚI
// =====================================================

export const newProducts: Product[] = [
  products[3],
  products[4],
  products[5],
  products[6],
  products[7],
];

// =====================================================
// BỘ SƯU TẬP
// =====================================================

export const collectionProducts: Product[] = [
  products[3],
  products[4],
  products[5],
  products[6],
  products[7],
  products[1],
  products[2],
  products[8],
];

// Lấy sản phẩm theo danh mục, không ảnh hưởng đến các danh mục chưa có hàng.
export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((product) => product.category === category);
}

// Chuẩn hóa danh sách không gian cho cả dữ liệu mới (rooms) và cũ (spaces).
export function getProductRooms(product: Product): ProductRoom[] {
  return product.rooms ?? [];
}

export function getProductsByRoom(room: ProductRoom): Product[] {
  return products.filter((product) => getProductRooms(product).includes(room));
}

export function getDiscountPercent(product: Product): number | undefined {
  if (
    product.originalPrice === undefined ||
    product.originalPrice <= product.price
  )
    return undefined;
  return Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100,
  );
}
