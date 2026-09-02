// src/pages/Checkout.jsx

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Checkout() {
  const {
    cartItems,
    getCartTotal,
    clearCart,
    deliveryType,
  } = useCart();

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = getCartTotal();
  const deliveryFee = deliveryType === 'delivery' ? 20 : 0;
  const grandTotal = total + deliveryFee;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // تجهيز المنتجات للحفظ في Firestore
      const items = cartItems.map((item) => ({
        productId: item.product.id,
        name: item.product.nameAr,
        price: item.product.price,
        quantity: item.quantity,
        options: item.options || {},
      }));

      // بيانات الطلب
      const orderData = {
        customer: {
          name: formData.name,
          phone: formData.phone,
          address:
            deliveryType === 'delivery' ? formData.address : '',
          notes: formData.notes,
        },

        deliveryType,

        items,

        subtotal: total,
        deliveryFee,
        total: grandTotal,

        status: 'new',

        createdAt: serverTimestamp(),
      };

      // حفظ الطلب في Firestore
      const orderRef = await addDoc(
        collection(db, 'orders'),
        orderData
      );

      // =========================
      // تجهيز رسالة WhatsApp
      // =========================

      let message = '';

      message += '*طلب جديد من كوكب السعادة 🍩*%0A';
      message += '----------------------------%0A';

      message += `👤 *الاسم:* ${formData.name}%0A`;
      message += `📞 *الهاتف:* ${formData.phone}%0A`;

      if (deliveryType === 'delivery') {
        message += `📍 *العنوان:* ${formData.address}%0A`;
      } else {
        message += '🏪 *نوع الطلب:* استلام من الفرع%0A';
      }

      if (formData.notes.trim() !== '') {
        message += `📝 *ملاحظات:* ${formData.notes}%0A`;
      }

      message += '%0A🛒 *تفاصيل الطلب:*%0A';

      cartItems.forEach((item, index) => {
        const itemTotal =
          item.product.price * item.quantity;

        message += `${index + 1}. *${item.product.nameAr}* `;
        message += `(x${item.quantity}) - `;
        message += `${itemTotal} ج.م%0A`;

        if (item.options?.size) {
          message += `   ▫️ الحجم: ${item.options.size}%0A`;
        }

        if (
          item.options?.sauces &&
          Array.isArray(item.options.sauces) &&
          item.options.sauces.length > 0
        ) {
          message += `   ▫️ الصوصات: ${item.options.sauces.join(
            '، '
          )}%0A`;
        }
      });

      message += '%0A----------------------------%0A';

      message += `💰 *المجموع:* ${total} ج.م%0A`;

      if (deliveryType === 'delivery') {
        message += `🛵 *التوصيل:* ${deliveryFee} ج.م%0A`;
      }

      message += `✨ *الإجمالي النهائي:* *${grandTotal} ج.م*%0A`;

      message += `🔢 *رقم الطلب:* ${orderRef.id}%0A`;

      // رقم WhatsApp الخاص بالمحل
      const phoneNumber = '201119346488';

      const whatsappUrl =
        `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${message}`;

      // فتح WhatsApp
      window.open(whatsappUrl, '_blank');

      // تفريغ السلة
      clearCart();

      // الانتقال إلى صفحة تتبع الطلب
      navigate(
        `/track-order?orderId=${orderRef.id}`
      );
    } catch (error) {
      console.error(
        'Error saving order:',
        error
      );

      alert(
        'حدث خطأ أثناء إرسال الطلب. تأكد من اتصال الإنترنت وحاول مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================
  // السلة فارغة
  // =========================

  if (cartItems.length === 0) {
    return (
      <main
        className="min-h-screen pt-28 pb-16 bg-[#FFF8F3] text-right"
        dir="rtl"
      >
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl border border-orange-100 shadow-sm">

          <span className="text-5xl">
            🍩
          </span>

          <h2 className="text-2xl font-black text-[#3D2314] mt-4 mb-2">
            لا يوجد منتجات لإتمام الطلب
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            يرجى إضافة بعض المنتجات لسلتك أولاً
          </p>

          <Link
            to="/menu"
            className="bg-[#FF6600] text-white px-8 py-3 rounded-full font-black text-sm shadow-md inline-block"
          >
            الذهاب للقائمة
          </Link>

        </div>
      </main>
    );
  }

  // =========================
  // صفحة Checkout
  // =========================

  return (
    <main
      className="min-h-screen pt-28 pb-16 bg-[#FFF8F3] text-right"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        <h1 className="text-3xl font-black text-[#3D2314] mb-6">
          إتمام الطلب 🚀
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* =========================
              نموذج البيانات
          ========================= */}

          <form
            onSubmit={handleSubmit}
            className="md:col-span-3 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm space-y-4"
          >

            <h2 className="text-lg font-extrabold text-[#3D2314] mb-2">
              بيانات الاستلام
            </h2>

            {/* الاسم */}

            <div>
              <label className="block text-xs font-black text-[#3D2314] mb-1">
                الاسم بالكامل *
              </label>

              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="أدخل اسمك"
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF8F3] border border-orange-100 text-sm focus:outline-none focus:border-[#FF6600]"
              />
            </div>

            {/* الهاتف */}

            <div>
              <label className="block text-xs font-black text-[#3D2314] mb-1">
                رقم الهاتف (واتساب) *
              </label>

              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="01000000000"
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF8F3] border border-orange-100 text-sm focus:outline-none focus:border-[#FF6600]"
              />
            </div>

            {/* العنوان */}

            {deliveryType === 'delivery' && (
              <div>
                <label className="block text-xs font-black text-[#3D2314] mb-1">
                  عنوان التوصيل التفصيلي *
                </label>

                <textarea
                  name="address"
                  required
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="المدينة، الشارع، رقم العمارة والشقة"
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF8F3] border border-orange-100 text-sm focus:outline-none focus:border-[#FF6600]"
                />
              </div>
            )}

            {/* الملاحظات */}

            <div>
              <label className="block text-xs font-black text-[#3D2314] mb-1">
                ملاحظات إضافية (اختياري)
              </label>

              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="مثال: بدون سكر، الاتصال عند الوصول..."
                className="w-full px-4 py-3 rounded-2xl bg-[#FFF8F3] border border-orange-100 text-sm focus:outline-none focus:border-[#FF6600]"
              />
            </div>

            {/* زر الإرسال */}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-4 text-white py-4 rounded-full font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#27AE60] hover:bg-[#219653] active:scale-95 cursor-pointer'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'جاري إرسال الطلب...'
                  : 'إرسال الطلب عبر واتساب 💬'}
              </span>
            </button>

          </form>

          {/* =========================
              ملخص الطلب
          ========================= */}

          <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-orange-100 shadow-sm h-fit space-y-4">

            <h2 className="text-lg font-extrabold text-[#3D2314] border-b border-orange-50 pb-2">
              ملخص الحساب
            </h2>

            <div className="space-y-2 text-xs font-bold text-gray-600">

              <div className="flex justify-between">
                <span>
                  المشتريات:
                </span>

                <span className="text-[#3D2314] font-black">
                  {total} ج.م
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  التوصيل:
                </span>

                <span className="text-[#3D2314] font-black">
                  {deliveryType === 'delivery'
                    ? `${deliveryFee} ج.م`
                    : 'مجاني'}
                </span>
              </div>

            </div>

            <div className="border-t border-orange-100 pt-3 flex justify-between items-center">

              <span className="font-extrabold text-sm text-[#3D2314]">
                الإجمالي:
              </span>

              <span className="text-xl font-black text-[#FF6600]">
                {grandTotal} ج.م
              </span>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}