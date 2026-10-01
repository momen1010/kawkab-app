import { useMemo, useState } from 'react';

import { useAdminData } from '../context/AdminDataContext';

const EMPTY_FORM = {
  name: '',
  nameAr: '',
  icon: '',
  sortOrder: '',
  isActive: true,
};

export default function Categories() {
  const {
    categories,
    categoriesLoading,
    categoriesError,
    categoryActionLoading,
    createCategory,
    updateCategory,
    toggleCategory,
    deleteCategory,
  } = useAdminData();

  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [formError, setFormError] = useState('');

  const [deleteLoadingId, setDeleteLoadingId] =
    useState(null);

  const filteredCategories = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return categories;
    }

    return categories.filter((category) => {
      const searchableText = [
        category.id,
        category.name,
        category.nameAr,
        category.icon,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [categories, search]);

  const openCreateModal = () => {
    setEditingCategory(null);

    setForm({
      ...EMPTY_FORM,
      sortOrder: String(
        categories.length + 1
      ),
    });

    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);

    setForm({
      name: category.name || '',
      nameAr: category.nameAr || '',
      icon: category.icon || '',
      sortOrder:
        category.sortOrder !== undefined &&
        category.sortOrder !== null
          ? String(category.sortOrder)
          : '',
      isActive:
        category.isActive !== false,
    });

    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (categoryActionLoading) {
      return;
    }

    setModalOpen(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setFormError('');

    if (!form.nameAr.trim()) {
      setFormError(
        'اسم التصنيف بالعربي مطلوب.'
      );
      return;
    }

    const sortOrder = Number(
      form.sortOrder
    );

    if (
      !Number.isFinite(sortOrder) ||
      sortOrder < 0
    ) {
      setFormError(
        'أدخل ترتيبًا صحيحًا.'
      );
      return;
    }

    const categoryData = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      icon: form.icon.trim(),
      sortOrder,
      isActive: form.isActive,
    };

    try {
      if (editingCategory) {
        await updateCategory(
          editingCategory.id,
          categoryData
        );
      } else {
        await createCategory(
          categoryData
        );
      }

      closeModal();
    } catch (error) {
      console.error(
        'Category save failed:',
        error
      );

      setFormError(
        error?.message ||
          'حدث خطأ أثناء حفظ التصنيف.'
      );
    }
  };

  const handleToggle = async (category) => {
    try {
      await toggleCategory(
        category.id,
        category.isActive === false
      );
    } catch (error) {
      console.error(
        'Category availability update failed:',
        error
      );

      window.alert(
        error?.message ||
          'تعذر تغيير حالة التصنيف.'
      );
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف "${category.nameAr || category.name}"؟\n\nتأكد أن هذا التصنيف غير مستخدم بواسطة منتجات قبل الحذف.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(category.id);

      await deleteCategory(category.id);
    } catch (error) {
      console.error(
        'Category deletion failed:',
        error
      );

      window.alert(
        error?.message ||
          'تعذر حذف التصنيف.'
      );
    } finally {
      setDeleteLoadingId(null);
    }
  };

  if (categoriesLoading) {
    return (
      <section dir="rtl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold text-[#FF6600]">
            إدارة القائمة
          </p>

          <h1 className="text-3xl font-black text-[#3D2314]">
            التصنيفات
          </h1>
        </div>

        <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-[#FF6600]" />

          <p className="font-bold text-[#3D2314]/70">
            جاري تحميل التصنيفات...
          </p>
        </div>
      </section>
    );
  }

  if (categoriesError) {
    return (
      <section dir="rtl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold text-[#FF6600]">
            إدارة القائمة
          </p>

          <h1 className="text-3xl font-black text-[#3D2314]">
            التصنيفات
          </h1>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-black text-red-700">
            تعذر تحميل التصنيفات
          </p>

          <p className="mt-2 text-sm leading-7 text-red-600">
            {categoriesError}
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
            إدارة القائمة
          </p>

          <h1 className="text-3xl font-black text-[#3D2314]">
            التصنيفات
          </h1>

          <p className="mt-2 text-sm text-[#3D2314]/60">
            إضافة وتعديل وتنظيم تصنيفات قائمة كوكب
            السعادة.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-2xl bg-[#FF6600] px-6 py-3 font-black text-white shadow-sm transition hover:bg-[#3D2314]"
        >
          + إضافة تصنيف
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 rounded-3xl border border-[#3D2314]/10 bg-white p-4 shadow-sm">
        <div className="relative">
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg">
            🔎
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث باسم التصنيف..."
            className="w-full rounded-2xl border border-[#3D2314]/10 bg-[#FFF8F3] py-3 pr-11 pl-4 text-sm font-medium outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
          />
        </div>
      </div>

      {/* Result count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-[#3D2314]/60">
          عرض {filteredCategories.length} من{' '}
          {categories.length} تصنيف
        </p>

        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-sm font-bold text-[#FF6600] hover:underline"
          >
            مسح البحث
          </button>
        )}
      </div>

      {/* Empty */}
      {filteredCategories.length === 0 && (
        <div className="rounded-3xl border border-dashed border-[#3D2314]/20 bg-white p-12 text-center">
          <div className="mb-4 text-5xl">
            🗂️
          </div>

          <h2 className="text-xl font-black text-[#3D2314]">
            لا توجد تصنيفات
          </h2>

          <p className="mt-2 text-sm text-[#3D2314]/60">
            لم نجد تصنيفات مطابقة للبحث.
          </p>
        </div>
      )}

      {/* Categories */}
      {filteredCategories.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredCategories.map(
            (category) => {
              const isDeleting =
                deleteLoadingId ===
                category.id;

              const isActive =
                category.isActive !== false;

              return (
                <article
                  key={category.id}
                  className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                        {category.icon || '🗂️'}
                      </div>

                      <div>
                        <h2 className="font-black text-[#3D2314]">
                          {category.nameAr ||
                            category.name ||
                            'بدون اسم'}
                        </h2>

                        {category.name &&
                          category.nameAr &&
                          category.name !==
                            category.nameAr && (
                            <p className="mt-1 text-xs text-[#3D2314]/40">
                              {category.name}
                            </p>
                          )}
                      </div>
                    </div>

                    <span
                      className={`
                        rounded-full px-3 py-1.5 text-xs font-black
                        ${
                          isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }
                      `}
                    >
                      {isActive
                        ? 'نشط'
                        : 'متوقف'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#FFF8F3] p-3">
                      <p className="text-xs font-bold text-[#3D2314]/40">
                        المعرف
                      </p>

                      <p
                        dir="ltr"
                        className="mt-1 truncate text-sm font-black text-[#3D2314]"
                      >
                        {category.id}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#FFF8F3] p-3">
                      <p className="text-xs font-bold text-[#3D2314]/40">
                        الترتيب
                      </p>

                      <p className="mt-1 text-sm font-black text-[#3D2314]">
                        #{category.sortOrder ?? '-'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(
                          category
                        )
                      }
                      className="rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-black text-[#FF6600] transition hover:bg-orange-100"
                    >
                      تعديل
                    </button>

                    <button
                      type="button"
                      disabled={
                        categoryActionLoading
                      }
                      onClick={() =>
                        handleToggle(
                          category
                        )
                      }
                      className={`
                        rounded-xl px-3 py-2.5 text-sm font-black transition
                        ${
                          isActive
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }
                      `}
                    >
                      {isActive
                        ? 'إيقاف'
                        : 'تفعيل'}
                    </button>

                    <button
                      type="button"
                      disabled={
                        isDeleting ||
                        categoryActionLoading
                      }
                      onClick={() =>
                        handleDelete(
                          category
                        )
                      }
                      className="rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-black text-gray-700 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDeleting
                        ? '...'
                        : 'حذف'}
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {/* Category Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#3D2314]/10 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-bold text-[#FF6600]">
                  إدارة القائمة
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#3D2314]">
                  {editingCategory
                    ? 'تعديل التصنيف'
                    : 'إضافة تصنيف جديد'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  categoryActionLoading
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xl font-bold text-gray-600 transition hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 p-6"
            >
              {formError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-7 text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                {/* Arabic Name */}
                <div>
                  <label
                    htmlFor="category-nameAr"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    اسم التصنيف بالعربي *
                  </label>

                  <input
                    id="category-nameAr"
                    name="nameAr"
                    type="text"
                    value={form.nameAr}
                    onChange={handleChange}
                    placeholder="مثال: القهوة"
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* English Name */}
                <div>
                  <label
                    htmlFor="category-name"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    اسم التصنيف بالإنجليزي
                  </label>

                  <input
                    id="category-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Example: Coffee"
                    dir="ltr"
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 text-left outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* Icon */}
                <div>
                  <label
                    htmlFor="category-icon"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    الأيقونة
                  </label>

                  <input
                    id="category-icon"
                    name="icon"
                    type="text"
                    value={form.icon}
                    onChange={handleChange}
                    placeholder="☕"
                    maxLength={10}
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 text-2xl outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* Sort Order */}
                <div>
                  <label
                    htmlFor="category-sortOrder"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    ترتيب التصنيف *
                  </label>

                  <input
                    id="category-sortOrder"
                    name="sortOrder"
                    type="number"
                    min="0"
                    step="1"
                    value={form.sortOrder}
                    onChange={handleChange}
                    placeholder="1"
                    dir="ltr"
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 text-left outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* Active */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 md:col-span-2">
                  <input
                    name="isActive"
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={handleChange}
                    className="h-5 w-5 accent-[#FF6600]"
                  />

                  <span>
                    <span className="block font-black text-[#3D2314]">
                      التصنيف نشط
                    </span>

                    <span className="text-xs text-[#3D2314]/50">
                      يظهر التصنيف للعملاء في القائمة.
                    </span>
                  </span>
                </label>
              </div>

              {/* ID Info */}
              {editingCategory && (
                <div className="rounded-2xl bg-[#FFF8F3] p-4">
                  <p className="text-xs font-bold text-[#3D2314]/40">
                    معرف التصنيف — لا يتم تغييره
                  </p>

                  <p
                    dir="ltr"
                    className="mt-1 text-sm font-black text-[#3D2314]"
                  >
                    {editingCategory.id}
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#3D2314]/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    categoryActionLoading
                  }
                  className="rounded-xl bg-gray-100 px-6 py-3 font-black text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={
                    categoryActionLoading
                  }
                  className="rounded-xl bg-[#FF6600] px-6 py-3 font-black text-white transition hover:bg-[#3D2314] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {categoryActionLoading
                    ? 'جاري الحفظ...'
                    : editingCategory
                      ? 'حفظ التعديلات'
                      : 'إضافة التصنيف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}