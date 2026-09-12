
import { useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

/*
 * =========================
 * Constants
 * =========================
 */

const DELIVERY_FEE = 20;

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 300;
const MAX_NOTES_LENGTH = 300;
const MAX_TRANSACTION_ID_LENGTH = 100;
const MAX_ITEM_QUANTITY = 20;

const WHATSAPP_PHONE = '201119346488';
const VODAFONE_CASH_PHONE = '01119346488';

/*
 * =========================
 * Helpers
 * =========================
 */

function normalizeText(value, maxLength) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

function normalizePhone(value) {
  return String(value || '')
    .trim()
    .replace(/[\s()-]/g, '');
}

function isValidEgyptianPhone(phone) {
  return /^(?:01\d{9}|\+201\d{9}|201\d{9})$/.test(phone);
}

function createTrackingToken() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return (
      crypto.randomUUID().replace(/-/g, '') +
      crypto.randomUUID().replace(/-/g, '')
    );
  }

  const randomPart = Math.random()
    .toString(36)
    .slice(2);

  const timePart = Date.now().toString(36);

  return `${randomPart}${timePart}${randomPart}`;
}

function getSafeQuantity(quantity) {
  const parsed = Number(quantity);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(
    Math.max(Math.floor(parsed), 1),
    MAX_ITEM_QUANTITY
  );
}

function getDeliveryFee(
  deliveryType,
  subtotal,
  freeDeliveryLimit
) {
  if (deliveryType !== 'delivery') {
    return 0;
  }

  if (subtotal >= freeDeliveryLimit) {
    return 0;
  }

  return DELIVERY_FEE;
}

/*
 * =========================
 * Component
 * =========================
 */

