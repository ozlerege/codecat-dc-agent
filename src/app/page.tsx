import Image from "next/image";
import Link from "next/link";

import { ArrowRight, GithubIcon, Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PixelButton } from "@/components/pixel-button";
import { cn } from "@/lib/utils";
import { PixelCardTitle } from "@/components/pixel-card";

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
            <PixelButton variant="discord">Launch</PixelButton>
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
    </main>
  );
}
