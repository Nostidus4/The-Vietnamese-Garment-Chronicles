"use client";

import { motion } from "framer-motion";

// Lines appear one after another, like grandma writing them
export function HandwrittenText({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div key={title} className="font-hand text-stone-800">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-3 text-2xl"
      >
        {title}
      </motion.h3>
      {lines.map((line, i) => (
        <motion.p
          key={line}
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ delay: 0.3 + i * 0.6, duration: 0.8, ease: "linear" }}
          className="mb-2 text-lg leading-snug"
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}
