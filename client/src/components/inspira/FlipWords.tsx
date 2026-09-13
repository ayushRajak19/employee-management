import React, { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface FlipWordsProps {
  words: string[];
  duration?: number;
  className?: string;
}

export const FlipWords: React.FC<FlipWordsProps> = ({
  words,
  duration = 3000,
  className,
}) => {
  const [currentWord, setCurrentWord] = useState(words[0] || "");
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const startAnimation = useCallback(() => {
    const nextIndex = (words.indexOf(currentWord) + 1) % words.length;
    const nextWord = words[nextIndex];
    setCurrentWord(nextWord);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating) {
      const timer = setTimeout(() => {
        startAnimation();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, duration, startAnimation]);

  return (
    <span
      className={cn(
        "inline-block relative text-left font-normal transition-all duration-500",
        className
      )}
      onTransitionEnd={() => {
        if (isAnimating) {
          setIsAnimating(false);
        }
      }}
    >
      <span
        key={currentWord}
        className="inline-block animate-fadeInUp will-change-transform"
      >
        {currentWord}
      </span>
    </span>
  );
};
