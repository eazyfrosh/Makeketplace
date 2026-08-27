import { Snowflake } from "lucide-react";

import { cn } from "@/lib/utils";
import { maskCardNumber } from "@/lib/banking/format";
import type { RedactedCard } from "@/lib/banking/client";

export function CardVisual({
  card,
  revealedNumber,
}: {
  card: RedactedCard & { cardNumber?: string };
  revealedNumber?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-xl",
        card.color,
      )}
    >
      <div className="bg-mesh absolute inset-0 opacity-30" />
      <div className="relative flex items-center justify-between text-xs">
        <span className="font-medium opacity-90">
          Novaofficial {card.type === "virtual" ? "Virtual" : "Physical"}
        </span>
        <span className="font-semibold tracking-wide uppercase">{card.network}</span>
      </div>
      <p className="relative font-mono text-lg tracking-widest">
        {revealedNumber ?? (card.cardNumber ? maskCardNumber(card.cardNumber) : "•••• •••• •••• ••••")}
      </p>
      <div className="relative flex items-center justify-between text-xs opacity-90">
        <span>{card.cardholderName}</span>
        <span>
          {card.expiryMonth}/{card.expiryYear.slice(-2)}
        </span>
      </div>
      {card.status === "frozen" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <span className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium">
            <Snowflake className="size-4" />
            Frozen
          </span>
        </div>
      )}
    </div>
  );
}
