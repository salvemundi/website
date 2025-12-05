"use client";

import React from "react";
import { motion, useAnimation } from 'framer-motion';
import type { Variants } from 'framer-motion';

interface ChevronRightProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const chevronVariants: Variants = {
  normal: {
    x: 0,
    opacity: 1,
  },
  animate: {
    x: [4, 0],
    opacity: [0.3, 1],
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const ChevronRight = ({
  width = 20,
  height = 20,
  strokeWidth = 2,
  stroke = "currentColor",
  __active,
  ...props
}: ChevronRightProps & { __active?: boolean }) => {
  const controls = useAnimation();

  React.useEffect(() => {
    if (__active === true) controls.start("animate");
    else if (__active === false) controls.start("normal");
  }, [__active, controls]);

  return (
    <div
      style={{
        cursor: "pointer",
        userSelect: "none",
        display: "inline-flex",
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
        <motion.path d="m9 18 6-6-6-6" variants={chevronVariants} animate={controls} initial="normal" />
      </svg>
    </div>
  );
};

export { ChevronRight };
