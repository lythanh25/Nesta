// =====================================================
// IMPORT FILE LOCAL - GIƯỜNG 1
// =====================================================

const bed1Image1 = new URL("../assets/images/Bed-1-1.jpg", import.meta.url)
  .href;

const bed1Image2 = new URL("../assets/images/Bed-1-2.jpg", import.meta.url)
  .href;

const bed1Image3 = new URL("../assets/images/Bed-1-3.jpg", import.meta.url)
  .href;

const bed1Image4 = new URL("../assets/images/Bed-1-4.jpg", import.meta.url)
  .href;

const bed1Model = new URL("../assets/models/Bed-1.glb", import.meta.url).href;

// =====================================================
// PRODUCT TYPE
// =====================================================

export type ProductSize = {
  label: string;
  width: number;
  length: number;
  height: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  subcategory: string;

  images: string[];

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
): ProductSize {
  return {
    label,
    width,
    length,
    height,
  };
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
    name: "Giường 1",
    price: 5000000,

    category: "Giường",
    subcategory: "Giường ngủ",

    images: [bed1Image1, bed1Image2, bed1Image3, bed1Image4],

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

    model3D: bed1Model,
  },

  {
    id: 7,
    name: "Minimal Bed",
    price: 9800000,

    category: "Giường",
    subcategory: "Giường ngủ",

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
    id: 8,
    name: "Wooden Bed",
    price: 8500000,

    category: "Giường",
    subcategory: "Giường đôi",

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

  // ===================================================
  // SOFA
  // ===================================================

  {
    id: 2,
    name: "Modern Sofa",
    price: 6500000,

    category: "Sofa",
    subcategory: "Sofa phòng khách",

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

  // ===================================================
  // GHẾ
  // ===================================================

  {
    id: 3,
    name: "Lounge Chair",
    price: 3200000,

    category: "Ghế",
    subcategory: "Ghế thư giãn",

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
    id: 4,
    name: "Modern Chair",
    price: 2800000,

    category: "Ghế",
    subcategory: "Ghế ăn",

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
    id: 5,
    name: "Nordic Coffee Table",
    price: 3600000,

    category: "Bàn",
    subcategory: "Bàn trà",

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
    id: 6,
    name: "Oak Dining Table",
    price: 7200000,

    category: "Bàn",
    subcategory: "Bàn ăn",

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

  // ===================================================
  // TỦ
  // ===================================================

  {
    id: 9,
    name: "Oak Wardrobe",
    price: 11500000,

    category: "Tủ",
    subcategory: "Tủ quần áo",

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
    id: 10,
    name: "Minimal Cabinet",
    price: 6200000,

    category: "Tủ",
    subcategory: "Tủ trang trí",

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

  // ===================================================
  // ĐÈN
  // ===================================================

  {
    id: 11,
    name: "Nordic Floor Lamp",
    price: 2400000,

    category: "Đèn",
    subcategory: "Đèn sàn",

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

  // ===================================================
  // KỆ
  // ===================================================

  {
    id: 12,
    name: "Wooden Shelf",
    price: 3200000,

    category: "Kệ",
    subcategory: "Kệ trang trí",

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

  // ===================================================
  // GƯƠNG
  // ===================================================

  {
    id: 13,
    name: "Round Wall Mirror",
    price: 1800000,

    category: "Gương",
    subcategory: "Gương treo tường",

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

  // ===================================================
  // TRANG TRÍ
  // ===================================================

  {
    id: 14,
    name: "Decor Vase",
    price: 850000,

    category: "Trang trí",
    subcategory: "Lọ trang trí",

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
    id: 15,
    name: "Decor Plant",
    price: 1200000,

    category: "Trang trí",
    subcategory: "Cây trang trí",

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
