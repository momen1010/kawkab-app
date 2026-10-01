import { useState } from 'react';

import { migrateProducts } from '../utils/migrateProducts';

export default function ProductMigration() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMigration = async () => {
    try {
      setLoading(true);
      setStatus('');

      const result =
        await migrateProducts();

      setStatus(
        `تم نقل ${result.count} منتج بنجاح إلى Firestore.`
      );
    } catch (error) {
      console.error(
        'Product migration failed:',
        error
      );

      setStatus(
        error?.message ||
          'حدث خطأ أثناء نقل المنتجات.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="mx-auto max-w-2xl"
    >
      <div className="rounded-3xl border border-orange-100 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-bold text-[#FF6600]">
          أدوات الإدارة
        </p>

        <h1 className="text-3xl font-black text-[#3D2314]">
          نقل المنتجات إلى Firebase
        </h1>

        <p className="mt-4 leading-8 text-gray-600">
          سيتم نقل المنتجات الموجودة حاليًا في
          <code className="mx-1 rounded bg-gray-100 px-2 py-1">
            products.js
          </code>
          إلى مجموعة
          <code className="mx-1 rounded bg-gray-100 px-2 py-1">
            products
          </code>
          في Firestore.
        </p>

        <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-sm leading-7 text-orange-800">
          <p className="font-black">
            ملاحظة:
          </p>

          <p>
            نفس IDs الحالية سيتم استخدامها،
            وتشغيل العملية مرة أخرى لن ينشئ
            منتجات مكررة.
          </p>
        </div>

        <button
          type="button"
          onClick={handleMigration}
          disabled={loading}
          className="mt-6 rounded-xl bg-[#FF6600] px-6 py-3 font-black text-white transition hover:bg-[#3D2314] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? 'جاري نقل المنتجات...'
            : 'نقل المنتجات إلى Firestore'}
        </button>

        {status && (
          <div className="mt-5 rounded-2xl bg-gray-50 p-4 font-bold text-[#3D2314]">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}