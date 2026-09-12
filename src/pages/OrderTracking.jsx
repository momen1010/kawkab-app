
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

const STATUS_STEPS = [
  {
    key: 'new',
    label: 'تم استلام الطلب',
    icon: '📦',
  },
  {
    key: 'preparing',
    label: 'جاري تجهيز الطلب',
    icon: '👨‍🍳',
  },
  {
    key: 'out_for_delivery',
    label: 'الطلب في الطريق',
    icon: '🛵',
  },
  {
    key: 'delivered',
    label: 'تم تسليم الطلب',
    icon: '✅',
  },
];

const STATUS_LABELS = {
  new: 'تم استلام الطلب',
  preparing: 'جاري تجهيز الطلب',
  out_for_delivery: 'الطلب في الطريق',
  delivered: 'تم تسليم الطلب',
  cancelled: 'تم إلغاء الطلب',
};

export default function OrderTracking() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError('رابط تتبع الطلب غير صالح.');
      setLoading(false);
      return;
    }

    const trackingRef = doc(db, 'orderTracking', token);

    const unsubscribe = onSnapshot(
      trackingRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setError('لم يتم العثور على الطلب.');
          setLoading(false);
          return;
        }

        setOrder(snapshot.data());
        setError('');
        setLoading(false);
      },
      (snapshotError) => {
        console.error('Tracking listener error:', snapshotError);
        setError('تعذر تحميل حالة الطلب.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[#FFF8F3]"
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🛵</div>

          <p className="text-[#3D2314] font-black text-lg">
            جاري تحميل حالة الطلب...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[#FFF8F3] px-5"
      >
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg">
          <div className="text-5xl mb-4">😕</div>

          <h1 className="text-2xl font-black text-[#3D2314] mb-3">
            حدث خطأ
          </h1>

          <p className="text-gray-600 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  const currentStatus = order?.status || 'new';

  if (currentStatus === 'cancelled') {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-[#FFF8F3] px-5"
      >
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-lg">
          <div className="text-6xl mb-5">❌</div>

          <h1 className="text-3xl font-black text-red-600 mb-3">
            تم إلغاء الطلب
          </h1>

          <p className="text-gray-600 font-bold">
            نأسف، تم إلغاء هذا الطلب.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex(
    (step) => step.key === currentStatus
  );

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FFF8F3] px-5 py-10"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🛵</div>

          <h1 className="text-3xl md:text-4xl font-black text-[#3D2314]">
            {STATUS_LABELS[currentStatus] || 'حالة الطلب'}
          </h1>

          <p className="text-gray-600 font-bold mt-3">
            سيتم تحديث حالة طلبك تلقائيًا.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
          <div className="relative">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div
                  key={step.key}
                  className="relative flex items-center gap-5"
                >
                  {index < STATUS_STEPS.length - 1 && (
                    <div
                      className={`absolute right-[23px] top-[55px] w-1 h-16 ${
                        index < currentIndex
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}

                  <div
                    className={`relative z-10 w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-xl transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                    } ${
                      isCurrent
                        ? 'ring-4 ring-green-100 scale-110'
                        : ''
                    }`}
                  >
                    {step.icon}
                  </div>

                  <div className="py-5">
                    <p
                      className={`font-black text-lg ${
                        isCompleted
                          ? 'text-[#3D2314]'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>

                    {isCurrent && (
                      <p className="text-sm text-green-600 font-bold mt-1">
                        الحالة الحالية
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 font-bold">
            حالة الطلب تتحدث تلقائيًا عند تغييرها من الإدارة.
          </p>
        </div>
      </div>
    </div>
  );
}