export default function Checkout() {
  const {
    cartItems,
    getCartTotal,
    clearCart,
    deliveryType,
    FREE_DELIVERY_LIMIT,
  } = useCart();

  const navigate = useNavigate();

  const formRef = useRef(null);
  const submissionLock = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderMethod, setOrderMethod] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');

  /*
   * =========================
   * Cart totals
   * =========================
   */

  const rawCartTotal = Number(getCartTotal());

  const total =
    Number.isFinite(rawCartTotal) && rawCartTotal >= 0
      ? rawCartTotal
      : 0;

  const deliveryFee = getDeliveryFee(
    deliveryType,
    total,
    FREE_DELIVERY_LIMIT
  );

  const grandTotal = total + deliveryFee;

  /*
   * =========================
   * Form change
   * =========================
   */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /*
   * =========================
   * Validation
   * =========================
   */

  const validateForm = () => {
    const name = normalizeText(
      formData.name,
      MAX_NAME_LENGTH
    );

    const phone = normalizePhone(formData.phone);

    const address =
      deliveryType === 'delivery'
        ? normalizeText(
            formData.address,
            MAX_ADDRESS_LENGTH
          )
        : '';

    const notes = normalizeText(
      formData.notes,
      MAX_NOTES_LENGTH
    );

    if (!name) {
      return 'من فضلك أدخل الاسم بالكامل.';
    }

    if (name.length < 2) {
      return 'الاسم يجب أن يحتوي على حرفين على الأقل.';
    }

    if (!phone) {
      return 'من فضلك أدخل رقم الهاتف.';
    }

    if (!isValidEgyptianPhone(phone)) {
      return 'من فضلك أدخل رقم هاتف مصري صحيح.';
    }

    if (deliveryType === 'delivery' && !address) {
      return 'من فضلك أدخل عنوان التوصيل.';
    }

    if (
      deliveryType === 'delivery' &&
      address.length < 5
    ) {
      return 'من فضلك أدخل عنوان توصيل كامل.';
    }

    if (
      paymentMethod === 'vodafone_cash' &&
      !normalizeText(
        transactionId,
        MAX_TRANSACTION_ID_LENGTH
      )
    ) {
      return 'من فضلك أدخل رقم عملية Vodafone Cash.';
    }

    if (
      paymentMethod === 'vodafone_cash' &&
      normalizeText(
        transactionId,
        MAX_TRANSACTION_ID_LENGTH
      ).length < 3
    ) {
      return 'رقم عملية Vodafone Cash غير صالح.';
    }

    if (!cartItems.length) {
      return 'السلة فارغة.';
    }

    for (const item of cartItems) {
      const quantity = getSafeQuantity(item.quantity);

      if (
        !item?.product?.id ||
        !item?.product?.nameAr
      ) {
        return 'يوجد منتج غير صالح داخل السلة. يرجى تحديث السلة.';
      }

      if (
        quantity < 1 ||
        quantity > MAX_ITEM_QUANTITY
      ) {
        return 'كمية أحد المنتجات غير صالحة.';
      }

      if (
        !Number.isFinite(
          Number(item.product.price)
        ) ||
        Number(item.product.price) < 0
      ) {
        return 'يوجد منتج بسعر غير صالح.';
      }
    }

    return null;
  };

  /*
   * =========================
   * Build WhatsApp message
   * =========================
   *
   * IMPORTANT:
   * Order number and tracking token are NOT
   * included directly as customer data.
   */

  const buildWhatsAppMessage = ({
    items,
    name,
    phone,
    address,
    notes,
    subtotal,
    calculatedDeliveryFee,
    calculatedGrandTotal,
    trackingToken,
  }) => {
    let message = '';

    message += '*طلب جديد من كوكب السعادة 🍩*\n';
    message += '----------------------------\n';

    message += `👤 *الاسم:* ${name}\n`;
    message += `📞 *الهاتف:* ${phone}\n`;

    if (deliveryType === 'delivery') {
      message += `📍 *العنوان:* ${address}\n`;
      message += '🛵 *نوع الطلب:* توصيل\n';
    } else {
      message += '🏪 *نوع الطلب:* استلام من الفرع\n';
    }

    if (notes) {
      message += `📝 *ملاحظات:* ${notes}\n`;
    }

    message += '\n🛒 *تفاصيل الطلب:*\n';

    items.forEach((item, index) => {
      const itemTotal =
        Number(item.price) *
        Number(item.quantity);

      message += `${index + 1}. *${item.name}* `;
      message += `(x${item.quantity}) - `;
      message += `${itemTotal} ج.م\n`;

      if (item.options?.size) {
        message += `   ▫️ الحجم: ${item.options.size}\n`;
      }

      if (
        Array.isArray(item.options?.sauces) &&
        item.options.sauces.length > 0
      ) {
        message += `   ▫️ الصوصات: ${item.options.sauces.join(
          '، '
        )}\n`;
      }
    });

    message += '\n----------------------------\n';

    message += `💰 *المجموع:* ${subtotal} ج.م\n`;

    if (deliveryType === 'delivery') {
      message += `🛵 *التوصيل:* ${
        calculatedDeliveryFee === 0
          ? 'مجاني'
          : `${calculatedDeliveryFee} ج.م`
      }\n`;
    }

    message += `✨ *الإجمالي النهائي:* *${calculatedGrandTotal} ج.م*\n`;

    if (paymentMethod === 'vodafone_cash') {
      message += '💳 *طريقة الدفع:* Vodafone Cash\n';
      message += `💰 *المبلغ المطلوب:* ${calculatedGrandTotal} ج.م\n`;
      message += `🔢 *رقم العملية:* ${normalizeText(
        transactionId,
        MAX_TRANSACTION_ID_LENGTH
      )}\n`;
      message += '🟡 *حالة الدفع:* في انتظار التأكيد\n';
    } else {
      message += '💳 *طريقة الدفع:* الدفع عند الاستلام\n';
    }

    const trackingUrl =
      `${window.location.origin}/track-order?token=` +
      encodeURIComponent(trackingToken);

    message += '\n📍 *رابط تتبع الطلب:*\n';
    message += trackingUrl;

    return message;
  };

  /*
   * =========================
   * Submit
   * =========================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      submissionLock.current ||
      isSubmitting
    ) {
      return;
    }

    if (!cartItems.length) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    if (!orderMethod) {
      alert('من فضلك اختر طريقة إرسال الطلب.');
      return;
    }

    submissionLock.current = true;
    setIsSubmitting(true);

    try {
      const name = normalizeText(
        formData.name,
        MAX_NAME_LENGTH
      );

      const phone = normalizePhone(
        formData.phone
      );

      const address =
        deliveryType === 'delivery'
          ? normalizeText(
              formData.address,
              MAX_ADDRESS_LENGTH
            )
          : '';

      const notes = normalizeText(
        formData.notes,
        MAX_NOTES_LENGTH
      );

      const items = cartItems.map((item) => ({
        productId: String(item.product.id),

        name: normalizeText(
          item.product.nameAr,
          200
        ),

        price: Number(item.product.price),

        quantity: getSafeQuantity(
          item.quantity
        ),

        options:
          item.options &&
          typeof item.options === 'object'
            ? item.options
            : {},
      }));

      /*
       * =========================
       * Tracking token
       * =========================
       *
       * Used only to connect:
       *
       * orders
       *      ↓
       * orderTracking
       *
       * It is NOT the order number.
       */

      const trackingToken =
        createTrackingToken();

      /*
       * =========================
       * Private order reference
       * =========================
       */

      const orderRef = doc(
        collection(db, 'orders')
      );

      /*
       * =========================
       * Sequential order number
       * =========================
       *
       * Admin only.
       */

      const counterRef = doc(
        db,
        'counters',
        'orderNumber'
      );

      const orderNumber =
        await runTransaction(
          db,
          async (transaction) => {
            const counterSnap =
              await transaction.get(
                counterRef
              );

            let currentValue = 0;

            if (counterSnap.exists()) {
              const storedValue = Number(
                counterSnap.data()?.value
              );

              if (
                Number.isFinite(storedValue) &&
                storedValue >= 0
              ) {
                currentValue =
                  Math.floor(storedValue);
              }
            }

            const nextNumber =
              currentValue + 1;

            transaction.set(
              counterRef,
              {
                value: nextNumber,
                updatedAt:
                  serverTimestamp(),
              },
              {
                merge: true,
              }
            );

            return nextNumber;
          }
        );

      /*
       * =========================
       * Order data
       * =========================
       */

      const orderData = {
        /*
         * Admin-only sequential number.
         */
        orderNumber,

        /*
         * Internal connection between the
         * private order and public tracking.
         *
         * This is NOT shown in the UI.
         */
        trackingToken,

        customer: {
          name,
          phone,
          address,
          notes,
        },

        deliveryType,

        items,

        subtotal: total,

        deliveryFee,

        total: grandTotal,

        status: 'new',

        payment: {
          method: paymentMethod,

          transactionId:
            paymentMethod === 'vodafone_cash'
              ? normalizeText(
                  transactionId,
                  MAX_TRANSACTION_ID_LENGTH
                )
              : '',

          status:
            paymentMethod === 'vodafone_cash'
              ? 'pending'
              : 'cash_on_delivery',
        },

        orderMethod,

        createdAt:
          serverTimestamp(),
      };

      /*
       * =========================
       * Create private order
       * =========================
       */

      await setDoc(
        orderRef,
        orderData
      );

      /*
       * =========================
       * Create tracking document
       * =========================
       *
       * Customer sees only the status.
       * No order number is stored here.
       */

      await setDoc(
        doc(
          db,
          'orderTracking',
          trackingToken
        ),
        {
          status: 'new',
          deliveryType,
          total: grandTotal,
        }
      );

      /*
       * =========================
       * Website order
       * =========================
       */

      if (orderMethod === 'website') {
        clearCart();

        navigate(
          `/track-order?token=${encodeURIComponent(
            trackingToken
          )}`,
          {
            replace: true,
          }
        );

        return;
      }

      /*
       * =========================
       * WhatsApp order
       * =========================
       */

      const message =
        buildWhatsAppMessage({
          items,
          name,
          phone,
          address,
          notes,
          subtotal: total,
          calculatedDeliveryFee:
            deliveryFee,
          calculatedGrandTotal:
            grandTotal,
          trackingToken,
        });

      const whatsappUrl =
        `https://wa.me/${WHATSAPP_PHONE}?text=` +
        encodeURIComponent(message);

      clearCart();

      window.location.href =
        whatsappUrl;

    } catch (error) {
      console.error(
        'Order creation failed:',
        error?.code,
        error?.message
      );

      alert(
        'حدث خطأ أثناء إرسال الطلب. تأكد من اتصال الإنترنت وحاول مرة أخرى.'
      );

      submissionLock.current = false;
      setIsSubmitting(false);
    }
  };

  /*
   * =========================
   * Empty cart
   * =========================
   */

  if (cartItems.length === 0) {
    return (
      <main
        className="min-h-screen pt-28 pb-16
                   bg-[#FFF8F3] text-right"
        dir="rtl"
      >
        <div
          className="max-w-md mx-auto text-center p-8
                     bg-white rounded-3xl
                     border border-orange-100
                     shadow-sm"
        >
          <span
            className="text-5xl"
            aria-hidden="true"
          >
            🍩
          </span>

          <h2
            className="text-2xl font-black
                       text-[#3D2314]
                       mt-4 mb-2"
          >
            لا يوجد منتجات لإتمام الطلب
          </h2>

          <p className="text-gray-500 text-sm mb-6">
            يرجى إضافة بعض المنتجات لسلتك أولاً
          </p>

          <Link
            to="/menu"
            className="bg-[#FF6600] text-white
                       px-8 py-3 rounded-full
                       font-black text-sm
                       shadow-md inline-block
                       hover:opacity-90 transition"
          >
            الذهاب للقائمة
          </Link>
        </div>
      </main>
    );
  }

  /*
   * =========================
   * Checkout UI
   * =========================
   */

  return (
    <main
      className="min-h-screen pt-28 pb-16
                 bg-[#FFF8F3] text-right"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        <h1
          className="text-3xl font-black
                     text-[#3D2314] mb-6"
        >
          إتمام الطلب 🚀
        </h1>

        <div
          className="grid grid-cols-1
                     md:grid-cols-5 gap-6"
        >

          {/* Form */}

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="md:col-span-3
                       bg-white p-6 rounded-3xl
                       border border-orange-100
                       shadow-sm space-y-4"
          >

            <h2
              className="text-lg font-extrabold
                         text-[#3D2314] mb-2"
            >
              بيانات الاستلام
            </h2>

            {/* Name */}

            <div>
              <label
                htmlFor="checkout-name"
                className="block text-xs
                           font-black text-[#3D2314]
                           mb-1"
              >
                الاسم بالكامل *
              </label>

              <input
                id="checkout-name"
                type="text"
                name="name"
                required
                maxLength={MAX_NAME_LENGTH}
                value={formData.name}
                onChange={handleChange}
                autoComplete="name"
                placeholder="أدخل اسمك"
                className="w-full px-4 py-3
                           rounded-2xl
                           bg-[#FFF8F3]
                           border border-orange-100
                           text-sm
                           focus:outline-none
                           focus:border-[#FF6600]"
              />
            </div>

            {/* Phone */}

            <div>
              <label
                htmlFor="checkout-phone"
                className="block text-xs
                           font-black text-[#3D2314]
                           mb-1"
              >
                رقم الهاتف (واتساب) *
              </label>

              <input
                id="checkout-phone"
                type="tel"
                name="phone"
                required
                maxLength={MAX_PHONE_LENGTH}
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                inputMode="tel"
                placeholder="01000000000"
                className="w-full px-4 py-3
                           rounded-2xl
                           bg-[#FFF8F3]
                           border border-orange-100
                           text-sm
                           focus:outline-none
                           focus:border-[#FF6600]"
              />
            </div>

            {/* Address */}

            {deliveryType === 'delivery' && (
              <div>
                <label
                  htmlFor="checkout-address"
                  className="block text-xs
                             font-black
                             text-[#3D2314] mb-1"
                >
                  عنوان التوصيل التفصيلي *
                </label>

                <textarea
                  id="checkout-address"
                  name="address"
                  required
                  maxLength={MAX_ADDRESS_LENGTH}
                  rows="2"
                  value={formData.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                  placeholder="المدينة، الشارع، رقم العمارة والشقة"
                  className="w-full px-4 py-3
                             rounded-2xl
                             bg-[#FFF8F3]
                             border border-orange-100
                             text-sm
                             focus:outline-none
                             focus:border-[#FF6600]"
                />
              </div>
            )}

            {/* Notes */}

            <div>
              <label
                htmlFor="checkout-notes"
                className="block text-xs
                           font-black
                           text-[#3D2314] mb-1"
              >
                ملاحظات إضافية (اختياري)
              </label>

              <input
                id="checkout-notes"
                type="text"
                name="notes"
                maxLength={MAX_NOTES_LENGTH}
                value={formData.notes}
                onChange={handleChange}
                placeholder="مثال: بدون سكر، الاتصال عند الوصول..."
                className="w-full px-4 py-3
                           rounded-2xl
                           bg-[#FFF8F3]
                           border border-orange-100
                           text-sm
                           focus:outline-none
                           focus:border-[#FF6600]"
              />
            </div>

            {/* Payment */}

            <div className="mt-5">

              <label
                className="block text-xs
                           font-black
                           text-[#3D2314] mb-2"
              >
                طريقة الدفع
              </label>

              <div className="space-y-3">

                {/* Cash */}

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod('cash')
                  }
                  disabled={isSubmitting}
                  className={`w-full p-4
                              rounded-2xl border
                              text-right
                              transition-all ${
                                paymentMethod === 'cash'
                                  ? 'border-[#FF6600] bg-orange-50'
                                  : 'border-orange-100 bg-white'
                              }`}
                >
                  <div className="font-black text-[#3D2314]">
                    💵 الدفع عند الاستلام
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    ادفع عند استلام الطلب
                  </div>
                </button>

                {/* Vodafone */}

                <button
                  type="button"
                  onClick={() =>
                    setPaymentMethod(
                      'vodafone_cash'
                    )
                  }
                  disabled={isSubmitting}
                  className={`w-full p-4
                              rounded-2xl border
                              text-right
                              transition-all ${
                                paymentMethod ===
                                'vodafone_cash'
                                  ? 'border-[#E60000] bg-red-50'
                                  : 'border-orange-100 bg-white'
                              }`}
                >
                  <div className="font-black text-[#3D2314]">
                    📱 Vodafone Cash
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    ادفع مقدمًا عن طريق Vodafone Cash
                  </div>
                </button>

              </div>
            </div>

            {/* Vodafone Details */}

            {paymentMethod ===
              'vodafone_cash' && (
              <div
                className="mt-3 p-4
                           rounded-2xl
                           bg-red-50
                           border border-red-100"
              >

                <div
                  className="font-black
                             text-[#3D2314] mb-2"
                >
                  📱 الدفع عن طريق Vodafone Cash
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  قم بتحويل مبلغ:
                </p>

                <div
                  className="text-xl font-black
                             text-[#FF6600] mb-3"
                >
                  {grandTotal} ج.م
                </div>

                <p className="text-sm text-gray-600">
                  إلى رقم Vodafone Cash:
                </p>

                <div
                  dir="ltr"
                  className="text-lg font-black
                             text-[#3D2314]
                             mt-1 mb-4"
                >
                  {VODAFONE_CASH_PHONE}
                </div>

                <label
                  htmlFor="transaction-id"
                  className="block text-xs
                             font-black
                             text-[#3D2314] mb-1"
                >
                  رقم العملية بعد التحويل *
                </label>

                <input
                  id="transaction-id"
                  type="text"
                  value={transactionId}
                  maxLength={
                    MAX_TRANSACTION_ID_LENGTH
                  }
                  onChange={(e) =>
                    setTransactionId(
                      e.target.value
                    )
                  }
                  placeholder="أدخل رقم العملية"
                  required={
                    paymentMethod ===
                    'vodafone_cash'
                  }
                  disabled={isSubmitting}
                  className="w-full px-4 py-3
                             rounded-2xl
                             bg-white
                             border border-red-100
                             text-sm
                             focus:outline-none
                             focus:border-[#FF6600]"
                />

                <p className="text-[11px] text-gray-500 mt-2">
                  بعد التحويل، اكتب رقم العملية حتى نتمكن من مراجعة الدفع.
                </p>

              </div>
            )}

            {/* Order Buttons */}

            <div className="space-y-3 mt-4">

              {/* Website */}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setOrderMethod('website');

                  requestAnimationFrame(() => {
                    formRef.current?.requestSubmit();
                  });
                }}
                className={`w-full
                            text-white py-4
                            rounded-full
                            font-black text-base
                            shadow-lg
                            transition-all
                            active:scale-95 ${
                              isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#FF6600] hover:bg-orange-600'
                            }`}
              >
                🛒 طلب من الموقع
              </button>

              {/* WhatsApp */}

              <button
                type="submit"
                disabled={isSubmitting}
                onClick={() =>
                  setOrderMethod('whatsapp')
                }
                className={`w-full
                            text-white py-4
                            rounded-full
                            font-black text-base
                            shadow-lg
                            transition-all
                            flex items-center
                            justify-center gap-2 ${
                              isSubmitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#27AE60] hover:bg-[#219653] active:scale-95'
                            }`}
              >
                <span>
                  {isSubmitting
                    ? 'جاري إرسال الطلب...'
                    : 'إرسال الطلب عبر واتساب 💬'}
                </span>
              </button>

            </div>

          </form>

          {/* Order Summary */}

          <div
            className="md:col-span-2
                       bg-white p-6 rounded-3xl
                       border border-orange-100
                       shadow-sm h-fit space-y-4"
          >

            <h2
              className="text-lg font-extrabold
                         text-[#3D2314]
                         border-b border-orange-50
                         pb-2"
            >
              ملخص الحساب
            </h2>

            <div
              className="space-y-2
                         text-xs font-bold
                         text-gray-600"
            >

              <div className="flex justify-between">
                <span>المشتريات:</span>

                <span
                  className="text-[#3D2314]
                             font-black"
                >
                  {total} ج.م
                </span>
              </div>

              <div className="flex justify-between">
                <span>التوصيل:</span>

                <span
                  className="text-[#3D2314]
                             font-black"
                >
                  {deliveryType === 'delivery'
                    ? deliveryFee === 0
                      ? 'مجاني'
                      : `${deliveryFee} ج.م`
                    : 'مجاني'}
                </span>
              </div>

              {deliveryType === 'delivery' &&
                total < FREE_DELIVERY_LIMIT && (
                  <p className="text-[11px] text-gray-500 pt-1">
                    التوصيل يصبح مجانيًا عند الوصول إلى{' '}
                    {FREE_DELIVERY_LIMIT} ج.م.
                  </p>
                )}

            </div>

            <div
              className="border-t border-orange-100
                         pt-3 flex justify-between
                         items-center"
            >

              <span
                className="font-extrabold
                           text-sm text-[#3D2314]"
              >
                الإجمالي:
              </span>

              <span
                className="text-xl font-black
                           text-[#FF6600]"
              >
                {grandTotal} ج.م
              </span>

            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
