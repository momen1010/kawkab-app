import { useMemo } from 'react';
import { useAdminData } from '../context/AdminDataContext';

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;
}

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

function formatDate(value) {
  const timestamp = getTimestamp(value);

  if (!timestamp) return '—';

  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(timestamp));
}

const STATUS_LABELS = {
  new: 'جديد',
  preparing: 'قيد التحضير',
  out_for_delivery: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export default function Analytics() {
  const {
    orders,
    loading,
    loadError,
    products,
  } = useAdminData();

  const analytics = useMemo(() => {
    const validOrders = orders.filter(Boolean);

    const completedOrders = validOrders.filter(
      (order) => order.status !== 'cancelled'
    );

    const deliveredOrders = validOrders.filter(
      (order) => order.status === 'delivered'
    );

    const totalSales = completedOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const deliveredSales = deliveredOrders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );

    const averageOrderValue =
      completedOrders.length > 0
        ? totalSales / completedOrders.length
        : 0;

    const statusCounts = {
      new: 0,
      preparing: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
    };

    validOrders.forEach((order) => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status] += 1;
      }
    });

    const deliveryStats = {
      delivery: {
        orders: 0,
        sales: 0,
      },
      pickup: {
        orders: 0,
        sales: 0,
      },
    };

    completedOrders.forEach((order) => {
      const type = order.deliveryType;

      if (type === 'delivery') {
        deliveryStats.delivery.orders += 1;
        deliveryStats.delivery.sales += Number(order.total || 0);
      }

      if (type === 'pickup') {
        deliveryStats.pickup.orders += 1;
        deliveryStats.pickup.sales += Number(order.total || 0);
      }
    });

    const paymentStats = {
      cash: {
        orders: 0,
        sales: 0,
      },
      vodafone_cash: {
        orders: 0,
        sales: 0,
      },
    };

    completedOrders.forEach((order) => {
      const method = order.payment?.method;

      if (method === 'cash') {
        paymentStats.cash.orders += 1;
        paymentStats.cash.sales += Number(order.total || 0);
      }

      if (method === 'vodafone_cash') {
        paymentStats.vodafone_cash.orders += 1;
        paymentStats.vodafone_cash.sales += Number(order.total || 0);
      }
    });

    const productStats = new Map();

    completedOrders.forEach((order) => {
      if (!Array.isArray(order.items)) return;

      order.items.forEach((item) => {
        const productId = item.productId || item.id;

        if (!productId) return;

        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);

        if (!productStats.has(productId)) {
          productStats.set(productId, {
            productId,
            name: item.name || 'منتج غير معروف',
            quantity: 0,
            revenue: 0,
          });
        }

        const product = productStats.get(productId);

        product.quantity += quantity;
        product.revenue += price * quantity;
      });
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const now = new Date();

    const dailySales = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);

      date.setHours(0, 0, 0, 0);
      date.setDate(now.getDate() - (6 - index));

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayOrders = completedOrders.filter((order) => {
        const timestamp = getTimestamp(order.createdAt);

        return (
          timestamp >= date.getTime() &&
          timestamp < nextDate.getTime()
        );
      });

      return {
        date,
        label: formatDate(date),
        orders: dayOrders.length,
        sales: dayOrders.reduce(
          (sum, order) => sum + Number(order.total || 0),
          0
        ),
      };
    });

    const maxDailySales = Math.max(
      ...dailySales.map((day) => day.sales),
      1
    );

    return {
      totalOrders: validOrders.length,
      completedOrders: completedOrders.length,
      cancelledOrders: statusCounts.cancelled,
      totalSales,
      deliveredSales,
      averageOrderValue,
      statusCounts,
      deliveryStats,
      paymentStats,
      topProducts,
      dailySales,
      maxDailySales,
      productsCount: products.length,
    };
  }, [orders, products]);

  if (loading) {
    return (
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">
            التحليلات
          </h1>

          <p className="mt-1 text-sm text-[#3D2314]/60">
            جاري تحميل البيانات...
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
          التحليلات
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
      <div>
        <h1 className="text-3xl font-black">
          التحليلات
        </h1>

        <p className="mt-1 text-sm text-[#3D2314]/60">
          نظرة عامة على أداء المطعم والطلبات
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon="💰"
          title="إجمالي المبيعات"
          value={formatPrice(analytics.totalSales)}
        />

        <StatCard
          icon="📦"
          title="إجمالي الطلبات"
          value={analytics.totalOrders.toLocaleString('ar-EG')}
        />

        <StatCard
          icon="🧾"
          title="متوسط الطلب"
          value={formatPrice(analytics.averageOrderValue)}
        />

        <StatCard
          icon="❌"
          title="الطلبات الملغاة"
          value={analytics.cancelledOrders.toLocaleString('ar-EG')}
        />
      </div>

      {/* 7 Days */}
      <section className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">
              المبيعات خلال آخر 7 أيام
            </h2>

            <p className="mt-1 text-sm text-[#3D2314]/50">
              المبيعات والطلبات اليومية
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFF8F3] px-4 py-2">
            <span className="text-xs text-[#3D2314]/50">
              المبيعات المسلّمة
            </span>

            <p className="font-black">
              {formatPrice(analytics.deliveredSales)}
            </p>
          </div>
        </div>

        <div className="mt-8 flex h-64 items-end gap-2 overflow-x-auto pb-2 sm:gap-4">
          {analytics.dailySales.map((day) => {
            const height =
              day.sales === 0
                ? 4
                : Math.max(
                    (day.sales / analytics.maxDailySales) * 100,
                    8
                  );

            return (
              <div
                key={day.date.toISOString()}
                className="flex min-w-12 flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-[10px] font-bold text-[#3D2314]/50">
                  {formatPrice(day.sales)}
                </span>

                <div className="flex h-40 w-full items-end rounded-xl bg-[#FFF8F3]">
                  <div
                    className="w-full rounded-xl bg-[#FF6600] transition-all"
                    style={{ height: `${height}%` }}
                    title={`${day.orders} طلب`}
                  />
                </div>

                <span className="text-xs font-bold">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Status + Delivery */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Order Status */}
        <section className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">
            حالات الطلبات
          </h2>

          <div className="mt-5 space-y-3">
            {Object.entries(analytics.statusCounts).map(
              ([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-2xl bg-[#FFF8F3] p-4"
                >
                  <span className="font-bold">
                    {STATUS_LABELS[status] || status}
                  </span>

                  <span className="rounded-xl bg-white px-3 py-1 font-black shadow-sm">
                    {count}
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        {/* Delivery */}
        <section className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black">
            طريقة الاستلام
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <AnalyticsBox
              icon="🚚"
              title="توصيل"
              orders={analytics.deliveryStats.delivery.orders}
              sales={analytics.deliveryStats.delivery.sales}
            />

            <AnalyticsBox
              icon="🏪"
              title="استلام من المكان"
              orders={analytics.deliveryStats.pickup.orders}
              sales={analytics.deliveryStats.pickup.sales}
            />
          </div>
        </section>
      </div>

      {/* Payment */}
      <section className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-black">
          طرق الدفع
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <AnalyticsBox
            icon="💵"
            title="دفع نقدي"
            orders={analytics.paymentStats.cash.orders}
            sales={analytics.paymentStats.cash.sales}
          />

          <AnalyticsBox
            icon="📱"
            title="Vodafone Cash"
            orders={analytics.paymentStats.vodafone_cash.orders}
            sales={analytics.paymentStats.vodafone_cash.sales}
          />
        </div>
      </section>

      {/* Top Products */}
      <section className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">
              أكثر المنتجات طلبًا
            </h2>

            <p className="mt-1 text-sm text-[#3D2314]/50">
              بناءً على الطلبات غير الملغاة
            </p>
          </div>

          <span className="rounded-xl bg-[#FFF8F3] px-3 py-2 text-xs font-bold">
            {analytics.productsCount} منتج
          </span>
        </div>

        {analytics.topProducts.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-[#FFF8F3] p-8 text-center text-sm text-[#3D2314]/50">
            لا توجد بيانات منتجات كافية حتى الآن.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center gap-4 rounded-2xl bg-[#FFF8F3] p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D2314] font-black text-white">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">
                    {product.name}
                  </p>

                  <p className="mt-1 text-xs text-[#3D2314]/50">
                    {product.quantity} وحدة مباعة
                  </p>
                </div>

                <p className="shrink-0 font-black">
                  {formatPrice(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-2xl">
          {icon}
        </span>

        <span className="text-xs font-bold text-[#3D2314]/45">
          كوكب السعادة
        </span>
      </div>

      <p className="mt-5 text-sm font-bold text-[#3D2314]/50">
        {title}
      </p>

      <p className="mt-2 text-2xl font-black">
        {value}
      </p>
    </div>
  );
}

function AnalyticsBox({
  icon,
  title,
  orders,
  sales,
}) {
  return (
    <div className="rounded-2xl bg-[#FFF8F3] p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {icon}
        </span>

        <h3 className="font-black">
          {title}
        </h3>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-3">
          <p className="text-xs text-[#3D2314]/50">
            الطلبات
          </p>

          <p className="mt-1 font-black">
            {orders.toLocaleString('ar-EG')}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="text-xs text-[#3D2314]/50">
            المبيعات
          </p>

          <p className="mt-1 font-black">
            {formatPrice(sales)}
          </p>
        </div>
      </div>
    </div>
  );
}