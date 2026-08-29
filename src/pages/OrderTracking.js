// src/pages/OrderTracking.jsx
import { useState, useEffect } from 'react';

export default function OrderTracking() {
  const [statusStep, setStatusStep] = useState(1);

  // محاكاة تحرك حالة الطلب
  useEffect(() => {
    const timer1 = setTimeout(() => setStatusStep(2), 4000);
    const timer2 = setTimeout(() => setStatusStep(3), 10000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const steps = [
    { id: 1, title: 'تم استلام الطلب', icon: '📝' },
    { id: 2, title: 'جاري التحضير والشوي', icon: '🍩' },
    { id: 3, title: 'الطلب في الطريق إليك', icon: '🛵' },
  ];

  return (
    <main className="min-h-screen pt-28 pb-16 bg-[#FFF8F3] text-right" dir="rtl">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 text-center">
          <span className="bg-[#E11383]/10 text-[#E11383] text-xs font-black px-4 py-1.5 rounded-full inline-block mb-3">
            تتبع الطلب الحي ⚡
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#3D2314] mb-2">طلبك قيد التجهيز!</h1>
          <p className="text-xs text-gray-500 mb-8">رقم الطلب: #KS-8942</p>

          {/* Stepper */}
          <div className="space-y-6 text-right mb-8">
            {steps.map((step) => {
              const isDone = statusStep >= step.id;
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all ${
                      isDone ? 'bg-[#FF6600] text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <h3 className={`font-extrabold text-sm sm:text-base ${isDone ? 'text-[#3D2314]' : 'text-gray-400'}`}>
                      {step.title}
                    </h3>
                    {statusStep === step.id && (
                      <p className="text-xs text-[#E11383] font-bold animate-pulse">جاري العمل الآن...</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-xs font-bold text-[#3D2314]">
            ⏱️ الوقت المتوقع للوصول: <strong className="text-[#FF6600]">25 - 35 دقيقة</strong>
          </div>
        </div>
      </div>
    </main>
  );
}