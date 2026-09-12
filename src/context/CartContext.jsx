
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const CartContext = createContext(null);

/*
 * =========================
 * Cart constants
 * =========================
 */

const FREE_DELIVERY_LIMIT = 150;
const MAX_ITEM_QUANTITY = 20;

/*
 * =========================
 * Helpers
 * =========================
 */

/**
 * Keep quantity within a safe client-side range.
 *
 * This is NOT a security mechanism.
 * Final quantities must still be validated server-side.
 */
function normalizeQuantity(quantity) {
  const parsed = Number(quantity);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(
    Math.max(Math.floor(parsed), 1),
    MAX_ITEM_QUANTITY
  );
}

/**
 * Create a stable representation of product options.
 *
 * JSON.stringify directly can produce different strings
 * for objects containing the same properties in a different
 * insertion order.
 */
function normalizeOptions(options) {
  if (
    !options ||
    typeof options !== 'object' ||
    Array.isArray(options)
  ) {
    return {};
  }

  const normalized = {};

  Object.keys(options)
    .sort()
    .forEach((key) => {
      const value = options[key];

      if (Array.isArray(value)) {
        normalized[key] = [...value].map(String).sort();
        return;
      }

      if (
        value !== null &&
        typeof value === 'object'
      ) {
        normalized[key] =
          normalizeOptions(value);
        return;
      }

      normalized[key] = value;
    });

  return normalized;
}

function createCartItemKey(productId, options) {
  const normalizedOptions =
    normalizeOptions(options);

  return `${String(productId)}-${JSON.stringify(
    normalizedOptions
  )}`;
}

function getSafePrice(product) {
  const price = Number(product?.price);

  if (!Number.isFinite(price) || price < 0) {
    return 0;
  }

  return price;
}

/*
 * =========================
 * Provider
 * =========================
 */

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isCartOpen, setIsCartOpen] =
    useState(false);
  const [toast, setToast] = useState('');
  const [deliveryType, setDeliveryType] =
    useState('delivery');
  const [searchQuery, setSearchQuery] =
    useState('');

  const toastTimerRef = useRef(null);

  /*
   * =========================
   * Toast
   * =========================
   */

  const showToast = useCallback((message) => {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current =
      setTimeout(() => {
        setToast('');
        toastTimerRef.current = null;
      }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  /*
   * =========================
   * Favorites
   * =========================
   */

  const toggleFavorite = useCallback(
    (product) => {
      if (!product?.id) {
        return;
      }

      setFavorites((previousFavorites) => {
        const exists =
          previousFavorites.some(
            (item) =>
              item?.id === product.id
          );

        if (exists) {
          showToast(
            `تم إزالة ${product.nameAr || 'المنتج'} من المفضلة`
          );

          return previousFavorites.filter(
            (item) =>
              item?.id !== product.id
          );
        }

        showToast(
          `تمت إضافة ${
            product.nameAr || 'المنتج'
          } للمفضلة! ❤️`
        );

        return [
          ...previousFavorites,
          product,
        ];
      });
    },
    [showToast]
  );

  /*
   * =========================
   * Cart controls
   * =========================
   */

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  /*
   * =========================
   * Add to cart
   * =========================
   */

  const addToCart = useCallback(
    (product, quantity = 1, options = {}) => {
      if (!product?.id) {
        showToast(
          'تعذر إضافة المنتج للسلة.'
        );
        return;
      }

      const safeQuantity =
        normalizeQuantity(quantity);

      const normalizedOptions =
        normalizeOptions(options);

      const itemKey =
        createCartItemKey(
          product.id,
          normalizedOptions
        );

      setCartItems((previousItems) => {
        const existingIndex =
          previousItems.findIndex(
            (item) =>
              item.key === itemKey
          );

        if (existingIndex !== -1) {
          const updatedItems = [
            ...previousItems,
          ];

          const currentItem =
            updatedItems[existingIndex];

          const nextQuantity =
            normalizeQuantity(
              currentItem.quantity +
                safeQuantity
            );

          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: nextQuantity,
          };

          return updatedItems;
        }

        return [
          ...previousItems,
          {
            key: itemKey,
            product,
            quantity: safeQuantity,
            options: normalizedOptions,
          },
        ];
      });

      showToast(
        `تمت إضافة ${
          product.nameAr || 'المنتج'
        } إلى السلة! 🍩`
      );
    },
    [showToast]
  );

  /*
   * =========================
   * Remove
   * =========================
   */

  const removeFromCart = useCallback(
    (itemKey) => {
      if (!itemKey) {
        return;
      }

      setCartItems((previousItems) =>
        previousItems.filter(
          (item) =>
            item.key !== itemKey
        )
      );
    },
    []
  );

  /*
   * =========================
   * Clear
   * =========================
   */

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  /*
   * =========================
   * Update quantity
   * =========================
   */

  const updateQuantity = useCallback(
    (itemKey, newQuantity) => {
      if (!itemKey) {
        return;
      }

      const numericQuantity =
        Number(newQuantity);

      if (
        !Number.isFinite(
          numericQuantity
        ) ||
        numericQuantity <= 0
      ) {
        setCartItems(
          (previousItems) =>
            previousItems.filter(
              (item) =>
                item.key !== itemKey
            )
        );

        return;
      }

      const safeQuantity =
        normalizeQuantity(
          numericQuantity
        );

      setCartItems((previousItems) =>
        previousItems.map((item) =>
          item.key === itemKey
            ? {
                ...item,
                quantity:
                  safeQuantity,
              }
            : item
        )
      );
    },
    []
  );

  /*
   * =========================
   * Cart total
   * =========================
   *
   * This is display/client calculation only.
   * It must NOT be trusted by Firestore/backend.
   */

  const cartTotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => {
        const price = getSafePrice(
          item?.product
        );

        const quantity =
          normalizeQuantity(
            item?.quantity
          );

        return (
          sum +
          price * quantity
        );
      },
      0
    );
  }, [cartItems]);

  const getCartTotal =
    useCallback(() => {
      return cartTotal;
    }, [cartTotal]);

  /*
   * =========================
   * Loyalty preview
   * =========================
   *
   * This only shows estimated points.
   * It does NOT mean points are stored
   * or awarded to a customer account.
   */

  const earnedPoints = useMemo(() => {
    return Math.floor(
      cartTotal / 10
    );
  }, [cartTotal]);

  /*
   * =========================
   * Context value
   * =========================
   */

  const contextValue = useMemo(
    () => ({
      cartItems,
      favorites,

      toggleFavorite,

      isCartOpen,
      openCart,
      closeCart,

      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,

      getCartTotal,
      earnedPoints,

      FREE_DELIVERY_LIMIT,
      MAX_ITEM_QUANTITY,

      toast,

      deliveryType,
      setDeliveryType,

      searchQuery,
      setSearchQuery,
    }),
    [
      cartItems,
      favorites,
      toggleFavorite,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      earnedPoints,
      toast,
      deliveryType,
      searchQuery,
    ]
  );

  return (
    <CartContext.Provider
      value={contextValue}
    >
      {children}
    </CartContext.Provider>
  );
}

/*
 * =========================
 * Hook
 * =========================
 */

export const useCart = () => {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    );
  }

  return context;
};

