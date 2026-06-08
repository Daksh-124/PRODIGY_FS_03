export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  categoryId: string;
  categoryName: string;
  subCategoryId?: string;
  subCategoryName?: string;
  stock: number;
  size: string;
  condition: string;
  brand: string;
  isFeatured: boolean;
  isTrending: boolean;
  rating: number;
  reviews: Review[];
  createdAt: string;
  gender: "Men" | "Women";
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export const CATEGORIES: Category[] = [
  { id: "men", name: "Men", slug: "men" },
  { id: "women", name: "Women", slug: "women" },
  { id: "rare-finds", name: "Rare Finds", slug: "rare-finds" }
];

export const SUBCATEGORIES: Subcategory[] = [
  // Men's Subcategories
  { id: "sub-men-tshirts-tops", name: "T-Shirts & Tops", slug: "men-t-shirts-tops", categoryId: "men" },
  { id: "sub-men-shirts", name: "Shirts", slug: "men-shirts", categoryId: "men" },
  { id: "sub-men-summer-knits", name: "Summer Knits", slug: "men-summer-knits", categoryId: "men" },
  { id: "sub-men-jeans", name: "Jeans", slug: "men-jeans", categoryId: "men" },
  { id: "sub-men-trousers", name: "Trousers", slug: "men-trousers", categoryId: "men" },
  { id: "sub-men-shorts", name: "Shorts", slug: "men-shorts", categoryId: "men" },
  { id: "sub-men-basics", name: "Basics", slug: "men-basics", categoryId: "men" },
  { id: "sub-men-polos", name: "Polos", slug: "men-polos", categoryId: "men" },
  { id: "sub-men-jackets-coats", name: "Jackets & Coats", slug: "men-jackets-coats", categoryId: "men" },
  { id: "sub-men-hoodies-sweatshirts", name: "Hoodies & Sweatshirts", slug: "men-hoodies-sweatshirts", categoryId: "men" },
  { id: "sub-men-sweaters-cardigans", name: "Sweaters & Cardigans", slug: "men-sweaters-cardigans", categoryId: "men" },
  { id: "sub-men-blazers-suits", name: "Blazers & Suits", slug: "men-blazers-suits", categoryId: "men" },
  { id: "sub-men-sweatpants", name: "Sweatpants", slug: "men-sweatpants", categoryId: "men" },

  // Women's Subcategories
  { id: "sub-women-tops", name: "Tops", slug: "women-tops", categoryId: "women" },
  { id: "sub-women-dresses", name: "Dresses", slug: "women-dresses", categoryId: "women" },
  { id: "sub-women-shirts-blouses", name: "Shirts & Blouses", slug: "women-shirts-blouses", categoryId: "women" },
  { id: "sub-women-jeans", name: "Jeans", slug: "women-jeans", categoryId: "women" },
  { id: "sub-women-trousers", name: "Trousers", slug: "women-trousers", categoryId: "women" },
  { id: "sub-women-basics", name: "Basics", slug: "women-basics", categoryId: "women" },
  { id: "sub-women-skirts", name: "Skirts", slug: "women-skirts", categoryId: "women" },
  { id: "sub-women-shorts", name: "Shorts", slug: "women-shorts", categoryId: "women" },
  { id: "sub-women-jackets-coats", name: "Jackets & Coats", slug: "women-jackets-coats", categoryId: "women" },
  { id: "sub-women-sweaters-cardigans", name: "Sweaters & Cardigans", slug: "women-sweaters-cardigans", categoryId: "women" },
  { id: "sub-women-sweatshirts-hoodies", name: "Sweatshirts & Hoodies", slug: "women-sweatshirts-hoodies", categoryId: "women" },
  { id: "sub-women-blazers-waistcoats", name: "Blazers & Waistcoats", slug: "women-blazers-waistcoats", categoryId: "women" },
  { id: "sub-women-jumpsuits", name: "Jumpsuits", slug: "women-jumpsuits", categoryId: "women" },
  { id: "sub-women-knitwear", name: "Knitwear", slug: "women-knitwear", categoryId: "women" },

  // Rare Finds Subcategories
  { id: "sub-rare-grails", name: "Grails", slug: "rare-grails", categoryId: "rare-finds" },
  { id: "sub-rare-vintage", name: "Vintage Pieces", slug: "rare-vintage", categoryId: "rare-finds" }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Archival Gothic Leather Trench",
    description: "Heavy-weight premium distress-treated steerhide leather trench coat. Features custom embossed metal button closures, standard wide notch collar, and full gothic script printed satin lining. Perfect heavy drape silhouette.",
    price: 320,
    imageUrls: [
      "/images/leather_trench_1.webp",
      "/images/leather_trench_2.webp"
    ],
    categoryId: "rare-finds",
    categoryName: "Rare Finds",
    subCategoryId: "sub-rare-grails",
    subCategoryName: "Grails",
    stock: 1,
    size: "S, M, L, XL",
    condition: "9.5/10 (Near Mint)",
    brand: "Fear of God Archive",
    isFeatured: true,
    isTrending: true,
    rating: 4.9,
    reviews: [
      { id: "rev-1", userName: "Aidan K.", rating: 5, comment: "Absurdly heavy and beautiful quality. The lining is pure art.", createdAt: "2026-05-10" }
    ],
    createdAt: "2026-04-01",
    gender: "Men"
  },
  {
    id: "prod-2",
    name: "Celestial Eclipse Hoodie",
    description: "Double-layered 520GSM French Terry cotton hood with washed charcoal black vintage wash. Mystical stacked moon phases screenprinted vertically down the spine in cracked off-white ink. Oversized streetwear cut.",
    price: 145,
    imageUrls: [
      "/images/eclipse_hoodie_1.webp",
      "/images/eclipse_hoodie_2.webp"
    ],
    categoryId: "men",
    categoryName: "Men",
    subCategoryId: "sub-men-hoodies-sweatshirts",
    subCategoryName: "Hoodies & Sweatshirts",
    stock: 3,
    size: "XS, S, M, L, XL",
    condition: "9/10 (Excellent)",
    brand: "MoonzThrift Custom",
    isFeatured: true,
    isTrending: true,
    rating: 4.8,
    reviews: [
      { id: "rev-2", userName: "Devon M.", rating: 5, comment: "Drape is insane, very heavy and keeps me warm. Best graphic hoodie I own.", createdAt: "2026-05-15" }
    ],
    createdAt: "2026-04-10",
    gender: "Men"
  },
  {
    id: "prod-3",
    name: "Y2K Cargo Denim Overalls",
    description: "Original wide-leg denim overalls from the early 2000s. Deep charcoal wash with accent beige cargo pocket stitching, multiple tool loops, and adjustable shoulder straps. Muted grunge streetwear vibe.",
    price: 110,
    imageUrls: [
      "/images/denim_overalls_1.webp",
      "/images/denim_overalls_2.webp"
    ],
    categoryId: "women",
    categoryName: "Women",
    subCategoryId: "sub-women-trousers",
    subCategoryName: "Trousers",
    stock: 2,
    size: "S, M, L",
    condition: "8.5/10 (Light Wear)",
    brand: "Represent Vintage",
    isFeatured: false,
    isTrending: true,
    rating: 4.5,
    reviews: [],
    createdAt: "2026-04-20",
    gender: "Women"
  },
  {
    id: "prod-4",
    name: "1994 Seattle Grunge Flannel",
    description: "Authentic mid-90s heavy wool flannel shirt. Faded vintage brown and beige block plaid patterns. Hand-frayed hem and soft brushed hand-feel from years of wear.",
    price: 85,
    imageUrls: [
      "/images/grunge_flannel_1.webp",
      "/images/grunge_flannel_2.webp"
    ],
    categoryId: "men",
    categoryName: "Men",
    subCategoryId: "sub-men-shirts",
    subCategoryName: "Shirts",
    stock: 1,
    size: "XS, S, M, L",
    condition: "8/10 (True Vintage Patina)",
    brand: "END Vintage",
    isFeatured: false,
    isTrending: false,
    rating: 4.7,
    reviews: [
      { id: "rev-3", userName: "Marcus T.", rating: 4, comment: "Classic fit. Smells a bit old but that is what washing is for. Authentic as it gets.", createdAt: "2026-05-02" }
    ],
    createdAt: "2026-03-15",
    gender: "Men"
  },
  {
    id: "prod-5",
    name: "Distressed Moon Knit Sweater",
    description: "Hand-knit heavy cotton sweater with open distressed knit detailing. Custom beige-tinted moon phases knit directly into the front chest panel. Gothic frayed cuffs and crop hem line.",
    price: 180,
    imageUrls: [
      "/images/moon_sweater_1.webp",
      "/images/moon_sweater_2.webp"
    ],
    categoryId: "women",
    categoryName: "Women",
    subCategoryId: "sub-women-knitwear",
    subCategoryName: "Knitwear",
    stock: 2,
    size: "XS, S, M, L, XL",
    condition: "9.5/10 (Near Mint)",
    brand: "MoonzThrift Custom",
    isFeatured: true,
    isTrending: true,
    rating: 5.0,
    reviews: [
      { id: "rev-4", userName: "Lucas V.", rating: 5, comment: "Absolute masterpiece. Got 4 compliments on the first wear.", createdAt: "2026-05-24" }
    ],
    createdAt: "2026-05-01",
    gender: "Women"
  },
  {
    id: "prod-6",
    name: "Reconstruct Cargo Streetwear Pants",
    description: "Paneled streetwear trousers crafted from repurposed vintage military bags. Contrast black zipper panels, adjustable strap systems, and utility cargo side storage. Extremely detailed tailoring.",
    price: 240,
    imageUrls: [
      "/images/cargo_pants_1.webp",
      "/images/cargo_pants_2.webp"
    ],
    categoryId: "men",
    categoryName: "Men",
    subCategoryId: "sub-men-trousers",
    subCategoryName: "Trousers",
    stock: 1,
    size: "S, M, L",
    condition: "9/10 (Excellent)",
    brand: "Culture Kings Select",
    isFeatured: false,
    isTrending: false,
    rating: 4.6,
    reviews: [],
    createdAt: "2026-05-05",
    gender: "Men"
  },
  {
    id: "prod-7",
    name: "Celestial Velvet Goth Corset",
    description: "Unveiled from the early Y2K era, a premium fitted velvet corset with custom silver moon embroidery details, front lace-up paneling, and hook-and-eye back closures.",
    price: 95,
    imageUrls: [
      "/images/goth_corset_1.webp",
      "/images/goth_corset_2.webp"
    ],
    categoryId: "women",
    categoryName: "Women",
    subCategoryId: "sub-women-tops",
    subCategoryName: "Tops",
    stock: 1,
    size: "XS, S, M",
    condition: "9.5/10 (Near Mint)",
    brand: "Archive Women",
    isFeatured: false,
    isTrending: true,
    rating: 4.8,
    reviews: [],
    createdAt: "2026-05-12",
    gender: "Women"
  },
  {
    id: "prod-8",
    name: "Minimalist Eclipse Cargo Skirt",
    description: "Low-rise technical cargo maxi skirt in premium vintage charcoal canvas. Features utility flap pockets, adjustable drawstrings at the hemline, and back slit detail.",
    price: 125,
    imageUrls: [
      "/images/cargo_skirt_1.webp",
      "/images/cargo_skirt_2.webp"
    ],
    categoryId: "women",
    categoryName: "Women",
    subCategoryId: "sub-women-skirts",
    subCategoryName: "Skirts",
    stock: 2,
    size: "S, M, L",
    condition: "9/10 (Excellent)",
    brand: "Represent Women",
    isFeatured: false,
    isTrending: true,
    rating: 4.7,
    reviews: [],
    createdAt: "2026-05-18",
    gender: "Women"
  }
];

