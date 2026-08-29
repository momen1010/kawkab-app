// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery'); // delivery | pickup
  const [searchQuery, setSearchQuery] = useState('');

  const FREE_DELIVERY_LIMIT = 150; // حد التوصيل المجاني 150 ج.م

  // إظهار التنبيهات
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // المفضلة
  const toggleFavorite = (product) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        showToast(`تم إزالة ${product.nameAr} من المفضلة`);
        return prev.filter((item) => item.id !== product.id);
      } else {
        showToast(`تمت إضافة ${product.nameAr} للمفضلة! ❤️`);
        return [...prev, product];
      }
    });
  };

  // التحكم بالسلة
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (product, quantity = 1, options = {}) => {
    setCartItems((prevItems) => {
      const itemKey = `${product.id}-${JSON.stringify(options)}`;
      const existingIndex = prevItems.findIndex((i) => i.key === itemKey);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prevItems, { key: itemKey, product, quantity, options }];
    });
    showToast(`تمت إضافة ${product.nameAr} إلى السلة! 🍩`);
  };

  const removeFromCart = (itemKey) => {
    setCartItems((prev) => prev.filter((item) => item.key !== itemKey));
  };

  const updateQuantity = (itemKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemKey);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.key === itemKey ? { ...item, quantity: newQuantity } : item))
    );
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  };

  // حساب نقاط الولاء (كل 10 ج.م = 1 نقطة)
  const earnedPoints = Math.floor(getCartTotal() / 10);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        favorites,
        toggleFavorite,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        getCartTotal,
        earnedPoints,
        FREE_DELIVERY_LIMIT,
        toast,
        deliveryType,
        setDeliveryType,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);