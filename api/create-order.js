import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
            /\\n/g,
            '\n'
          ),
        }),
      });

const db = getFirestore(app);

/*
 * =========================
 * Constants
 * =========================
 */

const DELIVERY_FEE = 20;
const FREE_DELIVERY_LIMIT = 150;
const MAX_ITEM_QUANTITY = 20;
const MAX_ITEMS = 50;

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_ADDRESS_LENGTH = 300;
const MAX_NOTES_LENGTH = 300;
const MAX_TRANSACTION_ID_LENGTH = 100;

const VALID_DELIVERY_TYPES = [
  'delivery',
  'pickup',
];

const VALID_PAYMENT_METHODS = [
  'cash',
  'vodafone_cash',
];

const VALID_ORDER_METHODS = [
  'website',
  'whatsapp',
];

/*
 * =========================
 * Helpers
 * =========================
 */

function normalizeText(value, maxLength) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, maxLength);
}

function normalizePhone(value) {
  return String(value || '')
    .trim()
    .replace(/[\s()-]/g, '');
}

function isValidEgyptianPhone(phone) {
  return /^(?:01\d{9}|\+201\d{9}|201\d{9})$/.test(
    phone
  );
}

function getSafeQuantity(quantity) {
  const parsed = Number(quantity);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(
    Math.max(Math.floor(parsed), 1),
    MAX_ITEM_QUANTITY
  );
}

function createTrackingToken() {
  return (
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '')
  );
}

