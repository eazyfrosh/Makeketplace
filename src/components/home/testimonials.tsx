"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { testimonials } from "@/lib/data/services";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Notes from the field</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
          The part clients remember.
        </h2>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            className={`glass flex flex-col rounded-3xl p-7 ${i === 0 ? "sm:col-span-2 lg:col-span-2 lg:row-span-2" : ""}`}
          >
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  className={
                    s < t.rating
                      ? "size-4 fill-amber-400 text-amber-400"
                      : "size-4 text-muted-foreground/30"
                  }
                />
              ))}
            </div>
            <p className={`mt-5 flex-1 leading-relaxed text-muted-foreground ${i === 0 ? "text-xl sm:text-2xl" : "text-sm"}`}>&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{t.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold">{t.author}</div>
                <div className="text-xs text-muted-foreground">
                  {t.role}, {t.company}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
