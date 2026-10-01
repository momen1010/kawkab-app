import { useMemo, useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';

  try {
    const date =
      typeof timestamp?.toDate === 'function'
        ? timestamp.toDate()
        : new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('ar-EG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
}

function getCustomerKey(order) {
  const phone = String(order?.customer?.phone || '').trim();

  if (phone) {
    return `phone:${phone}`;
  }

  const name = String(order?.customer?.name || '')
    .trim()
    .toLowerCase();

  return `name:${name}`;
}

export default function Customers() {
  const { orders, loading, loadError } = useAdminData();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const customers = useMemo(() => {
    const customerMap = new Map();

    orders.forEach((order) => {
      const customer = order?.customer;

      if (!customer) {
        return;
      }

      const key = getCustomerKey(order);

      if (!key || key === 'name:') {
        return;
      }

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          key,
          name: customer.name || 'عميل بدون اسم',
          phone: customer.phone || '—',
          address: customer.address || '—',
          ordersCount: 0,
          totalSpent: 0,
          orders: [],
          lastOrderAt: null,
        });
      }

      const customerData = customerMap.get(key);

      customerData.ordersCount += 1;
      customerData.totalSpent += Number(order.total || 0);
      customerData.orders.push(order);

      if (
        !customerData.lastOrderAt ||
        getTimestamp(order.createdAt) >
          getTimestamp(customerData.lastOrderAt)
      ) {
        customerData.lastOrderAt = order.createdAt;
      }
    });

    return Array.from(customerMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
      );
    });
  }, [customers, search]);

  const totalCustomers = customers.length;

  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  );

  const averageCustomerValue =
    totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  if (loading) {
    return (
      <div dir="rtl" className="space-y-6">
        <div>
          <h1 className="text-3xl font-black">
            العملاء
          </h1>
          <p className="mt-1 text-sm text-[#3D2314]/60">
            جاري تحميل بيانات العملاء...
          </p>
        </div>

        <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-8 text-center shadow-sm">
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div dir="rtl" className="space-y-6">
        <h1 className="text-3xl font-black">
          العملاء
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
          العملاء
        </h1>

        <p className="mt-1 text-sm text-[#3D2314]/60">
          متابعة العملاء بناءً على الطلبات المسجلة
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#3D2314]/50">
            إجمالي العملاء
          </p>

          <p className="mt-2 text-3xl font-black">
            {totalCustomers}
          </p>
        </div>

        <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#3D2314]/50">
            إجمالي الإنفاق
          </p>

          <p className="mt-2 text-3xl font-black">
            {formatPrice(totalRevenue)}
          </p>
        </div>

        <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-[#3D2314]/50">
            متوسط إنفاق العميل
          </p>

          <p className="mt-2 text-3xl font-black">
            {formatPrice(averageCustomerValue)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-3xl border border-[#3D2314]/10 bg-white p-4 shadow-sm">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="w-full rounded-2xl border border-[#3D2314]/10 bg-[#FFF8F3] px-4 py-3 outline-none transition focus:border-[#FF6600]"
        />
      </div>

      {/* Customers */}
      <div className="overflow-hidden rounded-3xl border border-[#3D2314]/10 bg-white shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-5xl">👥</div>

            <h2 className="mt-4 text-xl font-black">
              لا يوجد عملاء
            </h2>

            <p className="mt-2 text-sm text-[#3D2314]/50">
              العملاء سيظهرون هنا بعد وجود طلبات مسجلة.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-right">
                <thead className="border-b border-[#3D2314]/10 bg-[#FFF8F3]">
                  <tr>
                    <th className="px-5 py-4 text-sm font-black">
                      العميل
                    </th>

                    <th className="px-5 py-4 text-sm font-black">
                      الهاتف
                    </th>

                    <th className="px-5 py-4 text-sm font-black">
                      الطلبات
                    </th>

                    <th className="px-5 py-4 text-sm font-black">
                      إجمالي الإنفاق
                    </th>

                    <th className="px-5 py-4 text-sm font-black">
                      آخر طلب
                    </th>

                    <th className="px-5 py-4">
                      تفاصيل
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.key}
                      className="border-b border-[#3D2314]/5 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black">
                          {customer.name}
                        </p>

                        <p className="mt-1 max-w-xs truncate text-xs text-[#3D2314]/45">
                          {customer.address}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-bold">
                        {customer.phone}
                      </td>

                      <td className="px-5 py-4 font-black">
                        {customer.ordersCount}
                      </td>

                      <td className="px-5 py-4 font-black">
                        {formatPrice(customer.totalSpent)}
                      </td>

                      <td className="px-5 py-4 text-sm text-[#3D2314]/60">
                        {formatDate(customer.lastOrderAt)}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCustomer(customer)
                          }
                          className="rounded-xl bg-[#3D2314] px-4 py-2 text-sm font-black text-white transition hover:opacity-90"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="divide-y divide-[#3D2314]/5 lg:hidden">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.key}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black">
                        {customer.name}
                      </h3>

                      <p className="mt-1 text-sm text-[#3D2314]/55">
                        {customer.phone}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#FFF8F3] px-3 py-2 text-center">
                      <p className="text-xs text-[#3D2314]/50">
                        الطلبات
                      </p>

                      <p className="font-black">
                        {customer.ordersCount}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#FFF8F3] p-3">
                      <p className="text-xs text-[#3D2314]/50">
                        الإنفاق
                      </p>

                      <p className="mt-1 font-black">
                        {formatPrice(customer.totalSpent)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#FFF8F3] p-3">
                      <p className="text-xs text-[#3D2314]/50">
                        آخر طلب
                      </p>

                      <p className="mt-1 text-xs font-bold">
                        {formatDate(customer.lastOrderAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCustomer(customer)
                    }
                    className="w-full rounded-2xl bg-[#3D2314] px-4 py-3 font-black text-white"
                  >
                    عرض تفاصيل العميل
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#3D2314]/50">
                  تفاصيل العميل
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  {selectedCustomer.name}
                </h2>

                <p className="mt-1 text-sm text-[#3D2314]/60">
                  {selectedCustomer.phone}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8F3] text-xl"
                aria-label="إغلاق"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#FFF8F3] p-4">
                <p className="text-xs text-[#3D2314]/50">
                  عدد الطلبات
                </p>

                <p className="mt-1 text-xl font-black">
                  {selectedCustomer.ordersCount}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFF8F3] p-4">
                <p className="text-xs text-[#3D2314]/50">
                  إجمالي الإنفاق
                </p>

                <p className="mt-1 text-xl font-black">
                  {formatPrice(selectedCustomer.totalSpent)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFF8F3] p-4">
                <p className="text-xs text-[#3D2314]/50">
                  متوسط الطلب
                </p>

                <p className="mt-1 text-xl font-black">
                  {formatPrice(
                    selectedCustomer.totalSpent /
                      Math.max(selectedCustomer.ordersCount, 1)
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-black">
                الطلبات السابقة
              </h3>

              <div className="mt-3 space-y-3">
                {[...selectedCustomer.orders]
                  .sort(
                    (a, b) =>
                      getTimestamp(b.createdAt) -
                      getTimestamp(a.createdAt)
                  )
                  .map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-[#3D2314]/10 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-black">
                            طلب #{order.orderNumber || order.id}
                          </p>

                          <p className="mt-1 text-xs text-[#3D2314]/50">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="text-left">
                          <p className="font-black">
                            {formatPrice(order.total)}
                          </p>

                          <p className="mt-1 text-xs text-[#3D2314]/50">
                            {order.status || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#FFF8F3] p-4">
              <p className="text-xs font-bold text-[#3D2314]/50">
                العنوان
              </p>

              <p className="mt-1 text-sm font-bold">
                {selectedCustomer.address}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimestamp(value) {
  if (!value) {
    return 0;
  }

  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}