"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { testimonials } from "@/lib/data/services";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-medium text-primary">Testimonials</span>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Loved by founders and product teams
        </h2>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            className="glass flex flex-col rounded-2xl p-6"
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
            <p className="mt-4 flex-1 text-sm text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{t.author[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{t.author}</div>
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
