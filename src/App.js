import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "./config";
import {
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  LineChart,
  Leaf,
  Users,
  Sparkles,
  Factory,
  BarChart3,
  Lightbulb,
  Globe2,
  ShieldCheck,
  PhoneCall,
  Video,
  Calendar,
} from "lucide-react";

/**
 * Updates:
 * - Editor now shows the FULL CONFIG (brand, theme, slides). You don't need to see or edit code.
 * - Press E to open/close the editor, or click the Edit button. The editor is high-contrast and fullscreen.
 * - Save validates the JSON (tests) and applies it live.
 * - All slides are dark, and "Retell AI" spelling is consistent.
 */

const DEFAULT_CONFIG = {
  brand: {
    name: "Revolt",
    accent: "#7c3aed", // violet-600
  },
  theme: {
    backgrounds: [
      "https://images.unsplash.com/photo-1602524817040-12a9b5a4a0ba?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1920&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1604079628040-94301bb21b91?q=80&w=1920&auto=format&fit=crop",
    ],
    overlay: "rgba(0,0,0,0.50)",
  },
  slides: [
    {
      layout: "hero",
      on: "dark",
      kicker: "AI Voice Receptionists",
      title: "24/7 Receptionist that Books and Qualifies",
      text:
        "Retell AI stack with Twilio, 11Labs, and OpenAI. Integrated via n8n, running on Google Cloud, scheduling with Cal.com.",
      cta: { label: "See the Demo", action: "lastSlide" },
      media: { type: "embed", src: "https://www.youtube.com/watch?v=kpwNpdEPz7E", poster: "" },
      bgIndex: 0,
      blocks: [
        { icon: "PhoneCall", title: "24/7 Coverage", text: "Never miss a call." },
        { icon: "Sparkles", title: "Natural Voices", text: "11Labs neural speech." },
        { icon: "LineChart", title: "Drives Revenue", text: "Books, qualifies, routes." },
      ],
    },
    {
      layout: "grid",
      on: "dark",
      bgIndex: 1,
      kicker: "Stack",
      title: "Retell AI Orchestrated by Revolt",
      text:
        "Twilio for telephony, OpenAI for reasoning, 11Labs for voices. n8n automates workflows. Deployed on Google Cloud. Booking via Cal.com.",
      blocks: [
        { icon: "PhoneCall", title: "Twilio", text: "Reliable numbers, SIP, IVR." },
        { icon: "Sparkles", title: "OpenAI", text: "Conversation + intent parsing." },
        { icon: "Video", title: "11Labs", text: "Real‑time TTS + cloning." },
        { icon: "Factory", title: "n8n", text: "CRM + ERP integrations." },
        { icon: "Globe2", title: "Google Cloud", text: "Scalable, secure hosting." },
        { icon: "Calendar", title: "Cal.com", text: "Instant scheduling + rescheduling." },
      ],
    },
    {
      layout: "cards",
      on: "dark",
      bgIndex: 2,
      kicker: "Use Cases",
      title: "Answer, Qualify, and Book",
      text: "Inbound and outbound assistants that handle the entire front desk process.",
      blocks: [
        {
          icon: "CheckCircle2",
          title: "Inbound Reception",
          text: "Answers calls, captures intent, checks availability, books on Cal.com.",
          badge: "Core",
        },
        {
          icon: "BarChart3",
          title: "Lead Qualification",
          text: "Dynamic Q&A to score leads, push to CRM, route hot prospects.",
          badge: "+AOV",
        },
        {
          icon: "Rocket",
          title: "Outbound Campaigns",
          text: "Upload CSV. Dial warm/cold lists, follow scripts, demo/appointment set.",
          badge: "CSV",
        },
      ],
    },
    {
      layout: "stats",
      on: "dark",
      kicker: "Impact",
      title: "Quantified Results",
      stats: [
        { label: "Avg. Response Time", value: "<2s" },
        { label: "Booked Rate Lift", value: "+22%" },
        { label: "Qualification Accuracy", value: ">90%" },
      ],
      text: "Example benchmarks. Replace with your pilot metrics by market.",
    },
    {
      layout: "timeline",
      on: "dark",
      kicker: "Go‑Live",
      title: "From Zero to Live in a Week",
      text: "Simple implementation with existing systems.",
      milestones: [
        { label: "Day 1", value: 10 },
        { label: "Day 3", value: 30 },
        { label: "Day 5", value: 60 },
        { label: "Day 7", value: 100 },
      ],
    },
    {
      layout: "callouts",
      on: "dark",
      kicker: "Highlights",
      title: "Why Revolt",
      blocks: [
        { icon: "ShieldCheck", title: "Compliance", text: "PII handling, call consent, regional storage." },
        { icon: "Globe2", title: "Multilingual", text: "20+ languages with locale logic." },
        { icon: "Users", title: "CRM Ready", text: "HubSpot, Salesforce, custom APIs via n8n." },
        { icon: "Lightbulb", title: "Smart Routing", text: "Escalate to humans when needed." },
      ],
    },
    {
      layout: "media",
      on: "dark",
      bgIndex: 1,
      kicker: "Flow",
      title: "From Call to Calendar",
      text: "Intent → qualification → policy check → book/reschedule → CRM update → follow‑ups.",
      media: {
        type: "image",
        src: "https://cdn.midjourney.com/cbf3f066-9479-4a74-bbe1-e6a57afb80cb/0_0.png",
      },
    },
    {
      layout: "logos",
      on: "dark",
      kicker: "Integrations",
      title: "Part of Your Stack",
      text: "Swap placeholders with your actual tools.",
      logos: ["Twilio", "OpenAI", "11Labs", "n8n", "Google Cloud", "Cal.com"],
    },
    {
      layout: "pricing",
      on: "dark",
      kicker: "Plans",
      title: "Simple, usage‑based tiers",
      text: "Transparent minutes + seats. Month‑to‑month pilot available.",
      tiers: [
        { name: "Pilot", price: "from $", features: ["Single number", "1 flow", "Email support"] },
        { name: "Growth", price: "$$", features: ["Multi‑number", "CSV outbound", "Phone support"] },
        { name: "Scale", price: "Custom", features: ["SLA", "Dedicated success", "Compliance review"] },
      ],
    },
    {
      layout: "contact",
      on: "dark",
      bgIndex: 0,
      kicker: "Get Started",
      title: "Connect your number and details",
      text: "Enter your phone first. We'll trigger a confirmation call after submit.",
      form: "call-initiation",
      contact: {
        email: "sales@revolt.ai",
        phone: "+1 (555) 867‑5309",
      },
    },
  ],
};

