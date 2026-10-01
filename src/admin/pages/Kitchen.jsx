
import { useMemo, useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';

const COLUMNS = [
  {
    id: 'new',
    title: 'طلبات جديدة',
    icon: '🔔',
    description: 'طلبات تحتاج إلى البدء',
  },
  {
    id: 'preparing',
    title: 'قيد التحضير',
    icon: '👨‍🍳',
    description: 'طلبات داخل المطبخ',
  },
  {
    id: 'out_for_delivery',
    title: 'جاهزة / في الطريق',
    icon: '🚚',
    description: 'طلبات خرجت للتوصيل أو الاستلام',
  },
];

const STATUS_LABELS = {
  new: 'جديد',
  preparing: 'قيد التحضير',
  out_for_delivery: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

function getTimestamp(value) {
  if (!value) return 0;

  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatTime(value) {
  const timestamp = getTimestamp(value);

  if (!timestamp) return '—';

  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function formatDate(value) {
  const timestamp = getTimestamp(value);

  if (!timestamp) return '—';

  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;
}

function getNextStatus(status) {
  if (status === 'new') return 'preparing';
  if (status === 'preparing') return 'out_for_delivery';
  return null;
}

function getNextStatusLabel(status) {
  if (status === 'new') return 'بدء التحضير';
  if (status === 'preparing') return 'جاهز / إرسال';
  return null;
}

function getDeliveryLabel(type) {
  if (type === 'delivery') return '🚚 توصيل';
  if (type === 'pickup') return '🏪 استلام';
  return '—';
}

export default function Kitchen() {
  const {
    orders,
    loading,
    loadError,
    updatingOrderId,
    updateOrderStatus,
  } = useAdminData();

  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const kitchenOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders
      .filter((order) =>
        ['new', 'preparing', 'out_for_delivery'].includes(
          order.status
        )
      )
      .filter((order) => {
        if (!query) return true;

        const orderNumber = String(
          order.orderNumber || ''
        ).toLowerCase();

        const customerName = String(
          order.customer?.name || ''
        ).toLowerCase();

        const customerPhone = String(
          order.customer?.phone || ''
        ).toLowerCase();

        return (
          orderNumber.includes(query) ||
          customerName.includes(query) ||
          customerPhone.includes(query)
        );
      })
      .sort(
        (a, b) =>
          getTimestamp(a.createdAt) -
          getTimestamp(b.createdAt)
      );
  }, [orders, search]);

  const ordersByStatus = useMemo(() => {
    return {
      new: kitchenOrders.filter(
        (order) => order.status === 'new'
      ),
      preparing: kitchenOrders.filter(
        (order) => order.status === 'preparing'
      ),
      out_for_delivery: kitchenOrders.filter(
        (order) => order.status === 'out_for_delivery'
      ),
    };
  }, [kitchenOrders]);

  const handleAdvanceStatus = async (order) => {
    const nextStatus = getNextStatus(order.status);

    if (!nextStatus) return;

    try {
      await updateOrderStatus(order.id, nextStatus);

      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Kitchen status update failed:', error);
    }
  };

  const handleDeliver = async (order) => {
    try {
      await updateOrderStatus(order.id, 'delivered');

      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Kitchen delivery update failed:', error);
    }
  };

  if (loading) {
    return (
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">
            المطبخ
          </h1>

          <p className="mt-1 text-sm text-[#3D2314]/60">
            جاري تحميل الطلبات...
          </p>
        </div>

        <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-10 text-center shadow-sm">
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div dir="rtl" className="space-y-6">
        <h1 className="text-3xl font-black">
          المطبخ
        </h1>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {loadError}
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black">
            وضع المطبخ 👨‍🍳
          </h1>

          <p className="mt-1 text-sm text-[#3D2314]/60">
            متابعة الطلبات وتحديث حالتها لحظيًا
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[#3D2314]/10 bg-white px-4 py-3 shadow-sm">
            <span className="text-xs font-bold text-[#3D2314]/50">
              الطلبات الحالية
            </span>

            <p className="text-xl font-black">
              {kitchenOrders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FF6600] px-4 py-3 text-white shadow-sm">
            <span className="text-xs font-bold text-white/70">
              جديدة
            </span>

            <p className="text-xl font-black">
              {ordersByStatus.new.length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف..."
          className="w-full rounded-2xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 outline-none transition focus:border-[#FF6600]"
        />
      </div>

      {/* Kitchen Board */}
      <div className="grid gap-5 xl:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnOrders = ordersByStatus[column.id];

          return (
            <section
              key={column.id}
              className="min-w-0 rounded-3xl border border-[#3D2314]/10 bg-[#FFF8F3] p-4"
            >
              {/* Column Header */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {column.icon}
                    </span>

                    <h2 className="font-black">
                      {column.title}
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-[#3D2314]/50">
                    {column.description}
                  </p>
                </div>

                <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-white px-2 font-black shadow-sm">
                  {columnOrders.length}
                </span>
              </div>

              {/* Orders */}
              <div className="space-y-3">
                {columnOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#3D2314]/15 bg-white/60 p-8 text-center">
                    <div className="text-3xl">
                      {column.icon}
                    </div>

                    <p className="mt-2 text-sm font-bold text-[#3D2314]/45">
                      لا توجد طلبات
                    </p>
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      updating={
                        updatingOrderId === order.id
                      }
                      onAdvance={() =>
                        handleAdvanceStatus(order)
                      }
                      onDeliver={() =>
                        handleDeliver(order)
                      }
                      onOpen={() =>
                        setSelectedOrder(order)
                      }
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#3D2314]/50">
                  تفاصيل الطلب
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  طلب #
                  {selectedOrder.orderNumber ||
                    selectedOrder.id}
                </h2>

                <p className="mt-1 text-sm text-[#3D2314]/50">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8F3] text-xl"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoBox
                label="العميل"
                value={
                  selectedOrder.customer?.name || '—'
                }
              />

              <InfoBox
                label="الهاتف"
                value={
                  selectedOrder.customer?.phone || '—'
                }
              />

              <InfoBox
                label="طريقة الاستلام"
                value={getDeliveryLabel(
                  selectedOrder.deliveryType
                )}
              />

              <InfoBox
                label="الإجمالي"
                value={formatPrice(selectedOrder.total)}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-black">
                المنتجات
              </h3>

              <div className="mt-3 space-y-3">
                {Array.isArray(selectedOrder.items) &&
                  selectedOrder.items.map((item, index) => (
                    <div
                      key={`${item.productId || 'item'}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl bg-[#FFF8F3] p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-black">
                          {item.name || 'منتج'}
                        </p>

                        <p className="mt-1 text-xs text-[#3D2314]/50">
                          الكمية: {item.quantity || 0}
                        </p>
                      </div>

                      <p className="shrink-0 font-black">
                        {formatPrice(
                          Number(item.price || 0) *
                            Number(item.quantity || 0)
                        )}
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {selectedOrder.customer?.notes && (
              <div className="mt-6 rounded-2xl bg-yellow-50 p-4">
                <p className="text-xs font-bold text-yellow-700">
                  ملاحظات العميل
                </p>

                <p className="mt-1 text-sm font-bold text-yellow-900">
                  {selectedOrder.customer.notes}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {getNextStatus(selectedOrder.status) && (
                <button
                  type="button"
                  disabled={
                    updatingOrderId === selectedOrder.id
                  }
                  onClick={() =>
                    handleAdvanceStatus(selectedOrder)
                  }
                  className="rounded-2xl bg-[#FF6600] px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingOrderId === selectedOrder.id
                    ? 'جاري التحديث...'
                    : getNextStatusLabel(
                        selectedOrder.status
                      )}
                </button>
              )}

              {selectedOrder.status ===
                'out_for_delivery' && (
                <button
                  type="button"
                  disabled={
                    updatingOrderId === selectedOrder.id
                  }
                  onClick={() =>
                    handleDeliver(selectedOrder)
                  }
                  className="rounded-2xl bg-[#3D2314] px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updatingOrderId === selectedOrder.id
                    ? 'جاري التحديث...'
                    : 'تأكيد التسليم'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KitchenOrderCard({
  order,
  updating,
  onAdvance,
  onDeliver,
  onOpen,
}) {
  const nextStatus = getNextStatus(order.status);

  return (
    <article className="rounded-2xl border border-[#3D2314]/10 bg-white p-4 shadow-sm">
      {/* Order Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black">
            #{order.orderNumber || order.id}
          </p>

          <p className="mt-1 text-xs text-[#3D2314]/50">
            {formatTime(order.createdAt)}
          </p>
        </div>

        <span className="rounded-xl bg-[#FFF8F3] px-3 py-1 text-xs font-black">
          {STATUS_LABELS[order.status] ||
            order.status}
        </span>
      </div>

      {/* Customer */}
      <div className="mt-4">
        <p className="font-black">
          {order.customer?.name || 'عميل'}
        </p>

        <p className="mt-1 text-sm text-[#3D2314]/55">
          {getDeliveryLabel(order.deliveryType)}
        </p>
      </div>

      {/* Items */}
      <div className="mt-4 space-y-2">
        {Array.isArray(order.items) &&
          order.items.slice(0, 4).map((item, index) => (
            <div
              key={`${item.productId || 'item'}-${index}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate font-bold">
                {item.name || 'منتج'}
              </span>

              <span className="shrink-0 rounded-lg bg-[#FFF8F3] px-2 py-1 font-black">
                ×{item.quantity || 0}
              </span>
            </div>
          ))}

        {Array.isArray(order.items) &&
          order.items.length > 4 && (
            <p className="text-xs text-[#3D2314]/45">
              + {order.items.length - 4} منتجات أخرى
            </p>
          )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-[#3D2314]/10 pt-4">
        <p className="font-black">
          {formatPrice(order.total)}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="text-sm font-black text-[#FF6600]"
        >
          التفاصيل
        </button>
      </div>

      {/* Action */}
      {nextStatus && (
        <button
          type="button"
          disabled={updating}
          onClick={onAdvance}
          className="mt-3 w-full rounded-xl bg-[#FF6600] px-4 py-3 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updating
            ? 'جاري التحديث...'
            : getNextStatusLabel(order.status)}
        </button>
      )}

      {order.status === 'out_for_delivery' && (
        <button
          type="button"
          disabled={updating}
          onClick={onDeliver}
          className="mt-3 w-full rounded-xl bg-[#3D2314] px-4 py-3 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updating
            ? 'جاري التحديث...'
            : 'تأكيد التسليم'}
        </button>
      )}
    </article>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#FFF8F3] p-4">
      <p className="text-xs font-bold text-[#3D2314]/50">
        {label}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

