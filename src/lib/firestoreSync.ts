
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  Product,
  Sale,
  Purchase,
  CashTransaction,
} from "@/types";

const STORAGE_KEYS = {
  products: "zevasewa_products",
  sales: "zevasewa_sales",
  purchases: "zevasewa_purchases",
  cashTransactions: "zevasewa_cash_transactions",
};

const OWNER_KEY = "zevasewa_data_owner_uid";

interface BusinessData {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  cashTransactions: CashTransaction[];
}

// Prevent cloud updates from triggering another cloud upload.
let applyingRemoteUpdate = false;

export function isApplyingRemoteUpdate(): boolean {
  return applyingRemoteUpdate;
}

function readLocalArray<T>(key: string): T[] {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) return [];

    const parsed: unknown = JSON.parse(saved);

    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function getLocalData(): BusinessData {
  return {
    products: readLocalArray<Product>(STORAGE_KEYS.products),
    sales: readLocalArray<Sale>(STORAGE_KEYS.sales),
    purchases: readLocalArray<Purchase>(STORAGE_KEYS.purchases),
    cashTransactions: readLocalArray<CashTransaction>(
      STORAGE_KEYS.cashTransactions
    ),
  };
}

function saveLocalData(data: BusinessData): void {
  localStorage.setItem(
    STORAGE_KEYS.products,
    JSON.stringify(data.products)
  );

  localStorage.setItem(
    STORAGE_KEYS.sales,
    JSON.stringify(data.sales)
  );

  localStorage.setItem(
    STORAGE_KEYS.purchases,
    JSON.stringify(data.purchases)
  );

  localStorage.setItem(
    STORAGE_KEYS.cashTransactions,
    JSON.stringify(data.cashTransactions)
  );

  window.dispatchEvent(new Event("zevasewa-data-updated"));
}

function saveRemoteCollectionLocally<T>(
  storageKey: string,
  items: T[]
): void {
  applyingRemoteUpdate = true;

  try {
    localStorage.setItem(storageKey, JSON.stringify(items));

    window.dispatchEvent(
      new Event("zevasewa-data-updated")
    );
  } finally {
    applyingRemoteUpdate = false;
  }
}

async function readRemoteCollection<T>(
  userId: string,
  collectionName: string
): Promise<T[]> {
  const reference = collection(
    db,
    "users",
    userId,
    collectionName
  );

  const snapshot = await getDocs(reference);

  return snapshot.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  })) as T[];
}

async function getRemoteData(userId: string): Promise<BusinessData> {
  const [
    products,
    sales,
    purchases,
    cashTransactions,
  ] = await Promise.all([
    readRemoteCollection<Product>(userId, "products"),
    readRemoteCollection<Sale>(userId, "sales"),
    readRemoteCollection<Purchase>(userId, "purchases"),
    readRemoteCollection<CashTransaction>(
      userId,
      "cashTransactions"
    ),
  ]);

  return {
    products,
    sales,
    purchases,
    cashTransactions,
  };
}

async function replaceRemoteCollection<T extends { id: string }>(
  userId: string,
  collectionName: string,
  items: T[]
): Promise<void> {
  const reference = collection(
    db,
    "users",
    userId,
    collectionName
  );

  const snapshot = await getDocs(reference);

  const currentIds = new Set(items.map((item) => item.id));

  const operations: Array<{
    type: "delete" | "set";
    id: string;
    data?: T;
  }> = [];

  snapshot.docs.forEach((item) => {
    if (!currentIds.has(item.id)) {
      operations.push({
        type: "delete",
        id: item.id,
      });
    }
  });

  items.forEach((item) => {
    operations.push({
      type: "set",
      id: item.id,
      data: item,
    });
  });

  for (let index = 0; index < operations.length; index += 450) {
    const batch = writeBatch(db);
    const chunk = operations.slice(index, index + 450);

    chunk.forEach((operation) => {
      const document = doc(reference, operation.id);

      if (operation.type === "delete") {
        batch.delete(document);
      } else {
        batch.set(document, operation.data!);
      }
    });

    await batch.commit();
  }
}

async function writeRemoteData(
  userId: string,
  data: BusinessData
): Promise<void> {
  await replaceRemoteCollection(userId, "products", data.products);
  await replaceRemoteCollection(userId, "sales", data.sales);
  await replaceRemoteCollection(userId, "purchases", data.purchases);
  await replaceRemoteCollection(
    userId,
    "cashTransactions",
    data.cashTransactions
  );
}

function hasRecords(data: BusinessData): boolean {
  return (
    data.products.length > 0 ||
    data.sales.length > 0 ||
    data.purchases.length > 0 ||
    data.cashTransactions.length > 0
  );
}

export async function initializeUserData(
  userId: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const ownerId = localStorage.getItem(OWNER_KEY);
  const localData = getLocalData();
  const remoteData = await getRemoteData(userId);

  const shouldMigrate =
    !hasRecords(remoteData) &&
    hasRecords(localData) &&
    (!ownerId || ownerId === userId);

  if (shouldMigrate) {
    await writeRemoteData(userId, localData);
  } else {
    saveLocalData(remoteData);
  }

  localStorage.setItem(OWNER_KEY, userId);

  window.dispatchEvent(
    new Event("zevasewa-data-updated")
  );
}

export async function syncLocalDataToFirestore(
  userId: string
): Promise<void> {
  if (typeof window === "undefined") return;

  const ownerId = localStorage.getItem(OWNER_KEY);

  if (ownerId !== userId) {
    throw new Error(
      "Account ownership mismatch. Synchronization stopped."
    );
  }

  await writeRemoteData(userId, getLocalData());
}

/**
 * Subscribe to all four business collections.
 * Cloud changes automatically update the local cache.
 */
export function subscribeToUserData(
  userId: string
): () => void {
  const subscriptions = [
    onSnapshot(
      collection(db, "users", userId, "products"),
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        })) as Product[];

        saveRemoteCollectionLocally(
          STORAGE_KEYS.products,
          items
        );
      },
      (error) => {
        console.error("Products sync failed:", error);
      }
    ),

    onSnapshot(
      collection(db, "users", userId, "sales"),
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        })) as Sale[];

        saveRemoteCollectionLocally(
          STORAGE_KEYS.sales,
          items
        );
      },
      (error) => {
        console.error("Sales sync failed:", error);
      }
    ),

    onSnapshot(
      collection(db, "users", userId, "purchases"),
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        })) as Purchase[];

        saveRemoteCollectionLocally(
          STORAGE_KEYS.purchases,
          items
        );
      },
      (error) => {
        console.error("Purchases sync failed:", error);
      }
    ),

    onSnapshot(
      collection(db, "users", userId, "cashTransactions"),
      (snapshot) => {
        const items = snapshot.docs.map((item) => ({
          ...item.data(),
          id: item.id,
        })) as CashTransaction[];

        saveRemoteCollectionLocally(
          STORAGE_KEYS.cashTransactions,
          items
        );
      },
      (error) => {
        console.error("Cash transactions sync failed:", error);
      }
    ),
  ];

  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}
