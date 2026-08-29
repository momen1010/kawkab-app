// src/components/Hero.jsx
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-[#FFF8F3] via-white to-orange-50 rounded-3xl p-8 sm:p-14 mb-12 border border-orange-100 relative overflow-hidden shadow-sm">
      <div className="max-w-2xl text-right relative z-10">
        <span className="bg-[#E11383] text-white text-xs sm:text-sm font-black px-4 py-1.5 rounded-full inline-block mb-4 shadow-sm">
          يومك يبدأ بطاقة وحيوية 🍩⚡
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-[#3D2314] leading-tight mb-4">
          أنت تتمنى، ونحن <span className="text-[#FF6600]">نُقدّم!</span>
        </h1>
        <p className="text-gray-600 text-base sm:text-lg mb-8 font-medium leading-relaxed">
          اكتشف المذاق الأصلي للقهوة المختارة بعناية، والوافل المقرمش مع أجود صوصات الشوكولاتة والحلويات الطازجة.
        </p>
        <Link 
          to="/menu" 
          className="bg-[#FF6600] hover:bg-[#E11383] text-white text-lg font-black px-8 py-4 rounded-full inline-flex items-center gap-2 transition-all duration-300 shadow-lg shadow-orange-500/20 hover:scale-105"
        >
          <span>تصفح القائمة الكاملة</span>
          <span>🚀</span>
        </Link>
      </div>
    </section>
  );
}