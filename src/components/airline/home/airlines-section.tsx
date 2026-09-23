"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { airlines } from "@/lib/airline/data/airlines";
import { AirlineLogo } from "@/components/airline/ui/airline-logo";
import { Card } from "@/components/airline/ui/card";
import { cabinLabel } from "@/lib/airline/utils";

export function AirlinesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Our partner airlines</h2>
        <p className="mt-2 text-foreground/60">Compare cabin options from 15 world-class carriers</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {airlines.map((airline, idx) => (
          <motion.div
            key={airline.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: (idx % 6) * 0.05 }}
          >
            <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start gap-3">
                <AirlineLogo airline={airline} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{airline.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1 text-sm text-foreground/60">
                    <Star size={13} className="fill-gold-500 text-gold-500" />
                    {airline.rating.toFixed(1)} · Est. {airline.founded}
                  </div>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs text-foreground/60">
                <dt>Carry-on</dt>
                <dd className="text-right font-medium text-foreground/80">{airline.baggageAllowance.carryOn}</dd>
                <dt>Checked</dt>
                <dd className="text-right font-medium text-foreground/80">{airline.baggageAllowance.checked}</dd>
                <dt>Aircraft</dt>
                <dd className="text-right font-medium text-foreground/80">{airline.aircraftTypes[0]}</dd>
                <dt>Cabins</dt>
                <dd className="text-right font-medium text-foreground/80">
                  {airline.cabins.map((c) => cabinLabel(c)).join(", ")}
                </dd>
              </dl>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

