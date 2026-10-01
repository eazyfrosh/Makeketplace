"use client";

import Link from "next/link";
import { BookOpen, CircleHelp, Globe2, LayoutTemplate, Mail, WalletCards } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STARTING_POINTS = [
  {
    href: "/services",
    icon: BookOpen,
    title: "Find a tool",
    description: "See every EazyTool service and choose what you want to do.",
  },
  {
    href: "/support-templates",
    icon: LayoutTemplate,
    title: "Create a website",
    description: "Choose a design first, then change the words, colors, and images.",
  },
  {
    href: "/platform/email-designer",
    icon: Mail,
    title: "Design an email",
    description: "Pick a template, add your message, preview it, and save it.",
  },
  {
    href: "/domains",
    icon: Globe2,
    title: "Find a domain",
    description: "Search for the web address you want for your business.",
  },
  {
    href: "/wallet",
    icon: WalletCards,
    title: "Use your wallet",
    description: "Add money for eligible pay-as-you-go services such as domains.",
  },
];

export function BeginnerGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 rounded-full print:hidden"
          aria-label="Open the getting started guide"
        >
          <CircleHelp className="size-4 text-primary" />
          <span className="hidden xl:inline">Help me choose</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">What would you like to do?</DialogTitle>
          <DialogDescription className="text-base leading-6">
            Choose one option below. Each tool will guide you one step at a time, and you can always come back here.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2 grid gap-3">
          {STARTING_POINTS.map(({ href, icon: Icon, title, description }) => (
            <Button key={href} variant="outline" asChild className="h-auto justify-start whitespace-normal p-4 text-left">
              <Link href={href}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-sm font-normal leading-5 text-muted-foreground">{description}</span>
                </span>
              </Link>
            </Button>
          ))}
        </div>
        <p className="mt-2 rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
          Still unsure? Visit <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">Support</Link> and tell us what you want to achieve in your own words.
        </p>
      </DialogContent>
    </Dialog>
  );
}
