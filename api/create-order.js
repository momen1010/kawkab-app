import { randomUUID } from 'crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import {
  getFirestore,
  FieldValue,
} from 'firebase-admin/firestore';

const DEFAULT_SETTINGS = {
  restaurantName: 'كوكب السعادة',
  whatsappNumber: '201119346488',
  vodafoneCashNumber: '01119346488',
  deliveryFee: 20,
  freeDeliveryLimit: 150,
  ordersEnabled: true,
  closedMessage: 'نعتذر، استقبال الطلبات مغلق حاليًا.',
};

const MAX_ITEM_QUANTITY = 20;
const MAX_ITEMS = 50;
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 500;
const MAX_NOTES_LENGTH = 300;
const MAX_TRANSACTION_ID_LENGTH = 100;

function sendJson(res, status, data) {
  res.status(status).json(data);
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\s+/g, '').trim();
}

function normalizeSettings(data = {}) {
  const deliveryFee = Number(data.deliveryFee);
  const freeDeliveryLimit = Number(data.freeDeliveryLimit);

  return {
    restaurantName:
      typeof data.restaurantName === 'string' &&
      data.restaurantName.trim()
        ? data.restaurantName.trim()
        : DEFAULT_SETTINGS.restaurantName,

    whatsappNumber:
      typeof data.whatsappNumber === 'string'
        ? data.whatsappNumber.trim()
        : DEFAULT_SETTINGS.whatsappNumber,

    vodafoneCashNumber:
      typeof data.vodafoneCashNumber === 'string'
        ? data.vodafoneCashNumber.trim()
        : DEFAULT_SETTINGS.vodafoneCashNumber,

    deliveryFee:
      Number.isFinite(deliveryFee) && deliveryFee >= 0
        ? deliveryFee
        : DEFAULT_SETTINGS.deliveryFee,

    freeDeliveryLimit:
      Number.isFinite(freeDeliveryLimit) && freeDeliveryLimit >= 0
        ? freeDeliveryLimit
        : DEFAULT_SETTINGS.freeDeliveryLimit,

    ordersEnabled:
      typeof data.ordersEnabled === 'boolean'
        ? data.ordersEnabled
        : DEFAULT_SETTINGS.ordersEnabled,

    closedMessage:
      typeof data.closedMessage === 'string' &&
      data.closedMessage.trim()
        ? data.closedMessage.trim()
        : DEFAULT_SETTINGS.closedMessage,
  };
}

async function getRestaurantSettings(db) {
  const snapshot = await db
    .collection('settings')
    .doc('restaurant')
    .get();

  if (!snapshot.exists) {
    return DEFAULT_SETTINGS;
  }

  return normalizeSettings(snapshot.data());
}

function validateEgyptianPhone(phone) {
  return /^01[0125]\d{8}$/.test(phone);
}

function getFirebaseAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  return getFirestore();
}

