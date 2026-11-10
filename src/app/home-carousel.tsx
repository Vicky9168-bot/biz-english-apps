"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { FEATURES } from "@/lib/constants";
import { FEATURE_ICONS } from "@/lib/feature-icons";

type Feature = (typeof FEATURES)[number];

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const BRAND_HANDLE = "@BIZENGLISH";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const pad = (n: number) => String(n).padStart(2, "0");

// 暗色桌面質感：筆記本、筆電、杯墊的抽象色塊，每張投影片角度略不同
function DeskBackdrop({ seed }: { seed: number }) {
  const tilt = 28 + seed * 9;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute -right-24 top-[-10%] h-[70%] w-[62%] rounded-3xl bg-gradient-to-br from-stone-500/50 to-stone-800/30"
        style={{ transform: `rotate(${tilt}deg)` }}
      />
      <div
        className="absolute -left-16 top-[28%] h-[46%] w-[34%] rounded-2xl bg-gradient-to-b from-amber-100/25 to-amber-200/10"
        style={{ transform: `rotate(${-6 - seed * 3}deg)` }}
      />
      <div
        className="absolute left-[8%] top-[34%] h-[26%] w-[16%] rounded-lg bg-gradient-to-b from-stone-200/30 to-stone-400/10"
        style={{ transform: `rotate(${-6 - seed * 3}deg)` }}
      />
      <div className="absolute -bottom-20 left-[18%] h-56 w-56 rounded-full border border-stone-300/20 bg-gradient-to-br from-stone-300/25 to-stone-700/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_55%,transparent_20%,rgba(20,16,12,0.4)_90%)]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />
    </div>
  );
}

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
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-stone-900">熱門功能</h2>
        <span className="text-xs text-stone-500">大家最常練習的項目</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl bg-[#3a3632] text-white"
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
                className="relative grid min-h-[260px] w-full shrink-0 gap-6 overflow-hidden px-8 pb-8 pt-14 md:min-h-[240px] md:grid-cols-[1.3fr_1fr] md:items-center md:gap-10 md:px-16 md:py-8"
              >
                <DeskBackdrop seed={i} />

                <span
                  className="absolute right-8 top-6 text-xs tracking-wide text-white/60 md:right-16 md:top-5"
                  translate="no"
                >
                  VOL {pad(i + 1)}
                </span>

                <div className="relative">
                  <div
                    className="font-mono text-sm tracking-wider text-stone-100/80 md:text-base"
                    translate="no"
                  >
                    [{f.tag.toUpperCase()}]
                  </div>
                  <h3
                    className="mt-1.5 text-[clamp(1.5rem,3.2vw,2.25rem)] font-black leading-[0.95] tracking-[-0.04em] text-[#F5D368]"
                    translate="no"
                  >
                    {f.headline ?? f.title}
                  </h3>
                  {f.headline && (
                    <p className="mt-3 flex items-center gap-2 text-sm font-medium text-white/75">
                      <Icon
                        className="h-4 w-4"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      {f.title}
                    </p>
                  )}
                </div>

                <div className="relative flex flex-col items-start gap-4">
                  <p className="max-w-xs text-sm leading-snug text-white/80">
                    {f.desc}
                  </p>
                  <div className="flex items-center gap-4">
                    <Link
                      href={loggedIn ? f.href : "/signup"}
                      className="inline-flex items-center gap-2 rounded-full bg-[#F5D368] px-5 py-2 text-sm font-semibold text-stone-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      {loggedIn ? "開始練習" : "免費開始"}
                      <span aria-hidden="true">→</span>
                    </Link>
                    <span
                      className="hidden font-mono text-[10px] tracking-[0.2em] text-white/50 sm:inline"
                      translate="no"
                    >
                      {BRAND_HANDLE}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {count > 1 && (
          <>
            {/* 進度：01 ─ 02 ─ 03 */}
            <div className="absolute left-8 top-5 flex items-center gap-2 md:left-16 md:top-4">
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
                    className={`h-[3px] rounded-full transition-all duration-500 group-focus-visible:ring-2 group-focus-visible:ring-white/70 ${
                      i === index
                        ? "w-10 bg-[#F5D368]"
                        : "w-5 bg-white/35 group-hover:bg-white/60"
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="上一張"
              className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-lg backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:flex"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="下一張"
              className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/30 text-lg backdrop-blur transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:flex"
            >
              <span aria-hidden="true">→</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
