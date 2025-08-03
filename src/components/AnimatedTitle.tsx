import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Title content for both languages
const titleContent = {
  am: {
    title: "የደብዳቤ አስተዳደር ስርዓት",
    subtitle: "የስፔስ ሳይንስ እና ጂኦስፓሻል ኢንስቲትዩት (SSGI)",
  },
  en: {
    title: "Letter Management System",
    subtitle: "Space Science and Geospatial Institute (SSGI)",
  },
};

// Animation for each letter
const letterAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05, // Each letter appears with a slight delay
      duration: 0.5,
    },
  }),
};

export const AnimatedTitle = ({ lang }: { lang: "am" | "en" }) => {
  const [currentContent, setCurrentContent] = useState(titleContent[lang]);

  // Update content when language changes
  useEffect(() => {
    setCurrentContent(titleContent[lang]);
  }, [lang]);

  return (
    <div className="text-center">
      {/* Main Title */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${lang}-title`}
            initial="hidden"
            animate="visible"
            className="block"
          >
            {currentContent.title.split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterAnimation}
                className="inline-block"
              >
                {char === " " ? "\u00A0" : char} {/* Preserve spaces */}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </h1>

      {/* Subtitle */}
      <h2 className="text-xl sm:text-2xl text-blue-600 mb-6">
        <AnimatePresence mode="wait">
          <motion.span
            key={`${lang}-subtitle`}
            initial="hidden"
            animate="visible"
            className="block"
          >
            {currentContent.subtitle.split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={letterAnimation}
                className="inline-block"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </h2>
    </div>
  );
};