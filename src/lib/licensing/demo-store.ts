// Zero-config fallback persistence for license/order/audit data when Firebase
// Admin credentials aren't set. Lives only in server process memory — fine for
// a demo deployment, but not durable (resets on restart/redeploy). Configure
// FIREBASE_ADMIN_* env vars for real persistence.
import type { Order } from "@/types";
import type { License, LicenseValidationLog } from "@/types/licensing";

declare global {
  var __nexovaDemoStore:
    | {
        orders: Map<string, Order>;
        licenses: Map<string, License>;
        logs: Map<string, LicenseValidationLog>;
      }
    | undefined;
}

function store() {
  if (!global.__nexovaDemoStore) {
    global.__nexovaDemoStore = {
      orders: new Map(),
      licenses: new Map(),
      logs: new Map(),
    };
  }
  return global.__nexovaDemoStore;
}

export const demoOrders = {
  create: (order: Order) => {
    store().orders.set(order.id, order);
  },
  getById: (id: string) => store().orders.get(id) ?? null,
  getForUser: (userId: string) =>
    Array.from(store().orders.values()).filter((o) => o.userId === userId),
  getAll: () => Array.from(store().orders.values()),
};

export const demoLicenses = {
  create: (license: License) => {
    store().licenses.set(license.id, license);
  },
  update: (license: License) => {
    store().licenses.set(license.id, license);
  },
  getById: (id: string) => store().licenses.get(id) ?? null,
  getByKey: (licenseKey: string) =>
    Array.from(store().licenses.values()).find((l) => l.licenseKey === licenseKey) ?? null,
  getForUser: (userId: string) =>
    Array.from(store().licenses.values()).filter((l) => l.userId === userId),
  getForUserAndService: (userId: string, serviceSlug: string) =>
    Array.from(store().licenses.values()).find(
      (l) => l.userId === userId && l.serviceSlug === serviceSlug,
    ) ?? null,
  getAll: () => Array.from(store().licenses.values()),
};

export const demoLogs = {
  create: (log: LicenseValidationLog) => {
    store().logs.set(log.id, log);
  },
  getForLicense: (licenseId: string) =>
    Array.from(store().logs.values())
      .filter((l) => l.licenseId === licenseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  getAll: () =>
    Array.from(store().logs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
};