// Icon map
const ICONS = {
  PlayCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Rocket,
  LineChart,
  Leaf,
  Users,
  Sparkles,
  Factory,
  BarChart3,
  Lightbulb,
  Globe2,
  ShieldCheck,
  PhoneCall,
  Video,
  Calendar,
};

function Icon({ name, className = "w-5 h-5" }) {
  const C = ICONS[name] || Sparkles;
  return <C className={className} />;
}

const variants = {
  enter: { opacity: 0, y: 20 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function Pill({ children, tone = "dark" }) {
  const base =
    tone === "dark"
      ? "bg-white/15 border-white/20 text-white"
      : "bg-black/5 border-black/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${base}`}>
      {children}
    </span>
  );
}

function SectionShell({ children, s, config }) {
  const bgUrl = config.theme.backgrounds[s.bgIndex ?? -1];
  const isDark = s.on === "dark";
  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col"
      style={
        bgUrl
          ? {
              backgroundImage: `radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15), transparent 70%), radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.15), transparent 70%), linear-gradient(${config.theme.overlay},${config.theme.overlay}), url(${bgUrl})`,
              backgroundSize: "cover, cover, cover, cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              color: isDark ? "#fff" : "#0a0a0a",
            }
          : { 
              background: isDark 
                ? "radial-gradient(ellipse at top, rgba(139, 92, 246, 0.15), transparent 70%), radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.15), transparent 70%), #0b0b14"
                : "radial-gradient(ellipse at top, rgba(139, 92, 246, 0.08), transparent 70%), radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.08), transparent 70%), #ffffff",
              color: isDark ? "#fff" : "#0a0a0a" 
            }
      }
    >
      {children}
    </div>
  );
}

