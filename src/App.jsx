import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import Products from './admin/pages/Products';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

import { CartProvider, useCart } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingCartButton from './components/FloatingCartButton';
import ProductMigration from './admin/pages/ProductMigration';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Customers from './admin/pages/Customers';
import Checkout from './pages/Checkout';
import Kitchen from './admin/pages/Kitchen';
import OrderTracking from './pages/OrderTracking';
import Categories from './admin/pages/Categories';
import AdminLogin from './AdminLogin';
import Analytics from './admin/pages/Analytics';
import Settings from './admin/pages/Settings';
import CategoryMigration from './admin/pages/CategoryMigration';
import AdminHome from './admin/pages/AdminHome';
import Orders from './admin/pages/Orders';

import AdminLayout from './admin/layout/AdminLayout';




/* =========================
   Loading Screen
========================= */

function AuthLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#FFF8F3]"
      dir="rtl"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#D4AF37]" />

        <p className="font-bold text-[#3D2314]">
          جاري التحقق من تسجيل الدخول...
        </p>
      </div>
    </div>
  );
}

/* =========================
   Protected Admin Route
========================= */

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  if (user === undefined) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  /*
   * Authentication != Authorization.
   *
   * Admin authorization is currently verified
   * inside AdminDashboard through Firebase custom claims.
   *
   * We are keeping this behavior unchanged while
   * rebuilding the admin architecture.
   */

  return children;
}

/* =========================
   Website Layout
========================= */

function WebsiteLayout() {
  const { toast } = useCart();

  return (
    <>
      <Navbar />

      <main className="flex-grow transition-all duration-300">
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />

      <FloatingCartButton />

      {toast && (
        <div
          className="
            fixed top-24 left-1/2 z-50
            -translate-x-1/2 animate-bounce
            sm:top-auto sm:right-6 sm:bottom-6
            sm:left-auto sm:translate-x-0
          "
          role="status"
          aria-live="polite"
        >
          <div
            className="
              flex items-center gap-3
              rounded-2xl border border-orange-100
              border-r-4 border-r-[#E11383]
              bg-white/95 p-4 shadow-2xl backdrop-blur-md
            "
          >
            <div
              className="
                flex h-9 w-9 items-center justify-center
                rounded-full
                bg-gradient-to-r from-[#E11383] to-[#FF6600]
                font-bold text-white shadow-md
              "
              aria-hidden="true"
            >
              ✓
            </div>

            <span className="text-sm font-extrabold text-[#3D2314]">
              {toast}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================
   404 Page
========================= */

function NotFound() {
  return (
    <div
      className="
        flex min-h-[70vh]
        items-center justify-center
        px-6 py-16 text-center
      "
      dir="rtl"
    >
      <div className="max-w-md">
        <div className="mb-4 text-7xl font-black text-[#E11383]">
          404
        </div>

        <h1 className="mb-3 text-2xl font-black text-[#3D2314] sm:text-3xl">
          الصفحة غير موجودة
        </h1>

        <p className="mb-8 leading-8 text-[#6B5143]">
          الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
        </p>

        <Navigate to="/" replace />
      </div>
    </div>
  );
}

/* =========================
   App Content
========================= */

function AppContent() {
  return (
    <div
      className="
        flex min-h-screen flex-col
        bg-[#FFF8F3]
        text-right text-[#3D2314]
      "
      dir="rtl"
    >
      <Routes>

        {/* =========================
            Admin Login
        ========================= */}

        <Route
          path="/admin"
          element={<AdminLogin />}
        />

        {/* =========================
            Protected Admin Area
        ========================= */}

<Route
  element={
    <ProtectedRoute>
      <AdminLayout />
    </ProtectedRoute>
  }
>
<Route
  path="/admin/migrate-products"
  element={<ProductMigration />}
/>
  <Route
    path="/admin/dashboard"
    element={<AdminHome />}
  />
  <Route
  path="/admin/products"
  element={<Products />}
/>
<Route path="/admin/customers"
 element={<Customers />} />
<Route
    path="/admin/orders"
    element={<Orders />}
  />
<Route path="/admin/kitchen"
  element={<Kitchen />} />
  <Route
    path="/admin/categories"
    element={<Categories />}
  />
<Route path="/admin/analytics" 
   element={<Analytics />} 
/>
<Route path="/admin/settings" 
   element={<Settings />} 
/>

  <Route
    path="/admin/migrate-categories"
    element={<CategoryMigration />}
  />

</Route>
        {/* =========================
            Customer Website
        ========================= */}

        <Route element={<WebsiteLayout />}>
          <Route path="/" element={<Home />} />

          <Route path="/menu" element={<Menu />} />

          <Route path="/checkout" element={<Checkout />} />

          <Route
            path="/track-order"
            element={<OrderTracking />}
          />
        </Route>

        {/* =========================
            404
        ========================= */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </div>
  );
}

/* =========================
   App
========================= */

export default function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}