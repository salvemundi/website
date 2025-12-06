"use client";

import React from "react";
import { motion, useAnimation } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface BookMarkedProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const bookmarkVariants: Variants = {
  normal: {
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  animate: {
    y: [2, -4, 0],
    transition: {
      // Use a tween-style transition for multi-keyframe motion.
      // Spring transitions support only two keyframes; using a tween avoids the error.
      duration: 0.6,
      ease: "easeInOut",
    },
  },
};

const staticVariants: Variants = {
  normal: {
    opacity: 1,
  },
  animate: {
    opacity: 1,
  },
};

const BookMarked = ({
  width = 28,
  height = 28,
  strokeWidth = 2,
  stroke = "currentColor",
  __active,
  ...props
}: BookMarkedProps & { __active?: boolean }) => {
  const controls = useAnimation();

  React.useEffect(() => {
    if (__active === true) {
      controls.start("animate");
    } else if (__active === false) {
      controls.start("normal");
    }
  }, [__active, controls]);

  return (
    <div
      style={{
        cursor: "pointer",
        userSelect: "none",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={() => {
        if (__active === undefined) controls.start("animate");
      }}
      onMouseLeave={() => {
        if (__active === undefined) controls.start("normal");
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {/* Bouncing bookmark */}
        <motion.path
          d="M10 2v8l3-3 3 3V2"
          variants={bookmarkVariants}
          animate={controls}
        />
        {/* Static book part */}
        <motion.path
          d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"
          variants={staticVariants}
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { BookMarked };
