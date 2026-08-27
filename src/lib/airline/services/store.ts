"use client";

/**
 * v1 airline bookings are pure client-side storage, deliberately not wired
 * into Nexova's own Firebase project — bookings belong to whichever browser
 * made them, same trust model flightbook itself ships with. This keeps the
 * ported platform fully functional with zero backend dependency, and avoids
 * writing into collections Nexova's firestore.rules doesn't grant access to.
 * A durable, per-user Firebase-backed version (mirroring the licensing
 * system's admin-db.ts pattern) is a reasonable fast-follow.
 */

function localKey(name: string) {
  return `makeketplace_airline_${name}`;
}

function readLocal<T>(name: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(localKey(name));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(name: string, items: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localKey(name), JSON.stringify(items));
}

export async function getAll<T extends { id: string }>(collectionName: string): Promise<T[]> {
  return readLocal<T>(collectionName);
}

export async function getOne<T extends { id: string }>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const items = readLocal<T>(collectionName);
  return items.find((i) => i.id === id) ?? null;
}

export async function upsert<T extends { id: string }>(
  collectionName: string,
  item: T
): Promise<void> {
  const items = readLocal<T>(collectionName);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  writeLocal(collectionName, items);
}

export async function remove(collectionName: string, id: string): Promise<void> {
  const items = readLocal<{ id: string }>(collectionName).filter((i) => i.id !== id);
  writeLocal(collectionName, items);
}

export async function queryByField<T extends { id: string }>(
  collectionName: string,
  field: string,
  value: string
): Promise<T[]> {
  const items = readLocal<Record<string, unknown> & { id: string }>(collectionName);
  return items.filter((i) => i[field] === value) as unknown as T[];
}
