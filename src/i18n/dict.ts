export type Lang = "ar" | "en";

type DictShape = {
  brand: { name: string; tagline: string };
  nav: Record<string, string>;
  home: Record<string, string>;
  product: Record<string, string>;
  cart: Record<string, string>;
  checkout: Record<string, string>;
  confirm: Record<string, string>;
  status: Record<string, string>;
  account: Record<string, string>;
  auth: Record<string, string>;
  search: Record<string, string>;
  footer: Record<string, string>;
  common: Record<string, string>;
  panels: {
    admin: { title: string; sub: string };
    staff: { title: string; sub: string };
    previewBadge: string;
  };
};

export const dict: Record<Lang, DictShape> = {
  ar: {
    brand: { name: "ميتاكير بيوتي", tagline: "تجربة تسوق فاخرة وبسيطة للجمال" },
    nav: {
      home: "الرئيسية", shop: "تسوقي", categories: "الأقسام", brands: "العلامات",
      offers: "العروض", search: "بحث", account: "حسابي", cart: "السلة",
      wishlist: "المفضلة", login: "تسجيل الدخول", register: "إنشاء حساب", logout: "تسجيل الخروج",
      admin: "لوحة الإدارة", staff: "خدمة العملاء",
    },
    home: {
      heroEyebrow: "ود مدني • السودان",
      heroTitle: "جمال يثق بالعِلم",
      heroSub: "منتجات العناية والمكياج والعطور الفاخرة، مختارة بعناية لكِ.",
      heroCta: "ابدئي التسوق", heroCta2: "تصفحي العلامات",
      featured: "عروض مميزة", recommended: "مختارات لكِ", newArrivals: "وصل حديثاً",
      brands: "علاماتنا", categories: "الأقسام", bestSellers: "الأكثر مبيعاً",
      trustTitle: "لماذا ميتاكير؟",
      trust1Title: "أصلية 100٪", trust1Sub: "كل منتج موثّق من المصدر",
      trust2Title: "توصيل سريع", trust2Sub: "داخل ود مدني خلال اليوم",
      trust3Title: "خدمة عملاء فاخرة", trust3Sub: "متواصلون عبر واتساب",
      trust4Title: "دفع آمن", trust4Sub: "تحويل بنكي بتأكيد يدوي",
    },
    product: {
      addToCart: "أضيفي إلى السلة", added: "تمت الإضافة", outOfStock: "غير متوفر حالياً",
      inStock: "متوفر", price: "السعر", brand: "العلامة", category: "القسم",
      description: "الوصف", specs: "المواصفات", related: "منتجات مشابهة",
      loginToSee: "سجّلي الدخول لعرض السعر", viewDetails: "عرض التفاصيل",
      addToWishlist: "أضيفي للمفضلة", removeFromWishlist: "إزالة من المفضلة",
    },
    cart: {
      title: "سلة التسوق", empty: "سلتكِ فارغة",
      emptySub: "ابدئي بإضافة منتجاتكِ المفضلة",
      subtotal: "المجموع الفرعي", delivery: "التوصيل", total: "الإجمالي",
      checkout: "إتمام الطلب", remove: "إزالة", continueShopping: "متابعة التسوق",
      qty: "الكمية", item: "منتج", items: "منتجات",
    },
    checkout: {
      title: "إتمام الطلب", contact: "بيانات التواصل",
      fullName: "الاسم الكامل", phone: "رقم الجوال", whatsapp: "رقم الواتساب",
      address: "عنوان التوصيل", city: "المدينة", neighborhood: "الحي",
      street: "الشارع / المعلم القريب", notes: "ملاحظات إضافية",
      payment: "طريقة الدفع",
      bankTransfer: "تحويل بنكي — بنك الخرطوم",
      bankNote: "سيتم تأكيد الدفع يدوياً من قِبل خدمة العملاء",
      placeOrder: "تأكيد الطلب", placing: "جارٍ الإرسال…",
      loginRequired: "سجّلي الدخول لإتمام الطلب",
      wadMadaniOnly: "حالياً نوصّل داخل ود مدني فقط",
      state: "الولاية",
      bankInstructionsTitle: "تعليمات الدفع",
      bankInstructionsBody: "بعد تأكيد الطلب، تواصلي معنا عبر واتساب لاستلام بيانات الحساب وإكمال التحويل. سيقوم فريق خدمة العملاء بتأكيد الدفع يدوياً.",
      bankName: "بنك الخرطوم",
      contactCSForBank: "تواصلي مع خدمة العملاء عبر واتساب",
    },
    confirm: {
      title: "تم استلام طلبكِ", sub: "سنتواصل معكِ قريباً لتأكيد التفاصيل",
      orderNo: "رقم الطلب", contactWhatsapp: "تواصلي معنا عبر واتساب",
      viewOrder: "عرض الطلب", backHome: "العودة للرئيسية",
    },
    status: {
      new: "جديد", review: "قيد المراجعة", paid: "تم الدفع",
      shipping: "في الطريق إليكِ", delivered: "تم التسليم",
      cancelled: "ملغي", returned: "مُرتجع",
    },
    account: {
      title: "حسابي", profile: "الملف الشخصي", orders: "طلباتي",
      wishlist: "المفضلة", language: "اللغة", logout: "تسجيل الخروج",
      noOrders: "لا توجد طلبات بعد", noWishlist: "لا توجد منتجات في المفضلة",
      orderHistory: "سجل الطلبات", activeOrders: "الطلبات النشطة",
      trackOrder: "تتبّع الطلب", confirmDelivery: "تأكيد الاستلام",
      scanQr: "امسحي رمز QR من المندوب",
    },
    auth: {
      login: "تسجيل الدخول", register: "إنشاء حساب", phone: "رقم الجوال",
      whatsapp: "رقم الواتساب", fullName: "الاسم الكامل",
      sendOtp: "إرسال رمز التحقق", otp: "رمز التحقق", verify: "تحقق",
      haveAccount: "لديكِ حساب؟", noAccount: "ليس لديكِ حساب؟",
      mobileNote: "سنرسل لكِ رمز تحقق عبر الرسائل النصية",
      whatsappNote: "نستخدمه للتواصل بشأن طلباتكِ",
      continueAsGuest: "تصفّحي كزائرة",
      phHint: "مثال: 09xxxxxxxx",
    },
    search: { placeholder: "ابحثي بالاسم أو العلامة أو القسم…", results: "نتائج البحث", noResults: "لا توجد نتائج" },
    footer: {
      about: "عن ميتاكير", help: "المساعدة", policies: "السياسات",
      contact: "تواصلي معنا", rights: "جميع الحقوق محفوظة",
      sudan: "صُنع بحب في السودان",
    },
    common: { sdg: "ج.س", currency: "جنيه سوداني", or: "أو", optional: "اختياري" },
    panels: {
      admin: { title: "لوحة الإدارة", sub: "إدارة المنتجات، الطلبات، والفريق" },
      staff: { title: "لوحة خدمة العملاء", sub: "إدارة الطلبات المُسندة إليكِ" },
      previewBadge: "معاينة المرحلة الأولى",
    },
  },
  en: {
    brand: { name: "Metacare Beauty", tagline: "A luxurious, effortless beauty shopping experience" },
    nav: {
      home: "Home", shop: "Shop", categories: "Categories", brands: "Brands",
      offers: "Offers", search: "Search", account: "Account", cart: "Cart",
      wishlist: "Wishlist", login: "Sign in", register: "Create account", logout: "Sign out",
      admin: "Admin", staff: "Customer Service",
    },
    home: {
      heroEyebrow: "Wad Madani • Sudan",
      heroTitle: "Beauty that trusts science",
      heroSub: "Premium skincare, makeup and fragrance, curated for you.",
      heroCta: "Start shopping", heroCta2: "Explore brands",
      featured: "Featured offers", recommended: "Picked for you", newArrivals: "New arrivals",
      brands: "Our brands", categories: "Categories", bestSellers: "Best sellers",
      trustTitle: "Why Metacare?",
      trust1Title: "100% Authentic", trust1Sub: "Sourced and verified",
      trust2Title: "Fast delivery", trust2Sub: "Same-day in Wad Madani",
      trust3Title: "Luxury support", trust3Sub: "Always on WhatsApp",
      trust4Title: "Safe payment", trust4Sub: "Bank transfer, manually confirmed",
    },
    product: {
      addToCart: "Add to cart", added: "Added", outOfStock: "غير متوفر حالياً",
      inStock: "In stock", price: "Price", brand: "Brand", category: "Category",
      description: "Description", specs: "Specifications", related: "Related products",
      loginToSee: "Sign in to view price", viewDetails: "View details",
      addToWishlist: "Add to wishlist", removeFromWishlist: "Remove from wishlist",
    },
    cart: {
      title: "Cart", empty: "Your cart is empty",
      emptySub: "Start adding your favourites",
      subtotal: "Subtotal", delivery: "Delivery", total: "Total",
      checkout: "Checkout", remove: "Remove", continueShopping: "Continue shopping",
      qty: "Qty", item: "item", items: "items",
    },
    checkout: {
      title: "Checkout", contact: "Contact details",
      fullName: "Full name", phone: "Mobile number", whatsapp: "WhatsApp number",
      address: "Delivery address", city: "City", neighborhood: "Neighborhood",
      street: "Street / nearby landmark", notes: "Additional notes",
      payment: "Payment method", bankTransfer: "Bank transfer — Bank of Khartoum",
      bankNote: "Payment confirmed manually by our team",
      placeOrder: "Place order", placing: "Placing…",
      loginRequired: "Sign in to place an order",
      wadMadaniOnly: "We currently deliver inside Wad Madani only",
      state: "State",
      bankInstructionsTitle: "Payment instructions",
      bankInstructionsBody: "After placing your order, please contact us on WhatsApp to receive our bank account details and complete the transfer. Our team confirms each payment manually.",
      bankName: "Bank of Khartoum",
      contactCSForBank: "Message Customer Service on WhatsApp",
    },
    confirm: {
      title: "Order received", sub: "We'll be in touch to confirm the details",
      orderNo: "Order number", contactWhatsapp: "Contact us on WhatsApp",
      viewOrder: "View order", backHome: "Back home",
    },
    status: {
      new: "New", review: "Under Review", paid: "Paid",
      shipping: "Out for Delivery", delivered: "Delivered",
      cancelled: "Cancelled", returned: "Returned",
    },
    account: {
      title: "Account", profile: "Profile", orders: "Orders",
      wishlist: "Wishlist", language: "Language", logout: "Sign out",
      noOrders: "No orders yet", noWishlist: "No items in wishlist",
      orderHistory: "Order history", activeOrders: "Active orders",
      trackOrder: "Track order", confirmDelivery: "Confirm delivery",
      scanQr: "Scan the courier's QR code",
    },
    auth: {
      login: "Sign in", register: "Create account", phone: "Mobile number",
      whatsapp: "WhatsApp number", fullName: "Full name",
      sendOtp: "Send code", otp: "Verification code", verify: "Verify",
      haveAccount: "Have an account?", noAccount: "New to Metacare?",
      mobileNote: "We'll text you a verification code",
      whatsappNote: "Used to reach you about your orders",
      continueAsGuest: "Browse as guest",
      phHint: "e.g. 09xxxxxxxx",
    },
    search: { placeholder: "Search by name, brand or category…", results: "Search results", noResults: "No results" },
    footer: {
      about: "About Metacare", help: "Help", policies: "Policies",
      contact: "Contact us", rights: "All rights reserved",
      sudan: "Crafted with care in Sudan",
    },
    common: { sdg: "SDG", currency: "Sudanese Pound", or: "or", optional: "optional" },
    panels: {
      admin: { title: "Admin Dashboard", sub: "Manage products, orders, and team" },
      staff: { title: "Customer Service", sub: "Manage your assigned orders" },
      previewBadge: "Phase 1 preview",
    },
  },
};

export type Dict = DictShape;
