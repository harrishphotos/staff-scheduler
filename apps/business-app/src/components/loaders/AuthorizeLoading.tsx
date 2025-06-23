import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react"; // You can also use Heroicons or any SVG

const AuthorizingScreen: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-slate-900 via-gray-800 to-cyan-900 flex items-center justify-center overflow-hidden">
      {/* Animated blur orb for depth */}
      <div className="absolute w-96 h-96 bg-cyan-700 rounded-full opacity-20 blur-3xl animate-pulse top-1/4 right-1/4 -z-10" />

      {/* Secure Glow Ring */}
      <motion.div
        className="absolute w-32 h-32 border-4 border-cyan-500 rounded-full opacity-30 blur-lg"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      <div className="flex flex-col items-center space-y-6 z-10">
        {/* Animated shield icon */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="bg-cyan-600 p-4 rounded-full shadow-lg shadow-cyan-700/30"
        >
          <ShieldCheck size={36} className="text-white" />
        </motion.div>

        {/* Shimmer-style authorization text */}
        <motion.p
          className="relative text-cyan-100 text-sm sm:text-base tracking-wider uppercase font-medium overflow-hidden"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message || "Authorizing access..."}
        </motion.p>
      </div>
    </div>
  );
};

export default AuthorizingScreen;
