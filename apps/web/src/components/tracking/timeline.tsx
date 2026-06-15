"use client";

import { motion } from "framer-motion";
import { CheckCircle, Circle, Truck, MapPin } from "@phosphor-icons/react";
import { cn } from "@markala/ui";
import type { TrackingEvent } from "@markala/types";

interface Props {
  events: TrackingEvent[];
  /** Üst başlıkta gösterilecek takip no */
  trackingNumber?: string;
  carrier?: string;
}

export function TrackingTimeline({ events, trackingNumber, carrier = "DHL" }: Props) {
  const activeIndex = events.findIndex((e) => e.state === "active");
  let lastDoneIndex = -1;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i]?.state === "done") {
      lastDoneIndex = i;
      break;
    }
  }
  const currentLabel = events[activeIndex >= 0 ? activeIndex : lastDoneIndex]?.label ?? "Beklemede";

  return (
    <div className="space-y-6">
      {/* Üst durum kartı */}
      <div className="p-5 md:p-6 bg-paper-50 border border-paper-200 rounded-lg">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-brand-100 grid place-items-center text-brand-700">
              <Truck size={22} weight="regular" />
            </div>
            <div>
              <div className="text-xs text-ink-500 uppercase tracking-wider font-medium">Mevcut Durum</div>
              <div className="text-lg font-medium text-ink-900 mt-0.5">{currentLabel}</div>
            </div>
          </div>
          {trackingNumber && (
            <div className="text-right">
              <div className="text-xs text-ink-500 uppercase tracking-wider font-medium">{carrier} Takip No</div>
              <a
                href={`https://www.dhl.com/tr-tr/home/takip.html?tracking-id=${encodeURIComponent(trackingNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-medium text-ink-900 mt-0.5 inline-block hover:underline"
              >
                {trackingNumber} ↗
              </a>
            </div>
          )}
        </div>

        {/* İlerleme barı */}
        <ProgressBar events={events} />
      </div>

      {/* Timeline */}
      <ol className="relative">
        {/* Sol dikey çizgi */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-paper-200" />

        {events.map((ev, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            <Dot state={ev.state} />
            <div className="flex-1 -mt-0.5">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3
                  className={cn(
                    "font-medium",
                    ev.state === "done" && "text-ink-900",
                    ev.state === "active" && "text-brand-700",
                    ev.state === "pending" && "text-ink-500",
                  )}
                >
                  {ev.label}
                </h3>
                {(ev.state === "done" || ev.state === "active") && (
                  <span className="text-xs text-ink-500 tabular-nums">
                    {formatDateTime(ev.timestamp)}
                  </span>
                )}
              </div>
              {ev.description && (
                <p
                  className={cn(
                    "mt-1 text-sm",
                    ev.state === "pending" ? "text-ink-500" : "text-ink-700",
                  )}
                >
                  {ev.description}
                </p>
              )}
              {ev.location && (ev.state === "done" || ev.state === "active") && (
                <p className="mt-1 text-xs text-ink-500 inline-flex items-center gap-1">
                  <MapPin size={11} /> {ev.location}
                </p>
              )}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function Dot({ state }: { state: TrackingEvent["state"] }) {
  if (state === "done") {
    return (
      <div className="relative z-10 flex-none w-10 h-10 rounded-full bg-success/10 grid place-items-center text-success">
        <CheckCircle size={18} weight="fill" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="relative z-10 flex-none w-10 h-10 rounded-full bg-brand-500 grid place-items-center text-ink-900 shadow-lg">
        <span className="absolute inset-0 rounded-full bg-brand-500 animate-ping opacity-40" />
        <Truck size={18} weight="fill" className="relative" />
      </div>
    );
  }
  return (
    <div className="relative z-10 flex-none w-10 h-10 rounded-full bg-paper-100 grid place-items-center text-ink-300 border-2 border-paper-200">
      <Circle size={12} weight="regular" />
    </div>
  );
}

function ProgressBar({ events }: { events: TrackingEvent[] }) {
  const total = events.length;
  const done = events.filter((e) => e.state === "done").length;
  const active = events.filter((e) => e.state === "active").length;
  const percent = Math.round(((done + active * 0.5) / total) * 100);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-xs text-ink-500 mb-2">
        <span>İlerleme</span>
        <span className="tabular-nums font-medium text-ink-900">%{percent}</span>
      </div>
      <div className="h-2 rounded-full bg-paper-200 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
        />
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
