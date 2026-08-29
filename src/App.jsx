// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import FloatingCartButton from './components/FloatingCartButton';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import FirebaseDemo from './components/FirebaseDemo';

function AppContent() {
  const { toast } = useCart();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8F3] text-[#3D2314] selection:bg-[#E11383] selection:text-white text-right" dir="rtl">
      {/* Navbar الشريط العلوي */}
      <Navbar />
      
      {/* المحتوى الرئيسي للRoutes */}
      <main className="flex-grow transition-all duration-300">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/firebase-demo" element={<FirebaseDemo />} />
        </Routes>
      </main>

      {/* Footer الفوتر */}
      <Footer />
      
      {/* السلة الجانبية */}
      <CartDrawer />
      
      {/* زر السلة العائم للموبايل */}
      <FloatingCartButton />
      
      {/* Toast Notification العصري بألوان دانكن المبهجة */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 sm:top-auto sm:left-auto sm:translate-x-0 sm:bottom-6 sm:right-6 z-50 animate-bounce transition-all">
          <div className="bg-white/95 backdrop-blur-md border border-orange-100 shadow-2xl rounded-2xl p-4 flex items-center gap-3 border-r-4 border-r-[#E11383]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#E11383] to-[#FF6600] flex items-center justify-center text-white font-bold shadow-md">
              ✓
            </div>
            <span className="text-[#3D2314] font-extrabold text-sm">{toast}</span>
          </div>
        </div>
      )}
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