export const MOCK_ORDERS = [
  {
    id: "ord-88392",
    date: "2026-05-20",
    total: 320,
    status: "PAID",
    address: {
      street: "303 Eclipse Avenue, Suite A",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country: "United States"
    },
    coupon: null,
    items: [
      { productId: "prod-1", name: "Archival Gothic Leather Trench", quantity: 1, price: 320, size: "L", imageUrl: "/images/leather_trench_1.webp" }
    ],
    customerName: "Lila Moon",
    email: "lila@moonzthrift.com"
  },
  {
    id: "ord-77491",
    date: "2026-05-22",
    total: 110,
    status: "DELIVERED",
    address: {
      street: "303 Eclipse Avenue, Suite A",
      city: "Seattle",
      state: "WA",
      zip: "98101",
      country: "United States"
    },
    coupon: null,
    items: [
      { productId: "prod-3", name: "Y2K Cargo Denim Overalls", quantity: 1, price: 110, size: "M", imageUrl: "/images/denim_overalls_1.webp" }
    ],
    customerName: "Lila Moon",
    email: "lila@moonzthrift.com"
  }
];

export const MOCK_COUPONS = [
  { code: "LUNAR15", discount: 15 },
  { code: "STREETWEAR20", discount: 20 },
  { code: "ECLIPSE10", discount: 10 }
];
export const MOCK_ADDRESS = {
  street: "303 Eclipse Avenue, Suite A",
  city: "Seattle",
  state: "WA",
  zip: "98101",
  country: "United States"
};
