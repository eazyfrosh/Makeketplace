import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "@/lib/firebase/client";

function localKey(collectionName: string) {
  return `nexova_${collectionName}`;
}

function readLocal<T>(collectionName: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(localKey(collectionName));
  return raw ? (JSON.parse(raw) as T[]) : [];
}

function writeLocal<T>(collectionName: string, items: T[]) {
  window.localStorage.setItem(localKey(collectionName), JSON.stringify(items));
}

export async function getOne<T extends { id: string }>(
  collectionName: string,
  id: string,
): Promise<T | null> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db as Firestore, collectionName, id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
  }
  return readLocal<T>(collectionName).find((i) => i.id === id) ?? null;
}

export async function getAll<T extends { id: string }>(collectionName: string): Promise<T[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(collection(db as Firestore, collectionName));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  }
  return readLocal<T>(collectionName);
}

export async function getWhere<T extends { id: string }>(
  collectionName: string,
  field: string,
  value: unknown,
): Promise<T[]> {
  if (isFirebaseConfigured && db) {
    const snap = await getDocs(
      query(collection(db as Firestore, collectionName), where(field, "==", value)),
    );
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  }
  return readLocal<T>(collectionName).filter(
    (i) => (i as unknown as Record<string, unknown>)[field] === value,
  );
}

export async function upsert<T extends { id: string }>(
  collectionName: string,
  item: T,
): Promise<void> {
  if (isFirebaseConfigured && db) {
    await setDoc(doc(getFirestore(), collectionName, item.id), item, { merge: true });
    return;
  }
  const items = readLocal<T>(collectionName);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  writeLocal(collectionName, items);
}

export async function remove(collectionName: string, id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db as Firestore, collectionName, id));
    return;
  }
  const items = readLocal<{ id: string }>(collectionName).filter((i) => i.id !== id);
  writeLocal(collectionName, items);
}
