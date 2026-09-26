import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/\\n/g, '\n')
  .trim();

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    `Firebase environment variables are missing: projectId=${Boolean(
      projectId
    )}, clientEmail=${Boolean(clientEmail)}, privateKey=${Boolean(
      privateKey
    )}`
  );
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

const DELIVERY_FEE = 20;
const FREE_DELIVERY_LIMIT = 150;
const MAX_ITEM_QUANTITY = 20;
const MAX_ITEMS = 50;

function sendJson(res, statusCode, data) {
  res.status(statusCode).json(data);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  return Math.min(
    Math.max(Math.floor(quantity), 1),
    MAX_ITEM_QUANTITY
  );
}

function getDeliveryFee(deliveryType, subtotal) {
  if (deliveryType !== 'delivery') {
    return 0;
  }

  if (subtotal >= FREE_DELIVERY_LIMIT) {
    return 0;
  }

  return DELIVERY_FEE;
}

function createTrackingToken() {
  return `${randomUUID()}${randomUUID()}`.replaceAll('-', '');
}

function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object') {
    return 'بيانات العميل غير صحيحة.';
  }

  const name = normalizeText(customer.name);
  const phone = normalizeText(customer.phone);
  const address = normalizeText(customer.address);
  const notes = normalizeText(customer.notes);

  if (name.length < 2 || name.length > 100) {
    return 'الاسم غير صحيح.';
  }

  if (phone.length < 8 || phone.length > 20) {
    return 'رقم الهاتف غير صحيح.';
  }

  if (address.length > 300) {
    return 'العنوان طويل جدًا.';
  }

  if (notes.length > 300) {
    return 'الملاحظات طويلة جدًا.';
  }

  return null;
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'السلة فارغة.';
  }

  if (items.length > MAX_ITEMS) {
    return 'عدد المنتجات في الطلب كبير جدًا.';
  }

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return 'بيانات منتج غير صحيحة.';
    }

    const productId = normalizeText(item.productId);

    if (!productId || productId.length > 200) {
      return 'معرف المنتج غير صحيح.';
    }

    const quantity = normalizeQuantity(item.quantity);

    if (!quantity) {
      return 'كمية المنتج غير صحيحة.';
    }
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      error: 'Method not allowed.',
    });
  }

  try {
    const body =
      req.body && typeof req.body === 'object'
        ? req.body
        : {};

    const {
      customer,
      deliveryType,
      items,
      paymentMethod,
      transactionId,
      orderMethod,
    } = body;

    const customerError = validateCustomer(customer);

    if (customerError) {
      return sendJson(res, 400, {
        success: false,
        error: customerError,
      });
    }

    if (!['delivery', 'pickup'].includes(deliveryType)) {
      return sendJson(res, 400, {
        success: false,
        error: 'طريقة الاستلام غير صحيحة.',
      });
    }

    if (
      deliveryType === 'delivery' &&
      normalizeText(customer.address).length === 0
    ) {
      return sendJson(res, 400, {
        success: false,
        error: 'عنوان التوصيل مطلوب.',
      });
    }

    const itemsError = validateItems(items);

    if (itemsError) {
      return sendJson(res, 400, {
        success: false,
        error: itemsError,
      });
    }

    if (!['cash', 'vodafone_cash'].includes(paymentMethod)) {
      return sendJson(res, 400, {
        success: false,
        error: 'طريقة الدفع غير صحيحة.',
      });
    }

    const safeTransactionId =
      paymentMethod === 'vodafone_cash'
        ? normalizeText(transactionId)
        : '';

    if (safeTransactionId.length > 100) {
      return sendJson(res, 400, {
        success: false,
        error: 'رقم العملية غير صحيح.',
      });
    }

    if (!['website', 'whatsapp'].includes(orderMethod)) {
      return sendJson(res, 400, {
        success: false,
        error: 'طريقة إرسال الطلب غير صحيحة.',
      });
    }

    /*
     * ---------------------------------------------------------
     * READ TRUSTED PRODUCTS FROM FIRESTORE
     * ---------------------------------------------------------
     *
     * لا نثق في:
     * - السعر القادم من العميل
     * - اسم المنتج القادم من العميل
     * - subtotal
     * - deliveryFee
     * - total
     *
     * السيرفر يقرأ الأسعار الحقيقية من Firestore.
     */

    const productIds = [
      ...new Set(
        items.map((item) => normalizeText(item.productId))
      ),
    ];

    const productSnapshots = await Promise.all(
      productIds.map((productId) =>
        db.collection('products').doc(productId).get()
      )
    );

    const productsMap = new Map();

    productSnapshots.forEach((snapshot) => {
      if (snapshot.exists) {
        productsMap.set(snapshot.id, {
          id: snapshot.id,
          ...snapshot.data(),
        });
      }
    });

    const trustedItems = [];

    for (const item of items) {
      const productId = normalizeText(item.productId);
      const quantity = normalizeQuantity(item.quantity);

      const product = productsMap.get(productId);

      if (!product) {
        return sendJson(res, 400, {
          success: false,
          error: `المنتج غير موجود: ${productId}`,
        });
      }

      const price = Number(product.price);

      if (!isValidNumber(price) || price < 0) {
        return sendJson(res, 500, {
          success: false,
          error: 'يوجد منتج بسعر غير صالح في قاعدة البيانات.',
        });
      }

      const safeOptions =
        item.options &&
        typeof item.options === 'object' &&
        !Array.isArray(item.options)
          ? item.options
          : {};

      trustedItems.push({
        productId,
        name:
          normalizeText(product.nameAr) ||
          normalizeText(product.name) ||
          'منتج',
        price,
        quantity,
        options: safeOptions,
      });
    }

    /*
     * ---------------------------------------------------------
     * SERVER-SIDE TOTAL CALCULATION
     * ---------------------------------------------------------
     */

    const subtotal = trustedItems.reduce(
      (sum, item) => {
        return sum + item.price * item.quantity;
      },
      0
    );

    const deliveryFee = getDeliveryFee(
      deliveryType,
      subtotal
    );

    const total = subtotal + deliveryFee;

    const trackingToken = createTrackingToken();

    /*
     * ---------------------------------------------------------
     * CREATE ORDER NUMBER + ORDER + TRACKING
     * ---------------------------------------------------------
     */

    const counterRef = db
      .collection('counters')
      .doc('orderNumber');

    const orderRef = db.collection('orders').doc();

    const trackingRef = db
      .collection('orderTracking')
      .doc(trackingToken);

    let orderNumber;

    await db.runTransaction(async (transaction) => {
      const counterSnapshot =
        await transaction.get(counterRef);

      if (!counterSnapshot.exists) {
        orderNumber = 1;

        transaction.set(counterRef, {
          value: 1,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        const currentValue = Number(
          counterSnapshot.data()?.value
        );

        if (
          !Number.isInteger(currentValue) ||
          currentValue < 0
        ) {
          throw new Error(
            'Order number counter is invalid.'
          );
        }

        orderNumber = currentValue + 1;

        transaction.update(counterRef, {
          value: orderNumber,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      const orderData = {
        orderNumber,

        trackingToken,

        customer: {
          name: normalizeText(customer.name),
          phone: normalizeText(customer.phone),
          address: normalizeText(customer.address),
          notes: normalizeText(customer.notes),
        },

        deliveryType,

        items: trustedItems,

        subtotal,

        deliveryFee,

        total,

        status: 'new',

        payment: {
          method: paymentMethod,
          transactionId: safeTransactionId,
          status:
            paymentMethod === 'cash'
              ? 'cash_on_delivery'
              : 'pending',
        },

        orderMethod,

        createdAt: FieldValue.serverTimestamp(),
      };

      const trackingData = {
        status: 'new',
        deliveryType,
        total,
      };

      transaction.set(orderRef, orderData);

      transaction.set(trackingRef, trackingData);
    });

    return sendJson(res, 200, {
      success: true,

      orderNumber,

      trackingToken,

      subtotal,

      deliveryFee,

      total,

      items: trustedItems,
    });
  } catch (error) {
    console.error('Create order API error:', error);

    return sendJson(res, 500, {
      success: false,
      error: 'تعذر إنشاء الطلب. حاول مرة أخرى.',
    });
  }
}