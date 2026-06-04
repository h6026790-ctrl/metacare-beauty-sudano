import type { Brand, Category, Product, OrderStatus } from "./types";
import cream from "@/assets/product-cream.jpg";
import perfume from "@/assets/product-perfume.jpg";
import lipstick from "@/assets/product-lipstick.jpg";
import serum from "@/assets/product-serum.jpg";
import sunscreen from "@/assets/product-sunscreen.jpg";
import mascara from "@/assets/product-mascara.jpg";

export const brands: Brand[] = [
  { id: "lumiere", name: { ar: "لومييه", en: "Lumière" }, tagline: { ar: "إشراقة فرنسية", en: "French radiance" } },
  { id: "noor", name: { ar: "نور", en: "Noor" }, tagline: { ar: "للبشرة العربية", en: "For Arab skin" } },
  { id: "aqua-lab", name: { ar: "أكوا لاب", en: "Aqua Lab" }, tagline: { ar: "علم العناية", en: "Skincare science" } },
  { id: "velvet", name: { ar: "فيلفيت", en: "Velvet" }, tagline: { ar: "مكياج فاخر", en: "Luxury makeup" } },
  { id: "azure", name: { ar: "أزور", en: "Azure" }, tagline: { ar: "عطور توقيع", en: "Signature scents" } },
  { id: "soleil", name: { ar: "سولاي", en: "Soleil" }, tagline: { ar: "حماية ذكية", en: "Smart sun protection" } },
  { id: "rosa", name: { ar: "روزا", en: "Rosa" }, tagline: { ar: "العناية بالشفاه", en: "Lip care, refined" } },
  { id: "atelier", name: { ar: "أتيلييه", en: "Atelier" }, tagline: { ar: "للجسم والحمام", en: "Body & bath" } },
];

export const categories: Category[] = [
  { id: "skincare", name: { ar: "العناية بالبشرة", en: "Skincare" }, icon: "✦" },
  { id: "makeup", name: { ar: "المكياج", en: "Makeup" }, icon: "✿" },
  { id: "fragrance", name: { ar: "العطور", en: "Fragrance" }, icon: "❀" },
  { id: "bodycare", name: { ar: "العناية بالجسم", en: "Body Care" }, icon: "✻" },
];

