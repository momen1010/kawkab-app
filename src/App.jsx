
import { useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

import { CartProvider, useCart } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingCartButton from './components/FloatingCartButton';

import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';

import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

/* =========================
   Loading Screen
========================= */

function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#FFF8F3]"
      dir="rtl"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4" />

        <p className="text-[#3D2314] font-bold">
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
   * IMPORTANT:
   * Authentication != Authorization.
   *
   * For now we only verify that the user is authenticated.
   * Real admin authorization must be enforced with Firebase
   * security rules / custom claims and verified separately.
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
          className="fixed top-24 left-1/2 -translate-x-1/2
                     sm:top-auto sm:left-auto sm:translate-x-0
                     sm:bottom-6 sm:right-6
                     z-50 animate-bounce"
          role="status"
          aria-live="polite"
        >
          <div
            className="bg-white/95 backdrop-blur-md
                       border border-orange-100 shadow-2xl
                       rounded-2xl p-4
                       flex items-center gap-3
                       border-r-4 border-r-[#E11383]"
          >
            <div
              className="w-9 h-9 rounded-full
                         bg-gradient-to-r from-[#E11383] to-[#FF6600]
                         flex items-center justify-center
                         text-white font-bold shadow-md"
              aria-hidden="true"
            >
              ✓
            </div>

            <span className="text-[#3D2314] font-extrabold text-sm">
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
      className="min-h-[70vh] flex items-center justify-center px-6 py-16 text-center"
      dir="rtl"
    >
      <div className="max-w-md">
        <div className="text-7xl font-black text-[#E11383] mb-4">
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#3D2314] mb-3">
          الصفحة غير موجودة
        </h1>

        <p className="text-[#6B5143] mb-8 leading-8">
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
      className="min-h-screen flex flex-col
                 bg-[#FFF8F3] text-[#3D2314] text-right"
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
            Protected Admin Dashboard
        ========================= */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

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

