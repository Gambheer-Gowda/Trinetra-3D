import React from "react";
import { ArrowRight, Video, Target, Box, Sparkles } from "lucide-react";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  tagline: string;
  image: string;
  badge: string;
  colorAccent: string;
  badgeColor: string;
  arrowBg: string;
  onClick?: () => void;
}

const CARDS: FeatureCardProps[] = [
  {
    title: "Drone Footage → 3D Reconstruction",
    tagline: "Transform aerial video into a 3D model",
    image: "/drone_master_photo.jpg",
    badge: "Optical Ingestion",
    colorAccent: "group-hover:border-cyan-500/50 group-hover:shadow-[0_12px_30px_-10px_rgba(6,182,212,0.3)]",
    badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    arrowBg: "group-hover:bg-cyan-500 group-hover:text-black",
  },
  {
    title: "Geospatial Intelligence",
    tagline: "Generate measurable and georeferenced spatial data",
    image: "/photogrammetric_reference.png",
    badge: "WGS84 / UTM",
    colorAccent: "group-hover:border-emerald-500/50 group-hover:shadow-[0_12px_30px_-10px_rgba(16,185,129,0.3)]",
    badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    arrowBg: "group-hover:bg-emerald-500 group-hover:text-black",
  },
  {
    title: "Digital Twin & Analysis",
    tagline: "Explore, measure, and analyze the reconstructed environment",
    image: "/photogrammetric_model_alpha.png",
    badge: "3D CAD & Volumetrics",
    colorAccent: "group-hover:border-purple-500/50 group-hover:shadow-[0_12px_30px_-10px_rgba(168,85,247,0.3)]",
    badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    arrowBg: "group-hover:bg-purple-500 group-hover:text-white",
  }
];

export function FeatureCardsSection({
  onSelectFeature,
  onLaunchPlatform
}: {
  onSelectFeature?: (index: number) => void;
  onLaunchPlatform?: () => void;
}) {
  return (
    <section className="relative w-full py-16 px-4 md:px-8 lg:px-12 bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-200">
      {/* Background Dot Pattern with subtle Radial Fade */}
      <DotPattern
        width={20}
        height={20}
        cr={1}
        className="fill-zinc-300/60 dark:fill-white/[0.04] [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
      />

      <div className="relative max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Centered Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white max-w-2xl leading-[1.15]">
          Metrically accurate 3D models from a single drone pass.
        </h2>

        {/* Short Supporting Description */}
        <p className="mt-4 text-sm md:text-base text-zinc-600 dark:text-zinc-400 max-w-xl font-normal leading-relaxed">
          Trinetra-3D is an autonomous photogrammetry engine engineered for rapid tactical mapping,
          geospatial intelligence, and real-time digital twin generation.
        </p>

        {/* Minimal Pill Action Button (matching reference) */}
        <div className="mt-6">
          <button
            onClick={onLaunchPlatform}
            className="px-6 py-2.5 rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs md:text-sm font-semibold transition-all duration-150 shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>Launch Tactical Platform</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Responsive 3-Card Grid matching reference layout */}
        <div className="mt-14 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {CARDS.map((card, idx) => (
            <div
              key={idx}
              onClick={() => onSelectFeature && onSelectFeature(idx)}
              className={cn(
                "group relative flex flex-col justify-between rounded-3xl overflow-hidden cursor-pointer",
                "bg-white dark:bg-zinc-900/60 backdrop-blur-xl",
                "border border-zinc-200/80 dark:border-white/[0.08]",
                "shadow-sm hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300 ease-out",
                "hover:-translate-y-1.5",
                card.colorAccent
              )}
            >
              {/* Image Container with Large Rounded Top */}
              <div className="relative w-full aspect-[4/3] md:aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-950 p-2.5 pb-0">
                <div className="w-full h-full rounded-2xl overflow-hidden relative">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover object-center transform transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {/* Subtle gradient vignette over image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                  
                  {/* Category Pill on top left */}
                  <div className="absolute top-3 left-3">
                    <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-md", card.badgeColor)}>
                      {card.badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer: Title + Tagline on Left, Circular Arrow on Right */}
              <div className="p-5 flex items-center justify-between gap-3">
                <div className="text-left flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-white tracking-tight group-hover:text-cyan-500 dark:group-hover:text-cyan-300 transition-colors duration-200 truncate">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                    {card.tagline}
                  </p>
                </div>

                {/* Circular Arrow Button */}
                <div
                  className={cn(
                    "shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
                    "bg-zinc-100 dark:bg-white/[0.08] text-zinc-600 dark:text-zinc-300",
                    "border border-zinc-200 dark:border-white/10",
                    "transition-all duration-200 shadow-sm",
                    "group-hover:scale-110 group-hover:rotate-[-25deg]",
                    card.arrowBg
                  )}
                >
                  <ArrowRight className="w-4 h-4 transition-transform duration-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureCardsSection;
