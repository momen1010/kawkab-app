import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { getIdTokenResult } from 'firebase/auth';
import { auth, db } from '../../firebase/config';

const AdminDataContext = createContext(null);

const VALID_STATUSES = [
  'new',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

const DEFAULT_SETTINGS = {
  restaurantName: 'كوكب السعادة',
  whatsappNumber: '',
  vodafoneCashNumber: '',
  deliveryFee: 20,
  freeDeliveryLimit: 150,
  ordersEnabled: true,
  closedMessage: 'نعتذر، استقبال الطلبات مغلق حاليًا.',
};

// =========================================================
// ADMIN AUTHORIZATION
// =========================================================

const assertAdmin = async () => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('يجب تسجيل الدخول أولاً.');
  }

  const tokenResult = await getIdTokenResult(user, true);

  if (tokenResult.claims.admin !== true) {
    throw new Error('ليس لديك صلاحية لتنفيذ هذا الإجراء.');
  }

  return user;
};

// =========================================================
// HELPERS
// =========================================================

const cleanString = (value) => String(value || '').trim();

const cleanPhone = (value) =>
  String(value || '').replace(/\D/g, '');

const isValidPhone = (phone) =>
  !phone || /^01\d{9}$/.test(phone);

const validateNumber = (value, message) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(message);
  }

  return number;
};

// =========================================================
// PROVIDER
// =========================================================

