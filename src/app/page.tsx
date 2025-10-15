import Image from "next/image";
import Link from "next/link";

import { ArrowRight, GithubIcon, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PixelButton } from "@/components/pixel-button";
import { cn } from "@/lib/utils";
import {
  PixelCard,
  PixelCardContent,
  PixelCardDescription,
  PixelCardHeader,
  PixelCardTitle,
} from "@/components/pixel-card";
import { SignInCard } from "@/features/auth/components/sign-in-card";

const heroHeading =
  "Run AI-powered development tasks from Discord with CodeCat";

const heroDescription =
  "Coordinate your team, manage permissions, and launch automated pull requests directly from your Discord server. Configure guild defaults, confirm tasks, and keep every workflow in sync.";

const navigationLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Landing page hero section for the CodeCat dashboard.
 * Includes navigation, call-to-action buttons, and image placeholder.
 */
export default function Home() {
  return (
    <main className="w-full">
      <header className="border-b-4 border-border px-6 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-8xl items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/images/image.png"
              alt="CodeCat"
              width={64}
              height={32}
            />
            <div className="flex flex-col">
              <PixelCardTitle>CodeCat</PixelCardTitle>
            </div>
          </div>

          <nav
            className="hidden items-center justify-between gap-10 md:flex"
            aria-label="Main"
          >
            {navigationLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-bold text-muted-foreground transition hover:text-foreground text-lg"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex">
            <SignInCard />
          </div>

          <Button
            size="icon"
            variant="outline"
            className="md:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </header>

      <section className="px-10 sm:px-12 py-20 lg:px-12 lg:py-24">
        <div className="mx-auto grid w-full max-w-8xl gap-20 lg:grid-cols-[1fr_1.08fr] lg:items-center">
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-6 text-center lg:text-left">
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                {heroHeading}
              </h1>

              <p className="text-pretty text-lg text-muted-foreground">
                {heroDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
              <PixelButton variant="default">Launch Dashboard</PixelButton>
              <PixelButton variant="inverted">
                <div className="flex justify-center items-center gap-2">
                  <GithubIcon /> Github
                </div>
              </PixelButton>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <figure className="relative w-full max-w-[960px] overflow-hidden rounded-3xl border border-dashed border-border shadow-2xl">
              <Image
                src="/images/main-final.png"
                alt="Dashboard preview placeholder"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto rounded-3xl"
                sizes="(min-width: 1280px) 920px, (min-width: 768px) 75vw, 92vw"
              />
            </figure>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="px-6 py-20 sm:px-8 lg:px-10 lg:py-24 xl:py-28"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
            <span className="rounded-full border border-border/60 bg-muted/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Features
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to orchestrate CodeCat from Discord
            </h2>
            <p className="text-pretty text-base text-muted-foreground sm:text-lg">
              Configure your workflow end-to-end: connect repos, assign keys,
              control access, and keep shipping without leaving your guild.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map((feature) => (
              <PixelCard key={feature.title}>
                <PixelCardHeader>
                  <PixelCardTitle>{feature.title}</PixelCardTitle>
                  <PixelCardDescription>{feature.description}</PixelCardDescription>
                </PixelCardHeader>
                <PixelCardContent>
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-dashed border-border/80 bg-background/80 shadow-inner">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover object-[5%_50%]"
                      quality={95}
                      sizes="(min-width: 1024px) 400px, (min-width: 768px) 45vw, 90vw"
                    />
                  </div>
                </PixelCardContent>
              </PixelCard>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

type FeatureInfo = {
  title: string;
  description: string;
  image: string;
};

const FEATURES: FeatureInfo[] = [
  {
    title: "Connecting GitHub",
    description:
      "Authorize CodeCat with your GitHub account to open pull requests using the right permissions every time.",
    image: "/images/github-cropped.png",
  },
  {
    title: "Adding OpenRouter Keys",
    description:
      "Store personal or guild-level OpenRouter API keys securely so tasks always have the power to run.",
    image: "/images/openrouter.png",
  },
  {
    title: "Selecting Any Model",
    description:
      "Choose the AI model that matches your task complexity—from fast iterations to deep refactors.",
    image: "/images/model.png",
  },
  {
    title: "Creating PRs",
    description:
      "Trigger CodeCat to open ready-to-merge GitHub pull requests with progress updates delivered back to Discord.",
    image: "/images/pr-2.png",
  },
  {
    title: "Adjusting Permissions",
    description:
      "Map Discord roles to creation and confirmation actions, ensuring every task is reviewed by the right person.",
    image: "/images/permissions.png",
  },
  {
    title: "Confirming Tasks",
    description:
      "Approve proposals in a single click and push updates instantly, with real-time progress back in Discord.",
    image: "/images/confirm.png",
  },
];
