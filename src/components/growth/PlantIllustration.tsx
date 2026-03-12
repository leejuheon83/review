"use client";

import type { PlantStage } from "@/lib/growth";

type PlantIllustrationProps = {
  stage: PlantStage;
  className?: string;
};

const COLORS = {
  leaf: "#4ade80",
  leafDark: "#22c55e",
  stem: "#65a30d",
  soil: "#78716c",
  pot: "#a8a29e",
  potAccent: "#78716c",
  seed: "#a16207",
  bloom: "#fbbf24",
  bloomCenter: "#f59e0b",
};

export function PlantIllustration({ stage, className = "" }: PlantIllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 100"
      className={`transition-opacity duration-300 ${className}`}
      aria-hidden
    >
      {/* Stage 0: Seed */}
      {stage === 0 && (
        <g className="animate-[pulse_2s_ease-in-out_infinite]">
          <ellipse cx="40" cy="75" rx="8" ry="6" fill={COLORS.seed} opacity={0.9} />
          <ellipse cx="40" cy="74" rx="5" ry="3" fill="#ca8a04" opacity={0.5} />
        </g>
      )}

      {/* Stage 1: Sprout */}
      {stage === 1 && (
        <g>
          <path
            d="M40 85 Q38 70 40 55"
            stroke={COLORS.stem}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <ellipse
            cx="35"
            cy="58"
            rx="6"
            ry="4"
            fill={COLORS.leaf}
            transform="rotate(-25 35 58)"
            className="transition-all duration-500"
          />
          <ellipse
            cx="45"
            cy="58"
            rx="6"
            ry="4"
            fill={COLORS.leaf}
            transform="rotate(25 45 58)"
            className="transition-all duration-500"
          />
        </g>
      )}

      {/* Stage 2: Young plant */}
      {stage === 2 && (
        <g>
          <path
            d="M40 88 Q39 75 40 60 Q41 50 40 42"
            stroke={COLORS.stem}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="32" cy="45" rx="8" ry="5" fill={COLORS.leaf} transform="rotate(-30 32 45)" />
          <ellipse cx="48" cy="45" rx="8" ry="5" fill={COLORS.leaf} transform="rotate(30 48 45)" />
          <ellipse cx="38" cy="38" rx="6" ry="4" fill={COLORS.leafDark} transform="rotate(-10 38 38)" />
          <ellipse cx="42" cy="38" rx="6" ry="4" fill={COLORS.leafDark} transform="rotate(10 42 38)" />
        </g>
      )}

      {/* Stage 3: Healthy potted plant */}
      {stage === 3 && (
        <g>
          {/* Pot */}
          <path
            d="M28 88 L32 75 L48 75 L52 88 Z"
            fill={COLORS.pot}
            stroke={COLORS.potAccent}
            strokeWidth="1"
          />
          <rect x="30" y="78" width="20" height="4" rx="1" fill={COLORS.potAccent} opacity={0.3} />
          {/* Soil */}
          <ellipse cx="40" cy="74" rx="10" ry="3" fill={COLORS.soil} />
          {/* Stem & leaves */}
          <path
            d="M40 72 Q39 58 40 45 Q41 35 40 28"
            stroke={COLORS.stem}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx="30" cy="32" rx="10" ry="6" fill={COLORS.leaf} transform="rotate(-25 30 32)" />
          <ellipse cx="50" cy="32" rx="10" ry="6" fill={COLORS.leaf} transform="rotate(25 50 32)" />
          <ellipse cx="36" cy="25" rx="8" ry="5" fill={COLORS.leafDark} transform="rotate(-15 36 25)" />
          <ellipse cx="44" cy="25" rx="8" ry="5" fill={COLORS.leafDark} transform="rotate(15 44 25)" />
          <ellipse cx="40" cy="20" rx="6" ry="4" fill={COLORS.leaf} />
        </g>
      )}

      {/* Stage 4: Blooming plant */}
      {stage === 4 && (
        <g>
          {/* Pot */}
          <path
            d="M26 90 L30 76 L50 76 L54 90 Z"
            fill={COLORS.pot}
            stroke={COLORS.potAccent}
            strokeWidth="1"
          />
          <rect x="28" y="80" width="24" height="4" rx="1" fill={COLORS.potAccent} opacity={0.3} />
          {/* Soil */}
          <ellipse cx="40" cy="75" rx="12" ry="3" fill={COLORS.soil} />
          {/* Stem */}
          <path
            d="M40 73 Q39 55 40 40 Q41 28 40 22"
            stroke={COLORS.stem}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Leaves */}
          <ellipse cx="28" cy="35" rx="11" ry="7" fill={COLORS.leaf} transform="rotate(-28 28 35)" />
          <ellipse cx="52" cy="35" rx="11" ry="7" fill={COLORS.leaf} transform="rotate(28 52 35)" />
          <ellipse cx="34" cy="28" rx="9" ry="6" fill={COLORS.leafDark} transform="rotate(-12 34 28)" />
          <ellipse cx="46" cy="28" rx="9" ry="6" fill={COLORS.leafDark} transform="rotate(12 46 28)" />
          <ellipse cx="40" cy="22" rx="7" ry="5" fill={COLORS.leaf} />
          {/* Bloom */}
          <circle cx="40" cy="18" r="6" fill={COLORS.bloom} className="transition-opacity duration-500" />
          <circle cx="40" cy="18" r="3" fill={COLORS.bloomCenter} />
          <circle cx="36" cy="16" r="2.5" fill={COLORS.bloom} opacity={0.8} />
          <circle cx="44" cy="16" r="2.5" fill={COLORS.bloom} opacity={0.8} />
          <circle cx="38" cy="21" r="2" fill={COLORS.bloom} opacity={0.7} />
          <circle cx="42" cy="21" r="2" fill={COLORS.bloom} opacity={0.7} />
        </g>
      )}
    </svg>
  );
}
