import { Injectable, signal, effect, computed } from '@angular/core';

export type Language = 'en' | 'ar';

export interface ManagerTranslations {
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
  saveChanges: string;
  createItemBtn: string;
  cancel: string;
  confirmDelete: string;
  refresh: string;
  collectionsTitle: string;
  categoryLabel: string;
  allCollections: string;
  loadingCollection: string;
  reload: string;
  noProductsCategory: string;
  addToBag: string;
  viewProduct: string;
}

const UI_DICTIONARY: Record<Language, ManagerTranslations> = {
  en: {
    refresh: '↻ REFRESH',
    collectionsTitle: 'COLLECTIONS',
    categoryLabel: 'CATEGORY',
    allCollections: 'ALL COLLECTIONS',
    loadingCollection: 'LOADING COLLECTION...',
    reload: 'RELOAD',
    noProductsCategory: 'No products currently available in this category.',
    addToBag: '+ ADD TO BAG',
    viewProduct: 'VIEW PRODUCT',
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
    saveChanges: 'Save Changes',
    createItemBtn: 'Create Product',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure you want to delete this clothing item?',
  },
  ar: {
    refresh: '↻ تحديث',
    collectionsTitle: 'التشكيلات والتصنيفات',
    categoryLabel: 'التصنيف',
    allCollections: 'جميع التشكيلات',
    loadingCollection: 'جاري تحميل التشكيلة...',
    reload: 'إعادة التحميل',
    noProductsCategory: 'لا توجد منتجات متوفرة حالياً في هذا التصنيف.',
    addToBag: '+ إضافة إلى الحقيبة',
    viewProduct: 'عرض المنتج',
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
    saveChanges: 'حفظ التعديلات',
    createItemBtn: 'إنشاء المنتج',
    cancel: 'إلغاء',
    confirmDelete: 'هل أنت متأكد من حذف هذا المنتج؟',
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

