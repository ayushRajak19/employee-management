import React, { useMemo } from "react";
import { cn } from "@/lib/cn";

interface MeteorsProps {
  number?: number;
  className?: string;
  angle?: number;
}

export const Meteors: React.FC<MeteorsProps> = ({
  number = 20,
  className,
}) => {
  const meteors = useMemo(() => {
    return Array.from({ length: number }).map((_, idx) => ({
      id: idx,
      top: -20,
      left: Math.floor(Math.random() * 800 - 200),
      delay: Math.random() * 2 + 0.2,
      duration: Math.floor(Math.random() * 6 + 3),
    }));
  }, [number]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {meteors.map((meteor) => (
        <span
          key={`meteor-${meteor.id}`}
          style={{
            top: `${meteor.top}px`,
            left: `${meteor.left}px`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
          className={cn(
            "animate-meteor-effect absolute h-0.5 w-0.5 rotate-[215deg] rounded-full bg-emerald-300 shadow-[0_0_0_1px_#ffffff20]",
            "before:absolute before:top-1/2 before:h-[1px] before:w-[65px] before:-translate-y-[50%] before:bg-gradient-to-r before:from-emerald-300 before:to-transparent before:content-['']",
            className
          )}
        />
      ))}
    </div>
  );
};
