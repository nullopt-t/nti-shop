import { Injectable, signal, effect, computed } from '@angular/core';

export type Language = 'en' | 'ar';

export interface AppTranslations {
  // Navigation
  shopNav: string;
  savedNav: string;
  bagNav: string;

  // Catalog page
  refresh: string;
  collectionsTitle: string;
  categoryLabel: string;
  allCollections: string;
  loadingCollection: string;
  reload: string;
  noProductsCategory: string;
  addToBag: string;
  viewProduct: string;

  // Cart page
  shoppingBagTitle: string;
  itemsCountWord: string;
  itemCountWord: string;
  emptyBagMsg: string;
  discoverCollection: string;
  itemCol: string;
  descCol: string;
  priceCol: string;
  qtyCol: string;
  totalCol: string;
  clearBag: string;
  continueShopping: string;
  orderSummary: string;
  subtotal: string;
  courierShipping: string;
  complimentary: string;
  phoneVerification: string;
  included: string;
  totalEstimate: string;
  continueToCheckout: string;
  codDisclaimer: string;

  // Item Detail page
  backToCollection: string;
  fetchingSpecs: string;
  itemNotFound: string;
  aboutThisPiece: string;
  quantityLabel: string;
  savedInWishlist: string;
  saveToWishlist: string;
  addedToast: string;
  conciergeTitle: string;
  conciergeDesc: string;

  // Wishlist / Saved page
  savedPiecesTitle: string;
  emptyWishlistMsg: string;
  exploreCollection: string;

  // Checkout page
  expressCheckoutTitle: string;
  checkoutSubtitle: string;
  orderReceivedBadge: string;
  thankYouCustomer: string;
  orderRefText: string;
  codFollowupMsg: string;
  onlinePaymentMsg: string;
  paymentReceivedBadge: string;
  transactionCompletedTitle: string;
  deliveryContactHeading: string;
  fullNameLabel: string;
  phoneLabel: string;
  addressLabel: string;
  emailLabel: string;
  choosePaymentMethod: string;
  stripeCardOption: string;
  codOption: string;
  placeOrderCodBtn: string;
  proceedToStripeBtn: string;
  totalDueOnDelivery: string;
  totalPaid: string;
  redirectingToGateway: string;
  verifyingPaymentMsg: string;

  paymentConfirmedMsg: (id: string, total: string) => string;
  paymentPendingMsg: (id: string) => string;
  paymentDeclinedMsg: string;

  // Manager console
  staffConsole: string;
  viewPublicShop: string;
  logout: string;
  returnToShop: string;
  operationsConsole: string;
  operationsSubtitle: string;
  ordersTab: string;
  itemsTab: string;
  filterAll: string;
  filterOpened: string;
  filterClosed: string;
  filterPaymentAll: string;
  filterPaymentPaid: string;
  filterPaymentPending: string;
  orderId: string;
  customer: string;
  phone: string;
  address: string;
  itemsOrdered: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  markClosed: string;
  reopenOrder: string;
  orderNotesLogs: string;
  noNotesYet: string;
  addNotePlaceholder: string;
  addNoteBtn: string;
  noOrdersFound: string;
  clothingCatalog: string;
  catalogSubtitle: string;
  addNewItem: string;
  image: string;
  name: string;
  category: string;
  price: string;
  actions: string;
  edit: string;
  delete: string;
  noItemsFound: string;
  itemFormTitleCreate: string;
  itemFormTitleEdit: string;
  itemFormSubtitle: string;
  englishDetails: string;
  arabicTranslations: string;
  itemNameEn: string;
  itemCategoryEn: string;
  itemPrice: string;
  itemDescEn: string;
  itemNameAr: string;
  itemCategoryAr: string;
  itemDescAr: string;
  productImage: string;
  uploading: string;
  uploadImageBtn: string;
  pasteUrlPlaceholder: string;
  rememberToSaveNotice: string;
  saveChanges: string;
  createItemBtn: string;
  cancel: string;
  confirmDelete: string;
  // Toasts
  toastOrderUpdated: (id: string, status: string) => string;
  toastOrderUpdateFailed: string;
  toastNoteEmpty: string;
  toastNoteSaved: string;
  toastNoteFailed: string;
  toastItemDeleted: string;
  toastItemDeleteFailed: string;
  toastLoadItemFailed: string;
  toastImageUploaded: string;
  toastImageUploadFailed: string;
  toastFillRequiredEnFields: string;
  toastInvalidPrice: string;
  toastItemUpdated: string;
  toastItemUpdateFailed: string;
  toastItemCreated: string;
  toastItemCreateFailed: string;
}

