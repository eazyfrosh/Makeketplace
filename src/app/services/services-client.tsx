"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { services, categories } from "@/lib/data/services";
import type { ServiceCategory } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ServiceCard } from "@/components/marketing/service-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export function ServicesClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = React.useState<ServiceCategory | "all">(
    (searchParams.get("category") as ServiceCategory) ?? "all",
  );

  const filtered = services.filter((service) => {
    const matchesCategory = activeCategory === "all" || service.category === activeCategory;
    const matchesQuery =
      !query.trim() ||
      service.name.toLowerCase().includes(query.toLowerCase()) ||
      service.tagline.toLowerCase().includes(query.toLowerCase()) ||
      service.features.some((f) => f.toLowerCase().includes(query.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <span className="text-sm font-medium text-primary">Services</span>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Every product line, one marketplace
        </h1>
        <p className="mt-4 text-muted-foreground">
          Platforms, design, AI automation, templates, and custom development — pick
          what you need and launch with a senior team behind it.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or feature…"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory("all")}>
            <Badge
              variant={activeCategory === "all" ? "default" : "outline"}
              className={cn("cursor-pointer px-3.5 py-1.5 text-sm", activeCategory !== "all" && "text-muted-foreground")}
            >
              All
            </Badge>
          </button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}>
              <Badge
                variant={activeCategory === c.id ? "default" : "outline"}
                className={cn("cursor-pointer px-3.5 py-1.5 text-sm", activeCategory !== c.id && "text-muted-foreground")}
              >
                {c.label}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "service" : "services"} found
      </p>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service, i) => (
            <ServiceCard key={service.slug} service={service} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-12"
          title="No services match your search"
          description="Try a different keyword or clear the category filter."
        />
      )}
    </div>
  );
}
