import { adminDb, isAdminDbConfigured } from "@/lib/licensing/admin-db";
import { demoOrders, demoLicenses, demoLogs } from "@/lib/licensing/demo-store";
import type { Order } from "@/types";
import type { License, LicenseValidationLog } from "@/types/licensing";

export const isLicensingBackendDurable = isAdminDbConfigured;

const ORDERS = "orders";
const LICENSES = "licenses";
const LOGS = "licenseValidationLogs";

export async function createOrderRecord(order: Order): Promise<void> {
  if (adminDb) {
    await adminDb.collection(ORDERS).doc(order.id).set(order);
    return;
  }
  demoOrders.create(order);
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (adminDb) {
    const snap = await adminDb.collection(ORDERS).doc(id).get();
    return snap.exists ? (snap.data() as Order) : null;
  }
  return demoOrders.getById(id);
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (adminDb) {
    const snap = await adminDb.collection(ORDERS).where("userId", "==", userId).get();
    return snap.docs.map((d) => d.data() as Order);
  }
  return demoOrders.getForUser(userId);
}

export async function getAllOrders(): Promise<Order[]> {
  if (adminDb) {
    const snap = await adminDb.collection(ORDERS).get();
    return snap.docs.map((d) => d.data() as Order);
  }
  return demoOrders.getAll();
}

export async function createLicense(license: License): Promise<void> {
  if (adminDb) {
    await adminDb.collection(LICENSES).doc(license.id).set(license);
    return;
  }
  demoLicenses.create(license);
}

export async function updateLicense(license: License): Promise<void> {
  if (adminDb) {
    await adminDb.collection(LICENSES).doc(license.id).set(license);
    return;
  }
  demoLicenses.update(license);
}

export async function getLicenseById(id: string): Promise<License | null> {
  if (adminDb) {
    const snap = await adminDb.collection(LICENSES).doc(id).get();
    return snap.exists ? (snap.data() as License) : null;
  }
  return demoLicenses.getById(id);
}

export async function getLicenseByKey(licenseKey: string): Promise<License | null> {
  if (adminDb) {
    const snap = await adminDb.collection(LICENSES).where("licenseKey", "==", licenseKey).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as License);
  }
  return demoLicenses.getByKey(licenseKey);
}

export async function getLicensesForUser(userId: string): Promise<License[]> {
  if (adminDb) {
    const snap = await adminDb.collection(LICENSES).where("userId", "==", userId).get();
    return snap.docs.map((d) => d.data() as License);
  }
  return demoLicenses.getForUser(userId);
}

export async function getLicenseForUserAndService(
  userId: string,
  serviceSlug: string,
): Promise<License | null> {
  if (adminDb) {
    const snap = await adminDb
      .collection(LICENSES)
      .where("userId", "==", userId)
      .where("serviceSlug", "==", serviceSlug)
      .limit(1)
      .get();
    return snap.empty ? null : (snap.docs[0].data() as License);
  }
  return demoLicenses.getForUserAndService(userId, serviceSlug);
}

export async function getAllLicenses(): Promise<License[]> {
  if (adminDb) {
    const snap = await adminDb.collection(LICENSES).get();
    return snap.docs.map((d) => d.data() as License);
  }
  return demoLicenses.getAll();
}

export async function logValidation(log: LicenseValidationLog): Promise<void> {
  if (adminDb) {
    await adminDb.collection(LOGS).doc(log.id).set(log);
    return;
  }
  demoLogs.create(log);
}

export async function getValidationLogsForLicense(licenseId: string): Promise<LicenseValidationLog[]> {
  if (adminDb) {
    const snap = await adminDb
      .collection(LOGS)
      .where("licenseId", "==", licenseId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    return snap.docs.map((d) => d.data() as LicenseValidationLog);
  }
  return demoLogs.getForLicense(licenseId);
}

export async function getAllValidationLogs(): Promise<LicenseValidationLog[]> {
  if (adminDb) {
    const snap = await adminDb.collection(LOGS).orderBy("createdAt", "desc").limit(200).get();
    return snap.docs.map((d) => d.data() as LicenseValidationLog);
  }
  return demoLogs.getAll();
}
