import { useMemo, useState } from 'react';

import { useAdminData } from '../context/AdminDataContext';

const STATUS_LABELS = {
  new: 'جديد',
  preparing: 'قيد التحضير',
  out_for_delivery: 'خرج للتوصيل',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

const STATUS_STYLES = {
  new: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = [
  'new',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ar-EG')} جنيه`;
}

function formatDate(timestamp) {
  if (!timestamp) {
    return '—';
  }

  try {
    const date =
      typeof timestamp?.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp);

    return date.toLocaleString('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

export default function Orders() {
  
    const {
        orders,
        loading,
        loadError,
        updatingOrderId,
        updateOrderStatus,
        confirmPayment,
      } = useAdminData();
      const [selectedOrder, setSelectedOrder] = useState(null);



  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' ||
        order.status === statusFilter;

      if (!normalizedSearch) {
        return matchesStatus;
      }

      const searchableText = [
        order.orderNumber,
        order.id,
        order.customer?.name,
        order.customer?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesStatus &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [orders, statusFilter, search]);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      new: orders.filter(
        (order) => order.status === 'new'
      ).length,
      preparing: orders.filter(
        (order) => order.status === 'preparing'
      ).length,
      out_for_delivery: orders.filter(
        (order) => order.status === 'out_for_delivery'
      ).length,
      delivered: orders.filter(
        (order) => order.status === 'delivered'
      ).length,
      cancelled: orders.filter(
        (order) => order.status === 'cancelled'
      ).length,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-[#FF6600] border-t-transparent" />

          <p className="font-black text-[#3D2314]">
            جاري تحميل الطلبات...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold text-[#FF6600]">
              إدارة الطلبات
            </p>

            <h1 className="text-3xl font-black text-[#3D2314] sm:text-4xl">
              الطلبات
            </h1>

            <p className="mt-2 text-sm text-[#6B5143]">
              متابعة الطلبات وتحديث حالتها لحظيًا.
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-bold text-gray-400">
              إجمالي الطلبات
            </p>

            <p className="mt-1 text-2xl font-black text-[#3D2314]">
              {counts.all}
            </p>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-bold">{loadError}</p>
        </div>
      )}

      {/* Filters */}
      <section className="mb-6 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <label
              htmlFor="order-search"
              className="mb-2 block text-sm font-bold text-gray-600"
            >
              بحث
            </label>

            <input
              id="order-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="رقم الطلب، اسم العميل أو الهاتف..."
              className="w-full rounded-xl border border-gray-200 bg-[#FFF8F3] px-4 py-3 font-bold outline-none transition focus:border-[#FF6600]"
            />
          </div>

          <div className="lg:w-64">
            <label
              htmlFor="status-filter"
              className="mb-2 block text-sm font-bold text-gray-600"
            >
              الحالة
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 bg-[#FFF8F3] px-4 py-3 font-bold outline-none"
            >
              <option value="all">
                كل الطلبات ({counts.all})
              </option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]} (
                  {counts[status]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Orders */}
      <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-black">
              قائمة الطلبات
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              عرض {filteredOrders.length} من {orders.length}{' '}
              طلب
            </p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            لا توجد طلبات مطابقة للبحث أو الفلتر.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-[#FFF8F3]">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-black">
                      الطلب
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-black">
                      العميل
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-black">
                      النوع
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-black">
                      الإجمالي
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-black">
                      الحالة
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-black">
                      التاريخ
                    </th>

                    <th className="px-6 py-4 text-right text-sm font-black">
                      التفاصيل
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition hover:bg-orange-50/50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-black">
                          #
                          {order.orderNumber ||
                            order.id.slice(0, 8)}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {order.orderMethod === 'whatsapp'
                            ? 'WhatsApp'
                            : 'Website'}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="font-bold">
                          {order.customer?.name || '—'}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {order.customer?.phone || '—'}
                        </p>
                      </td>

                      <td className="px-6 py-5 font-bold">
                        {order.deliveryType === 'delivery'
                          ? '🚚 توصيل'
                          : '🏪 استلام'}
                      </td>

                      <td className="px-6 py-5 font-black">
                        {formatPrice(order.total)}
                      </td>

                      <td className="px-6 py-5">
                        <select
                          value={order.status || 'new'}
                          disabled={
                            updatingOrderId === order.id
                          }
                          onChange={(event) =>
                            updateOrderStatus(
                              order.id,
                              event.target.value
                            )
                          }
                          className={`rounded-lg border-0 px-3 py-2 text-sm font-black outline-none ${
                            STATUS_STYLES[
                              order.status || 'new'
                            ]
                          }`}
                        >
                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {STATUS_LABELS[status]}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="px-6 py-5 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(order)
                          }
                          className="rounded-xl bg-[#3D2314] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#FF6600]"
                        >
                          التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="space-y-4 p-4 md:hidden">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black">
                        #
                        {order.orderNumber ||
                          order.id.slice(0, 8)}
                      </p>

                      <p className="text-sm text-gray-500">
                        {order.customer?.name || '—'}
                      </p>
                    </div>

                    <span
                      className={`rounded-lg px-3 py-2 text-xs font-black ${
                        STATUS_STYLES[
                          order.status || 'new'
                        ]
                      }`}
                    >
                      {STATUS_LABELS[
                        order.status || 'new'
                      ]}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">
                        الهاتف
                      </span>

                      <p className="mt-1 font-bold">
                        {order.customer?.phone || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        الإجمالي
                      </span>

                      <p className="mt-1 font-black">
                        {formatPrice(order.total)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        النوع
                      </span>

                      <p className="mt-1 font-bold">
                        {order.deliveryType ===
                        'delivery'
                          ? '🚚 توصيل'
                          : '🏪 استلام'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        التاريخ
                      </span>

                      <p className="mt-1 text-xs font-bold">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={order.status || 'new'}
                      disabled={
                        updatingOrderId === order.id
                      }
                      onChange={(event) =>
                        updateOrderStatus(
                          order.id,
                          event.target.value
                        )
                      }
                      className="flex-1 rounded-xl bg-gray-100 px-3 py-3 font-bold outline-none"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOrder(order)
                      }
                      className="rounded-xl bg-[#3D2314] px-4 py-3 font-black text-white"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          updating={
            updatingOrderId === selectedOrder.id
          }
          onClose={() => setSelectedOrder(null)}
          onStatusChange={updateOrderStatus}
          onConfirmPayment={confirmPayment}
        />
      )}
    </>
  );
}

function OrderModal({
  order,
  updating,
  onClose,
  onStatusChange,
  onConfirmPayment,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white p-5">
          <div>
            <h2 className="text-2xl font-black">
              تفاصيل الطلب #
              {order.orderNumber || order.id}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {formatDate(order.createdAt)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl font-black transition hover:bg-red-100 hover:text-red-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 p-5">
          <section>
            <h3 className="mb-3 text-lg font-black">
              بيانات العميل 👤
            </h3>

            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-[#FFF8F3] p-4 sm:grid-cols-2">
              <InfoItem
                label="الاسم"
                value={order.customer?.name}
              />

              <InfoItem
                label="الهاتف"
                value={order.customer?.phone}
              />

              <div className="sm:col-span-2">
                <InfoItem
                  label="العنوان"
                  value={order.customer?.address}
                />
              </div>

              {order.customer?.notes && (
                <div className="sm:col-span-2">
                  <InfoItem
                    label="ملاحظات"
                    value={order.customer.notes}
                  />
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-black">
              حالة الطلب 📦
            </h3>

            <select
              value={order.status || 'new'}
              disabled={updating}
              onChange={(event) =>
                onStatusChange(
                  order.id,
                  event.target.value
                )
              }
              className={`w-full rounded-xl px-4 py-3 font-black outline-none ${
                STATUS_STYLES[order.status || 'new']
              }`}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-black">
              المنتجات 🧇
            </h3>

            <div className="space-y-3">
              {Array.isArray(order.items) &&
              order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div
                    key={`${item.id || item.name || 'item'}-${index}`}
                    className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-black">
                        {item.name || 'منتج'}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        الكمية: {item.quantity || 1}
                      </p>
                    </div>

                    <p className="font-black">
                      {formatPrice(
                        Number(item.price || 0) *
                          Number(item.quantity || 1)
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  لا توجد منتجات.
                </p>
              )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-black">
              الدفع 💳
            </h3>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoItem
                  label="طريقة الدفع"
                  value={
                    order.payment?.method ===
                    'vodafone_cash'
                      ? 'Vodafone Cash'
                      : order.payment?.method ===
                        'cash'
                      ? 'الدفع عند الاستلام'
                      : '—'
                  }
                />

                <InfoItem
                  label="الحالة"
                  value={
                    order.payment?.status === 'paid'
                      ? 'تم الدفع ✓'
                      : order.payment?.status ===
                        'cash_on_delivery'
                      ? 'عند الاستلام'
                      : 'في انتظار الدفع'
                  }
                />

                {order.payment?.transactionId && (
                  <div className="sm:col-span-2">
                    <InfoItem
                      label="رقم العملية"
                      value={
                        order.payment.transactionId
                      }
                    />
                  </div>
                )}
              </div>

              {order.payment?.status !== 'paid' &&
                order.payment?.method ===
                  'vodafone_cash' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      onConfirmPayment(order.id)
                    }
                    className="mt-4 w-full rounded-xl bg-green-600 py-3 font-black text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating
                      ? 'جاري التأكيد...'
                      : 'تأكيد الدفع ✓'}
                  </button>
                )}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-lg font-black">
              ملخص الحساب 💰
            </h3>

            <div className="space-y-3 rounded-2xl bg-[#3D2314] p-5 text-white">
              <div className="flex justify-between">
                <span className="text-white/70">
                  المنتجات
                </span>

                <span className="font-bold">
                  {formatPrice(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">
                  التوصيل
                </span>

                <span className="font-bold">
                  {formatPrice(order.deliveryFee)}
                </span>
              </div>

              <div className="flex justify-between border-t border-white/20 pt-3 text-lg">
                <span className="font-black">
                  الإجمالي
                </span>

                <span className="font-black text-[#FFB000]">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>

          <section>
            <div className="rounded-2xl bg-orange-50 p-4">
              <p className="text-sm text-gray-500">
                طريقة الاستلام
              </p>

              <p className="mt-1 font-black">
                {order.deliveryType === 'delivery'
                  ? '🚚 توصيل إلى العنوان'
                  : '🏪 استلام من المكان'}
              </p>
            </div>
          </section>
        </div>

        <div className="border-t border-gray-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#3D2314] py-3 font-black text-white transition hover:bg-[#FF6600]"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <p className="mt-1 break-words font-black">
        {value || '—'}
      </p>
    </div>
  );
}