const UI_DICTIONARY: Record<Language, AppTranslations> = {
  en: {
    shopNav: 'SHOP',
    savedNav: 'SAVED',
    bagNav: 'BAG',

    refresh: '↻ REFRESH',
    collectionsTitle: 'COLLECTIONS',
    categoryLabel: 'CATEGORY',
    allCollections: 'ALL COLLECTIONS',
    loadingCollection: 'LOADING COLLECTION...',
    reload: 'RELOAD',
    noProductsCategory: 'No products currently available in this category.',
    addToBag: '+ ADD TO BAG',
    viewProduct: 'VIEW PRODUCT',

    shoppingBagTitle: 'SHOPPING BAG',
    itemsCountWord: 'ITEMS',
    itemCountWord: 'ITEM',
    emptyBagMsg: 'Your shopping bag is currently empty.',
    discoverCollection: 'DISCOVER THE COLLECTION',
    itemCol: 'ITEM',
    descCol: 'DESCRIPTION',
    priceCol: 'PRICE',
    qtyCol: 'QUANTITY',
    totalCol: 'TOTAL',
    clearBag: 'CLEAR BAG',
    continueShopping: 'CONTINUE SHOPPING',
    orderSummary: 'ORDER SUMMARY',
    subtotal: 'Subtotal',
    courierShipping: 'Courier Shipping',
    complimentary: 'COMPLIMENTARY',
    phoneVerification: 'Phone Verification',
    included: 'INCLUDED',
    totalEstimate: 'TOTAL ESTIMATE',
    continueToCheckout: 'CONTINUE TO CHECKOUT →',
    codDisclaimer: 'Payment is collected upon delivery handover following telephone confirmation.',

    backToCollection: '← BACK TO COLLECTION',
    fetchingSpecs: 'FETCHING PRODUCT SPECIFICATIONS...',
    itemNotFound: 'Product not found or failed to load.',
    aboutThisPiece: 'ABOUT THIS PIECE',
    quantityLabel: 'QUANTITY',
    savedInWishlist: '★ SAVED IN WISHLIST',
    saveToWishlist: '☆ SAVE TO WISHLIST',
    addedToast: 'Added to your bag.',
    conciergeTitle: 'CONCIERGE DELIVERY & FIT CHECK',
    conciergeDesc: 'All orders are confirmed directly via telephone prior to courier dispatch. Our team verifies exact measurements and coordinates delivery at your convenience.',

    savedPiecesTitle: 'SAVED PIECES',
    emptyWishlistMsg: 'Your saved wishlist is currently empty.',
    exploreCollection: 'EXPLORE THE COLLECTION',

    expressCheckoutTitle: 'EXPRESS CHECKOUT',
    checkoutSubtitle: 'Choose your preferred payment method and finalize your pieces.',
    orderReceivedBadge: '✓ ORDER RECEIVED',
    thankYouCustomer: 'THANK YOU',
    orderRefText: 'Your order reference is',
    codFollowupMsg: 'A ROCK client specialist will contact you directly to confirm sizing and coordinate delivery.',
    onlinePaymentMsg: 'Your online payment has been submitted. Our team is processing your shipment.',
    paymentReceivedBadge: '✓ PAYMENT RECEIVED',
    transactionCompletedTitle: 'TRANSACTION COMPLETED',
    deliveryContactHeading: 'DELIVERY / CONTACT INFORMATION',
    fullNameLabel: 'Full Name *',
    phoneLabel: 'Phone Number *',
    addressLabel: 'Delivery Address *',
    emailLabel: 'Email Address (Optional)',
    choosePaymentMethod: 'PAYMENT METHOD',
    stripeCardOption: 'Credit / Debit Card (Stripe)',
    codOption: 'Cash on Delivery (Handover Verification)',
    placeOrderCodBtn: 'CONFIRM CASH ON DELIVERY ORDER',
    proceedToStripeBtn: 'PROCEED TO SECURE CARD PAYMENT →',
    totalDueOnDelivery: 'TOTAL DUE ON DELIVERY',
    totalPaid: 'TOTAL PAID',
    redirectingToGateway: 'Redirecting to secure payment gateway...',
    verifyingPaymentMsg: 'Verifying payment status, please wait...',
    paymentConfirmedMsg: (id: string, total: string) =>
      `Payment confirmed for order #${id}. Total settled: $${total}. Our team is preparing your dispatch.`,
    paymentPendingMsg: (id: string) =>
      `Your payment for order #${id} is being processed. We will update you once confirmed.`,
    paymentDeclinedMsg: 'Payment was declined or cancelled at the gateway. Please retry or choose Cash on Delivery.',

    staffConsole: 'STAFF CONSOLE',
    viewPublicShop: '↗ VIEW PUBLIC SHOP',
    logout: 'LOGOUT',
    returnToShop: '← RETURN TO SHOP',
    operationsConsole: 'OPERATIONS CONSOLE',
    operationsSubtitle: 'Real-time order processing, inventory controls, and multilingual product management.',
    ordersTab: 'Orders',
    itemsTab: 'Items & Products',
    filterAll: 'All Orders',
    filterOpened: 'Active Orders',
    filterClosed: 'Closed Orders',
    filterPaymentAll: 'All Payments',
    filterPaymentPaid: 'Paid',
    filterPaymentPending: 'Pending / COD',
    orderId: 'Order ID',
    customer: 'Customer',
    phone: 'Phone',
    address: 'Address',
    itemsOrdered: 'Items Ordered',
    paymentMethod: 'Payment Method',
    paymentStatus: 'Payment Status',
    orderStatus: 'Order Status',
    markClosed: 'Mark as Closed',
    reopenOrder: 'Re-open Order',
    orderNotesLogs: 'Order Notes & Call Logs',
    noNotesYet: 'No call notes or logs recorded yet.',
    addNotePlaceholder: 'Record customer conversation or internal note...',
    addNoteBtn: '+ ADD NOTE',
    noOrdersFound: 'No orders found matching the selected filter.',
    clothingCatalog: 'CLOTHING CATALOG',
    catalogSubtitle: 'Manage products, multilingual Arabic translations, categories, and inventory items.',
    addNewItem: '+ ADD NEW PRODUCT',
    image: 'Image',
    name: 'Product Name',
    category: 'Category',
    price: 'Price',
    actions: 'Actions',
    edit: 'Edit & Translate',
    delete: 'Delete',
    noItemsFound: 'No catalog items found. Create your first product above.',
    itemFormTitleCreate: 'NEW PRODUCT & TRANSLATION',
    itemFormTitleEdit: 'EDIT PRODUCT & TRANSLATIONS',
    itemFormSubtitle: 'Set English product data along with Arabic translations for international shoppers.',
    englishDetails: 'English Details (Default)',
    arabicTranslations: 'Arabic Translations (العربية)',
    itemNameEn: 'Product Name (EN) *',
    itemCategoryEn: 'Category (EN) *',
    itemPrice: 'Price ($ USD) *',
    itemDescEn: 'Description (EN) *',
    itemNameAr: 'Product Name (العربية)',
    itemCategoryAr: 'Category (العربية)',
    itemDescAr: 'Description (العربية)',
    productImage: 'Product Image',
    uploading: 'Uploading image...',
    uploadImageBtn: 'UPLOAD IMAGE FILE',
    pasteUrlPlaceholder: 'Or paste image URL...',
    rememberToSaveNotice: 'Image uploaded. Click Save Changes above or below to save permanently.',
    saveChanges: 'Save Changes',
    createItemBtn: 'Create Product',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this clothing item?',
    toastOrderUpdated: (id: string, status: string) => `Order #${id} status updated to ${status}.`,
    toastOrderUpdateFailed: 'Failed to update order status.',
    toastNoteEmpty: 'Please enter a note before adding to log.',
    toastNoteSaved: 'New log entry recorded.',
    toastNoteFailed: 'Failed to save log entry.',
    toastItemDeleted: 'Item removed from catalog.',
    toastItemDeleteFailed: 'Failed to delete item.',
    toastLoadItemFailed: 'Failed to load product details.',
    toastImageUploaded: 'Image uploaded successfully.',
    toastImageUploadFailed: 'Failed to upload image.',
    toastFillRequiredEnFields: 'Please fill all required English fields (name, category, description)',
    toastInvalidPrice: 'Price must be greater than or equal to zero',
    toastItemUpdated: 'Product and translations updated successfully.',
    toastItemUpdateFailed: 'Failed to update product.',
    toastItemCreated: 'New product and translations created.',
    toastItemCreateFailed: 'Failed to create product.',
  },
  ar: {
    shopNav: 'المتجر',
    savedNav: 'المفضلة',
    bagNav: 'الحقيبة',

    refresh: '↻ تحديث',
    collectionsTitle: 'التشكيلات والتصنيفات',
    categoryLabel: 'التصنيف',
    allCollections: 'جميع التشكيلات',
    loadingCollection: 'جاري تحميل التشكيلة...',
    reload: 'إعادة التحميل',
    noProductsCategory: 'لا توجد منتجات متوفرة حالياً في هذا التصنيف.',
    addToBag: '+ إضافة إلى الحقيبة',
    viewProduct: 'عرض المنتج',

    shoppingBagTitle: 'حقيبة التسوق',
    itemsCountWord: 'منتجات',
    itemCountWord: 'منتج',
    emptyBagMsg: 'حقيبة التسوق الخاصة بك فارغة حالياً.',
    discoverCollection: 'استكشف التشكيلة الحصرية',
    itemCol: 'المنتج',
    descCol: 'الوصف والمواصفات',
    priceCol: 'السعر',
    qtyCol: 'الكمية',
    totalCol: 'الإجمالي',
    clearBag: 'تفريغ الحقيبة',
    continueShopping: 'متابعة التسوق',
    orderSummary: 'ملخص الطلب',
    subtotal: 'المجموع الفرعي',
    courierShipping: 'الشحن السريع',
    complimentary: 'مجاني',
    phoneVerification: 'التأكيد الهاتفي',
    included: 'مشمول',
    totalEstimate: 'الإجمالي التقديري',
    continueToCheckout: 'الانتقال إلى إتمام الطلب ←',
    codDisclaimer: 'يتم تحصيل المبلغ عند الاستلام يداً بيد بعد التأكيد الهاتفي ومراجعة المقاسات.',

    backToCollection: '← العودة إلى التشكيلة',
    fetchingSpecs: 'جاري جلب تفاصيل ومواصفات القطعة...',
    itemNotFound: 'لم يتم العثور على المنتج أو تعذر تحميل البيانات.',
    aboutThisPiece: 'عن هذه القطعة',
    quantityLabel: 'الكمية',
    savedInWishlist: '★ محفوظ في المفضلة',
    saveToWishlist: '☆ حفظ في المفضلة',
    addedToast: 'تمت إضافة القطعة إلى الحقيبة.',
    conciergeTitle: 'خدمة التوصيل والتحقق من المقاس',
    conciergeDesc: 'يتم تأكيد جميع الطلبات عبر الهاتف مباشرة قبل إرسال المندوب، للتحقق من المقاسات المناسبة وتحديد موعد التسليم الذي يناسبك.',

    savedPiecesTitle: 'القطع المحفوظة',
    emptyWishlistMsg: 'قائمة الرغبات والمحفوظات فارغة حالياً.',
    exploreCollection: 'استكشف التشكيلة',

    expressCheckoutTitle: 'إتمام الطلب السريع',
    checkoutSubtitle: 'اختر طريقة الدفع المفضلة لديك وأكمل طلب القطع الفاخرة.',
    orderReceivedBadge: '✓ تم استلام الطلب',
    thankYouCustomer: 'شكراً لك',
    orderRefText: 'رقم مرجع طلبك هو',
    codFollowupMsg: 'سيتواصل معك أخصائي خدمة العملاء هاتفياً لتأكيد المقاسات والتنسيق للتوصيل.',
    onlinePaymentMsg: 'تم تقديم الدفع الإلكتروني بنجاح وجاري تجهيز الشحنة.',
    paymentReceivedBadge: '✓ تم استلام الدفع',
    transactionCompletedTitle: 'اكتملت المعاملة بنجاح',
    deliveryContactHeading: 'بيانات التواصل والتوصيل',
    fullNameLabel: 'الاسم بالكامل *',
    phoneLabel: 'رقم الهاتف *',
    addressLabel: 'عنوان التوصيل *',
    emailLabel: 'البريد الإلكتروني (اختياري)',
    choosePaymentMethod: 'طريقة الدفع',
    stripeCardOption: 'بطاقة ائتمان / بطاقة بنكية (Stripe)',
    codOption: 'الدفع نقداً عند الاستلام (مع التحقق)',
    placeOrderCodBtn: 'تأكيد الطلب والدفع عند الاستلام',
    proceedToStripeBtn: 'المتابعة للدفع الإلكتروني الآمن ←',
    totalDueOnDelivery: 'الإجمالي المطلوب عند الاستلام',
    totalPaid: 'الإجمالي المدفوع',
    redirectingToGateway: 'جاري تحويلك إلى بوابة الدفع الآمنة...',
    verifyingPaymentMsg: 'جاري التحقق من حالة الدفع، يرجى الانتظار...',
    paymentConfirmedMsg: (id: string, total: string) =>
      `تم تأكيد الدفع للطلب رقم #${id}. الإجمالي المدفوع: $${total}. فريقنا يقوم بتجهيز الشحنة والتوصيل لك.`,
    paymentPendingMsg: (id: string) =>
      `جاري معالجة الدفع للطلب رقم #${id}. سنقوم بإعلامك فور التأكيد.`,
    paymentDeclinedMsg: 'تم رفض أو إلغاء عملية الدفع عبر البوابة. يمكنك المحاولة مرة أخرى أو اختيار الدفع عند الاستلام.',

    staffConsole: 'لوحة تحكم الإدارة',
    viewPublicShop: '↗ عرض المتجر للعملاء',
    logout: 'تسجيل خروج',
    returnToShop: '← العودة للمتجر',
    operationsConsole: 'لوحة إدارة العمليات',
    operationsSubtitle: 'متابعة الطلبات اللحظية، وإدارة المنتجات والترجمات متعددة اللغات.',
    ordersTab: 'الطلبات',
    itemsTab: 'المنتجات والكتالوج',
    filterAll: 'كل الطلبات',
    filterOpened: 'الطلبات النشطة',
    filterClosed: 'الطلبات المكتملة',
    filterPaymentAll: 'كل حالات الدفع',
    filterPaymentPaid: 'المدفوعة',
    filterPaymentPending: 'قيد الدفع / عند الاستلام',
    orderId: 'رقم الطلب',
    customer: 'العميل',
    phone: 'رقم الهاتف',
    address: 'العنوان',
    itemsOrdered: 'المنتجات المطلوبة',
    paymentMethod: 'طريقة الدفع',
    paymentStatus: 'حالة الدفع',
    orderStatus: 'حالة الطلب',
    markClosed: 'إغلاق الطلب',
    reopenOrder: 'إعادة فتح الطلب',
    orderNotesLogs: 'سجل الملاحظات والمكالمات',
    noNotesYet: 'لا توجد ملاحظات أو سجلات مسجلة حتى الآن.',
    addNotePlaceholder: 'اكتب ملاحظة أو تفاصيل اتصال بالعميل...',
    addNoteBtn: '+ إضافة ملاحظة',
    noOrdersFound: 'لا توجد طلبات تطابق الفلتر المحدد.',
    clothingCatalog: 'كتالوج المنتجات والملابس',
    catalogSubtitle: 'إدارة المنتجات، الترجمات العربية، التصنيفات والأسعار.',
    addNewItem: '+ إضافة منتج جديد',
    image: 'الصورة',
    name: 'اسم المنتج',
    category: 'التصنيف',
    price: 'السعر',
    actions: 'الإجراءات',
    edit: 'تعديل وترجمة',
    delete: 'حذف',
    noItemsFound: 'لم يتم العثور على منتجات. يمكنك إضافة منتج جديد أعلاه.',
    itemFormTitleCreate: 'إضافة منتج جديد وترجماته',
    itemFormTitleEdit: 'تعديل المنتج والترجمات',
    itemFormSubtitle: 'قم بتعيين البيانات بالإنجليزية مع الترجمة العربية لتظهر تلقائياً للمتسوقين.',
    englishDetails: 'البيانات باللغة الإنجليزية (الافتراضية)',
    arabicTranslations: 'الترجمة باللغة العربية (العربية)',
    itemNameEn: 'اسم المنتج (EN) *',
    itemCategoryEn: 'التصنيف (EN) *',
    itemPrice: 'السعر ($ دولار) *',
    itemDescEn: 'الوصف (EN) *',
    itemNameAr: 'اسم المنتج (بالعربية)',
    itemCategoryAr: 'التصنيف (بالعربية)',
    itemDescAr: 'الوصف (بالعربية)',
    productImage: 'صورة المنتج',
    uploading: 'جاري رفع الصورة...',
    uploadImageBtn: 'رفع ملف صورة محلي',
    pasteUrlPlaceholder: 'أو الصق رابط الصورة...',
    rememberToSaveNotice: 'تم رفع الصورة للمعاينة. اضغط "حفظ التعديلات" لحفظها نهائياً للمنتج.',
    saveChanges: 'حفظ التعديلات',
    createItemBtn: 'إنشاء المنتج',
    cancel: 'إلغاء',
    confirmDelete: 'هل أنت متأكد من حذف هذا المنتج؟',
    toastOrderUpdated: (id: string, status: string) => `تم تحديث حالة الطلب #${id} إلى ${status === 'OPENED' || status === 'opened' ? 'مفتوح' : 'مغلق'}.`,
    toastOrderUpdateFailed: 'فشل تحديث حالة الطلب.',
    toastNoteEmpty: 'يرجى كتابة ملاحظة قبل إضافتها للسجل.',
    toastNoteSaved: 'تم تسجيل الملاحظة في السجل بنجاح.',
    toastNoteFailed: 'فشل حفظ الملاحظة.',
    toastItemDeleted: 'تم حذف المنتج من الكتالوج بنجاح.',
    toastItemDeleteFailed: 'فشل حذف المنتج.',
    toastLoadItemFailed: 'فشل تحميل بيانات المنتج.',
    toastImageUploaded: 'تم رفع الصورة بنجاح.',
    toastImageUploadFailed: 'فشل رفع ملف الصورة.',
    toastFillRequiredEnFields: 'يرجى ملء جميع الحقول الإنجليزية الأساسية (الاسم، التصنيف، الوصف)',
    toastInvalidPrice: 'يجب أن يكون السعر رقماً موجباً أو صفراً',
    toastItemUpdated: 'تم حفظ تعديلات المنتج والترجمات بنجاح.',
    toastItemUpdateFailed: 'فشل تحديث المنتج.',
    toastItemCreated: 'تم إنشاء المنتج الجديد والترجمات بنجاح.',
    toastItemCreateFailed: 'فشل إنشاء المنتج.',
  },
};

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly storageKey = 'rock_app_language';

  readonly currentLanguage = signal<Language>(this.getInitialLanguage());

  readonly t = computed(() => UI_DICTIONARY[this.currentLanguage()]);

  constructor() {
    effect(() => {
      const lang = this.currentLanguage();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(this.storageKey, lang);
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        } catch {
          // ignore localStorage access issues
        }
      }
    });
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
  }

  toggleLanguage(): void {
    this.currentLanguage.update((lang) => (lang === 'en' ? 'ar' : 'en'));
  }

  private getInitialLanguage(): Language {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.storageKey) as Language | null;
        if (saved === 'en' || saved === 'ar') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'en';
  }
}
