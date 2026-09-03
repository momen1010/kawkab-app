import { useEffect, useState } from 'react';
import AdminDashboard from './AdminDashboard';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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
import FirebaseDemo from './components/FirebaseDemo';

import AdminLogin from './AdminLogin';

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF8F3]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>

          <p className="text-[#3D2314] font-bold">
            جاري التحقق من تسجيل الدخول...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppContent() {
  const { toast } = useCart();

  return (
    <div
      className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#3D2314] text-right"
      dir="rtl"
    >
      <Routes>

        {/* Admin Login */}
        <Route
          path="/admin"
          element={<AdminLogin />}
        />

        {/* Protected Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Website */}
        <Route
          path="*"
          element={
            <>
              <Navbar />

              <main className="flex-grow transition-all duration-300">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/checkout" element={<Checkout />} />

                  <Route
                    path="/firebase-demo"
                    element={<FirebaseDemo />}
                  />
                </Routes>
              </main>

              <Footer />

              <CartDrawer />

              <FloatingCartButton />

              {toast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 sm:top-auto sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-6 z-50 animate-bounce">
                  <div className="bg-white/95 backdrop-blur-md border border-orange-100 shadow-2xl rounded-2xl p-4 flex items-center gap-3 border-r-4 border-r-[#E11383]">

                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#E11383] to-[#FF6600] flex items-center justify-center text-white font-bold shadow-md">
                      ✓
                    </div>

                    <span className="text-[#3D2314] font-extrabold text-sm">
                      {toast}
                    </span>

                  </div>
                </div>
              )}

            </>
          }
        />

      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}
