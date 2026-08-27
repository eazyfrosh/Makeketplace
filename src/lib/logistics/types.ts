export type ShipmentStatus =
  | "pending"
  | "processing"
  | "picked_up"
  | "in_transit"
  | "arrived_at_hub"
  | "customs_clearance"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery"
  | "returned"
  | "cancelled";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "pending",
  "processing",
  "picked_up",
  "in_transit",
  "arrived_at_hub",
  "customs_clearance",
  "out_for_delivery",
  "delivered",
  "failed_delivery",
  "returned",
  "cancelled",
];

export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  arrived_at_hub: "Arrived at Hub",
  customs_clearance: "Customs Clearance",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  failed_delivery: "Failed Delivery",
  returned: "Returned",
  cancelled: "Cancelled",
};

export type ServiceType = "express" | "economy" | "priority" | "standard";

export const SERVICE_TYPES: ServiceType[] = ["express", "economy", "priority", "standard"];

export const SERVICE_LABELS: Record<ServiceType, string> = {
  express: "Express",
  economy: "Economy",
  priority: "Priority",
  standard: "Standard",
};

export type PackageType = "box" | "envelope" | "pallet" | "tube" | "crate" | "bag";

export const PACKAGE_TYPES: PackageType[] = ["box", "envelope", "pallet", "tube", "crate", "bag"];

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface PackageInfo {
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  packageType: PackageType;
  description?: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  trackingNumber: string;
  referenceNumber?: string;
  carrierCode: string;
  status: ShipmentStatus;
  serviceType: ServiceType;
  sender: ContactInfo;
  receiver: ContactInfo;
  package: PackageInfo;
  specialInstructions?: string;
  estimatedDeliveryDate: string;
  shippingCost: number;
  insured: boolean;
  insuranceValue?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  notes?: string;
  timestamp: string;
  createdBy?: string;
}
