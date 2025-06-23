import React from "react";
import { motion } from "framer-motion";

const LoadingScreen: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center overflow-hidden">
      {/* Soft glow behind blob */}
      <div className="absolute w-[30rem] h-[30rem] bg-indigo-700 rounded-full opacity-20 blur-[160px] -z-10 top-1/3 left-1/4" />

      {/* Blob + Text container */}
      <div className="flex flex-col items-center space-y-4">
        {/* Morphing blob */}
        <motion.div
          className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-2xl"
          animate={{
            borderRadius: [
              "50% 50% 50% 50%",
              "60% 40% 70% 30%",
              "50% 60% 40% 70%",
              "50% 50% 50% 50%",
            ],
          }}
          transition={{
            duration: 6,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />

        {/* Loading message */}
        <motion.p
          className="text-gray-200 text-sm sm:text-base tracking-wide"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {message || "Getting things ready..."}
        </motion.p>
      </div>
    </div>
  );
};

export default LoadingScreen;
