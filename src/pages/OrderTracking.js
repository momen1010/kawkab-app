// src/pages/OrderTracking.jsx

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../firebase/config';

export default function OrderTracking() {
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =========================
  // جلب الطلب من Firebase
  // =========================

  useEffect(() => {
    if (!orderId) {
      setError('رقم الطلب غير موجود.');
      setLoading(false);
      return;
    }

    const orderRef = doc(db, 'orders', orderId);

    const unsubscribe = onSnapshot(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setOrder({
            id: snapshot.id,
            ...snapshot.data(),
          });

          setError('');
        } else {
          setError('لم يتم العثور على هذا الطلب.');
        }

        setLoading(false);
      },
      (firebaseError) => {
        console.error(
          'Error loading order:',
          firebaseError
        );

        setError(
          'حدث خطأ أثناء تحميل الطلب.'
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  // =========================
  // حالات الطلب
  // =========================

  const steps = [
    {
      id: 'new',
      title: 'تم استلام الطلب',
      icon: '📝',
    },
    {
      id: 'preparing',
      title: 'جاري التحضير والشوي',
      icon: '🍩',
    },
    {
      id: 'out_for_delivery',
      title: 'الطلب في الطريق إليك',
      icon: '🛵',
    },
    {
      id: 'delivered',
      title: 'تم تسليم الطلب',
      icon: '✅',
    },
  ];

  const statusOrder = [
    'new',
    'preparing',
    'out_for_delivery',
    'delivered',
  ];

  const cancelled =
    order?.status === 'cancelled';

  const currentStatusIndex = order
    ? statusOrder.indexOf(order.status)
    : 0;

  // =========================
  // أسماء الحالات
  // =========================

  const statusLabels = {
    new: 'تم استلام الطلب',
    preparing: 'جاري التحضير والشوي',
    out_for_delivery: 'الطلب في الطريق إليك',
    delivered: 'تم تسليم الطلب',
    cancelled: 'تم إلغاء الطلب',
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <main
        className="min-h-screen pt-28 pb-16 bg-[#FFF8F3] flex items-center justify-center"
        dir="rtl"
      >
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-orange-100 text-center">

          <div className="text-5xl mb-4 animate-bounce">
            🍩
          </div>

          <h2 className="text-xl font-black text-[#3D2314]">
            جاري تحميل طلبك...
          </h2>

          <p className="text-sm text-gray-500 mt-2">
            لحظة واحدة من فضلك
          </p>

        </div>
      </main>
    );
  }

  // =========================
  // Error
  // =========================

  if (error || !order) {
    return (
      <main
        className="min-h-screen pt-28 pb-16 bg-[#FFF8F3] flex items-center justify-center"
        dir="rtl"
      >
        <div className="max-w-md w-full mx-4 bg-white rounded-3xl p-8 shadow-xl border border-orange-100 text-center">

          <div className="text-5xl mb-4">
            😕
          </div>

          <h2 className="text-xl font-black text-[#3D2314] mb-2">
            لم نتمكن من العثور على الطلب
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            {error || 'تأكد من رقم الطلب وحاول مرة أخرى.'}
          </p>

          <Link
            to="/menu"
            className="inline-block bg-[#FF6600] text-white px-8 py-3 rounded-full font-black text-sm"
          >
            العودة للقائمة
          </Link>

        </div>
      </main>
    );
  }

  // =========================
  // الطلب ملغي
  // =========================

  if (cancelled) {
    return (
      <main
        className="min-h-screen pt-28 pb-16 bg-[#FFF8F3] text-right"
        dir="rtl"
      >
        <div className="max-w-xl mx-auto px-4">

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-100 text-center">

            <span className="bg-red-50 text-red-600 text-xs font-black px-4 py-1.5 rounded-full inline-block mb-3">
              حالة الطلب
            </span>

            <div className="text-6xl mb-4">
              ❌
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#3D2314] mb-2">
              تم إلغاء الطلب
            </h1>

            <p className="text-xs text-gray-500 mb-6">
              رقم الطلب: #{order.id.slice(0, 8)}
            </p>

            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-sm font-bold text-red-700">
              نأسف، تم إلغاء هذا الطلب.
            </div>

          </div>

        </div>
      </main>
    );
  }

  // =========================
  // الصفحة الرئيسية
  // =========================

  return (
    <main
      className="min-h-screen pt-28 pb-16 bg-[#FFF8F3] text-right"
      dir="rtl"
    >
      <div className="max-w-xl mx-auto px-4">

        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100 text-center">

          {/* العنوان */}

          <span className="bg-[#E11383]/10 text-[#E11383] text-xs font-black px-4 py-1.5 rounded-full inline-block mb-3">
            تتبع الطلب الحي ⚡
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#3D2314] mb-2">
            {statusLabels[order.status] || 'حالة الطلب'}
          </h1>

          <p className="text-xs text-gray-500 mb-2">
            رقم الطلب:
          </p>

          <p className="text-sm font-black text-[#FF6600] mb-8">
            #{order.id}
          </p>

          {/* العميل */}

          {order.customer?.name && (
            <div className="bg-[#FFF8F3] rounded-2xl p-4 mb-6 text-right">

              <p className="text-xs text-gray-500 mb-1">
                العميل
              </p>

              <p className="font-black text-[#3D2314]">
                {order.customer.name}
              </p>

            </div>
          )}

          {/* Stepper */}

          <div className="space-y-6 text-right mb-8">

            {steps.map((step, index) => {
              const isDone =
                currentStatusIndex >= index;

              const isCurrent =
                order.status === step.id;

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-4"
                >

                  {/* الأيقونة */}

                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all ${
                      isDone
                        ? 'bg-[#FF6600] text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {step.icon}
                  </div>

                  {/* النص */}

                  <div>

                    <h3
                      className={`font-extrabold text-sm sm:text-base ${
                        isDone
                          ? 'text-[#3D2314]'
                          : 'text-gray-400'
                      }`}
                    >
                      {step.title}
                    </h3>

                    {isCurrent && (
                      <p className="text-xs text-[#E11383] font-bold animate-pulse mt-1">
                        جاري العمل الآن...
                      </p>
                    )}

                  </div>

                </div>
              );
            })}

          </div>

          {/* الحالة الحالية */}

          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-sm font-bold text-[#3D2314] mb-4">

            الحالة الحالية:

            <strong className="text-[#FF6600] mr-1">
              {statusLabels[order.status] || 'غير محددة'}
            </strong>

          </div>

          {/* التوصيل */}

          {order.deliveryType === 'delivery' && (
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-xs font-bold text-blue-700">
              🛵 طلبك سيتم توصيله إلى العنوان المسجل.
            </div>
          )}

          {order.deliveryType === 'pickup' && (
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-xs font-bold text-green-700">
              🏪 طلبك جاهز للاستلام من الفرع.
            </div>
          )}

          {/* الإجمالي */}

          <div className="border-t border-orange-100 mt-6 pt-5 flex justify-between items-center">

            <span className="font-extrabold text-sm text-[#3D2314]">
              إجمالي الطلب
            </span>

            <span className="text-xl font-black text-[#FF6600]">
              {order.total || 0} ج.م
            </span>

          </div>

        </div>

      </div>
    </main>
  );
}