function Progress({ index, total, onJump, tone }) {
  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 ${
      tone === "dark" ? "bg-white/80" : "bg-black/80"
    } backdrop-blur rounded-full px-3 py-2 border border-black/10 shadow-[0_4px_8px_rgba(0,0,0,0.15)]`}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onJump(i)}
          aria-label={`Go to slide ${i + 1}`}
          className={`h-2 rounded-full transition-all ${
            i === index ? "w-8 bg-black/80" : "w-2 bg-black/20 hover:bg-black/40"
          }`}
        />
      ))}
    </div>
  );
}

function NavButtons({ onPrev, onNext, tone }) {
  const base = tone === "dark" ? "bg-white/85" : "bg-black/85 text-white";
  return (
    <div className="fixed inset-y-0 left-0 right-0 pointer-events-none z-30">
      <div className="flex items-center justify-between h-full">
        <button
          onClick={onPrev}
          className={`pointer-events-auto m-3 md:m-6 p-2 rounded-full ${base} hover:opacity-95 border border-black/10 shadow-[0_4px_8px_rgba(0,0,0,0.15)]`}
          aria-label="Previous slide"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onNext}
          className={`pointer-events-auto m-3 md:m-6 p-2 rounded-full ${base} hover:opacity-95 border border-black/10 shadow-[0_4px_8px_rgba(0,0,0,0.15)]`}
          aria-label="Next slide"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Helper function to convert YouTube watch URLs to embed URLs
function getYouTubeEmbedUrl(url) {
  if (!url) return "";
  
  // If already an embed URL, return as-is
  if (url.includes("/embed/")) return url;
  
  // Extract video ID from watch URL
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0&modestbranding=1`;
  }
  
  // If it's already an embed URL or other format, return as-is
  return url;
}