export function AdminDataProvider({ children }) {
  // =======================================================
  // STATE
  // =======================================================

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [productActionLoading, setProductActionLoading] =
    useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');
  const [categoryActionLoading, setCategoryActionLoading] =
    useState(false);

  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');
  const [settingsActionLoading, setSettingsActionLoading] =
    useState(false);

  // =======================================================
  // ORDERS LISTENER
  // =======================================================

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    const initialize = async () => {
      try {
        setLoading(true);
        setLoadError('');

        await assertAdmin();

        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(
          ordersQuery,
          (snapshot) => {
            if (cancelled) return;

            setOrders(
              snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
              }))
            );

            setLoading(false);
          },
          (error) => {
            console.error('Admin orders listener error:', error);

            if (!cancelled) {
              setLoadError(
                'حدث خطأ أثناء تحميل الطلبات. حاول مرة أخرى.'
              );
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error('Admin data initialization error:', error);

        if (!cancelled) {
          setLoadError(
            error?.message ||
              'حدث خطأ أثناء تحميل بيانات الإدارة.'
          );
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // =======================================================
  // PRODUCTS LISTENER
  // =======================================================

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    const initialize = async () => {
      try {
        setProductsLoading(true);
        setProductsError('');

        await assertAdmin();

        const productsQuery = query(
          collection(db, 'products'),
          orderBy('sortOrder', 'asc')
        );

        unsubscribe = onSnapshot(
          productsQuery,
          (snapshot) => {
            if (cancelled) return;

            setProducts(
              snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
              }))
            );

            setProductsLoading(false);
          },
          (error) => {
            console.error('Products listener error:', error);

            if (!cancelled) {
              setProductsError(
                'حدث خطأ أثناء تحميل المنتجات.'
              );
              setProductsLoading(false);
            }
          }
        );
      } catch (error) {
        console.error('Products initialization error:', error);

        if (!cancelled) {
          setProductsError(
            error?.message ||
              'حدث خطأ أثناء تحميل المنتجات.'
          );
          setProductsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // =======================================================
  // CATEGORIES LISTENER
  // =======================================================

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    const initialize = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError('');

        await assertAdmin();

        const categoriesQuery = query(
          collection(db, 'categories'),
          orderBy('sortOrder', 'asc')
        );

        unsubscribe = onSnapshot(
          categoriesQuery,
          (snapshot) => {
            if (cancelled) return;

            setCategories(
              snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
              }))
            );

            setCategoriesLoading(false);
          },
          (error) => {
            console.error('Categories listener error:', error);

            if (!cancelled) {
              setCategoriesError(
                'حدث خطأ أثناء تحميل التصنيفات.'
              );
              setCategoriesLoading(false);
            }
          }
        );
      } catch (error) {
        console.error(
          'Categories initialization error:',
          error
        );

        if (!cancelled) {
          setCategoriesError(
            error?.message ||
              'حدث خطأ أثناء تحميل التصنيفات.'
          );
          setCategoriesLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // =======================================================
  // SETTINGS LISTENER
  // =======================================================

  useEffect(() => {
    let unsubscribe;
    let cancelled = false;

    const initialize = async () => {
      try {
        setSettingsLoading(true);
        setSettingsError('');

        await assertAdmin();

        const settingsRef = doc(
          db,
          'settings',
          'restaurant'
        );

        unsubscribe = onSnapshot(
          settingsRef,
          (snapshot) => {
            if (cancelled) return;

            setSettings(
              snapshot.exists()
                ? {
                    id: snapshot.id,
                    ...DEFAULT_SETTINGS,
                    ...snapshot.data(),
                  }
                : {
                    id: 'restaurant',
                    ...DEFAULT_SETTINGS,
                  }
            );

            setSettingsLoading(false);
          },
          (error) => {
            console.error(
              'Settings listener error:',
              error
            );

            if (!cancelled) {
              setSettingsError(
                'حدث خطأ أثناء تحميل إعدادات المطعم.'
              );
              setSettingsLoading(false);
            }
          }
        );
      } catch (error) {
        console.error(
          'Settings initialization error:',
          error
        );

        if (!cancelled) {
          setSettingsError(
            error?.message ||
              'حدث خطأ أثناء تحميل إعدادات المطعم.'
          );
          setSettingsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // =======================================================
  // PRODUCTS
  // =======================================================

  const createProduct = async (data) => {
    await assertAdmin();

    try {
      setProductActionLoading(true);

      const product = {
        name: cleanString(data?.name),
        nameAr: cleanString(data?.nameAr),
        description: cleanString(data?.description),
        descriptionAr: cleanString(data?.descriptionAr),
        category: cleanString(data?.category),
        price: validateNumber(
          data?.price,
          'سعر المنتج غير صالح.'
        ),
        sortOrder: validateNumber(
          data?.sortOrder,
          'ترتيب المنتج غير صالح.'
        ),
        image: cleanString(data?.image),
        isAvailable: data?.isAvailable !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!product.nameAr) {
        throw new Error('اسم المنتج بالعربي مطلوب.');
      }

      if (!product.category) {
        throw new Error('تصنيف المنتج مطلوب.');
      }

      const ref = await addDoc(
        collection(db, 'products'),
        product
      );

      return ref.id;
    } finally {
      setProductActionLoading(false);
    }
  };

  const updateProduct = async (productId, data) => {
    await assertAdmin();

    if (!productId) {
      throw new Error('معرف المنتج غير موجود.');
    }

    try {
      setProductActionLoading(true);

      const product = {
        name: cleanString(data?.name),
        nameAr: cleanString(data?.nameAr),
        description: cleanString(data?.description),
        descriptionAr: cleanString(data?.descriptionAr),
        category: cleanString(data?.category),
        price: validateNumber(
          data?.price,
          'سعر المنتج غير صالح.'
        ),
        sortOrder: validateNumber(
          data?.sortOrder,
          'ترتيب المنتج غير صالح.'
        ),
        image: cleanString(data?.image),
        isAvailable: data?.isAvailable !== false,
        updatedAt: serverTimestamp(),
      };

      if (!product.nameAr) {
        throw new Error('اسم المنتج بالعربي مطلوب.');
      }

      if (!product.category) {
        throw new Error('تصنيف المنتج مطلوب.');
      }

      await updateDoc(
        doc(db, 'products', productId),
        product
      );
    } finally {
      setProductActionLoading(false);
    }
  };

  const toggleProductAvailability = async (
    productId,
    isAvailable
  ) => {
    await assertAdmin();

    if (!productId) {
      throw new Error('معرف المنتج غير موجود.');
    }

    try {
      setProductActionLoading(true);

      await updateDoc(
        doc(db, 'products', productId),
        {
          isAvailable: Boolean(isAvailable),
          updatedAt: serverTimestamp(),
        }
      );
    } finally {
      setProductActionLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    await assertAdmin();

    if (!productId) {
      throw new Error('معرف المنتج غير موجود.');
    }

    try {
      setProductActionLoading(true);
      await deleteDoc(doc(db, 'products', productId));
    } finally {
      setProductActionLoading(false);
    }
  };

  // =======================================================
  // CATEGORIES
  // =======================================================

  const createCategory = async (data) => {
    await assertAdmin();

    try {
      setCategoryActionLoading(true);

      const category = {
        name: cleanString(data?.name),
        nameAr: cleanString(data?.nameAr),
        icon: cleanString(data?.icon),
        sortOrder: validateNumber(
          data?.sortOrder,
          'ترتيب التصنيف غير صالح.'
        ),
        isActive: data?.isActive !== false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!category.nameAr) {
        throw new Error(
          'اسم التصنيف بالعربي مطلوب.'
        );
      }

      const ref = await addDoc(
        collection(db, 'categories'),
        category
      );

      return ref.id;
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const updateCategory = async (categoryId, data) => {
    await assertAdmin();

    if (!categoryId) {
      throw new Error('معرف التصنيف غير موجود.');
    }

    try {
      setCategoryActionLoading(true);

      const category = {
        name: cleanString(data?.name),
        nameAr: cleanString(data?.nameAr),
        icon: cleanString(data?.icon),
        sortOrder: validateNumber(
          data?.sortOrder,
          'ترتيب التصنيف غير صالح.'
        ),
        isActive: data?.isActive !== false,
        updatedAt: serverTimestamp(),
      };

      if (!category.nameAr) {
        throw new Error(
          'اسم التصنيف بالعربي مطلوب.'
        );
      }

      await updateDoc(
        doc(db, 'categories', categoryId),
        category
      );
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const toggleCategory = async (
    categoryId,
    isActive
  ) => {
    await assertAdmin();

    if (!categoryId) {
      throw new Error('معرف التصنيف غير موجود.');
    }

    try {
      setCategoryActionLoading(true);

      await updateDoc(
        doc(db, 'categories', categoryId),
        {
          isActive: Boolean(isActive),
          updatedAt: serverTimestamp(),
        }
      );
    } finally {
      setCategoryActionLoading(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    await assertAdmin();

    if (!categoryId) {
      throw new Error('معرف التصنيف غير موجود.');
    }

    try {
      setCategoryActionLoading(true);
      await deleteDoc(doc(db, 'categories', categoryId));
    } finally {
      setCategoryActionLoading(false);
    }
  };

  // =======================================================
  // ORDERS
  // =======================================================

  const updateOrderStatus = async (
    orderId,
    status
  ) => {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error('حالة الطلب غير صالحة.');
    }

    try {
      setUpdatingOrderId(orderId);

      const order = orders.find(
        (item) => item.id === orderId
      );

      if (!order) {
        throw new Error('الطلب غير موجود.');
      }

      await updateDoc(
        doc(db, 'orders', orderId),
        { status }
      );

      if (order.trackingToken) {
        try {
          await updateDoc(
            doc(
              db,
              'orderTracking',
              order.trackingToken
            ),
            { status }
          );
        } catch (error) {
          console.error(
            'Tracking status update error:',
            error
          );
        }
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const confirmPayment = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);

      await updateDoc(
        doc(db, 'orders', orderId),
        {
          'payment.status': 'paid',
        }
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // =======================================================
  // SETTINGS
  // =======================================================

  const updateSettings = async (data) => {
    await assertAdmin();

    try {
      setSettingsActionLoading(true);

      const restaurantName = cleanString(
        data?.restaurantName
      );

      const whatsappNumber = cleanPhone(
        data?.whatsappNumber
      );

      const vodafoneCashNumber = cleanPhone(
        data?.vodafoneCashNumber
      );

      const deliveryFee = validateNumber(
        data?.deliveryFee,
        'رسوم التوصيل غير صالحة.'
      );

      const freeDeliveryLimit = validateNumber(
        data?.freeDeliveryLimit,
        'حد التوصيل المجاني غير صالح.'
      );

      const ordersEnabled =
        data?.ordersEnabled !== false;

      const closedMessage = cleanString(
        data?.closedMessage
      );

      if (!restaurantName) {
        throw new Error('اسم المطعم مطلوب.');
      }

      if (!isValidPhone(whatsappNumber)) {
        throw new Error(
          'رقم WhatsApp يجب أن يكون رقمًا مصريًا صحيحًا مكونًا من 11 رقمًا ويبدأ بـ 01.'
        );
      }

      if (!isValidPhone(vodafoneCashNumber)) {
        throw new Error(
          'رقم Vodafone Cash يجب أن يكون رقمًا مصريًا صحيحًا مكونًا من 11 رقمًا ويبدأ بـ 01.'
        );
      }

      await setDoc(
        doc(db, 'settings', 'restaurant'),
        {
          restaurantName,
          whatsappNumber,
          vodafoneCashNumber,
          deliveryFee,
          freeDeliveryLimit,
          ordersEnabled,
          closedMessage,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } finally {
      setSettingsActionLoading(false);
    }
  };

  // =======================================================
  // CONTEXT
  // =======================================================

  const value = useMemo(
    () => ({
      orders,
      loading,
      loadError,
      updatingOrderId,
      updateOrderStatus,
      confirmPayment,

      products,
      productsLoading,
      productsError,
      productActionLoading,
      createProduct,
      updateProduct,
      toggleProductAvailability,
      deleteProduct,

      categories,
      categoriesLoading,
      categoriesError,
      categoryActionLoading,
      createCategory,
      updateCategory,
      toggleCategory,
      deleteCategory,

      settings,
      settingsLoading,
      settingsError,
      settingsActionLoading,
      updateSettings,
    }),
    [
      orders,
      loading,
      loadError,
      updatingOrderId,

      products,
      productsLoading,
      productsError,
      productActionLoading,

      categories,
      categoriesLoading,
      categoriesError,
      categoryActionLoading,

      settings,
      settingsLoading,
      settingsError,
      settingsActionLoading,
    ]
  );

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useAdminData() {
  const context = useContext(AdminDataContext);

  if (!context) {
    throw new Error(
      'useAdminData must be used inside AdminDataProvider.'
    );
  }

  return context;
}