import { ArrowRight, MousePointerClick, SlidersHorizontal, Sparkles } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: MousePointerClick,
    title: "Choose a tool",
    description: "Start with a ready-to-use service that matches the job in front of you.",
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    title: "Make it yours",
    description: "Add your details, preferences, and brand without unnecessary setup.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get the result",
    description: "Download, share, or continue working with a clean professional output.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-border/70 bg-background/45 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Simple by design</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">From task to done.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">No complicated onboarding. Pick a tool, follow the clear steps, and keep moving.</p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, description }, index) => (
            <div key={number} className="relative rounded-2xl border border-border/70 bg-card/60 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.18em] text-primary">{number}</span>
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-8 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              {index < STEPS.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden size-5 -translate-y-1/2 rounded-full bg-background text-muted-foreground md:block" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
