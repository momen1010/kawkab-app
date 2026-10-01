import { useMemo, useState } from 'react';

import { useAdminData } from '../context/AdminDataContext';

const EMPTY_FORM = {
  name: '',
  nameAr: '',
  description: '',
  descriptionAr: '',
  price: '',
  category: '',
  image: '',
  isAvailable: true,
  sortOrder: '',
};

export default function Products() {
  const {
    products,
    productsLoading,
    productsError,
    productActionLoading,
    createProduct,
    updateProduct,
    toggleProductAvailability,
    deleteProduct,

    // Categories from Firestore
    categories,
    categoriesLoading,
  } = useAdminData();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [formError, setFormError] =
    useState('');

  const [deleteLoadingId, setDeleteLoadingId] =
    useState(null);

  /*
   * Active categories are the categories
   * that can be selected for products.
   *
   * We keep all categories available for
   * filtering because existing products may
   * still reference an inactive category.
   */
  const allCategories = useMemo(() => {
    return [...categories].sort(
      (a, b) =>
        Number(a.sortOrder ?? 0) -
        Number(b.sortOrder ?? 0)
    );
  }, [categories]);

  const activeCategories = useMemo(() => {
    return allCategories.filter(
      (currentCategory) =>
        currentCategory.isActive !== false
    );
  }, [allCategories]);

  /*
   * Category IDs already used by products.
   *
   * This is only used to keep an existing
   * inactive category selectable while editing
   * a product that already belongs to it.
   */
  const usedCategoryIds = useMemo(() => {
    return new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
    );
  }, [products]);

  const selectableCategories = useMemo(() => {
    return allCategories.filter(
      (currentCategory) =>
        currentCategory.isActive !== false ||
        currentCategory.id === form.category
    );
  }, [allCategories, form.category]);

  /*
   * Categories used by existing products but
   * not found in Firestore.
   *
   * This protects old/broken data from becoming
   * impossible to filter or edit.
   */
  const missingCategories = useMemo(() => {
    const knownCategoryIds = new Set(
      allCategories.map(
        (currentCategory) => currentCategory.id
      )
    );

    return [
      ...usedCategoryIds,
    ]
      .filter(
        (categoryId) =>
          !knownCategoryIds.has(categoryId)
      )
      .map((categoryId) => ({
        id: categoryId,
        name: categoryId,
        nameAr: categoryId,
        icon: '❓',
        sortOrder: 999999,
        isActive: false,
        missing: true,
      }));
  }, [allCategories, usedCategoryIds]);

  const filterCategories = useMemo(() => {
    const existingCategoryIds = new Set(
      allCategories.map(
        (currentCategory) => currentCategory.id
      )
    );

    const missingUsedCategories =
      missingCategories.filter(
        (currentCategory) =>
          !existingCategoryIds.has(
            currentCategory.id
          )
      );

    return [
      ...allCategories,
      ...missingUsedCategories,
    ].sort(
      (a, b) =>
        Number(a.sortOrder ?? 0) -
        Number(b.sortOrder ?? 0)
    );
  }, [allCategories, missingCategories]);

  const getCategoryLabel = (categoryId) => {
    const currentCategory =
      filterCategories.find(
        (item) => item.id === categoryId
      );

    if (!currentCategory) {
      return categoryId || 'بدون تصنيف';
    }

    return (
      currentCategory.nameAr ||
      currentCategory.name ||
      currentCategory.id
    );
  };

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
        getCategoryLabel(product.category),
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
  }, [
    products,
    search,
    category,
    filterCategories,
  ]);

  const openCreateModal = () => {
    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
      category:
        activeCategories[0]?.id || '',
      sortOrder: String(
        products.length + 1
      ),
    });

    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || '',
      nameAr: product.nameAr || '',
      description:
        product.description || '',
      descriptionAr:
        product.descriptionAr || '',
      price:
        product.price !== undefined &&
        product.price !== null
          ? String(product.price)
          : '',
      category: product.category || '',
      image: product.image || '',
      isAvailable:
        product.isAvailable !== false,
      sortOrder:
        product.sortOrder !== undefined &&
        product.sortOrder !== null
          ? String(product.sortOrder)
          : '',
    });

    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (productActionLoading) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
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
        'اسم المنتج بالعربي مطلوب.'
      );
      return;
    }

    if (!form.category.trim()) {
      setFormError(
        'تصنيف المنتج مطلوب.'
      );
      return;
    }

    const selectedCategory =
      allCategories.find(
        (currentCategory) =>
          currentCategory.id ===
          form.category
      );

    /*
     * Prevent creating a new product under
     * a category that does not exist.
     *
     * When editing an old product whose category
     * is missing from Firestore, we allow keeping
     * the existing value until it is intentionally
     * changed.
     */
    if (
      !selectedCategory &&
      !editingProduct
    ) {
      setFormError(
        'التصنيف المحدد غير موجود.'
      );
      return;
    }

    if (
      selectedCategory &&
      selectedCategory.isActive === false &&
      selectedCategory.id !==
        editingProduct?.category
    ) {
      setFormError(
        'لا يمكن اختيار تصنيف غير نشط لمنتج جديد.'
      );
      return;
    }

    const price = Number(form.price);

    const sortOrder = Number(
      form.sortOrder
    );

    if (!Number.isFinite(price) || price < 0) {
      setFormError(
        'أدخل سعرًا صحيحًا.'
      );
      return;
    }

    if (
      !Number.isFinite(sortOrder) ||
      sortOrder < 0
    ) {
      setFormError(
        'أدخل ترتيبًا صحيحًا.'
      );
      return;
    }

    const productData = {
      name: form.name.trim(),
      nameAr: form.nameAr.trim(),
      description:
        form.description.trim(),
      descriptionAr:
        form.descriptionAr.trim(),
      price,
      category: form.category,
      image: form.image.trim(),
      isAvailable: form.isAvailable,
      sortOrder,
    };

    try {
      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          productData
        );
      } else {
        await createProduct(
          productData
        );
      }

      closeModal();
    } catch (error) {
      console.error(
        'Product save failed:',
        error
      );

      setFormError(
        error?.message ||
          'حدث خطأ أثناء حفظ المنتج.'
      );
    }
  };

  const handleToggleAvailability =
    async (product) => {
      try {
        await toggleProductAvailability(
          product.id,
          product.isAvailable === false
        );
      } catch (error) {
        console.error(
          'Product availability update failed:',
          error
        );

        window.alert(
          error?.message ||
            'تعذر تغيير حالة المنتج.'
        );
      }
    };

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف "${product.nameAr || product.name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoadingId(product.id);

      await deleteProduct(product.id);
    } catch (error) {
      console.error(
        'Product deletion failed:',
        error
      );

      window.alert(
        error?.message ||
          'تعذر حذف المنتج.'
      );
    } finally {
      setDeleteLoadingId(null);
    }
  };

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
            إضافة وتعديل وإدارة منتجات كوكب
            السعادة.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={
            categoriesLoading ||
            activeCategories.length === 0
          }
          className="rounded-2xl bg-[#FF6600] px-6 py-3 font-black text-white shadow-sm transition hover:bg-[#3D2314] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {categoriesLoading
            ? 'جاري تحميل التصنيفات...'
            : '+ إضافة منتج'}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-3xl border border-[#3D2314]/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
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

          <div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-xl">
            <button
              type="button"
              onClick={() =>
                setCategory('all')
              }
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

            {filterCategories.map(
              (currentCategory) => (
                <button
                  key={currentCategory.id}
                  type="button"
                  onClick={() =>
                    setCategory(
                      currentCategory.id
                    )
                  }
                  className={`
                    shrink-0 rounded-xl px-4 py-3 text-sm font-bold transition
                    ${
                      category ===
                      currentCategory.id
                        ? 'bg-[#FF6600] text-white'
                        : 'bg-[#FFF8F3] text-[#3D2314]/70 hover:bg-orange-50'
                    }
                  `}
                >
                  {currentCategory.icon
                    ? `${currentCategory.icon} `
                    : ''}
                  {currentCategory.nameAr ||
                    currentCategory.name ||
                    currentCategory.id}
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

        {(search ||
          category !== 'all') && (
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
            لم نجد منتجات مطابقة.
          </p>
        </div>
      )}

      {/* Products */}
      {filteredProducts.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map(
            (product) => {
              const isDeleting =
                deleteLoadingId ===
                product.id;

              return (
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
                        {getCategoryLabel(
                          product.category
                        )}
                      </span>
                    </div>

                    <p className="min-h-10 text-sm leading-6 text-[#3D2314]/60">
                      {product.descriptionAr ||
                        product.description ||
                        'لا يوجد وصف'}
                    </p>

                    <div className="mt-5 border-t border-[#3D2314]/10 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-[#FF6600]">
                          {Number(
                            product.price || 0
                          ).toLocaleString(
                            'ar-EG'
                          )}{' '}
                          <span className="text-sm">
                            ج.م
                          </span>
                        </span>

                        <span className="text-xs font-medium text-[#3D2314]/40">
                          ترتيب #
                          {product.sortOrder ?? '-'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEditModal(
                              product
                            )
                          }
                          className="rounded-xl bg-orange-50 px-3 py-2.5 text-sm font-black text-[#FF6600] transition hover:bg-orange-100"
                        >
                          تعديل
                        </button>

                        <button
                          type="button"
                          disabled={
                            productActionLoading
                          }
                          onClick={() =>
                            handleToggleAvailability(
                              product
                            )
                          }
                          className={`
                            rounded-xl px-3 py-2.5 text-sm font-black transition
                            ${
                              product.isAvailable ===
                              false
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }
                          `}
                        >
                          {product.isAvailable ===
                          false
                            ? 'تفعيل'
                            : 'إيقاف'}
                        </button>

                        <button
                          type="button"
                          disabled={
                            isDeleting ||
                            productActionLoading
                          }
                          onClick={() =>
                            handleDelete(
                              product
                            )
                          }
                          className="rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-black text-gray-700 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting
                            ? '...'
                            : 'حذف'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {/* Product Modal */}
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
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#3D2314]/10 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-bold text-[#FF6600]">
                  إدارة المنتجات
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#3D2314]">
                  {editingProduct
                    ? 'تعديل المنتج'
                    : 'إضافة منتج جديد'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  productActionLoading
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
                    htmlFor="nameAr"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    اسم المنتج بالعربي *
                  </label>

                  <input
                    id="nameAr"
                    name="nameAr"
                    type="text"
                    value={form.nameAr}
                    onChange={handleChange}
                    placeholder="مثال: وافل شوكولاتة"
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* English Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    الاسم بالإنجليزي
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Example: Chocolate Waffle"
                    dir="ltr"
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 text-left outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* Arabic Description */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="descriptionAr"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    الوصف بالعربي
                  </label>

                  <textarea
                    id="descriptionAr"
                    name="descriptionAr"
                    value={
                      form.descriptionAr
                    }
                    onChange={handleChange}
                    rows={3}
                    placeholder="وصف المنتج..."
                    className="w-full resize-none rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* English Description */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    الوصف بالإنجليزي
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    value={
                      form.description
                    }
                    onChange={handleChange}
                    rows={3}
                    placeholder="Product description..."
                    dir="ltr"
                    className="w-full resize-none rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 text-left outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* Price */}
                <div>
                  <label
                    htmlFor="price"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    السعر بالجنيه *
                  </label>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="50"
                    dir="ltr"
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 text-left outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    التصنيف *
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    disabled={categoriesLoading}
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">
                      {categoriesLoading
                        ? 'جاري تحميل التصنيفات...'
                        : 'اختر التصنيف'}
                    </option>

                    {selectableCategories.map(
                      (currentCategory) => (
                        <option
                          key={currentCategory.id}
                          value={currentCategory.id}
                        >
                          {currentCategory.icon
                            ? `${currentCategory.icon} `
                            : ''}
                          {currentCategory.nameAr ||
                            currentCategory.name ||
                            currentCategory.id}
                          {currentCategory.isActive ===
                          false
                            ? ' — غير نشط'
                            : ''}
                        </option>
                      )
                    )}
                  </select>

                  {form.category &&
                    !allCategories.some(
                      (currentCategory) =>
                        currentCategory.id ===
                        form.category
                    ) && (
                      <p className="mt-2 text-xs font-bold text-red-600">
                        هذا المنتج مرتبط بتصنيف غير
                        موجود في قاعدة البيانات.
                      </p>
                    )}
                </div>

                {/* Sort Order */}
                <div>
                  <label
                    htmlFor="sortOrder"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    ترتيب المنتج *
                  </label>

                  <input
                    id="sortOrder"
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

                {/* Image */}
                <div>
                  <label
                    htmlFor="image"
                    className="mb-2 block text-sm font-black text-[#3D2314]"
                  >
                    رابط الصورة
                  </label>

                  <input
                    id="image"
                    name="image"
                    type="url"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="https://..."
                    dir="ltr"
                    className="w-full rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 text-left outline-none transition focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10"
                  />
                </div>

                {/* Availability */}
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3">
                  <input
                    name="isAvailable"
                    type="checkbox"
                    checked={
                      form.isAvailable
                    }
                    onChange={handleChange}
                    className="h-5 w-5 accent-[#FF6600]"
                  />

                  <span>
                    <span className="block font-black text-[#3D2314]">
                      المنتج متوفر
                    </span>

                    <span className="text-xs text-[#3D2314]/50">
                      يظهر للعميل كمنتج متاح.
                    </span>
                  </span>
                </label>
              </div>

              {/* Preview */}
              {form.image && (
                <div className="overflow-hidden rounded-2xl border border-[#3D2314]/10 bg-[#FFF8F3]">
                  <div className="border-b border-[#3D2314]/10 px-4 py-3">
                    <p className="text-sm font-black text-[#3D2314]">
                      معاينة الصورة
                    </p>
                  </div>

                  <div className="flex justify-center p-4">
                    <img
                      src={form.image}
                      alt="معاينة المنتج"
                      className="h-48 w-48 rounded-2xl object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#3D2314]/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={
                    productActionLoading
                  }
                  className="rounded-xl bg-gray-100 px-6 py-3 font-black text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={
                    productActionLoading ||
                    categoriesLoading
                  }
                  className="rounded-xl bg-[#FF6600] px-6 py-3 font-black text-white transition hover:bg-[#3D2314] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {productActionLoading
                    ? 'جاري الحفظ...'
                    : editingProduct
                      ? 'حفظ التعديلات'
                      : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}