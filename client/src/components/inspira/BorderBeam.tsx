import React, { useId } from "react";
import { cn } from "@/lib/cn";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
  borderRadius?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  className,
  size = 25,
  duration = 8,
  borderWidth = 2,
  colorFrom = "#6366f1",
  colorTo = "#06b6d4",
  delay = 0,
  borderRadius = 14,
}) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 size-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id={`beam-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="1" />
            <stop offset="100%" stopColor={colorTo} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx={borderRadius}
          fill="none"
          stroke={`url(#beam-grad-${id})`}
          strokeWidth={borderWidth}
          pathLength="100"
          strokeDasharray={`${size} ${100 - size}`}
          style={{
            animation: `border-beam-dash ${duration}s linear infinite`,
            animationDelay: `-${delay}s`,
          }}
        />
      </svg>
      <style>{`
        @keyframes border-beam-dash {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};
