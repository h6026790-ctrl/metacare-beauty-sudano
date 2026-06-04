import type { Brand, Category, Product } from "./types";
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
  { id: "soleil", name: { ar: "سولاي", en: "Soleil" }, tagline: { ar: "حماية ذكية", en: "Smart protection" } },
];

export const categories: Category[] = [
  { id: "skincare", name: { ar: "العناية بالبشرة", en: "Skincare" }, icon: "✦" },
  { id: "makeup", name: { ar: "المكياج", en: "Makeup" }, icon: "✿" },
  { id: "fragrance", name: { ar: "العطور", en: "Fragrance" }, icon: "❀" },
  { id: "bodycare", name: { ar: "العناية بالجسم", en: "Body Care" }, icon: "✻" },
];

export const products: Product[] = [
  {
    id: "p-001",
    name: { ar: "سيروم الترطيب العميق", en: "Hydra Deep Serum" },
    brandId: "aqua-lab", categoryId: "skincare",
    price: 48000, compareAt: 60000, image: serum,
    description: {
      ar: "سيروم خفيف بحمض الهيالورونيك يمنح البشرة ترطيباً عميقاً وإشراقة طبيعية.",
      en: "Lightweight hyaluronic acid serum for deep hydration and natural glow.",
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
    description: {
      ar: "كريم ليلي غني يجدد خلايا البشرة ويعيد لها نضارتها.",
      en: "Rich night cream that renews the skin and restores radiance.",
    },
    specs: [
      { label: { ar: "الحجم", en: "Size" }, value: { ar: "٥٠ مل", en: "50 ml" } },
    ],
    stock: 12, isFeatured: true,
  },
  {
    id: "p-003",
    name: { ar: "أحمر شفاه فيلفيت ماط", en: "Velvet Matte Lipstick" },
    brandId: "velvet", categoryId: "makeup",
    price: 28000, image: lipstick,
    description: {
      ar: "أحمر شفاه ماط بتركيبة فاخرة تدوم طويلاً مع لمسة مخملية.",
      en: "Long-wear matte lipstick with a luxurious velvet finish.",
    },
    specs: [{ label: { ar: "اللون", en: "Shade" }, value: { ar: "وردي ملكي", en: "Royal Rose" } }],
    stock: 40, isNew: true, isBestSeller: true,
  },
  {
    id: "p-004",
    name: { ar: "عطر أزور بلو", en: "Azure Blue Eau de Parfum" },
    brandId: "azure", categoryId: "fragrance",
    price: 145000, image: perfume,
    description: {
      ar: "عطر شرقي أنيق بنفحات الياسمين والعنبر.",
      en: "An elegant oriental fragrance with jasmine and amber notes.",
    },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٧٥ مل", en: "75 ml" } }],
    stock: 8, isFeatured: true,
  },
  {
    id: "p-005",
    name: { ar: "واقي شمس يومي SPF50", en: "Daily Shield SPF50" },
    brandId: "soleil", categoryId: "skincare",
    price: 39000, image: sunscreen,
    description: {
      ar: "حماية يومية خفيفة الملمس مناسبة تحت المكياج.",
      en: "Lightweight daily protection that layers beautifully under makeup.",
    },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "٥٠ مل", en: "50 ml" } }],
    stock: 35, isBestSeller: true, isNew: true,
  },
  {
    id: "p-006",
    name: { ar: "ماسكارا الحجم اللامحدود", en: "Infinite Volume Mascara" },
    brandId: "velvet", categoryId: "makeup",
    price: 32000, image: mascara,
    description: {
      ar: "ماسكارا تمنح رموشكِ كثافة وطولاً استثنائيين.",
      en: "Delivers extraordinary length and volume to your lashes.",
    },
    specs: [{ label: { ar: "اللون", en: "Color" }, value: { ar: "أسود ليلي", en: "Midnight Black" } }],
    stock: 0, isFeatured: true,
  },
  {
    id: "p-007",
    name: { ar: "غسول لطيف بحمض الساليسيليك", en: "Gentle Salicylic Cleanser" },
    brandId: "aqua-lab", categoryId: "skincare",
    price: 26000, image: cream,
    description: {
      ar: "غسول يومي ينظف بعمق دون أن يجفف البشرة.",
      en: "Daily cleanser that purifies deeply without stripping the skin.",
    },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "١٥٠ مل", en: "150 ml" } }],
    stock: 18, isNew: true,
  },
  {
    id: "p-008",
    name: { ar: "عطر لومييه ذهبي", en: "Lumière Gold" },
    brandId: "lumiere", categoryId: "fragrance",
    price: 175000, image: perfume,
    description: {
      ar: "عطر فاخر بتوقيع فرنسي ولمسة ذهبية.",
      en: "A French signature scent with a golden touch.",
    },
    specs: [{ label: { ar: "الحجم", en: "Size" }, value: { ar: "١٠٠ مل", en: "100 ml" } }],
    stock: 5, isFeatured: true,
  },
];

export const findProduct = (id: string) => products.find((p) => p.id === id);
export const findBrand = (id: string) => brands.find((b) => b.id === id);
export const findCategory = (id: string) => categories.find((c) => c.id === id);
export const productsByBrand = (id: string) => products.filter((p) => p.brandId === id);
export const productsByCategory = (id: string) => products.filter((p) => p.categoryId === id);
