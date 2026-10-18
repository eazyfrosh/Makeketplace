import type { ShipmentStatus } from "@/lib/logistics/types";

export const TRACKING_EVENT_DESCRIPTION_TEMPLATES: Record<ShipmentStatus, string> = {
  pending: "Shipment created and awaiting carrier pickup.",
  processing: "Shipment is being processed at the origin facility.",
  picked_up: "Package picked up by the carrier.",
  in_transit: "Package is in transit to the next facility.",
  arrived_at_hub: "Package arrived at a regional sorting hub.",
  customs_clearance: "Shipment is undergoing customs clearance.",
  out_for_delivery: "Package is out for delivery to the recipient.",
  delivered: "Package delivered successfully.",
  failed_delivery: "The delivery attempt was unsuccessful.",
  returned: "Package is being returned to the sender.",
  cancelled: "Shipment has been cancelled.",
};
