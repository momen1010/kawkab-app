import {
    doc,
    serverTimestamp,
    writeBatch,
  } from 'firebase/firestore';
  
  import { db } from '../../firebase/config';
  import { products } from '../../data/products';
  
  export async function migrateProducts() {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error(
        'لا توجد منتجات لنقلها.'
      );
    }
  
    const batch = writeBatch(db);
  
    products.forEach((product, index) => {
      const productRef = doc(
        db,
        'products',
        product.id
      );
  
      batch.set(
        productRef,
        {
          id: product.id,
  
          name: product.name || '',
          nameAr: product.nameAr || '',
  
          description:
            product.description || '',
          descriptionAr:
            product.descriptionAr || '',
  
          price: Number(product.price || 0),
  
          category: product.category || '',
  
          image: product.image || '',
  
          isAvailable: true,
  
          sortOrder: index + 1,
  
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );
    });
  
    await batch.commit();
  
    return {
      count: products.length,
    };
  }