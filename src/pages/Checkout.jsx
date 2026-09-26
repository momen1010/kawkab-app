import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function getSafePrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price) || price < 0) {
    return 0;
  }

  return price;
}

const DELIVERY_FEE = 20;
const FREE_DELIVERY_LIMIT = 150;

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) return 1;

  return Math.min(Math.max(Math.floor(quantity), 1), 20);
}

function getDeliveryFee(deliveryType, subtotal) {
  if (deliveryType !== 'delivery') return 0;

  if (subtotal >= FREE_DELIVERY_LIMIT) return 0;

  return DELIVERY_FEE;
}

function generateTrackingToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
}

function buildWhatsAppMessage({
  items,
  name,
  phone,
  address,
  notes,
  subtotal,
  calculatedDeliveryFee,
  calculatedGrandTotal,
  trackingToken,
}) {
  const itemsText = items
    .map((item) => {
      const itemTotal =
        Number(item.price || 0) * Number(item.quantity || 0);

      return `• ${item.name} × ${item.quantity} = ${itemTotal} ج.م`;
    })
    .join('\n');

  const trackingUrl = `${window.location.origin}/track-order?token=${trackingToken}`;

  return `
🌟 *طلب جديد - كوكب السعادة* 🌟

👤 *الاسم:* ${name}
📱 *الهاتف:* ${phone}
📍 *العنوان:* ${address || 'استلام من الفرع'}
📝 *ملاحظات:* ${notes || 'لا يوجد'}

🛒 *الطلبات:*
${itemsText}

💰 *الإجمالي قبل التوصيل:* ${subtotal} ج.م
🚚 *التوصيل:* ${calculatedDeliveryFee} ج.م
💵 *الإجمالي النهائي:* ${calculatedGrandTotal} ج.م

🔎 *تتبع الطلب:*
${trackingUrl}
`.trim();
}

