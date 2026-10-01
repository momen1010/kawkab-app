import {
    collection,
    doc,
    serverTimestamp,
    writeBatch,
  } from 'firebase/firestore';
  
  import { db } from '../../firebase/config';
  import { categories } from '../../data/products';
  
  export async function migrateCategories() {
    const realCategories = categories.filter(
      (category) => category.id !== 'all'
    );
  
    if (realCategories.length === 0) {
      throw new Error('لا توجد تصنيفات لنقلها.');
    }
  
    const batch = writeBatch(db);
  
    realCategories.forEach((category, index) => {
      const categoryRef = doc(
        collection(db, 'categories'),
        category.id
      );
  
      batch.set(
        categoryRef,
        {
          id: category.id,
          name: category.name || '',
          nameAr: category.nameAr || '',
          icon: category.icon || '',
          sortOrder: index + 1,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  
    await batch.commit();
  
    return {
      count: realCategories.length,
    };
  }