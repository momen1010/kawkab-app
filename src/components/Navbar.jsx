// src/components/Navbar.jsx
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { cartItems, openCart } = useCart();
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="fixed top-0 right-0 left-0 bg-white/95 backdrop-blur-md z-40 border-b border-orange-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl sm:text-3xl font-black text-[#FF6600] tracking-tight group-hover:scale-105 transition-transform">
             happy drink<span className="text-[#E11383]"></span> 🍩
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-extrabold text-[#3D2314]">
          <Link to="/" className="hover:text-[#FF6600] transition-colors">الرئيسية</Link>
          <Link to="/menu" className="hover:text-[#FF6600] transition-colors">القائمة</Link>
        </nav>

        {/* Cart Button */}
        <button
          onClick={openCart}
          className="relative bg-[#FFF8F3] hover:bg-orange-100 text-[#3D2314] p-3 rounded-full transition-all duration-300 flex items-center justify-center border border-orange-200 cursor-pointer"
          aria-label="فتح سلة المشتريات"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#E11383]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          
          {totalItemsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FF6600] text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}