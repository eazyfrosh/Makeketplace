import type { LucideIcon } from "lucide-react";
import { Truck, Plane, Package } from "lucide-react";
import type { ServiceType } from "@/lib/logistics/types";

export interface CarrierDefinition {
  code: string;
  name: string;
  prefix: string;
  icon: LucideIcon;
  region: string;
  serviceTypes: ServiceType[];
}

export const CARRIERS: CarrierDefinition[] = [
  { code: "DHL", name: "DHL", prefix: "DHL", icon: Plane, region: "Global", serviceTypes: ["express", "economy", "priority"] },
  { code: "FEDEX", name: "FedEx", prefix: "FDX", icon: Plane, region: "Global", serviceTypes: ["express", "priority", "standard"] },
  { code: "UPS", name: "UPS", prefix: "UPS", icon: Truck, region: "Global", serviceTypes: ["express", "standard", "economy"] },
  { code: "USPS", name: "USPS", prefix: "USP", icon: Truck, region: "United States", serviceTypes: ["standard", "economy", "priority"] },
  { code: "ARAMEX", name: "Aramex", prefix: "ARX", icon: Truck, region: "Middle East", serviceTypes: ["express", "standard"] },
  { code: "TNT", name: "TNT", prefix: "TNT", icon: Plane, region: "Europe", serviceTypes: ["express", "economy"] },
  { code: "CANADAPOST", name: "Canada Post", prefix: "CNP", icon: Truck, region: "Canada", serviceTypes: ["standard", "economy", "priority"] },
  { code: "ROYALMAIL", name: "Royal Mail", prefix: "RML", icon: Truck, region: "United Kingdom", serviceTypes: ["standard", "economy", "priority"] },
  { code: "DPD", name: "DPD", prefix: "DPD", icon: Truck, region: "Europe", serviceTypes: ["express", "standard"] },
  { code: "GLS", name: "GLS", prefix: "GLS", icon: Truck, region: "Europe", serviceTypes: ["standard", "economy"] },
  { code: "AUSPOST", name: "Australia Post", prefix: "AUP", icon: Truck, region: "Australia", serviceTypes: ["standard", "economy", "priority"] },
  { code: "BLUEDART", name: "BlueDart", prefix: "BLD", icon: Truck, region: "India", serviceTypes: ["express", "priority"] },
  { code: "PUROLATOR", name: "Purolator", prefix: "PUR", icon: Truck, region: "Canada", serviceTypes: ["express", "standard"] },
  { code: "JAPANPOST", name: "Japan Post", prefix: "JPP", icon: Truck, region: "Japan", serviceTypes: ["standard", "economy"] },
  { code: "POSTNL", name: "PostNL", prefix: "PNL", icon: Truck, region: "Netherlands", serviceTypes: ["standard", "economy"] },
  { code: "CORREOS", name: "Correos", prefix: "COR", icon: Truck, region: "Spain", serviceTypes: ["standard", "economy"] },
  { code: "SWISSPOST", name: "Swiss Post", prefix: "SWP", icon: Truck, region: "Switzerland", serviceTypes: ["standard", "priority"] },
];

export const GENERIC_CARRIER: CarrierDefinition = {
  code: "GENERIC",
  name: "TrackNova Direct",
  prefix: "TRK",
  icon: Package,
  region: "Global",
  serviceTypes: ["express", "economy", "priority", "standard"],
};

export const ALL_CARRIERS = [...CARRIERS, GENERIC_CARRIER];

export function getCarrier(identifier: string): CarrierDefinition {
  const exact = ALL_CARRIERS.find((c) => c.code === identifier);
  if (exact) return exact;
  const normalized = identifier.trim().toLowerCase();
  const byNameOrCode = ALL_CARRIERS.find(
    (c) => c.code.toLowerCase() === normalized || c.name.toLowerCase() === normalized
  );
  return byNameOrCode ?? GENERIC_CARRIER;
}
