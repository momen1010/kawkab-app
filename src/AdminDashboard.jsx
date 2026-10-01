import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

import { db } from './firebase/config';

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

function formatDate(timestamp) {
  if (!timestamp) return '—';

  try {
    const date = timestamp.toDate
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

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString('ar-EG')} ج.م`;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const previousOrderCount = useRef(0);

  /*
   * تسجيل الخروج
   */
  const handleLogout = async () => {
    try {
      const auth = getAuth();

      await signOut(auth);

      window.location.href = '/admin';
    } catch (error) {
      console.error('Logout error:', error);
      alert('حدث خطأ أثناء تسجيل الخروج.');
    }
  };

  /*
   * تحميل الطلبات من Firestore
   */
  useEffect(() => {
    let unsubscribe = null;
  
    const loadAdminOrders = async () => {
      try {
        setLoading(true);
        setLoadError('');
  
        const auth = getAuth();
        const user = auth.currentUser;
  
        // مفيش مستخدم مسجل دخول
        if (!user) {
          setLoadError(
            'لم يتم تسجيل الدخول. ارجع لصفحة تسجيل الدخول وسجل دخولك كمسؤول.'
          );
          setLoading(false);
          return;
        }
  
        /*
         * مهم جدًا:
         * إجبار Firebase على تحديث الـ ID Token
         * حتى يحصل على admin: true من Custom Claims
         */
        const tokenResult = await user.getIdTokenResult(true);
  
        console.log('Admin email:', user.email);
        console.log('Admin claim:', tokenResult.claims.admin);
  
        // حماية إضافية قبل فتح الطلبات
        if (tokenResult.claims.admin !== true) {
          setLoadError(
            'هذا الحساب ليس لديه صلاحية Admin. قم بتسجيل الخروج ثم الدخول بالحساب الإداري الصحيح.'
          );
  
          setLoading(false);
          return;
        }
  
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc')
        );
  
        unsubscribe = onSnapshot(
          ordersQuery,
          (snapshot) => {
            const ordersData = snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }));
  
            console.log(
              'Orders loaded successfully:',
              ordersData.length
            );
  
            setOrders(ordersData);
            setLoading(false);
            setLoadError('');
          },
          (error) => {
            console.error(
              'Orders listener error:',
              error
            );
  
            setLoadError(
              'تعذر تحميل الطلبات. تأكد من صلاحيات حساب Admin.'
            );
  
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Admin authentication error:', error);
  
        setLoadError(
          'تعذر التحقق من صلاحيات المسؤول. سجل الخروج ثم ادخل مرة أخرى.'
        );
  
        setLoading(false);
      }
    };
  
    loadAdminOrders();
  
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  /*
   * تغيير حالة الطلب
   */
  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) {
      return;
    }
  
    try {
      setUpdatingOrderId(orderId);
  
      /*
       * تحديث الطلب الأساسي
       */
      const orderRef = doc(db, 'orders', orderId);
  
      await updateDoc(orderRef, {
        status: newStatus,
      });
      console.log('STATUS UPDATED:', orderId, newStatus);
  
      /*
       * تحديث الـ tracking
       */
      const order = orders.find((item) => item.id === orderId);
  
      if (order?.trackingToken) {
        try {
          const trackingRef = doc(
            db,
            'orderTracking',
            order.trackingToken
          );
  
          await updateDoc(trackingRef, {
            status: newStatus,
          });
        } catch (trackingError) {
          console.error(
            'Tracking update error:',
            trackingError
          );
        }
      }
  
      /*
       * تحديث الطلب المحدد فورًا في الواجهة
       */
      setSelectedOrder((current) => {
        if (!current || current.id !== orderId) {
          return current;
        }
  
        return {
          ...current,
          status: newStatus,
        };
      });
  
    } catch (error) {
      console.error('Status update error:', error);
  
      alert(
        'حدث خطأ أثناء تحديث حالة الطلب. حاول مرة أخرى.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };
  /*
   * تأكيد الدفع
   */
  const handlePaymentConfirm = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);

      const orderRef = doc(db, 'orders', orderId);

      await updateDoc(orderRef, {
        'payment.status': 'paid',
      });

      setSelectedOrder((current) => {
        if (!current || current.id !== orderId) {
          return current;
        }

        return {
          ...current,
          payment: {
            ...current.payment,
            status: 'paid',
          },
        };
      });
    } catch (error) {
      console.error('Payment update error:', error);

      alert(
        'حدث خطأ أثناء تأكيد الدفع. حاول مرة أخرى.'
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  /*
   * إحصائيات الطلبات
   */
  const totalOrders = orders.length;

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

  const totalRevenue = orders
    .filter((order) => order.status !== 'cancelled')
    .reduce(
      (total, order) => total + Number(order.total || 0),
      0
    );

  /*
   * Loading
   */
  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#FFF8F3] flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-[#3D2314] font-black">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FFF8F3] text-[#3D2314]"
    >
      {/* ================= HEADER ================= */}
      <header className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-[#3D2314]">
                لوحة التحكم 📊
              </h1>

              <p className="text-gray-500 mt-2">
                إدارة طلبات هابي درينك
              </p>
            </div>

            {/* زر تسجيل الخروج */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border border-red-100 px-5 py-3 rounded-xl font-black text-sm transition-all duration-200 cursor-pointer"
            >
              <span>🚪</span>
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Error */}
        {loadError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            <p className="font-bold">
              {loadError}
            </p>
          </div>
        )}

        {/* ================= STATS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* Total */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-bold">
                  إجمالي الطلبات
                </p>

                <p className="text-3xl font-black mt-2">
                  {totalOrders}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">
                📦
              </div>
            </div>
          </div>

          {/* New */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-bold">
                  طلبات جديدة
                </p>

                <p className="text-3xl font-black mt-2 text-blue-600">
                  {newOrders}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                🆕
              </div>
            </div>
          </div>

          {/* Preparing */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-bold">
                  قيد التحضير
                </p>

                <p className="text-3xl font-black mt-2 text-yellow-600">
                  {preparingOrders}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-2xl">
                👨‍🍳
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-bold">
                  إجمالي المبيعات
                </p>

                <p className="text-2xl font-black mt-2 text-green-600">
                  {formatPrice(totalRevenue)}
                </p>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECONDARY STATS ================= */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-sm">
              للتوصيل
            </p>

            <p className="text-2xl font-black mt-1">
              {deliveryOrders}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-sm">
              تم التسليم
            </p>

            <p className="text-2xl font-black text-green-600 mt-1">
              {deliveredOrders}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-sm">
              ملغي
            </p>

            <p className="text-2xl font-black text-red-600 mt-1">
              {cancelledOrders}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-gray-500 text-sm">
              قيد المعالجة
            </p>

            <p className="text-2xl font-black text-purple-600 mt-1">
              {preparingOrders + deliveryOrders}
            </p>
          </div>
        </section>

        {/* ================= ORDERS ================= */}
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">

          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">
                  الطلبات
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  آخر الطلبات المستلمة
                </p>
              </div>

              <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-black">
                {totalOrders} طلب
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FFF8F3]">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-black">
                    الطلب
                  </th>

                  <th className="text-right px-6 py-4 text-sm font-black">
                    العميل
                  </th>

                  <th className="text-right px-6 py-4 text-sm font-black">
                    النوع
                  </th>

                  <th className="text-right px-6 py-4 text-sm font-black">
                    الإجمالي
                  </th>

                  <th className="text-right px-6 py-4 text-sm font-black">
                    الحالة
                  </th>

                  <th className="text-right px-6 py-4 text-sm font-black">
                    التاريخ
                  </th>

                  <th className="text-right px-6 py-4 text-sm font-black">
                    التفاصيل
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      لا توجد طلبات حتى الآن 📭
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-orange-50/50 transition"
                    >
                      {/* Order number */}
                      <td className="px-6 py-5">
                        <div className="font-black text-[#3D2314]">
                          #
                          {order.orderNumber ||
                            order.id.slice(0, 8)}
                        </div>

                        <div className="text-xs text-gray-400 mt-1">
                          {order.orderMethod === 'whatsapp'
                            ? 'WhatsApp'
                            : 'Website'}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-5">
                        <div className="font-bold">
                          {order.customer?.name || '—'}
                        </div>

                        <div className="text-sm text-gray-500 mt-1">
                          {order.customer?.phone || '—'}
                        </div>
                      </td>

                      {/* Delivery */}
                      <td className="px-6 py-5">
                        <span className="font-bold">
                          {order.deliveryType === 'delivery'
                            ? '🚚 توصيل'
                            : '🏪 استلام'}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-5">
                        <span className="font-black">
                          {formatPrice(order.total)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <select
                          value={order.status || 'new'}
                          disabled={
                            updatingOrderId === order.id
                          }
                          onChange={(event) =>
                            handleStatusChange(
                              order.id,
                              event.target.value
                            )
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-black border-0 outline-none cursor-pointer ${
                            STATUS_STYLES[
                              order.status || 'new'
                            ]
                          }`}
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
                      </td>

                      {/* Date */}
                      <td className="px-6 py-5 text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Details */}
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(order)
                          }
                          className="bg-[#3D2314] hover:bg-[#FF6600] text-white px-4 py-2 rounded-lg font-bold text-sm transition cursor-pointer"
                        >
                          التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا توجد طلبات حتى الآن 📭
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-100 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="font-black text-lg">
                        #
                        {order.orderNumber ||
                          order.id.slice(0, 8)}
                      </p>

                      <p className="text-sm text-gray-500">
                        {order.customer?.name || '—'}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-2 rounded-lg text-xs font-black ${
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

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-gray-400">
                        الهاتف
                      </span>

                      <p className="font-bold mt-1">
                        {order.customer?.phone || '—'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        الإجمالي
                      </span>

                      <p className="font-black mt-1">
                        {formatPrice(order.total)}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        النوع
                      </span>

                      <p className="font-bold mt-1">
                        {order.deliveryType === 'delivery'
                          ? '🚚 توصيل'
                          : '🏪 استلام'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-400">
                        التاريخ
                      </span>

                      <p className="font-bold mt-1 text-xs">
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
                        handleStatusChange(
                          order.id,
                          event.target.value
                        )
                      }
                      className="flex-1 px-3 py-3 rounded-xl bg-gray-100 font-bold outline-none"
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
                      className="px-4 py-3 rounded-xl bg-[#3D2314] text-white font-black"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* ================= ORDER MODAL ================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">
                  تفاصيل الطلب #
                  {selectedOrder.orderNumber ||
                    selectedOrder.id}
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 transition font-black text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-6">

              {/* Customer */}
              <section>
                <h3 className="font-black text-lg mb-3">
                  بيانات العميل 👤
                </h3>

                <div className="bg-[#FFF8F3] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 text-sm">
                      الاسم
                    </span>

                    <p className="font-black mt-1">
                      {selectedOrder.customer?.name || '—'}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500 text-sm">
                      الهاتف
                    </span>

                    <p className="font-black mt-1">
                      {selectedOrder.customer?.phone || '—'}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-gray-500 text-sm">
                      العنوان
                    </span>

                    <p className="font-black mt-1">
                      {selectedOrder.customer?.address ||
                        '—'}
                    </p>
                  </div>

                  {selectedOrder.customer?.notes && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 text-sm">
                        ملاحظات
                      </span>

                      <p className="font-black mt-1">
                        {selectedOrder.customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Status */}
              <section>
                <h3 className="font-black text-lg mb-3">
                  حالة الطلب 📦
                </h3>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedOrder.status || 'new'}
                    disabled={
                      updatingOrderId ===
                      selectedOrder.id
                    }
                    onChange={(event) =>
                      handleStatusChange(
                        selectedOrder.id,
                        event.target.value
                      )
                    }
                    className={`flex-1 px-4 py-3 rounded-xl font-black outline-none ${
                      STATUS_STYLES[
                        selectedOrder.status || 'new'
                      ]
                    }`}
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
                </div>
              </section>

              {/* Products */}
              <section>
                <h3 className="font-black text-lg mb-3">
                  المنتجات 🧇
                </h3>

                <div className="space-y-3">
                  {Array.isArray(selectedOrder.items) &&
                  selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div
                        key={`${item.id || item.name || 'item'}-${index}`}
                        className="flex items-center justify-between gap-4 bg-gray-50 rounded-xl p-4"
                      >
                        <div>
                          <p className="font-black">
                            {item.name || 'منتج'}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
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

              {/* Payment */}
              <section>
                <h3 className="font-black text-lg mb-3">
                  الدفع 💳
                </h3>

                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-gray-500 text-sm">
                        طريقة الدفع
                      </p>

                      <p className="font-black mt-1">
                        {selectedOrder.payment?.method ===
                        'vodafone_cash'
                          ? 'Vodafone Cash'
                          : selectedOrder.payment
                                ?.method === 'cash'
                          ? 'الدفع عند الاستلام'
                          : '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 text-sm">
                        الحالة
                      </p>

                      <p
                        className={`font-black mt-1 ${
                          selectedOrder.payment?.status ===
                          'paid'
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}
                      >
                        {selectedOrder.payment?.status ===
                        'paid'
                          ? 'تم الدفع ✓'
                          : selectedOrder.payment?.status ===
                            'cash_on_delivery'
                          ? 'عند الاستلام'
                          : 'في انتظار الدفع'}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.payment
                    ?.transactionId && (
                    <div className="mb-4">
                      <p className="text-gray-500 text-sm">
                        رقم العملية
                      </p>

                      <p className="font-black mt-1 break-all">
                        {
                          selectedOrder.payment
                            .transactionId
                        }
                      </p>
                    </div>
                  )}

                  {selectedOrder.payment?.status !==
                    'paid' &&
                    selectedOrder.payment?.method ===
                      'vodafone_cash' && (
                      <button
                        type="button"
                        disabled={
                          updatingOrderId ===
                          selectedOrder.id
                        }
                        onClick={() =>
                          handlePaymentConfirm(
                            selectedOrder.id
                          )
                        }
                        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-black transition"
                      >
                        {updatingOrderId ===
                        selectedOrder.id
                          ? 'جاري التأكيد...'
                          : 'تأكيد الدفع ✓'}
                      </button>
                    )}
                </div>
              </section>

              {/* Totals */}
              <section>
                <h3 className="font-black text-lg mb-3">
                  ملخص الحساب 💰
                </h3>

                <div className="bg-[#3D2314] text-white rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/70">
                      المنتجات
                    </span>

                    <span className="font-bold">
                      {formatPrice(
                        selectedOrder.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-white/70">
                      التوصيل
                    </span>

                    <span className="font-bold">
                      {formatPrice(
                        selectedOrder.deliveryFee
                      )}
                    </span>
                  </div>

                  <div className="border-t border-white/20 pt-3 flex justify-between text-lg">
                    <span className="font-black">
                      الإجمالي
                    </span>

                    <span className="font-black text-[#FFB000]">
                      {formatPrice(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Delivery */}
              <section>
                <div className="bg-orange-50 rounded-2xl p-4">
                  <p className="text-gray-500 text-sm">
                    طريقة الاستلام
                  </p>

                  <p className="font-black mt-1">
                    {selectedOrder.deliveryType ===
                    'delivery'
                      ? '🚚 توصيل للعنوان'
                      : '🏪 استلام من المكان'}
                  </p>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-5">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-[#3D2314] hover:bg-[#FF6600] text-white py-3 rounded-xl font-black transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}