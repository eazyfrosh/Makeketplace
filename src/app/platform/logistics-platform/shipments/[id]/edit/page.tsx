"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShipmentForm } from "@/components/logistics/shipment-form";
import { Button } from "@/components/logistics/ui/button";
import { LoadingState } from "@/components/logistics/ui/loading-state";
import { getShipment } from "@/lib/logistics/client";
import type { Shipment } from "@/lib/logistics/types";
import type { ShipmentFormInput } from "@/lib/logistics/validation";

function shipmentToFormInput(s: Shipment): Partial<ShipmentFormInput> {
  return {
    carrierCode: s.carrierCode,
    serviceType: s.serviceType,
    referenceNumber: s.referenceNumber,
    sender: s.sender,
    receiver: s.receiver,
    weightKg: s.package.weightKg,
    lengthCm: s.package.lengthCm,
    widthCm: s.package.widthCm,
    heightCm: s.package.heightCm,
    packageType: s.package.packageType,
    description: s.package.description,
    specialInstructions: s.specialInstructions,
    estimatedDeliveryDate: s.estimatedDeliveryDate.slice(0, 10),
    shippingCost: s.shippingCost,
    insured: s.insured,
    insuranceValue: s.insuranceValue,
  };
}

export default function EditShipmentPage() {
  const { id } = useParams<{ id: string }>();
  const [shipment, setShipment] = useState<Shipment | null | undefined>(undefined);

  useEffect(() => {
    getShipment(id)
      .then((data) => setShipment(data.shipment))
      .catch(() => setShipment(null));
  }, [id]);

  if (shipment === undefined) return <LoadingState label="Loading shipment…" />;

  if (!shipment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Shipment not found</h1>
        <Link href="/platform/logistics-platform">
          <Button className="mt-6">Back to shipments</Button>
        </Link>
      </div>
    );
  }

  return <ShipmentForm shipmentId={shipment.id} defaultValues={shipmentToFormInput(shipment)} />;
}
