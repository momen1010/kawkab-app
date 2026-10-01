import { useMemo } from 'react';
import { Link } from 'react-router-dom';

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

export default function AdminHome() {
  const {
    orders,
    loading,
    loadError,
  } = useAdminData();

  const stats = useMemo(() => {
    const newOrders = orders.filter(
      (order) => order.status === 'new'
    ).length;

    const preparingOrders = orders.filter(
      (order) => order.status === 'preparing'
    ).length;

    const deliveryOrders = orders.filter(
      (order) => order.status === 'out_for_delivery'
    ).length;

    const deliveredOrders = orders.filter(
      (order) => order.status === 'delivered'
    ).length;

    const cancelledOrders = orders.filter(
      (order) => order.status === 'cancelled'
    ).length;

    const activeOrders =
      newOrders +
      preparingOrders +
      deliveryOrders;

    const totalRevenue = orders
      .filter((order) => order.status !== 'cancelled')
      .reduce(
        (total, order) =>
          total + Number(order.total || 0),
        0
      );

    const averageOrderValue =
      orders.length > 0
        ? totalRevenue /
          orders.filter(
            (order) => order.status !== 'cancelled'
          ).length
        : 0;

    return {
      totalOrders: orders.length,
      newOrders,
      preparingOrders,
      deliveryOrders,
      deliveredOrders,
      cancelledOrders,
      activeOrders,
      totalRevenue,
      averageOrderValue:
        Number.isFinite(averageOrderValue)
          ? averageOrderValue
          : 0,
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-[#FF6600] border-t-transparent" />

          <p className="font-black text-[#3D2314]">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold text-[#FF6600]">
              كوكب السعادة
            </p>

            <h1 className="text-3xl font-black text-[#3D2314] sm:text-4xl">
              لوحة التحكم
            </h1>

            <p className="mt-2 text-sm leading-7 text-[#6B5143]">
              نظرة سريعة على حالة الطلبات وأداء المتجر.
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="inline-flex w-fit items-center justify-center rounded-xl bg-[#3D2314] px-5 py-3 text-sm font-black text-white transition hover:bg-[#FF6600]"
          >
            إدارة الطلبات
            <span className="mr-2">←</span>
          </Link>
        </div>
      </section>

      {/* Error */}
      {loadError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-bold">{loadError}</p>
        </div>
      )}

      {/* Main Stats */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          icon="📦"
          iconClass="bg-orange-100"
        />

        <StatCard
          title="طلبات نشطة"
          value={stats.activeOrders}
          icon="🔥"
          iconClass="bg-red-100"
          valueClass="text-red-600"
        />

        <StatCard
          title="طلبات جديدة"
          value={stats.newOrders}
          icon="🔔"
          iconClass="bg-blue-100"
          valueClass="text-blue-600"
        />

        <StatCard
          title="إجمالي المبيعات"
          value={formatPrice(stats.totalRevenue)}
          icon="💰"
          iconClass="bg-green-100"
          valueClass="text-green-600"
        />
      </section>

      {/* Secondary Stats */}
      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat
          label="قيد التحضير"
          value={stats.preparingOrders}
          valueClass="text-yellow-600"
        />

        <MiniStat
          label="خرج للتوصيل"
          value={stats.deliveryOrders}
          valueClass="text-purple-600"
        />

        <MiniStat
          label="تم التسليم"
          value={stats.deliveredOrders}
          valueClass="text-green-600"
        />

        <MiniStat
          label="ملغي"
          value={stats.cancelledOrders}
          valueClass="text-red-600"
        />
      </section>

      {/* Performance Cards */}
      <section className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400">
                متوسط قيمة الطلب
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#3D2314]">
                {formatPrice(stats.averageOrderValue)}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-2xl">
              📈
            </div>
          </div>

          <p className="text-sm leading-7 text-gray-500">
            متوسط قيمة الطلبات غير الملغاة بناءً على البيانات
            الحالية.
          </p>
        </div>

        <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-400">
                حالة التشغيل الآن
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#3D2314]">
                {stats.activeOrders}
              </h2>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
              ⚡
            </div>
          </div>

          <div className="space-y-3">
            <ProgressRow
              label="جديد"
              value={stats.newOrders}
              total={Math.max(stats.activeOrders, 1)}
            />

            <ProgressRow
              label="قيد التحضير"
              value={stats.preparingOrders}
              total={Math.max(stats.activeOrders, 1)}
            />

            <ProgressRow
              label="خرج للتوصيل"
              value={stats.deliveryOrders}
              total={Math.max(stats.activeOrders, 1)}
            />
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#3D2314]">
              آخر الطلبات
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              أحدث 5 طلبات في النظام.
            </p>
          </div>

          <Link
            to="/admin/orders"
            className="w-fit rounded-xl bg-orange-100 px-4 py-2 text-sm font-black text-orange-700 transition hover:bg-orange-200"
          >
            عرض كل الطلبات
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            لا توجد طلبات حتى الآن 📭
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-black text-[#3D2314]">
                      #
                      {order.orderNumber ||
                        order.id.slice(0, 8)}
                    </p>

                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-black ${
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

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span>
                      {order.customer?.name || 'عميل'}
                    </span>

                    <span>
                      {order.deliveryType ===
                      'delivery'
                        ? '🚚 توصيل'
                        : '🏪 استلام'}
                    </span>

                    <span>
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-5 sm:justify-end">
                  <p className="font-black text-[#3D2314]">
                    {formatPrice(order.total)}
                  </p>

                  <Link
                    to="/admin/orders"
                    className="rounded-xl bg-[#3D2314] px-4 py-2 text-sm font-black text-white transition hover:bg-[#FF6600]"
                  >
                    التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconClass,
  valueClass = '',
}) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-500">
            {title}
          </p>

          <p
            className={`mt-2 truncate text-2xl font-black sm:text-3xl ${valueClass}`}
          >
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  valueClass = '',
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-bold text-gray-500">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-black ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

function ProgressRow({ label, value, total }) {
  const percentage = Math.min(
    100,
    Math.round((value / total) * 100)
  );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-bold text-gray-600">
          {label}
        </span>

        <span className="font-black text-[#3D2314]">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#FF6600] transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}