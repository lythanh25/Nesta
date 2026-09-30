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

export type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  subcategory: string;
  images: string[];
  description: string;
  model3D?: string;
};

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
  },
];

// =====================================================
// GET PRODUCT BY ID
// =====================================================

export function getProductById(id: number) {
  return products.find(function (product) {
    return product.id === id;
  });
}

// =====================================================
// HOME PRODUCTS
// =====================================================

export const featuredProducts = products.slice(0, 4);

export const newProducts = products.slice(4, 8);
