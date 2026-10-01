import { useEffect, useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';

const initialForm = {
  restaurantName: '',
  whatsappNumber: '',
  vodafoneCashNumber: '',
  deliveryFee: 20,
  freeDeliveryLimit: 150,
  ordersEnabled: true,
  closedMessage: '',
};

export default function Settings() {
  const {
    settings,
    settingsLoading,
    settingsError,
    settingsActionLoading,
    updateSettings,
  } = useAdminData();

  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!settings) return;

    setForm({
      restaurantName: settings.restaurantName ?? '',
      whatsappNumber: settings.whatsappNumber ?? '',
      vodafoneCashNumber: settings.vodafoneCashNumber ?? '',
      deliveryFee: settings.deliveryFee ?? 20,
      freeDeliveryLimit: settings.freeDeliveryLimit ?? 150,
      ordersEnabled: settings.ordersEnabled !== false,
      closedMessage:
        settings.closedMessage ??
        'نعتذر، استقبال الطلبات مغلق حاليًا.',
    });
  }, [settings]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    try {
      await updateSettings({
        ...form,
        deliveryFee: Number(form.deliveryFee),
        freeDeliveryLimit: Number(form.freeDeliveryLimit),
      });

      setMessage('تم حفظ الإعدادات بنجاح.');
    } catch (error) {
      setMessage(
        error?.message || 'حدث خطأ أثناء حفظ الإعدادات.'
      );
    }
  };

  if (settingsLoading) {
    return (
      <div className="p-6 text-right" dir="rtl">
        <h1 className="mb-2 text-2xl font-bold text-[#3D2314]">
          الإعدادات
        </h1>
        <p className="text-gray-500">
          جاري تحميل الإعدادات...
        </p>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="p-6 text-right" dir="rtl">
        <h1 className="mb-3 text-2xl font-bold text-[#3D2314]">
          الإعدادات
        </h1>

        <div className="rounded-xl bg-red-50 p-4 text-red-700">
          {settingsError}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 text-right sm:p-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#3D2314]">
          إعدادات المطعم
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          إدارة بيانات المطعم والتوصيل واستقبال الطلبات.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-4xl space-y-6"
      >
        {/* بيانات المطعم */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-[#3D2314]">
            بيانات المطعم
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="اسم المطعم"
              name="restaurantName"
              value={form.restaurantName}
              onChange={handleChange}
              placeholder="كوكب السعادة"
            />

            <Field
              label="رقم WhatsApp"
              name="whatsappNumber"
              value={form.whatsappNumber}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              type="tel"
            />

            <Field
              label="رقم Vodafone Cash"
              name="vodafoneCashNumber"
              value={form.vodafoneCashNumber}
              onChange={handleChange}
              placeholder="01xxxxxxxxx"
              type="tel"
            />
          </div>
        </section>

        {/* التوصيل */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-[#3D2314]">
            إعدادات التوصيل
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="رسوم التوصيل"
              name="deliveryFee"
              value={form.deliveryFee}
              onChange={handleChange}
              type="number"
              min="0"
              suffix="جنيه"
            />

            <Field
              label="حد التوصيل المجاني"
              name="freeDeliveryLimit"
              value={form.freeDeliveryLimit}
              onChange={handleChange}
              type="number"
              min="0"
              suffix="جنيه"
            />
          </div>
        </section>

        {/* الطلبات */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-[#3D2314]">
            استقبال الطلبات
          </h2>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
            <div>
              <p className="font-semibold text-[#3D2314]">
                استقبال الطلبات
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {form.ordersEnabled
                  ? 'الموقع يسمح للعملاء بإرسال طلبات جديدة.'
                  : 'تم إيقاف استقبال الطلبات من الموقع.'}
              </p>
            </div>

            <input
              type="checkbox"
              name="ordersEnabled"
              checked={form.ordersEnabled}
              onChange={handleChange}
              className="h-5 w-5 accent-[#FF6600]"
            />
          </label>

          {!form.ordersEnabled && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-[#3D2314]">
                رسالة إغلاق الطلبات
              </label>

              <textarea
                name="closedMessage"
                value={form.closedMessage}
                onChange={handleChange}
                rows={3}
                placeholder="نعتذر، استقبال الطلبات مغلق حاليًا."
                className="w-full rounded-xl border border-gray-200 p-3 outline-none transition focus:border-[#FF6600]"
              />
            </div>
          )}
        </section>

        {/* رسالة */}
        {message && (
          <div
            className={`rounded-xl p-4 ${
              message.includes('بنجاح')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* حفظ */}
        <button
          type="submit"
          disabled={settingsActionLoading}
          className="rounded-xl bg-[#FF6600] px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {settingsActionLoading
            ? 'جاري الحفظ...'
            : 'حفظ الإعدادات'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  suffix,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#3D2314]">
        {label}
      </label>

      <div className="relative">
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          className={`w-full rounded-xl border border-gray-200 p-3 outline-none transition focus:border-[#FF6600] ${
            suffix ? 'pl-16' : ''
          }`}
        />

        {suffix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}