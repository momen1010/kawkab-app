// src/AdminDashboard.jsx

import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from 'firebase/firestore';

import { db } from './firebase/config';

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  // الطلب المختار للتفاصيل
  const [selectedOrder, setSelectedOrder] = useState(null);

  // إشعار الطلب الجديد
  const [newOrderNotification, setNewOrderNotification] =
    useState(null);

  // لمعرفة الطلبات الجديدة فقط
  const previousOrderIds = useRef(new Set());
  const firstLoad = useRef(true);

  // =========================
  // جلب الطلبات من Firebase
  // =========================

  useEffect(() => {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        // =========================
        // اكتشاف الطلب الجديد
        // =========================

        const currentOrderIds = new Set(
          ordersData.map((order) => order.id)
        );

        if (firstLoad.current) {
          previousOrderIds.current = currentOrderIds;
          firstLoad.current = false;
        } else {
          const newOrders = ordersData.filter(
            (order) =>
              !previousOrderIds.current.has(order.id)
          );

          if (newOrders.length > 0) {
            const newestOrder = newOrders[0];

            setNewOrderNotification(newestOrder);

            // Browser Notification
            if (
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              new Notification(
                '🍩 طلب جديد - كوكب السعادة',
                {
                  body: `طلب جديد من ${
                    newestOrder.customer?.name ||
                    'عميل'
                  } - ${
                    newestOrder.total || 0
                  } ج.م`,
                }
              );
            }

            // طلب إذن الإشعارات
            if (
              'Notification' in window &&
              Notification.permission === 'default'
            ) {
              Notification.requestPermission();
            }
          }

          previousOrderIds.current =
            currentOrderIds;
        }

        setOrders(ordersData);
console.log("ORDERS:", ordersData);
        setLoading(false);
      },
      (error) => {
        console.error(
          'Error loading orders:',
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================
  // تغيير حالة الطلب
  // =========================

  const updateOrderStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingOrder(orderId);

      const orderRef = doc(
        db,
        'orders',
        orderId
      );

      await updateDoc(orderRef, {
        status: newStatus,
      });
    } catch (error) {
      console.error(
        'Error updating order status:',
        error
      );

      alert(
        'حدث خطأ أثناء تحديث حالة الطلب.'
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  // =========================
  // إحصائيات
  // =========================

  const totalOrders = orders.length;

  const newOrders = orders.filter(
    (order) => order.status === 'new'
  ).length;

  const totalSales = orders.reduce(
    (sum, order) =>
      sum + (Number(order.total) || 0),
    0
  );

  const deliveryOrders = orders.filter(
    (order) =>
      order.deliveryType === 'delivery'
  ).length;

  // =========================
  // تنسيق التاريخ
  // =========================

  const formatDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return 'جاري الحفظ...';
    }

    return timestamp
      .toDate()
      .toLocaleString('ar-EG');
  };

  // =========================
  // معلومات الحالة
  // =========================

  const getStatusInfo = (status) => {
    const statuses = {
      new: {
        label: '🆕 جديد',
        className:
          'bg-orange-50 text-orange-600',
      },

      preparing: {
        label: '👨‍🍳 قيد التجهيز',
        className:
          'bg-yellow-50 text-yellow-700',
      },

      out_for_delivery: {
        label: '🛵 قيد التوصيل',
        className:
          'bg-blue-50 text-blue-600',
      },

      delivered: {
        label: '✅ تم التسليم',
        className:
          'bg-green-50 text-green-600',
      },

      cancelled: {
        label: '❌ ملغي',
        className:
          'bg-red-50 text-red-600',
      },
    };

    return (
      statuses[status] || {
        label: 'غير محدد',
        className:
          'bg-gray-100 text-gray-600',
      }
    );
  };

  // =========================
  // إغلاق إشعار الطلب
  // =========================

  const closeNewOrderNotification = () => {
    setNewOrderNotification(null);
  };

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#FFF8F3] flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">
            🍩
          </div>

          <p className="font-bold text-gray-500">
            جاري تحميل لوحة التحكم...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#FFF8F3] p-6 md:p-10"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">

        {/* =========================
            إشعار طلب جديد
        ========================= */}

        {newOrderNotification && (
          <div className="fixed top-5 left-5 right-5 md:left-auto md:w-[380px] z-50 animate-bounce">

            <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#FF6600] p-5">

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl shrink-0">
                  🔔
                </div>

                <div className="flex-1">

                  <div className="flex items-center justify-between gap-2">

                    <h3 className="font-black text-[#3D2314]">
                      طلب جديد! 🎉
                    </h3>

                    <button
                      onClick={
                        closeNewOrderNotification
                      }
                      className="text-gray-400 hover:text-red-500 text-xl"
                    >
                      ×
                    </button>

                  </div>

                  <p className="text-sm font-bold text-gray-600 mt-2">
                    {newOrderNotification.customer
                      ?.name || 'عميل جديد'}
                  </p>

                  <p className="text-sm text-[#FF6600] font-black mt-1">
                    {newOrderNotification.total ||
                      0}{' '}
                    ج.م
                  </p>

                  <div className="flex gap-2 mt-4">

                    <button
                      onClick={() => {
                        setSelectedOrder(
                          newOrderNotification
                        );
                        setNewOrderNotification(
                          null
                        );
                      }}
                      className="flex-1 bg-[#FF6600] text-white py-2.5 rounded-xl text-xs font-black hover:bg-orange-600 transition"
                    >
                      عرض الطلب
                    </button>

                    <button
                      onClick={
                        closeNewOrderNotification
                      }
                      className="px-4 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-xs font-black"
                    >
                      إغلاق
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* =========================
            العنوان
        ========================= */}

        <div className="mb-8">

          <h1 className="text-3xl font-black text-[#3D2314]">
            لوحة التحكم 📊
          </h1>

          <p className="text-gray-500 mt-2">
            إدارة طلبات كوكب السعادة
          </p>

        </div>

        {/* =========================
            الإحصائيات
        ========================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {/* إجمالي الطلبات */}

          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-bold text-gray-500">
                  إجمالي الطلبات
                </p>

                <h2 className="text-3xl font-black text-[#3D2314] mt-2">
                  {totalOrders}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-2xl">
                📦
              </div>

            </div>

          </div>

          {/* الطلبات الجديدة */}

          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-bold text-gray-500">
                  طلبات جديدة
                </p>

                <h2 className="text-3xl font-black text-[#FF6600] mt-2">
                  {newOrders}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">
                🆕
              </div>

            </div>

          </div>

          {/* المبيعات */}

          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-bold text-gray-500">
                  إجمالي المبيعات
                </p>

                <h2 className="text-3xl font-black text-[#27AE60] mt-2">
                  {totalSales}

                  <span className="text-sm mr-1">
                    ج.م
                  </span>
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl">
                💰
              </div>

            </div>

          </div>

          {/* التوصيل */}

          <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm font-bold text-gray-500">
                  طلبات التوصيل
                </p>

                <h2 className="text-3xl font-black text-[#3D2314] mt-2">
                  {deliveryOrders}
                </h2>

              </div>

              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
                🛵
              </div>

            </div>

          </div>

        </div>

        {/* =========================
            الطلبات
        ========================= */}

        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">

          <div className="p-6 border-b border-orange-100">

            <div className="flex items-center justify-between">

              <div>

              <div className="flex items-center gap-3">
  <h2 className="text-xl font-black text-[#3D2314]">
    الطلبات 📋
  </h2>

  {newOrders > 0 && (
    <span className="min-w-[28px] h-7 px-2 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black animate-pulse">
      {newOrders}
    </span>
  )}
</div>

                <p className="text-sm text-gray-500 mt-1">
                  إدارة الطلبات وتحديث حالتها
                </p>

              </div>

              <span className="text-2xl">
                📦
              </span>

            </div>

          </div>

          {/* لا توجد طلبات */}

          {orders.length === 0 && (
            <div className="p-10 text-center">

              <div className="text-5xl mb-4">
                📦
              </div>

              <p className="font-bold text-gray-500">
                لا توجد طلبات حتى الآن
              </p>

            </div>
          )}

          {/* جدول الطلبات */}

          {orders.length > 0 && (
            <div className="overflow-x-auto">

              <table className="w-full text-right">

                <thead className="bg-[#FFF8F3]">

                  <tr>

                    <th className="p-4 text-sm font-black text-[#3D2314]">
                      الطلب
                    </th>

                    <th className="p-4 text-sm font-black text-[#3D2314]">
                      العميل
                    </th>

                    <th className="p-4 text-sm font-black text-[#3D2314]">
                      النوع
                    </th>

                    <th className="p-4 text-sm font-black text-[#3D2314]">
                      الإجمالي
                    </th>

                    <th className="p-4 text-sm font-black text-[#3D2314]">
                      الحالة
                    </th>

                    <th className="p-4 text-sm font-black text-[#3D2314]">
                      التاريخ
                    </th>

                    <th className="p-4 text-sm font-black text-[#3D2314]">
                      التفاصيل
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {orders.map((order) => {

                    const statusInfo =
                      getStatusInfo(
                        order.status
                      );

                    return (
                      <tr
                        key={order.id}
                        className="border-t border-orange-50 hover:bg-[#FFF8F3] transition"
                      >

                        {/* الطلب */}

                        <td className="p-4">

                          <span className="font-black text-[#FF6600] text-xs">
                            #{order.id.slice(0, 8)}
                          </span>

                        </td>

                        {/* العميل */}

                        <td className="p-4">

                          <div>

                            <p className="font-black text-[#3D2314]">
                              {order.customer?.name ||
                                'غير معروف'}
                            </p>

                            <p className="text-xs text-gray-500 mt-1">
                              {order.customer?.phone ||
                                '-'}
                            </p>

                          </div>

                        </td>

                        {/* النوع */}

                        <td className="p-4">

                          {order.deliveryType ===
                          'delivery' ? (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                              🛵 توصيل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold">
                              🏪 استلام
                            </span>
                          )}

                        </td>

                        {/* الإجمالي */}

                        <td className="p-4">

                          <span className="font-black text-[#3D2314]">
                            {order.total || 0}{' '}
                            ج.م
                          </span>

                        </td>

                        {/* الحالة */}

                        <td className="p-4">

                          <div className="flex flex-col gap-2">

                            <span
                              className={`inline-flex w-fit items-center px-3 py-1 rounded-full text-xs font-bold ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </span>

                            <select
                              value={
                                order.status ||
                                'new'
                              }
                              disabled={
                                updatingOrder ===
                                order.id
                              }
                              onChange={(e) =>
                                updateOrderStatus(
                                  order.id,
                                  e.target.value
                                )
                              }
                              className="border border-orange-100 rounded-xl px-3 py-2 text-xs font-bold bg-white text-[#3D2314] focus:outline-none focus:border-[#FF6600] disabled:bg-gray-100"
                            >

                              <option value="new">
                                🆕 جديد
                              </option>

                              <option value="preparing">
                                👨‍🍳 قيد التجهيز
                              </option>

                              <option value="out_for_delivery">
                                🛵 قيد التوصيل
                              </option>

                              <option value="delivered">
                                ✅ تم التسليم
                              </option>

                              <option value="cancelled">
                                ❌ ملغي
                              </option>

                            </select>

                            {updatingOrder ===
                              order.id && (
                              <span className="text-[10px] text-gray-400">
                                جاري التحديث...
                              </span>
                            )}

                          </div>

                        </td>

                        {/* التاريخ */}

                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        {/* التفاصيل */}

                        <td className="p-4">

                          <button
                            onClick={() =>
                              setSelectedOrder(
                                order
                              )
                            }
                            className="bg-[#FFF0E6] text-[#FF6600] hover:bg-[#FF6600] hover:text-white px-4 py-2 rounded-xl text-xs font-black transition"
                          >
                            👁️ عرض
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* ==================================================
          نافذة تفاصيل الطلب
      ================================================== */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Header */}

            <div className="p-6 border-b border-orange-100 flex items-center justify-between sticky top-0 bg-white z-10">

              <div>

                <p className="text-xs text-gray-500 mb-1">
                  تفاصيل الطلب
                </p>

                <h2 className="text-xl font-black text-[#3D2314]">
                  #{selectedOrder.id}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 text-2xl transition"
              >
                ×
              </button>

            </div>

            <div className="p-6 space-y-5">

              {/* بيانات العميل */}

              <div className="bg-[#FFF8F3] rounded-2xl p-5">

                <h3 className="font-black text-[#3D2314] mb-4">
                  👤 بيانات العميل
                </h3>

                <div className="space-y-3 text-sm">

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      الاسم
                    </span>

                    <span className="font-black text-[#3D2314]">
                      {selectedOrder.customer
                        ?.name || '-'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      الهاتف
                    </span>

                    <span className="font-black text-[#3D2314]">
                      {selectedOrder.customer
                        ?.phone || '-'}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      النوع
                    </span>

                    <span className="font-black text-[#3D2314]">
                      {selectedOrder.deliveryType ===
                      'delivery'
                        ? '🛵 توصيل'
                        : '🏪 استلام من الفرع'}
                    </span>
                  </div>

                  {selectedOrder.deliveryType ===
                    'delivery' && (
                    <div>

                      <p className="text-gray-500 mb-1">
                        العنوان
                      </p>

                      <p className="font-bold text-[#3D2314] bg-white rounded-xl p-3">
                        {selectedOrder.customer
                          ?.address || '-'}
                      </p>

                    </div>
                  )}

                  {selectedOrder.customer?.notes && (
                    <div>

                      <p className="text-gray-500 mb-1">
                        الملاحظات
                      </p>

                      <p className="font-bold text-[#3D2314] bg-white rounded-xl p-3">
                        📝{' '}
                        {
                          selectedOrder.customer
                            .notes
                        }
                      </p>

                    </div>
                  )}

                </div>

              </div>

              {/* حالة الطلب */}

              <div className="bg-white border border-orange-100 rounded-2xl p-5">

                <div className="flex items-center justify-between gap-3">

                  <div>

                    <h3 className="font-black text-[#3D2314]">
                      حالة الطلب
                    </h3>

                    <p className="text-xs text-gray-500 mt-1">
                      يمكنك تغيير الحالة من هنا
                    </p>

                  </div>

                  <span
                    className={`px-3 py-2 rounded-full text-xs font-black ${
                      getStatusInfo(
                        selectedOrder.status
                      ).className
                    }`}
                  >
                    {
                      getStatusInfo(
                        selectedOrder.status
                      ).label
                    }
                  </span>

                </div>

                <select
                  value={
                    selectedOrder.status ||
                    'new'
                  }
                  disabled={
                    updatingOrder ===
                    selectedOrder.id
                  }
                  onChange={async (e) => {

                    const newStatus =
                      e.target.value;

                    await updateOrderStatus(
                      selectedOrder.id,
                      newStatus
                    );

                    setSelectedOrder(
                      (prev) => ({
                        ...prev,
                        status: newStatus,
                      })
                    );

                  }}
                  className="w-full mt-4 border border-orange-100 rounded-xl px-4 py-3 text-sm font-bold text-[#3D2314] bg-white focus:outline-none focus:border-[#FF6600]"
                >

                  <option value="new">
                    🆕 جديد
                  </option>

                  <option value="preparing">
                    👨‍🍳 قيد التجهيز
                  </option>

                  <option value="out_for_delivery">
                    🛵 قيد التوصيل
                  </option>

                  <option value="delivered">
                    ✅ تم التسليم
                  </option>

                  <option value="cancelled">
                    ❌ ملغي
                  </option>

                </select>

              </div>

              {/* المنتجات */}

              <div className="border border-orange-100 rounded-2xl overflow-hidden">

                <div className="p-5 bg-[#FFF8F3] border-b border-orange-100">

                  <h3 className="font-black text-[#3D2314]">
                    🍩 تفاصيل المنتجات
                  </h3>

                </div>

                <div className="divide-y divide-orange-50">

                  {selectedOrder.items?.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="p-5"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <h4 className="font-black text-[#3D2314]">
                              {item.name ||
                                'منتج'}
                            </h4>

                            <p className="text-xs text-gray-500 mt-1">
                              الكمية: x
                              {item.quantity}
                            </p>

                            {item.options
                              ?.size && (
                              <p className="text-xs text-gray-500 mt-1">
                                📏 الحجم:{' '}
                                {
                                  item
                                    .options
                                    .size
                                }
                              </p>
                            )}

                            {item.options
                              ?.sauces &&
                              Array.isArray(
                                item.options
                                  .sauces
                              ) &&
                              item.options.sauces
                                .length >
                                0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  🍫 الصوصات:{' '}
                                  {item.options.sauces.join(
                                    '، '
                                  )}
                                </p>
                              )}

                          </div>

                          <div className="text-left">

                            <p className="font-black text-[#FF6600]">
                              {(Number(
                                item.price
                              ) || 0) *
                                (Number(
                                  item.quantity
                                ) || 0)}{' '}
                              ج.م
                            </p>

                            <p className="text-[10px] text-gray-400 mt-1">
                              {item.price || 0}{' '}
                              ج.م / قطعة
                            </p>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* الحساب */}

              <div className="bg-[#3D2314] text-white rounded-2xl p-5">

                <h3 className="font-black mb-4">
                  💰 ملخص الحساب
                </h3>

                <div className="space-y-3 text-sm">

                  <div className="flex justify-between">
                    <span className="text-gray-300">
                      المشتريات
                    </span>

                    <span className="font-bold">
                      {selectedOrder.subtotal ||
                        0}{' '}
                      ج.م
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-300">
                      التوصيل
                    </span>

                    <span className="font-bold">
                      {selectedOrder.deliveryFee ||
                        0}{' '}
                      ج.م
                    </span>
                  </div>

                  <div className="border-t border-white/20 pt-3 flex justify-between">

                    <span className="font-black">
                      الإجمالي النهائي
                    </span>

                    <span className="text-xl font-black text-[#FFB000]">
                      {selectedOrder.total ||
                        0}{' '}
                      ج.م
                    </span>

                  </div>

                </div>

              </div>

              {/* التاريخ */}

              <div className="text-center text-xs text-gray-400">
                تاريخ الطلب:{' '}
                {formatDate(
                  selectedOrder.createdAt
                )}
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}

export default AdminDashboard;