function HeroSlide({ s, onNavigate }) {
  const hasVideo = s.media && s.media.type === "video" && s.media.src;
  const hasEmbed = s.media && s.media.type === "embed" && s.media.src;
  const embedSrc = hasEmbed ? getYouTubeEmbedUrl(s.media.src) : "";
  
  const handleCTAClick = (e) => {
    if (s.cta?.action === "lastSlide") {
      e.preventDefault();
      onNavigate?.();
    }
  };
  
  return (
    <div className="relative flex flex-col items-center px-6 md:px-16 py-20">
      {/* Main content centered */}
      <div className="max-w-4xl text-center space-y-5">
        <Pill tone={s.on}>{s.kicker}</Pill>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-stone-50 to-cyan-400 bg-clip-text text-transparent">
          {s.title}
        </h1>
        <p className="text-base md:text-lg opacity-90 mx-auto max-w-2xl">{s.text}</p>
        
        {/* Feature blocks */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {s.blocks?.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Icon name={b.icon} /> <span className="opacity-90">{b.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Large CTA button */}
      {s.cta?.label && (
        <a
          href={s.cta.href || "#"}
          onClick={handleCTAClick}
          className={`inline-flex items-center gap-3 rounded-full px-8 py-4 text-lg font-semibold mt-8 ${
            s.on === "dark" ? "bg-white text-black" : "bg-black text-white"
          } hover:scale-105 transition-transform shadow-[0_4px_8px_rgba(0,0,0,0.15)]`}
        >
          {s.cta.label} <ArrowRight className="w-5 h-5" />
        </a>
      )}

      {/* Video directly below */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-black/10 bg-white mt-8 w-full max-w-4xl">
        {hasEmbed ? (
          <iframe
            src={embedSrc}
            title={s.title || "Video"}
            className="w-full h-[320px] md:h-[480px]"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          />
        ) : hasVideo ? (
          <video
            src={s.media.src}
            poster={s.media?.poster}
            className="w-full h-[320px] md:h-[480px] object-cover"
            controls
          />
        ) : (
          <div className="w-full h-[320px] md:h-[480px] grid place-items-center bg-gradient-to-br from-violet-100 to-indigo-100">
            <div className="text-center text-black">
              <Video className="w-12 h-12 mx-auto" />
              <p className="mt-2 text-sm opacity-70">Add your video URL in slides[0].media.src</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Powered by Revolt text */}
      <p className="text-base md:text-lg opacity-70 text-gray-600 mt-4">
        Powered by Revolt.
      </p>
    </div>
  );
}

function GridSlide({ s }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16">
      <div className="max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <div>
          <Pill tone={s.on}>{s.kicker}</Pill>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-5">{s.title}</h2>
          {s.text && <p className="mt-5 text-lg md:text-xl opacity-90 max-w-4xl">{s.text}</p>}
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-3 gap-4 md:gap-3 lg:gap-8">
          {s.blocks?.map((b, i) => (
            <div 
              key={i} 
              className={`rounded-[28px] border relative overflow-hidden backdrop-blur-[34px] opacity-92 shadow-[0_10px_28px_rgba(0,0,0,0.10)] transition-transform ${
                s.on === "dark" ? "border-white/35 bg-white/10" : "border-black/35 bg-white/10"
              } p-4 md:p-4 lg:p-8`} 
              style={{
                boxShadow: "0 10px 28px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.20)"
              }}
            >
              <div className="relative z-10">
                <Icon name={b.icon} className="w-5 h-5 md:w-5 md:h-5 lg:w-8 lg:h-8" />
                <h3 className="font-semibold mt-3 md:mt-2 lg:mt-5 text-sm md:text-xs lg:text-lg leading-tight md:leading-tight">{b.title}</h3>
                <p className="text-xs md:text-[10px] lg:text-base opacity-90 mt-2 md:mt-1.5 lg:mt-3 leading-tight md:leading-tight">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function CardsSlide({ s }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16">
      <div className="max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <div>
          <Pill tone={s.on}>{s.kicker}</Pill>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-5">{s.title}</h2>
          {s.text && <p className="mt-5 text-lg md:text-xl opacity-90 max-w-4xl">{s.text}</p>}
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-9">
          {s.blocks?.map((b, i) => (
            <div key={i} className={`rounded-[28px] border p-9 relative overflow-hidden backdrop-blur-[34px] opacity-92 shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
              s.on === "dark" ? "border-white/35 bg-white/10" : "border-black/35 bg-white/10"
            }`} style={{
              boxShadow: "0 10px 28px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.20)"
            }}>
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <Icon name={b.icon} className="w-8 h-8" />
                  <span className={`text-sm rounded-full px-3 py-1 ${
                    s.on === "dark" ? "bg-white/15" : "bg-black/5"
                  }`}>{b.badge || "Feature"}</span>
                </div>
                <h3 className="font-semibold mt-5 text-lg">{b.title}</h3>
                <p className="text-base opacity-90 mt-3">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function StatsSlide({ s }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16">
      <div className="max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <div>
          <Pill tone={s.on}>{s.kicker}</Pill>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-5">{s.title}</h2>
          {s.text && <p className="mt-5 text-lg md:text-xl opacity-80 max-w-4xl">{s.text}</p>}
        </div>
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-9">
          {s.stats?.map((st, i) => (
            <div key={i} className={`rounded-[28px] text-center p-9 border relative overflow-hidden backdrop-blur-[34px] opacity-92 shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
              s.on === "dark" ? "border-white/35 bg-white/10" : "border-black/35 bg-white/10"
            }`} style={{
              boxShadow: "0 10px 28px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.20)"
            }}>
              <div className="relative z-10">
                <div className="text-5xl md:text-6xl font-extrabold">{st.value}</div>
                <div className="opacity-80 mt-2 text-lg">{st.label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function TimelineSlide({ s }) {
  const max = Math.max(...s.milestones.map((m) => m.value));
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16">
      <div className="max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <div>
          <Pill tone={s.on}>{s.kicker}</Pill>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-5">{s.title}</h2>
          {s.text && <p className="mt-5 text-lg md:text-xl opacity-80 max-w-4xl">{s.text}</p>}
        </div>
        <div className="mt-16 grid grid-cols-4 gap-6 items-end">
          {s.milestones.map((m, i) => (
            <div key={i} className="text-center">
              <div
                className={`mx-auto w-16 rounded-xl ${
                  s.on === "dark"
                    ? "bg-gradient-to-t from-violet-300 to-white"
                    : "bg-gradient-to-t from-violet-600 to-fuchsia-400"
                }`}
                style={{ height: `${(m.value / max) * 330 + 30}px` }}
              />
              <div className="mt-3 text-base opacity-80">{m.label}</div>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function CalloutsSlide({ s }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16">
      <div className="max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <div>
          <Pill tone={s.on}>{s.kicker}</Pill>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-5">{s.title}</h2>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-3 lg:gap-9">
          {s.blocks?.map((b, i) => (
            <div key={i} className={`rounded-[28px] border relative overflow-hidden backdrop-blur-[34px] opacity-92 shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
              s.on === "dark" ? "border-white/35 bg-white/10" : "border-black/35 bg-white/10"
            } p-4 md:p-4 lg:p-9`} style={{
              boxShadow: "0 10px 28px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.20)"
            }}>
              <div className="relative z-10">
                <Icon name={b.icon} className="w-5 h-5 md:w-5 md:h-5 lg:w-8 lg:h-8" />
                <h3 className="font-semibold mt-3 md:mt-2 lg:mt-5 text-sm md:text-xs lg:text-lg leading-tight md:leading-tight">{b.title}</h3>
                <p className="text-xs md:text-[10px] lg:text-base opacity-90 mt-2 md:mt-1.5 lg:mt-3 leading-tight md:leading-tight">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function MediaSlide({ s }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-4 sm:px-6 md:px-16">
      <div className="relative max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <div className={`relative rounded-xl md:rounded-2xl overflow-hidden border shadow-lg ${
          s.on === "dark" ? "border-white/20 bg-white/10" : "border-black/10 bg-white"
        }`}>
          {s.media?.type === "image" && (
            <img src={s.media.src} alt={s.title || "Media"} className="w-full h-[420px] sm:h-[540px] md:h-[720px] lg:h-[900px] object-cover" />
          )}
          {s.media?.type === "embed" && (
            <iframe src={s.media.src} title={s.title || "Embedded content"} className="w-full h-[420px] sm:h-[540px] md:h-[720px] lg:h-[900px]" />
          )}
          {/* Text overlay */}
          <div className="absolute top-0 left-0 right-0 p-6 sm:p-9 md:p-12 lg:p-16">
            <Pill tone={s.on}>{s.kicker}</Pill>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mt-3 sm:mt-4">{s.title}</h2>
            {s.text && <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl lg:text-2xl opacity-90 max-w-4xl">{s.text}</p>}
          </div>
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function LogosSlide({ s }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16 text-center">
      <div className="max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <Pill tone={s.on}>{s.kicker}</Pill>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-5">{s.title}</h2>
        {s.text && <p className="mt-5 text-lg md:text-xl opacity-80 max-w-4xl mx-auto">{s.text}</p>}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-6 gap-9">
          {s.logos?.map((l, i) => (
            <div key={i} className={`rounded-[28px] p-9 text-base border relative overflow-hidden backdrop-blur-[34px] opacity-92 shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
              s.on === "dark" ? "border-white/35 bg-white/10" : "border-black/35 bg-white/10"
            }`} style={{
              boxShadow: "0 10px 28px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.20)"
            }}>
              <div className="relative z-10">
                {l}
              </div>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function PricingSlide({ s }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16 text-center">
      <div className="max-w-7xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <Pill tone={s.on}>{s.kicker}</Pill>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mt-5">{s.title}</h2>
        {s.text && <p className="mt-5 text-lg md:text-xl opacity-80 max-w-4xl mx-auto">{s.text}</p>}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-3 lg:gap-9">
          {s.tiers?.map((t, i) => (
            <div key={i} className={`rounded-[28px] text-left border relative overflow-hidden backdrop-blur-[34px] opacity-92 shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
              s.on === "dark" ? "border-white/35 bg-white/10" : "border-black/35 bg-white/10"
            } p-4 md:p-5 lg:p-9`} style={{
              boxShadow: "0 10px 28px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.20)"
            }}>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm md:text-xs lg:text-lg">{t.name}</h3>
                  <span className={`text-xs md:text-[10px] lg:text-sm rounded-full px-2 md:px-2 lg:px-3 py-1 ${
                    s.on === "dark" ? "bg-white/15" : "bg-black/5"
                  }`}>{t.price}</span>
                </div>
                <ul className="mt-4 md:mt-3 lg:mt-6 space-y-2 md:space-y-1.5 lg:space-y-3">
                  {t.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 md:gap-1.5 lg:gap-3 text-xs md:text-[10px] lg:text-base">
                      <CheckCircle2 className="w-4 h-4 md:w-3 md:h-3 lg:w-5 lg:h-5 flex-shrink-0" /> <span className="leading-tight md:leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>
    </div>
  );
}

function ContactSlide({ s }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [business, setBusiness] = useState("");
  const [examples, setExamples] = useState(["", "", ""]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const submit = async () => {
    if (!phone.trim()) {
      setSubmitError("Please enter a phone number.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const payload = {
        phone: phone.trim(),
        name: name.trim(),
        email: email.trim(),
        business: business.trim(),
        exampleInformation1: examples[0]?.trim() || "",
        exampleInformation2: examples[1]?.trim() || "",
        exampleInformation3: examples[2]?.trim() || "",
      };

      const response = await axios.post(`${API_BASE_URL}/api/contact`, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      });

      if (response.data.success) {
        // Reset form after submission
        setPhone("");
        setName("");
        setEmail("");
        setBusiness("");
        setExamples(["", "", ""]);
        
        // Log webhook errors and show warning in dev mode
        if (response.data.webhookError) {
          console.error('❌ Webhook error:', response.data.webhookError);
          
          // In dev mode, show error message to user
          const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
          if (isDev) {
            const errorDetails = response.data.webhookError.details || response.data.webhookError.error || 'Webhook failed';
            setSubmitError(`⚠️  Form submitted, but n8n webhook failed: ${errorDetails}`);
            
            // Auto-clear the error after 10 seconds
            setTimeout(() => setSubmitError(''), 10000);
          }
        }
        
        // Always show modal on successful form submission
        // Use setTimeout to ensure state updates happen after form reset
        // Wrap in try-catch to prevent any errors from crashing the app
        setTimeout(() => {
          try {
            setShowModal(true);
          } catch (err) {
            console.error('Error showing modal:', err);
          }
        }, 0);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        request: error.request ? 'Request made but no response' : 'No request made'
      });
      
      // More detailed error messages
      let errorMessage = 'Failed to submit form. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - the server took too long to respond. Please try again.';
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorMessage = `Network error - cannot connect to server at ${API_BASE_URL}. Make sure the backend server is running on port 3001.`;
      } else if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || `Server error: ${error.response.status} ${error.response.statusText}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = `No response from server at ${API_BASE_URL}. Check if the backend server is running.`;
      } else {
        errorMessage = error.message || 'Failed to submit form. Please try again.';
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="contact" className="flex flex-col justify-center items-center min-h-[100dvh] px-6 md:px-16">
      <div className="max-w-6xl w-full translate-y-0 md:-translate-y-[5%] lg:-translate-y-[10%]">
        <div className="text-center space-y-5">
          <Pill tone={s.on}>{s.kicker}</Pill>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight pb-2 bg-gradient-to-r from-stone-50 to-cyan-400 bg-clip-text text-transparent">
            {s.title}
          </h2>
          {s.text && <p className="text-base md:text-lg opacity-90 mx-auto max-w-2xl -mt-[5px]">{s.text}</p>}
        </div>
        <div className={`rounded-[28px] overflow-hidden border p-9 mt-10 relative backdrop-blur-[34px] opacity-92 shadow-[0_10px_28px_rgba(0,0,0,0.10)] ${
          s.on === "dark" ? "border-white/35 bg-white/10" : "border-black/35 bg-white/10"
        }`} style={{
          boxShadow: "0 10px 28px rgba(0,0,0,0.10), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -2px 4px rgba(0,0,0,0.20)"
        }}>
          <div className="relative z-10">
            <h3 className="font-semibold text-xl">Check it out!</h3>
          <form className="mt-6 grid gap-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <input 
              className="border rounded-xl px-5 py-4 text-lg text-black" 
              placeholder="Phone number" 
              value={phone} 
              onChange={(e)=>setPhone(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <div className="grid md:grid-cols-3 gap-5">
              <input 
                className="border rounded-xl px-5 py-4 text-lg text-black" 
                placeholder="Name" 
                value={name} 
                onChange={(e)=>setName(e.target.value)}
                disabled={isSubmitting}
              />
              <input 
                className="border rounded-xl px-5 py-4 text-lg text-black" 
                placeholder="Email" 
                type="email"
                value={email} 
                onChange={(e)=>setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <input 
                className="border rounded-xl px-5 py-4 text-lg text-black" 
                placeholder="Business" 
                value={business} 
                onChange={(e)=>setBusiness(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              <textarea 
                className="border rounded-xl px-5 py-4 text-lg text-black" 
                placeholder="Example information 1" 
                rows={4} 
                value={examples[0]} 
                onChange={(e)=>setExamples([e.target.value, examples[1], examples[2]])}
                disabled={isSubmitting}
              />
              <textarea 
                className="border rounded-xl px-5 py-4 text-lg text-black" 
                placeholder="Example information 2" 
                rows={4} 
                value={examples[1]} 
                onChange={(e)=>setExamples([examples[0], e.target.value, examples[2]])}
                disabled={isSubmitting}
              />
              <textarea 
                className="border rounded-xl px-5 py-4 text-lg text-black" 
                placeholder="Example information 3" 
                rows={4} 
                value={examples[2]} 
                onChange={(e)=>setExamples([examples[0], examples[1], e.target.value])}
                disabled={isSubmitting}
              />
            </div>
            {submitError && (
              <div className="text-red-500 text-base">{submitError}</div>
            )}
            <button 
              type="submit" 
              className={`rounded-xl px-8 py-5 text-lg font-semibold text-white transition-all inline-flex items-center gap-3 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed shadow-lg shadow-gray-400/40' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 shadow-2xl shadow-blue-600/60 hover:shadow-blue-600/70'
              }`}
              style={!isSubmitting ? {
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5), 0 4px 6px -2px rgba(37, 99, 235, 0.3)'
              } : {}}
              disabled={isSubmitting}
            >
              <PhoneCall className="w-5 h-5" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </div>
        </div>
        <p className="text-base md:text-lg opacity-70 mt-8 text-center">Powered by Revolt.</p>
      </div>

      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4"
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="bg-white text-black rounded-2xl shadow-2xl max-w-xl w-full p-9">
            <h4 className="text-2xl font-semibold">Check your phone</h4>
            <p className="mt-4 text-lg">Please check the phone associated with that phone number. It will be having a phone call.</p>
            <button 
              onClick={() => setShowModal(false)} 
              className="mt-6 rounded-xl bg-black text-white px-8 py-4 text-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function Slide({ data, onNavigateToLast }) {
  switch (data.layout) {
    case "hero":
      return <HeroSlide s={data} onNavigate={onNavigateToLast} />;
    case "grid":
      return <GridSlide s={data} />;
    case "cards":
      return <CardsSlide s={data} />;
    case "stats":
      return <StatsSlide s={data} />;
    case "timeline":
      return <TimelineSlide s={data} />;
    case "callouts":
      return <CalloutsSlide s={data} />;
    case "media":
      return <MediaSlide s={data} />;
    case "logos":
      return <LogosSlide s={data} />;
    case "pricing":
      return <PricingSlide s={data} />;
    case "contact":
      return <ContactSlide s={data} />;
    default:
      return (
        <div className="p-24">
          <h2 className="text-3xl font-bold">Unknown layout</h2>
        </div>
      );
  }
}

function Editor({ value, onChange }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-5xl bg-[#0b0b14] text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="font-semibold">Config Editor</div>
          <div className="text-xs opacity-70">Edit brand, theme, and slides. Press Cmd/Ctrl+S to save.</div>
        </div>
        <textarea
          className="w-full h-[65vh] p-4 font-mono text-sm outline-none bg-transparent text-white"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function validateConfig(cfg) {
  const errors = [];
  if (!cfg || typeof cfg !== "object") errors.push("CONFIG must be an object");
  if (!cfg.slides || !Array.isArray(cfg.slides)) errors.push("CONFIG.slides must be an array");
  (cfg.slides || []).forEach((s, idx) => {
    if (!s || typeof s !== "object") errors.push(`Slide ${idx} is not an object`);
    if (!s.layout) errors.push(`Slide ${idx} missing layout`);
    if (s.blocks && !Array.isArray(s.blocks)) errors.push(`Slide ${idx} blocks must be an array`);
    if (s.stats && !Array.isArray(s.stats)) errors.push(`Slide ${idx} stats must be an array`);
    if (s.tiers && !Array.isArray(s.tiers)) errors.push(`Slide ${idx} tiers must be an array`);
    if (s.milestones && !Array.isArray(s.milestones)) errors.push(`Slide ${idx} milestones must be an array`);
  });
  return errors;
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [json, setJson] = useState(JSON.stringify(DEFAULT_CONFIG, null, 2));
  const tone = config.slides[index]?.on || "dark";
  const [testErrors, setTestErrors] = useState([]);

  // validations (tests)
  useEffect(() => {
    setTestErrors(validateConfig(config));
  }, [config]);

  const saveJson = useCallback(() => {
    try {
      const next = JSON.parse(json);
      const errs = validateConfig(next);
      if (errs.length) throw new Error(errs[0]);
      setConfig(next);
      setEditing(false);
      setIndex((i) => Math.min(i, (next.slides || []).length - 1));
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  }, [json]);

  // keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (!e.key) return; // Guard against undefined key
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, config.slides.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveJson();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [config.slides.length, saveJson]);

  return (
    <SectionShell s={config.slides[index] || { on: "dark" }} config={config}>
      <style>{`
        :root { --accent: ${config.brand.accent}; }
        .accent { color: var(--accent); }
        .bg-accent { background-color: var(--accent); }
      `}</style>

      {testErrors.length > 0 && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white text-xs px-3 py-2 rounded-full shadow">
          {testErrors[0]}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.main
          key={index}
          initial="enter"
          animate="center"
          exit="exit"
          variants={variants}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1"
        >
          <Slide data={config.slides[index]} onNavigateToLast={() => setIndex(config.slides.length - 1)} />
        </motion.main>
      </AnimatePresence>

      <NavButtons
        onPrev={() => setIndex((i) => Math.max(i - 1, 0))}
        onNext={() => setIndex((i) => Math.min(i + 1, config.slides.length - 1))}
        tone={tone}
      />
      <Progress index={index} total={config.slides.length} onJump={setIndex} tone={tone} />

      {/* Editor overlay */}
      {editing && (
        <div>
          <Editor value={json} onChange={setJson} />
          <div className="fixed bottom-5 right-5 z-50 flex gap-2">
            <button
              className="rounded-full bg-white border border-black/10 shadow px-4 py-2"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-black text-white shadow px-4 py-2"
              onClick={saveJson}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </SectionShell>
  );
}
