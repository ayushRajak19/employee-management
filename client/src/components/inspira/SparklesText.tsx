import React, { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
  lifespan: number;
}

interface SparklesTextProps {
  text: string;
  className?: string;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
}

const SparkleIcon = ({ color }: { color: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="size-full"
  >
    <path
      d="M80 0C80 0 84.2846 41.2925 101.496 58.504C118.707 75.7154 160 80 160 80C160 80 118.707 84.2846 101.496 101.496C84.2846 118.707 80 160 80 160C80 160 75.7154 118.707 58.504 101.496C41.2925 84.2846 0 80 0 80C0 80 41.2925 75.7154 58.504 58.504C75.7154 41.2925 80 0 80 0Z"
      fill={color}
    />
  </svg>
);

export const SparklesText: React.FC<SparklesTextProps> = ({
  text,
  className,
  sparklesCount = 6,
  colors = { first: "#f5c94b", second: "#e8623c" },
}) => {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generateSparkle = (): Sparkle => {
      return {
        id: `${Math.random()}-${Date.now()}`,
        x: `${Math.floor(Math.random() * 95)}%`,
        y: `${Math.floor(Math.random() * 95)}%`,
        color: Math.random() > 0.5 ? colors.first : colors.second,
        delay: Math.random() * 1.5,
        scale: Math.random() * 0.7 + 0.4,
        lifespan: Math.random() * 1.5 + 1.2,
      };
    };

    const initialSparkles = Array.from({ length: sparklesCount }, generateSparkle);
    setSparkles(initialSparkles);

    const interval = setInterval(() => {
      setSparkles((current) => {
        return current.map((sp) =>
          Math.random() > 0.4 ? generateSparkle() : sp
        );
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [sparklesCount, colors.first, colors.second]);

  return (
    <span className={cn("relative inline-block", className)}>
      <span className="relative z-10">{text}</span>
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="pointer-events-none absolute -z-0 block animate-sparkle"
          style={{
            left: sparkle.x,
            top: sparkle.y,
            transform: `scale(${sparkle.scale})`,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.lifespan}s`,
            width: "14px",
            height: "14px",
          }}
          aria-hidden="true"
        >
          <SparkleIcon color={sparkle.color} />
        </span>
      ))}
    </span>
  );
};
