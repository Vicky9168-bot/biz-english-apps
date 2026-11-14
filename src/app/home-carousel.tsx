"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FEATURES } from "@/lib/constants";
import { FEATURE_ICONS } from "@/lib/feature-icons";

type Feature = (typeof FEATURES)[number];

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const navButtonClass =
  "hidden h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-ink transition hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 md:flex";

export function HomeCarousel({
  features,
  loggedIn,
}: {
  features: Feature[];
  loggedIn: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
  const touchStartX = useRef<number | null>(null);
  const count = features.length;

  useEffect(() => {
    if (paused || reducedMotion || count < 2) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => clearTimeout(timer);
  }, [index, paused, reducedMotion, count]);

  if (count === 0) return null;

  const go = (i: number) => setIndex((i + count) % count);

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    go(dx < 0 ? index + 1 : index - 1);
  };

  return (
    <section aria-roledescription="carousel" aria-label="熱門功能">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-bold text-ink">熱門功能</h2>
        <span className="text-sm text-ink/65">大家最常練習的項目</span>
      </div>

      <div
        className="overflow-hidden rounded-lg border border-ink/15 bg-white text-ink"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
          aria-live={paused || reducedMotion ? "polite" : "off"}
        >
          {features.map((f, i) => {
            const Icon = FEATURE_ICONS[f.key];
            return (
              <div
                key={f.key}
                role="group"
                aria-roledescription="slide"
                aria-label={`第 ${i + 1} 張，共 ${count} 張`}
                aria-hidden={i !== index}
                inert={i !== index}
                className="grid w-full shrink-0 gap-8 px-6 pb-6 pt-10 md:grid-cols-[1.1fr_1fr] md:items-center md:gap-14 md:px-14 md:pt-12"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium text-ink/65">
                    <Icon
                      className="h-4 w-4"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    {f.title}
                  </p>
                  <h3
                    className="mt-3 font-display text-[clamp(2rem,4.6vw,3.5rem)] font-bold leading-[1.02] tracking-[-0.03em]"
                    translate="no"
                  >
                    {f.headline ?? f.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-base leading-relaxed text-ink/70">
                    {f.desc}
                  </p>
                  <Link
                    href={loggedIn ? f.href : "/signup"}
                    className="mt-6 inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-ink/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2"
                  >
                    {loggedIn ? "開始練習" : "免費開始"}
                  </Link>
                </div>

                {f.preview && (
                  <blockquote className="border-l-4 border-mark pl-5">
                    <p className="text-sm text-ink/65">{f.preview.label}</p>
                    <p className="mt-2 max-w-sm font-display text-xl font-medium leading-snug md:text-2xl">
                      {f.preview.text}
                    </p>
                  </blockquote>
                )}
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <div className="flex items-center justify-between px-6 pb-6 md:px-14">
            <div className="flex items-center gap-2">
              {features.map((f, i) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`跳到第 ${i + 1} 張：${f.title}`}
                  aria-current={i === index}
                  className="group flex h-6 items-center focus-visible:outline-none"
                >
                  <span
                    className={`h-[3px] rounded-full transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-ink/40 group-focus-visible:ring-offset-2 ${
                      i === index
                        ? "w-10 bg-ink"
                        : "w-5 bg-ink/25 group-hover:bg-ink/50"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(index - 1)}
                aria-label="上一張"
                className={navButtonClass}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                aria-label="下一張"
                className={navButtonClass}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
