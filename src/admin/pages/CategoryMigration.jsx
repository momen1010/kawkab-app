import { useState } from 'react';

import { migrateCategories } from '../utils/migrateCategories';

export default function CategoryMigration() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleMigration = async () => {
    try {
      setLoading(true);
      setMessage('');
      setError('');

      const result = await migrateCategories();

      setMessage(
        `تم نقل ${result.count} تصنيفات إلى Firestore بنجاح.`
      );
    } catch (migrationError) {
      console.error('Category migration failed:', migrationError);

      setError(
        migrationError?.message ||
          'حدث خطأ أثناء نقل التصنيفات.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-orange-100">
        <h1 className="text-2xl font-black text-[#3D2314]">
          نقل التصنيفات إلى Firestore
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          هذه العملية تنقل التصنيفات الحالية من ملف products.js
          إلى مجموعة categories في Firestore.
        </p>

        <button
          type="button"
          onClick={handleMigration}
          disabled={loading}
          className="mt-6 rounded-xl bg-[#FF6600] px-6 py-3 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'جاري النقل...' : 'نقل التصنيفات'}
        </button>

        {message && (
          <div className="mt-4 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}