// 20 products spanning all categories and brands
export const products: Product[] = [
  {
    id: "p-001",
    name: { ar: "سيروم الترطيب العميق", en: "Hydra Deep Serum" },
    brandId: "aqua-lab", categoryId: "skincare",
    price: 48000, compareAt: 60000, image: serum,
    description: {
      ar: "سيروم خفيف بحمض الهيالورونيك ينعش البشرة ويمنحها ترطيباً عميقاً وإشراقة طبيعية.",
      en: "Lightweight hyaluronic-acid serum that floods skin with moisture for a fresh, lit-from-within glow.",
    },
    specs: [
      { label: { ar: "الحجم", en: "Size" }, value: { ar: "٣٠ مل", en: "30 ml" } },
      { label: { ar: "نوع البشرة", en: "Skin type" }, value: { ar: "كل الأنواع", en: "All types" } },
    ],
    stock: 24, isFeatured: true, isBestSeller: true,
  },
  {
    id: "p-002",
    name: { ar: "كريم الترميم الليلي", en: "Night Repair Cream" },
    brandId: "noor", categoryId: "skincare",
    price: 62000, image: cream,
    description: { ar: "كريم ليلي غني يجدد خلايا البشرة ويعيد لها نضارتها وحيويتها بحلول الصباح.",
      en: "Rich night cream that renews skin overnight and restores its morning radiance." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٥٠ مل", en: "50 ml" } }],
    stock: 12, isFeatured: true,
  },
  {
    id: "p-003",
    name: { ar: "أحمر شفاه فيلفيت ماط", en: "Velvet Matte Lipstick" },
    brandId: "velvet", categoryId: "makeup",
    price: 28000, image: lipstick,
    description: { ar: "أحمر شفاه ماط بتركيبة فاخرة تدوم طويلاً مع لمسة مخملية ناعمة.",
      en: "Long-wear matte lipstick with a velvet-soft finish that feels weightless." },
    specs: [{ label: { ar: "اللون", en: "Shade" }, value: { ar: "وردي ملكي", en: "Royal Rose" } }],
    stock: 40, isNew: true, isBestSeller: true,
  },
  {
    id: "p-004",
    name: { ar: "عطر أزور بلو", en: "Azure Blue Eau de Parfum" },
    brandId: "azure", categoryId: "fragrance",
    price: 145000, image: perfume,
    description: { ar: "عطر شرقي أنيق بنفحات الياسمين والعنبر يبقى معكِ طوال اليوم.",
      en: "An elegant oriental fragrance with jasmine and amber that lasts all day." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٧٥ مل", en: "75 ml" } }],
    stock: 8, isFeatured: true,
  },
  {
    id: "p-005",
    name: { ar: "واقي شمس يومي SPF50", en: "Daily Shield SPF50" },
    brandId: "soleil", categoryId: "skincare",
    price: 39000, image: sunscreen,
    description: { ar: "حماية يومية خفيفة الملمس بدون أثر أبيض، مناسبة تحت المكياج.",
      en: "Lightweight invisible daily protection that layers beautifully under makeup." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٥٠ مل", en: "50 ml" } }],
    stock: 35, isBestSeller: true, isNew: true,
  },
  {
    id: "p-006",
    name: { ar: "ماسكارا الحجم اللامحدود", en: "Infinite Volume Mascara" },
    brandId: "velvet", categoryId: "makeup",
    price: 32000, image: mascara,
    description: { ar: "ماسكارا تمنح رموشكِ كثافة وطولاً استثنائيين بلمسة واحدة.",
      en: "Delivers extraordinary length and volume to your lashes in one stroke." },
    specs: [{ label: { ar: "اللون", en: "Color" }, value: { ar: "أسود ليلي", en: "Midnight Black" } }],
    stock: 0, isFeatured: true,
  },
  {
    id: "p-007",
    name: { ar: "غسول لطيف بحمض الساليسيليك", en: "Gentle Salicylic Cleanser" },
    brandId: "aqua-lab", categoryId: "skincare",
    price: 26000, image: cream,
    description: { ar: "غسول يومي ينظف بعمق ويوازن البشرة دون أن يجففها.",
      en: "Daily cleanser that purifies deeply and balances skin without stripping it." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "١٥٠ مل", en: "150 ml" } }],
    stock: 18, isNew: true,
  },
  {
    id: "p-008",
    name: { ar: "عطر لومييه ذهبي", en: "Lumière Gold" },
    brandId: "lumiere", categoryId: "fragrance",
    price: 175000, image: perfume,
    description: { ar: "عطر فاخر بتوقيع فرنسي ولمسة ذهبية من الفانيليا والعنبر.",
      en: "A French signature scent with a golden touch of vanilla and amber." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "١٠٠ مل", en: "100 ml" } }],
    stock: 5, isFeatured: true,
  },
  {
    id: "p-009",
    name: { ar: "كريم العين المنشّط", en: "Revive Eye Cream" },
    brandId: "noor", categoryId: "skincare",
    price: 42000, image: cream,
    description: { ar: "كريم عين مركّز يقلل من الانتفاخ والهالات ويشد محيط العين.",
      en: "Concentrated eye cream that reduces puffiness and dark circles." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "١٥ مل", en: "15 ml" } }],
    stock: 22,
  },
  {
    id: "p-010",
    name: { ar: "بلسم الشفاه الوردي", en: "Rosé Lip Balm" },
    brandId: "rosa", categoryId: "makeup",
    price: 14000, image: lipstick,
    description: { ar: "بلسم شفاه مرطّب بلون وردي خفيف ولمعة طبيعية.",
      en: "Hydrating lip balm with a sheer rosé tint and a natural glossy finish." },
    specs: [{ label: { ar: "اللون", en: "Shade" }, value: { ar: "وردي عاري", en: "Sheer Rose" } }],
    stock: 60, isBestSeller: true,
  },
  {
    id: "p-011",
    name: { ar: "تونر متوازن للبشرة الدهنية", en: "Balance Toner for Oily Skin" },
    brandId: "aqua-lab", categoryId: "skincare",
    price: 31000, image: serum,
    description: { ar: "تونر يوازن إفراز الزيوت ويصغر مظهر المسام دون جفاف.",
      en: "Toner that balances oil production and refines pores without dryness." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٢٠٠ مل", en: "200 ml" } }],
    stock: 14, isNew: true,
  },
  {
    id: "p-012",
    name: { ar: "أحمر خدود مشرق", en: "Glow Blush" },
    brandId: "velvet", categoryId: "makeup",
    price: 24000, image: lipstick,
    description: { ar: "أحمر خدود بودرة بلمسة ساتان طبيعية يمنح إشراقة صحية.",
      en: "Satin-finish powder blush for a natural, healthy flush." },
    specs: [{ label: { ar: "اللون", en: "Shade" }, value: { ar: "خوخي ناعم", en: "Soft Peach" } }],
    stock: 28,
  },
  {
    id: "p-013",
    name: { ar: "عطر روزا الياسمين", en: "Rosa Jasmine" },
    brandId: "rosa", categoryId: "fragrance",
    price: 98000, compareAt: 120000, image: perfume,
    description: { ar: "عطر زهري ربيعي بنفحات الياسمين الأبيض والخزامى.",
      en: "A floral spring scent of white jasmine and lavender." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٥٠ مل", en: "50 ml" } }],
    stock: 9, isFeatured: true,
  },
  {
    id: "p-014",
    name: { ar: "لوشن الجسم المرطّب", en: "Silk Body Lotion" },
    brandId: "atelier", categoryId: "bodycare",
    price: 36000, image: cream,
    description: { ar: "لوشن جسم خفيف بزبدة الشيا يمنح البشرة نعومة الحرير.",
      en: "Lightweight shea-butter lotion that leaves skin silk-soft." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٢٥٠ مل", en: "250 ml" } }],
    stock: 32, isBestSeller: true,
  },
  {
    id: "p-015",
    name: { ar: "مقشّر الجسم بالسكر", en: "Sugar Body Scrub" },
    brandId: "atelier", categoryId: "bodycare",
    price: 29000, image: cream,
    description: { ar: "مقشّر طبيعي بالسكر وزيت اللوز ينعّم البشرة دون قسوة.",
      en: "Natural sugar and almond-oil scrub that polishes skin gently." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٢٠٠ غ", en: "200 g" } }],
    stock: 11, isNew: true,
  },
  {
    id: "p-016",
    name: { ar: "كحل عيون ضد الماء", en: "Waterproof Kohl Eyeliner" },
    brandId: "velvet", categoryId: "makeup",
    price: 18000, image: mascara,
    description: { ar: "كحل أسود مكثّف مقاوم للماء يدوم ١٢ ساعة.",
      en: "Intense black waterproof kohl that lasts 12 hours." },
    specs: [{ label: { ar: "اللون", en: "Shade" }, value: { ar: "أسود", en: "Black" } }],
    stock: 45, isBestSeller: true,
  },
  {
    id: "p-017",
    name: { ar: "كريم النهار المرطّب SPF30", en: "Daily Moisturiser SPF30" },
    brandId: "soleil", categoryId: "skincare",
    price: 45000, image: cream,
    description: { ar: "كريم نهاري يجمع بين الترطيب والحماية في خطوة واحدة.",
      en: "Day cream that combines hydration and protection in one step." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٥٠ مل", en: "50 ml" } }],
    stock: 19,
  },
  {
    id: "p-018",
    name: { ar: "زيت الشعر بالأرجان", en: "Argan Hair Oil" },
    brandId: "atelier", categoryId: "bodycare",
    price: 38000, image: serum,
    description: { ar: "زيت أرجان نقي ينعّم الشعر ويمنحه لمعاناً صحياً.",
      en: "Pure argan oil that smooths hair and adds a healthy shine." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "١٠٠ مل", en: "100 ml" } }],
    stock: 16,
  },
  {
    id: "p-019",
    name: { ar: "كونسيلر تغطية كاملة", en: "Full Coverage Concealer" },
    brandId: "lumiere", categoryId: "makeup",
    price: 33000, image: lipstick,
    description: { ar: "كونسيلر بتغطية عالية يخفي العيوب بمظهر طبيعي يدوم طوال اليوم.",
      en: "High-coverage concealer that hides imperfections with a natural all-day finish." },
    specs: [{ label: { ar: "اللون", en: "Shade" }, value: { ar: "بيج متوسط", en: "Medium Beige" } }],
    stock: 26,
  },
  {
    id: "p-020",
    name: { ar: "عطر نور المسك", en: "Noor Musk" },
    brandId: "noor", categoryId: "fragrance",
    price: 120000, image: perfume,
    description: { ar: "عطر مسك أبيض ناعم ومناسب للاستخدام اليومي.",
      en: "A soft white-musk fragrance perfect for everyday wear." },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٥٠ مل", en: "50 ml" } }],
    stock: 7,
  },
];

export const findProduct = (id: string) => products.find((p) => p.id === id);
export const findBrand = (id: string) => brands.find((b) => b.id === id);
export const findCategory = (id: string) => categories.find((c) => c.id === id);
export const productsByBrand = (id: string) => products.filter((p) => p.brandId === id);
export const productsByCategory = (id: string) => products.filter((p) => p.categoryId === id);
export const onSaleProducts = () => products.filter((p) => p.compareAt && p.compareAt > p.price);

// ============================================================================
// Sample customers, orders, CS queue & delivery jobs — used by dashboards
// in Phase 1. Phase 2 will replace these with real Supabase data.
// ============================================================================

export type SampleCustomer = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  neighborhood: string;
  ordersCount: number;
  totalSpent: number;
  joinedAt: string;
};

export const sampleCustomers: SampleCustomer[] = [
  { id: "c-001", name: "سارة محمد إبراهيم", phone: "0912345678", whatsapp: "0912345678", neighborhood: "حي الثورة", ordersCount: 6, totalSpent: 312000, joinedAt: "2026-02-14" },
  { id: "c-002", name: "هدى علي عثمان",   phone: "0911223344", whatsapp: "0911223344", neighborhood: "حي الموردة", ordersCount: 3, totalSpent: 174000, joinedAt: "2026-03-02" },
  { id: "c-003", name: "آلاء عثمان حسن",  phone: "0918887766", whatsapp: "0918887766", neighborhood: "حي السوق", ordersCount: 9, totalSpent: 528000, joinedAt: "2025-11-21" },
  { id: "c-004", name: "ريم خالد",         phone: "0919998877", whatsapp: "0919998877", neighborhood: "حي الجديد", ordersCount: 1, totalSpent: 48000, joinedAt: "2026-05-30" },
  { id: "c-005", name: "منال أحمد",        phone: "0915554433", whatsapp: "0915554433", neighborhood: "حي الدبيكر", ordersCount: 4, totalSpent: 226000, joinedAt: "2026-01-18" },
  { id: "c-006", name: "إيمان عبد الله",   phone: "0913332211", whatsapp: "0913332211", neighborhood: "حي الزهور", ordersCount: 2, totalSpent: 84000, joinedAt: "2026-04-09" },
];

export type SampleOrder = {
  number: string;
  customerId: string;
  status: OrderStatus;
  items: { productId: string; qty: number }[];
  total: number; // SDG (subtotal + 3000 delivery)
  placedAt: string; // ISO
  assignedTo?: { staff?: string; agent?: string };
  address: string;
};

export const sampleOrders: SampleOrder[] = [
  { number: "MC260604-1042", customerId: "c-001", status: "new",       items: [{ productId: "p-001", qty: 1 }, { productId: "p-005", qty: 1 }], total: 90000, placedAt: "2026-06-04T08:42:00Z", assignedTo: { staff: "خدمة 1" }, address: "حي الثورة، شارع الجامعة، بجوار صيدلية النور" },
  { number: "MC260604-2173", customerId: "c-002", status: "review",    items: [{ productId: "p-002", qty: 1 }, { productId: "p-009", qty: 1 }], total: 107000, placedAt: "2026-06-04T07:10:00Z", assignedTo: { staff: "خدمة 1" }, address: "حي الموردة، خلف المستشفى" },
  { number: "MC260604-3320", customerId: "c-005", status: "paid",      items: [{ productId: "p-013", qty: 1 }], total: 101000, placedAt: "2026-06-04T06:30:00Z", assignedTo: { staff: "خدمة 1", agent: "مندوب 1" }, address: "حي الدبيكر، شارع المدينة" },
  { number: "MC260603-9981", customerId: "c-003", status: "shipping",  items: [{ productId: "p-004", qty: 1 }, { productId: "p-010", qty: 2 }], total: 176000, placedAt: "2026-06-03T17:05:00Z", assignedTo: { staff: "خدمة 2", agent: "مندوب 1" }, address: "حي السوق، شارع الميدان" },
  { number: "MC260603-7714", customerId: "c-006", status: "shipping",  items: [{ productId: "p-016", qty: 1 }, { productId: "p-014", qty: 1 }], total: 57000, placedAt: "2026-06-03T15:20:00Z", assignedTo: { staff: "خدمة 2", agent: "مندوب 2" }, address: "حي الزهور، أمام مدرسة الأمل" },
  { number: "MC260603-5520", customerId: "c-001", status: "delivered", items: [{ productId: "p-003", qty: 1 }, { productId: "p-010", qty: 1 }], total: 45000, placedAt: "2026-06-03T10:00:00Z", assignedTo: { staff: "خدمة 1", agent: "مندوب 2" }, address: "حي الثورة، شارع الجامعة" },
  { number: "MC260602-4407", customerId: "c-004", status: "delivered", items: [{ productId: "p-001", qty: 1 }], total: 51000, placedAt: "2026-06-02T11:30:00Z", assignedTo: { staff: "خدمة 2", agent: "مندوب 1" }, address: "حي الجديد، شارع الكلية" },
  { number: "MC260602-2298", customerId: "c-003", status: "cancelled", items: [{ productId: "p-008", qty: 1 }], total: 178000, placedAt: "2026-06-02T09:00:00Z", assignedTo: { staff: "خدمة 1" }, address: "حي السوق، شارع الميدان" },
];

export const findCustomer = (id: string) => sampleCustomers.find((c) => c.id === id);
export const findSampleOrder = (number: string) => sampleOrders.find((o) => o.number === number);
