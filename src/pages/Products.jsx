import { useMemo, useState } from 'react';

import { useAdminData } from '../context/AdminDataContext';

export default function Products() {
  const {
    products,
    productsLoading,
    productsError,
  } = useAdminData();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];

    return uniqueCategories;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === 'all' ||
        product.category === category;

      if (!normalizedSearch) {
        return matchesCategory;
      }

      const searchableText = [
        product.name,
        product.nameAr,
        product.description,
        product.descriptionAr,
        product.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesCategory &&
        searchableText.includes(
          normalizedSearch
        )
      );
    });
  }, [products, search, category]);

  if (productsLoading) {
    return (
      <section dir="rtl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold text-[#FF6600]">
            إدارة المنتجات
          </p>

          <h1 className="text-3xl font-black text-[#3D2314]">
            المنتجات
          </h1>
        </div>

        <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-[#FF6600]" />

          <p className="font-bold text-[#3D2314]/70">
            جاري تحميل المنتجات...
          </p>
        </div>
      </section>
    );
  }

  if (productsError) {
    return (
      <section dir="rtl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold text-[#FF6600]">
            إدارة المنتجات
          </p>

          <h1 className="text-3xl font-black text-[#3D2314]">
            المنتجات
          </h1>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-black text-red-700">
            تعذر تحميل المنتجات
          </p>

          <p className="mt-2 text-sm leading-7 text-red-600">
            {productsError}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section dir="rtl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-bold text-[#FF6600]">
            إدارة المنتجات
          </p>

          <h1 className="text-3xl font-black text-[#3D2314]">
            المنتجات
          </h1>

          <p className="mt-2 text-sm text-[#3D2314]/60">
            إدارة ومراجعة المنتجات الموجودة في
            قائمة كوكب السعادة.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-[#3D2314]/10">
          <span className="text-sm text-[#3D2314]/60">
            إجمالي المنتجات
          </span>

          <span className="mr-3 text-xl font-black text-[#FF6600]">
            {products.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-3xl border border-[#3D2314]/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث باسم المنتج..."
              className="w-full rounded-2xl border border-[#3D2314]/10 bg-[#FFF8F3] py-3 pr-11 pl-4 text-sm font-medium outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
            />
          </div>

          {/* Category */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-xl">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`
                shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition
                ${
                  category === 'all'
                    ? 'bg-[#FF6600] text-white'
                    : 'bg-[#FFF8F3] text-[#3D2314]/70 hover:bg-orange-50'
                }
              `}
            >
              الكل
            </button>

            {categories.map(
              (currentCategory) => (
                <button
                  key={currentCategory}
                  type="button"
                  onClick={() =>
                    setCategory(currentCategory)
                  }
                  className={`
                    shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition
                    ${
                      category ===
                      currentCategory
                        ? 'bg-[#FF6600] text-white'
                        : 'bg-[#FFF8F3] text-[#3D2314]/70 hover:bg-orange-50'
                    }
                  `}
                >
                  {currentCategory}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-[#3D2314]/60">
          عرض {filteredProducts.length} من{' '}
          {products.length} منتج
        </p>

        {(search || category !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
            className="text-sm font-bold text-[#FF6600] hover:underline"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Empty */}
      {filteredProducts.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#3D2314]/20 bg-white p-12 text-center">
          <div className="mb-4 text-5xl">
            🧇
          </div>

          <h2 className="text-xl font-black text-[#3D2314]">
            لا توجد منتجات
          </h2>

          <p className="mt-2 text-sm text-[#3D2314]/60">
            لم نجد منتجات مطابقة للبحث أو
            التصنيف المحدد.
          </p>
        </div>
      )}

      {/* Products */}
      {filteredProducts.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map(
            (product) => (
              <article
                key={product.id}
                className="overflow-hidden rounded-3xl border border-[#3D2314]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-[#FFF8F3]">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={
                        product.nameAr ||
                        product.name ||
                        'منتج'
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">
                      🧇
                    </div>
                  )}

                  <div className="absolute right-3 top-3">
                    <span
                      className={`
                        rounded-full px-3 py-1.5 text-xs font-black shadow-sm
                        ${
                          product.isAvailable ===
                          false
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }
                      `}
                    >
                      {product.isAvailable ===
                      false
                        ? 'غير متوفر'
                        : 'متوفر'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-black text-[#3D2314]">
                        {product.nameAr ||
                          product.name ||
                          'بدون اسم'}
                      </h2>

                      {product.name &&
                        product.nameAr &&
                        product.name !==
                          product.nameAr && (
                          <p className="mt-1 text-xs text-[#3D2314]/40">
                            {product.name}
                          </p>
                        )}
                    </div>

                    <span className="shrink-0 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#FF6600]">
                      {product.category ||
                        'بدون تصنيف'}
                    </span>
                  </div>

                  <p className="min-h-10 text-sm leading-6 text-[#3D2314]/60">
                    {product.descriptionAr ||
                      product.description ||
                      'لا يوجد وصف'}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-[#3D2314]/10 pt-4">
                    <span className="text-xl font-black text-[#FF6600]">
                      {Number(
                        product.price || 0
                      ).toLocaleString('ar-EG')}{' '}
                      <span className="text-sm">
                        ج.م
                      </span>
                    </span>

                    <span className="text-xs font-medium text-[#3D2314]/40">
                      ترتيب #{product.sortOrder ?? '-'}
                    </span>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}