/*
 * =========================
 * API
 * =========================
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.',
    });
  }

  try {
    /*
     * =========================
     * Request body
     * =========================
     */

    const {
      customer,
      deliveryType,
      items,
      paymentMethod,
      transactionId,
      orderMethod,
    } = req.body || {};

    /*
     * =========================
     * Basic validation
     * =========================
     */

    if (!customer || typeof customer !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'بيانات العميل غير صالحة.',
      });
    }

    if (
      !VALID_DELIVERY_TYPES.includes(
        deliveryType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'نوع التوصيل غير صالح.',
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > MAX_ITEMS
    ) {
      return res.status(400).json({
        success: false,
        message: 'المنتجات غير صالحة.',
      });
    }

    if (
      !VALID_PAYMENT_METHODS.includes(
        paymentMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'طريقة الدفع غير صالحة.',
      });
    }

    if (
      !VALID_ORDER_METHODS.includes(
        orderMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'طريقة إرسال الطلب غير صالحة.',
      });
    }

    /*
     * =========================
     * Customer validation
     * =========================
     */

    const name = normalizeText(
      customer.name,
      MAX_NAME_LENGTH
    );

    const phone = normalizePhone(
      customer.phone
    );

    const address =
      deliveryType === 'delivery'
        ? normalizeText(
            customer.address,
            MAX_ADDRESS_LENGTH
          )
        : '';

    const notes = normalizeText(
      customer.notes,
      MAX_NOTES_LENGTH
    );

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'الاسم غير صالح.',
      });
    }

    if (
      phone.length > MAX_PHONE_LENGTH ||
      !isValidEgyptianPhone(phone)
    ) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف غير صالح.',
      });
    }

    if (
      deliveryType === 'delivery' &&
      address.length < 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'عنوان التوصيل غير صالح.',
      });
    }

    /*
     * =========================
     * Payment validation
     * =========================
     */

    const safeTransactionId =
      paymentMethod === 'vodafone_cash'
        ? normalizeText(
            transactionId,
            MAX_TRANSACTION_ID_LENGTH
          )
        : '';

    if (
      paymentMethod === 'vodafone_cash' &&
      safeTransactionId.length < 3
    ) {
      return res.status(400).json({
        success: false,
        message:
          'رقم عملية Vodafone Cash غير صالح.',
      });
    }

    /*
     * =========================
     * Read trusted products
     * =========================
     *
     * IMPORTANT:
     * Prices come ONLY from Firestore.
     * Client prices are completely ignored.
     */

    const productIds = [
      ...new Set(
        items.map((item) =>
          String(item?.productId || '')
        )
      ),
    ];

    if (
      productIds.some(
        (productId) => !productId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'يوجد منتج غير صالح.',
      });
    }

    const productRefs = productIds.map((id) =>
      db.collection('products').doc(id)
    );

    const productSnapshots =
      await db.getAll(...productRefs);

    const productsMap = new Map();

    productSnapshots.forEach((snapshot) => {
      if (snapshot.exists) {
        productsMap.set(snapshot.id, {
          id: snapshot.id,
          ...snapshot.data(),
        });
      }
    });

    /*
     * =========================
     * Calculate trusted items
     * =========================
     */

    const trustedItems = [];

    let subtotal = 0;

    for (const item of items) {
      const productId = String(
        item.productId || ''
      );

      const product =
        productsMap.get(productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message:
            'أحد المنتجات لم يعد متاحًا.',
        });
      }

      const quantity = getSafeQuantity(
        item.quantity
      );

      if (
        quantity < 1 ||
        quantity > MAX_ITEM_QUANTITY
      ) {
        return res.status(400).json({
          success: false,
          message:
            'كمية أحد المنتجات غير صالحة.',
        });
      }

      const price = Number(product.price);

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return res.status(500).json({
          success: false,
          message:
            'سعر أحد المنتجات غير صالح.',
        });
      }

      const itemTotal =
        price * quantity;

      subtotal += itemTotal;

      trustedItems.push({
        productId,
        name: normalizeText(
          product.nameAr,
          200
        ),
        price,
        quantity,
        options:
          item.options &&
          typeof item.options === 'object'
            ? item.options
            : {},
      });
    }

    /*
     * =========================
     * Delivery
     * =========================
     */

    const deliveryFee =
      deliveryType === 'delivery'
        ? subtotal >= FREE_DELIVERY_LIMIT
          ? 0
          : DELIVERY_FEE
        : 0;

    const total =
      subtotal + deliveryFee;

    /*
     * =========================
     * Tracking
     * =========================
     */

    const trackingToken =
      createTrackingToken();

    /*
     * =========================
     * Order number
     * =========================
     */

    const counterRef = db
      .collection('counters')
      .doc('orderNumber');

    const orderNumber =
      await db.runTransaction(
        async (transaction) => {
          const counterSnap =
            await transaction.get(
              counterRef
            );

          let currentValue = 0;

          if (counterSnap.exists) {
            const storedValue = Number(
              counterSnap.data()?.value
            );

            if (
              Number.isFinite(
                storedValue
              ) &&
              storedValue >= 0
            ) {
              currentValue =
                Math.floor(
                  storedValue
                );
            }
          }

          const nextNumber =
            currentValue + 1;

          transaction.set(
            counterRef,
            {
              value: nextNumber,
              updatedAt:
                FieldValue.serverTimestamp(),
            },
            {
              merge: true,
            }
          );

          return nextNumber;
        }
      );

    /*
     * =========================
     * Order
     * =========================
     */

    const orderRef = db
      .collection('orders')
      .doc();

    const orderData = {
      orderNumber,

      trackingToken,

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

      status: 'new',

      payment: {
        method: paymentMethod,

        transactionId:
          safeTransactionId,

        status:
          paymentMethod === 'vodafone_cash'
            ? 'pending'
            : 'cash_on_delivery',
      },

      orderMethod,

      createdAt:
        FieldValue.serverTimestamp(),
    };

    /*
     * =========================
     * Tracking
     * =========================
     */

    const trackingRef = db
      .collection('orderTracking')
      .doc(trackingToken);

    /*
     * Write both documents together
     */

    const batch = db.batch();

    batch.set(
      orderRef,
      orderData
    );

    batch.set(
      trackingRef,
      {
        status: 'new',
        deliveryType,
        total,
      }
    );

    await batch.commit();

    /*
     * =========================
     * Response
     * =========================
     */

    return res.status(200).json({
      success: true,

      orderNumber,

      trackingToken,

      subtotal,

      deliveryFee,

      total,

      items: trustedItems,
    });
  } catch (error) {
    console.error(
      'Create order API error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'حدث خطأ أثناء إنشاء الطلب.',
    });
  }
}