export default async function handler(req, res) {
  const db = getFirebaseAdmin();

  /*
   * PUBLIC SETTINGS
   * Checkout يستخدم هذا الـ GET بدل القراءة المباشرة من Firestore.
   */
  if (req.method === 'GET') {
    try {
      const settings = await getRestaurantSettings(db);

      return sendJson(res, 200, {
        success: true,
        settings: {
          restaurantName: settings.restaurantName,
          whatsappNumber: settings.whatsappNumber,
          vodafoneCashNumber: settings.vodafoneCashNumber,
          deliveryFee: settings.deliveryFee,
          freeDeliveryLimit: settings.freeDeliveryLimit,
          ordersEnabled: settings.ordersEnabled,
          closedMessage: settings.closedMessage,
        },
      });
    } catch (error) {
      console.error('Restaurant settings API error:', error);

      return sendJson(res, 500, {
        success: false,
        error: 'تعذر تحميل إعدادات المطعم.',
      });
    }
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed.',
    });
  }

  try {
    /*
     * IMPORTANT:
     * الإعدادات يتم قراءتها من Firestore على السيرفر.
     * لا نعتمد على أي قيمة يرسلها الـFrontend.
     */
    const settings = await getRestaurantSettings(db);

    if (!settings.ordersEnabled) {
      return sendJson(res, 403, {
        success: false,
        error: settings.closedMessage,
      });
    }

    const {
      customer = {},
      deliveryType = 'delivery',
      items = [],
      paymentMethod = 'cash',
      transactionId = '',
      orderMethod = 'website',
    } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return sendJson(res, 400, {
        success: false,
        error: 'السلة فارغة.',
      });
    }

    if (items.length > MAX_ITEMS) {
      return sendJson(res, 400, {
        success: false,
        error: 'عدد المنتجات في الطلب كبير جدًا.',
      });
    }

    if (!['delivery', 'pickup'].includes(deliveryType)) {
      return sendJson(res, 400, {
        success: false,
        error: 'نوع الاستلام غير صحيح.',
      });
    }

    if (!['cash', 'vodafone_cash'].includes(paymentMethod)) {
      return sendJson(res, 400, {
        success: false,
        error: 'طريقة الدفع غير صحيحة.',
      });
    }

    if (!['website', 'whatsapp'].includes(orderMethod)) {
      return sendJson(res, 400, {
        success: false,
        error: 'طريقة الطلب غير صحيحة.',
      });
    }

    const name = String(customer.name || '').trim();
    const phone = normalizePhone(customer.phone);
    const address = String(customer.address || '').trim();
    const notes = String(customer.notes || '').trim();

    if (!name || name.length > MAX_NAME_LENGTH) {
      return sendJson(res, 400, {
        success: false,
        error: 'الاسم غير صحيح.',
      });
    }

    if (
      !phone ||
      phone.length > MAX_PHONE_LENGTH ||
      !validateEgyptianPhone(phone)
    ) {
      return sendJson(res, 400, {
        success: false,
        error: 'رقم الهاتف غير صحيح.',
      });
    }

    if (deliveryType === 'delivery' && !address) {
      return sendJson(res, 400, {
        success: false,
        error: 'عنوان التوصيل مطلوب.',
      });
    }

    if (address.length > MAX_ADDRESS_LENGTH) {
      return sendJson(res, 400, {
        success: false,
        error: 'العنوان طويل جدًا.',
      });
    }

    if (notes.length > MAX_NOTES_LENGTH) {
      return sendJson(res, 400, {
        success: false,
        error: 'الملاحظات طويلة جدًا.',
      });
    }

    const cleanTransactionId = String(transactionId || '').trim();

    if (paymentMethod === 'vodafone_cash') {
      if (
        !cleanTransactionId ||
        cleanTransactionId.length > MAX_TRANSACTION_ID_LENGTH
      ) {
        return sendJson(res, 400, {
          success: false,
          error: 'رقم عملية الدفع مطلوب.',
        });
      }
    }

    /*
     * اقرأ المنتجات من Firestore.
     * السعر والاسم الحقيقيان من السيرفر وليس من الـFrontend.
     */
    const productIds = [
      ...new Set(
        items
          .map((item) => String(item?.productId || '').trim())
          .filter(Boolean)
      ),
    ];

    if (!productIds.length) {
      return sendJson(res, 400, {
        success: false,
        error: 'المنتجات غير صحيحة.',
      });
    }

    const productSnapshots = await Promise.all(
      productIds.map((productId) =>
        db.collection('products').doc(productId).get()
      )
    );

    const productMap = new Map();

    for (const snapshot of productSnapshots) {
      if (snapshot.exists) {
        productMap.set(snapshot.id, {
          id: snapshot.id,
          ...snapshot.data(),
        });
      }
    }

    let subtotal = 0;
    const trustedItems = [];

    for (const item of items) {
      const productId = String(item?.productId || '').trim();
      const quantity = Number(item?.quantity);

      if (!productId || !Number.isInteger(quantity)) {
        return sendJson(res, 400, {
          success: false,
          error: 'بيانات المنتجات غير صحيحة.',
        });
      }

      if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
        return sendJson(res, 400, {
          success: false,
          error: 'كمية المنتج غير صحيحة.',
        });
      }

      const product = productMap.get(productId);

      if (!product) {
        return sendJson(res, 400, {
          success: false,
          error: 'أحد المنتجات لم يعد متاحًا.',
        });
      }

      if (product.active === false) {
        return sendJson(res, 400, {
          success: false,
          error: `المنتج "${product.name}" غير متاح حاليًا.`,
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return sendJson(res, 500, {
          success: false,
          error: 'يوجد سعر غير صالح لأحد المنتجات.',
        });
      }

      const itemTotal = price * quantity;
      subtotal += itemTotal;

      trustedItems.push({
        productId,
        name: String(product.name || ''),
        price,
        quantity,
        options:
          item?.options && typeof item.options === 'object'
            ? item.options
            : {},
        total: itemTotal,
      });
    }

    /*
     * DELIVERY FEE
     * القيمة هنا من Settings وليس رقمًا ثابتًا.
     */
    const deliveryFee =
      deliveryType === 'delivery' &&
      subtotal < settings.freeDeliveryLimit
        ? settings.deliveryFee
        : 0;

    const total = subtotal + deliveryFee;

    /*
     * Order number + order ID + tracking token
     */
    const counterRef = db.collection('counters').doc('orderNumber');

    const orderRef = db.collection('orders').doc();

    const trackingToken = `${randomUUID()}-${randomUUID()}`;

    const trackingRef = db
      .collection('orderTracking')
      .doc(trackingToken);

    const orderNumber = await db.runTransaction(async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);

      const currentNumber = counterSnapshot.exists
        ? Number(counterSnapshot.data()?.value || 0)
        : 0;

      const nextNumber = currentNumber + 1;

      transaction.set(
        counterRef,
        {
          value: nextNumber,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return nextNumber;
    });

    const orderData = {
      orderNumber,

      customer: {
        name,
        phone,
        address,
        notes,
      },

      deliveryType,

      items: trustedItems,

      subtotal,
      deliveryFee,
      total,

      payment: {
        method: paymentMethod,
        transactionId: cleanTransactionId,
        status:
          paymentMethod === 'cash'
            ? 'cash_on_delivery'
            : 'pending',
      },

      orderMethod,

      status: 'new',

      trackingToken,

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const trackingData = {
      orderId: orderRef.id,
      orderNumber,
      status: 'new',
      total,
      deliveryType,
      createdAt: FieldValue.serverTimestamp(),
    };

    const batch = db.batch();

    batch.set(orderRef, orderData);
    batch.set(trackingRef, trackingData);

    await batch.commit();

    return sendJson(res, 200, {
      success: true,

      orderId: orderRef.id,
      orderNumber,
      trackingToken,

      subtotal,
      deliveryFee,
      total,

      trustedItems,
    });
  } catch (error) {
    console.error('Create order error:', error);

    return sendJson(res, 500, {
      success: false,
      error: 'حدث خطأ أثناء إنشاء الطلب.',
    });
  }
}