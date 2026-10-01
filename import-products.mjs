import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const serviceAccountPath =
  './src/data/serviceAccountKey.json';

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(
    `Service account file not found: ${serviceAccountPath}`
  );
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const products = [
  // =========================
  // Coffee
  // =========================

  {
    id: 'coffee-1',
    name: 'Classic Espresso',
    nameAr: 'إسبريسو كلاسيك',
    description: 'Rich and bold single shot espresso',
    descriptionAr: 'إسبريسو مركز وقوي',
    price: 25,
    category: 'coffee',
    image:
      'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=400&fit=crop',
  },

  {
    id: 'coffee-2',
    name: 'Caramel Macchiato',
    nameAr: 'كارامل ماكياتو',
    description: 'Velvety espresso with caramel drizzle',
    descriptionAr: 'إسبريسو مخملي مع صوص الكارامل',
    price: 45,
    category: 'coffee',
    image:
      'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=400&fit=crop',
  },

  {
    id: 'coffee-3',
    name: 'Vanilla Latte',
    nameAr: 'لاتيه فانيليا',
    description: 'Smooth latte with vanilla essence',
    descriptionAr: 'لاتيه ناعم مع نكهة الفانيليا',
    price: 40,
    category: 'coffee',
    image:
      'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=400&fit=crop',
  },

  {
    id: 'coffee-4',
    name: 'Mocha Supreme',
    nameAr: 'موكا سوبريم',
    description: 'Decadent chocolate and coffee blend',
    descriptionAr: 'مزج الشوكولاتة والقهوة الفاخر',
    price: 50,
    category: 'coffee',
    image:
      'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&h=400&fit=crop',
  },

  {
    id: 'coffee-5',
    name: 'Cold Brew',
    nameAr: 'كولد برو',
    description: 'Smooth cold-brewed coffee',
    descriptionAr: 'قهوة باردة منعشة',
    price: 35,
    category: 'coffee',
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
  },

  {
    id: 'coffee-6',
    name: 'Hazelnut Cappuccino',
    nameAr: 'كابتشينو بندق',
    description: 'Creamy cappuccino with hazelnut',
    descriptionAr: 'كابتشينو كريمي بنكهة البندق',
    price: 48,
    category: 'coffee',
    image:
      'https://images.unsplash.com/photo-1572442388796-11668a67e53b?w=400&h=400&fit=crop',
  },

  // =========================
  // Tea
  // =========================

  {
    id: 'tea-1',
    name: 'Royal Arabic Tea',
    nameAr: 'شاي عربي ملكي',
    description: 'Traditional spiced Arabic tea',
    descriptionAr: 'شاي عربي تقليدي بالتوابل',
    price: 20,
    category: 'tea',
    image:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
  },

  {
    id: 'tea-2',
    name: 'Green Tea Mint',
    nameAr: 'شاي أخضر بالنعناع',
    description: 'Refreshing green tea with fresh mint',
    descriptionAr: 'شاي أخضر منعش مع النعناع الطازج',
    price: 22,
    category: 'tea',
    image:
      'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
  },

  {
    id: 'tea-3',
    name: 'Chai Latte',
    nameAr: 'تشاي لاتيه',
    description: 'Aromatic spiced milk tea',
    descriptionAr: 'شاي بالحليب والتوابل العطرية',
    price: 30,
    category: 'tea',
    image:
      'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=400&fit=crop',
  },

  {
    id: 'tea-4',
    name: 'Earl Grey',
    nameAr: 'إيرل جراي',
    description: 'Classic bergamot-infused tea',
    descriptionAr: 'شاي كلاسيكي بنكهة البرغموت العطرية',
    price: 28,
    category: 'tea',
    image:
      'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=400&h=400&fit=crop',
  },

  // =========================
  // Pastries
  // =========================

  {
    id: 'pastry-1',
    name: 'Croissant',
    nameAr: 'كرواسون',
    description: 'Buttery French pastry',
    descriptionAr: 'مخبوزات فرنسية هشة بالزبدة',
    price: 30,
    category: 'pastry',
    image:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop',
  },

  {
    id: 'pastry-2',
    name: 'Chocolate Muffin',
    nameAr: 'مافن شوكولاتة',
    description: 'Rich chocolate muffin',
    descriptionAr: 'مافن غني بالشوكولاتة',
    price: 28,
    category: 'pastry',
    image:
      'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=400&fit=crop',
  },

  {
    id: 'pastry-3',
    name: 'Cheesecake',
    nameAr: 'تشيز كيك',
    description: 'Creamy New York style',
    descriptionAr: 'تشيز كيك كريمي على طريقة نيويورك',
    price: 45,
    category: 'pastry',
    image:
      'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&h=400&fit=crop',
  },

  {
    id: 'pastry-4',
    name: 'Tiramisu',
    nameAr: 'تيراميسو',
    description: 'Classic Italian coffee-flavored',
    descriptionAr: 'حلوى إيطالية كلاسيكية بنكهة القهوة',
    price: 50,
    category: 'pastry',
    image:
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=400&fit=crop',
  },

  {
    id: 'pastry-5',
    name: 'Danish Pastry',
    nameAr: 'مخبوزات دنماركية',
    description: 'Flaky pastry with cream',
    descriptionAr: 'مخبوزات هشة محشوة بالكريمة',
    price: 32,
    category: 'pastry',
    image:
      'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&h=400&fit=crop',
  },

  // =========================
  // Waffles
  // =========================

  {
    id: 'waffle-1',
    name: 'Classic Mix Waffle',
    nameAr: 'وافل مكس شوكولاتة ومكسرات ومارشميلو',
    description:
      'Golden crispy waffle with chocolate, nuts & marshmallow',
    descriptionAr:
      'وافل مقرمش مع مكس شوكولاتة ومكسرات ومارشميلو',
    price: 35,
    category: 'waffle',
    image: '/src/assets/waffel-1.jpeg',
  },

  {
    id: 'waffle-2',
    name: 'Chocolate Waffle',
    nameAr: 'وافل مكس شوكولاتة ومكسرات',
    description:
      'Rich chocolate covered waffle with nuts',
    descriptionAr:
      'وافل مغطى بجميع أنواع الشوكولاتة الغنية والمكسرات',
    price: 40,
    category: 'waffle',
    image: '/src/assets/waffel-2.jpeg',
  },

  {
    id: 'waffle-3',
    name: 'Strawberry & Hohos Waffle',
    nameAr: 'وافل صوصات وهوهوز',
    description:
      'Fresh strawberry topped waffle with Hohos',
    descriptionAr:
      'وافل مغطى بجميع الصوصات الطازجة والهوهوز اللذيذ',
    price: 42,
    category: 'waffle',
    image: '/src/assets/waffel-3.jpeg',
  },

  {
    id: 'waffle-5',
    name: 'Caramel Waffle',
    nameAr: 'وافل كراميل',
    description: 'Warm waffle with caramel sauce',
    descriptionAr: 'وافل دافئ مع صوص الكراميل',
    price: 45,
    category: 'waffle',
    image: '/src/assets/waffel-5.jpeg',
  },

  {
    id: 'waffle-6',
    name: 'Kawkab Qashtota',
    nameAr: 'قشطوطة الكوكب',
    description:
      'Special signature dessert with extra cream & toppings',
    descriptionAr:
      'قشطوطة الدمار المار الخاصة بهابي درينك',
    price: 5,
    category: 'waffle',
    image: '/src/assets/waffel-6.jpeg',
  },
];

async function importProducts() {
  const batch = db.batch();

  for (const product of products) {
    const { id, ...data } = product;

    const ref = db.collection('products').doc(id);

    batch.set(
      ref,
      {
        ...data,
        updatedAt:
          new Date(),
      },
      {
        merge: true,
      }
    );

    console.log(`Prepared: ${id}`);
  }

  await batch.commit();

  console.log(
    `\nSuccessfully imported ${products.length} products.`
  );
}

importProducts().catch((error) => {
  console.error('\nImport failed:');
  console.error(error);
  process.exit(1);
});