export default function Checkout() {
  const navigate = useNavigate();

  const {
    cartItems,
    clearCart,
    deliveryType,
    setDeliveryType,
    getCartTotal,
  } = useCart();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');

  const [orderMethod, setOrderMethod] = useState('website');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const formRef = useRef(null);

  const rawCartTotal = Number(getCartTotal());

  const subtotal = Number.isFinite(rawCartTotal)
    ? Math.max(rawCartTotal, 0)
    : 0;

  const deliveryFee = getDeliveryFee(deliveryType, subtotal);

  const grandTotal = subtotal + deliveryFee;

  const cartIsEmpty = cartItems.length === 0;

  const canSubmit = useMemo(() => {
    return (
      normalizeText(name).length >= 2 &&
      normalizeText(phone).length >= 8 &&
      (deliveryType === 'pickup' || normalizeText(address).length > 0) &&
      cartItems.length > 0 &&
      !isSubmitting
    );
  }, [
    name,
    phone,
    address,
    deliveryType,
    cartItems.length,
    isSubmitting,
  ]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setError('');

    const customerName = normalizeText(name);
    const customerPhone = normalizeText(phone);
    const customerAddress = normalizeText(address);
    const customerNotes = normalizeText(notes);

    if (customerName.length < 2) {
      setError('من فضلك أدخل اسم صحيح.');
      return;
    }

    if (customerPhone.length < 8) {
      setError('من فضلك أدخل رقم هاتف صحيح.');
      return;
    }

    if (deliveryType === 'delivery' && !customerAddress) {
      setError('من فضلك أدخل عنوان التوصيل.');
      return;
    }

    if (cartIsEmpty) {
      setError('السلة فارغة.');
      return;
    }

    if (!['cash', 'vodafone_cash'].includes(paymentMethod)) {
      setError('طريقة الدفع غير صحيحة.');
      return;
    }

    setIsSubmitting(true);

    try {
      /*
       * مهم:
       * لا نرسل السعر أو الإجمالي أو orderNumber أو trackingToken.
       * السيرفر هو الذي يقرأ الأسعار من Firestore ويحسب الإجمالي.
       */
      const items = cartItems.map((item) => ({
        productId: String(item.product?.id || ''),
        quantity: normalizeQuantity(item.quantity),
        options:
          item.options && typeof item.options === 'object'
            ? item.options
            : {},
      }));

      if (items.some((item) => !item.productId)) {
        throw new Error('يوجد منتج غير صالح في السلة.');
      }

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            notes: customerNotes,
          },

          deliveryType,

          items,

          paymentMethod,

          transactionId:
            paymentMethod === 'vodafone_cash'
              ? normalizeText(transactionId)
              : '',

          orderMethod,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || 'تعذر إنشاء الطلب. حاول مرة أخرى.'
        );
      }

      /*
       * هنا نستخدم بيانات السيرفر فقط.
       */
      const serverItems = Array.isArray(data.items)
        ? data.items
        : [];

      const serverSubtotal = Number(data.subtotal || 0);
      const serverDeliveryFee = Number(data.deliveryFee || 0);
      const serverTotal = Number(data.total || 0);
      const trackingToken = data.trackingToken;

      if (!trackingToken) {
        throw new Error('تم إنشاء الطلب ولكن تعذر الحصول على رابط التتبع.');
      }

      if (orderMethod === 'whatsapp') {
        const message = buildWhatsAppMessage({
          items: serverItems,
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          notes: customerNotes,
          subtotal: serverSubtotal,
          calculatedDeliveryFee: serverDeliveryFee,
          calculatedGrandTotal: serverTotal,
          trackingToken,
        });

        const whatsappUrl = `https://wa.me/201119346488?text=${encodeURIComponent(
          message
        )}`;

        clearCart();

        window.location.href = whatsappUrl;
        return;
      }

      clearCart();

      navigate(
        `/track-order?token=${encodeURIComponent(trackingToken)}`
      );
    } catch (err) {
      console.error('Order creation failed:', err);

      setError(
        err?.message ||
          'حدث خطأ أثناء إنشاء الطلب. حاول مرة أخرى.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      className="min-h-screen pt-24 pb-16 bg-[#FFF8F3]"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="bg-[#E11383]/10 text-[#E11383] text-xs sm:text-sm font-black px-4 py-1.5 rounded-full inline-block mb-3">
            خطوة أخيرة ✨
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-[#3D2314]">
            إتمام <span className="text-[#FF6600]">الطلب</span>
          </h1>
        </div>

        {cartIsEmpty ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 text-center border border-orange-100 shadow-sm">
            <div className="text-5xl mb-4">🛒</div>

            <h2 className="text-xl font-black text-[#3D2314] mb-2">
              السلة فارغة
            </h2>

            <p className="text-sm text-gray-500 mb-6">
              أضف بعض المنتجات أولاً لإتمام الطلب.
            </p>

            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="bg-[#FF6600] text-white px-6 py-3 rounded-xl font-black"
            >
              العودة للقائمة
            </button>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-3xl p-5 sm:p-7 border border-orange-100 shadow-sm">
                <h2 className="text-xl font-black text-[#3D2314] mb-5">
                  بيانات العميل
                </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-[#3D2314] mb-2">
                      الاسم
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:border-[#FF6600]"
                      placeholder="اسمك"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-[#3D2314] mb-2">
                      رقم الهاتف
                    </label>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:border-[#FF6600]"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-black text-[#3D2314] mb-2">
                    طريقة الاستلام
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`py-3 rounded-xl font-black border transition ${
                        deliveryType === 'delivery'
                          ? 'bg-[#FF6600] text-white border-[#FF6600]'
                          : 'bg-white text-[#3D2314] border-orange-100'
                      }`}
                    >
                      🚚 توصيل
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`py-3 rounded-xl font-black border transition ${
                        deliveryType === 'pickup'
                          ? 'bg-[#FF6600] text-white border-[#FF6600]'
                          : 'bg-white text-[#3D2314] border-orange-100'
                      }`}
                    >
                      🏪 استلام
                    </button>
                  </div>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="mt-4">
                    <label className="block text-sm font-black text-[#3D2314] mb-2">
                      عنوان التوصيل
                    </label>

                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:border-[#FF6600] resize-none"
                      placeholder="اكتب عنوان التوصيل بالتفصيل"
                    />
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-black text-[#3D2314] mb-2">
                    ملاحظات
                  </label>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:border-[#FF6600] resize-none"
                    placeholder="أي ملاحظات خاصة بالطلب..."
                  />
                </div>
              </section>

              <section className="bg-white rounded-3xl p-5 sm:p-7 border border-orange-100 shadow-sm">
                <h2 className="text-xl font-black text-[#3D2314] mb-5">
                  طريقة الدفع
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-4 rounded-xl font-black border transition ${
                      paymentMethod === 'cash'
                        ? 'bg-[#FF6600] text-white border-[#FF6600]'
                        : 'bg-white text-[#3D2314] border-orange-100'
                    }`}
                  >
                    💵 الدفع عند الاستلام
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod('vodafone_cash')
                    }
                    className={`py-4 rounded-xl font-black border transition ${
                      paymentMethod === 'vodafone_cash'
                        ? 'bg-[#FF6600] text-white border-[#FF6600]'
                        : 'bg-white text-[#3D2314] border-orange-100'
                    }`}
                  >
                    📱 Vodafone Cash
                  </button>
                </div>

                {paymentMethod === 'vodafone_cash' && (
                  <div className="mt-4">
                    <label className="block text-sm font-black text-[#3D2314] mb-2">
                      رقم العملية
                    </label>

                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) =>
                        setTransactionId(e.target.value)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-orange-100 focus:outline-none focus:border-[#FF6600]"
                      placeholder="رقم عملية Vodafone Cash"
                    />
                  </div>
                )}
              </section>

              <section className="bg-white rounded-3xl p-5 sm:p-7 border border-orange-100 shadow-sm">
                <h2 className="text-xl font-black text-[#3D2314] mb-5">
                  طريقة إرسال الطلب
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderMethod('website')}
                    className={`py-4 rounded-xl font-black border transition ${
                      orderMethod === 'website'
                        ? 'bg-[#FF6600] text-white border-[#FF6600]'
                        : 'bg-white text-[#3D2314] border-orange-100'
                    }`}
                  >
                    🌐 من الموقع
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderMethod('whatsapp')}
                    className={`py-4 rounded-xl font-black border transition ${
                      orderMethod === 'whatsapp'
                        ? 'bg-[#FF6600] text-white border-[#FF6600]'
                        : 'bg-white text-[#3D2314] border-orange-100'
                    }`}
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </section>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 font-bold text-sm">
                  {error}
                </div>
              )}
            </div>

            <aside className="lg:col-span-1">
              <div className="bg-white rounded-3xl p-5 sm:p-7 border border-orange-100 shadow-sm lg:sticky lg:top-24">
                <h2 className="text-xl font-black text-[#3D2314] mb-5">
                  ملخص الطلب
                </h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => {
                    const price = getSafePrice(item.product?.price);

                    const quantity = normalizeQuantity(
                      item.quantity
                    );

                    const itemTotal = price * quantity;

                    return (
                      <div
                        key={item.key || item.product?.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-black text-[#3D2314] text-sm">
                            {item.product?.nameAr ||
                              item.product?.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            × {quantity}
                          </p>
                        </div>

                        <span className="font-black text-[#FF6600]">
                          {itemTotal} ج.م
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-orange-100 pt-4 space-y-3">
                  <div className="flex justify-between text-sm font-bold text-gray-600">
                    <span>المجموع</span>
                    <span>{subtotal} ج.م</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-gray-600">
                    <span>التوصيل</span>
                    <span>
                      {deliveryFee === 0
                        ? 'مجاني'
                        : `${deliveryFee} ج.م`}
                    </span>
                  </div>

                  <div className="border-t border-orange-100 pt-3 flex justify-between">
                    <span className="font-black text-[#3D2314]">
                      الإجمالي
                    </span>

                    <span className="font-black text-xl text-[#FF6600]">
                      {grandTotal} ج.م
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full mt-6 bg-[#FF6600] hover:bg-[#e85d00] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black transition"
                >
                  {isSubmitting
                    ? 'جاري إنشاء الطلب...'
                    : orderMethod === 'whatsapp'
                    ? 'إرسال الطلب عبر WhatsApp'
                    : 'تأكيد الطلب'}
                </button>
              </div>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}