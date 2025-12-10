"use client";

import { motion } from "framer-motion";
import { FiCheck, FiCpu } from "react-icons/fi";

export default function FloatingCards() {
  return (
    <>
      {}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -left-20 bg-white p-4 rounded-xl shadow-xl z-20 max-w-[200px]"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <FiCheck />
          </div>
          <span className="font-semibold text-slate-800 text-sm">Tin nháº¯n Ä‘Ã£ gá»­i</span>
        </div>
        <div className="text-2xl font-bold text-slate-900">1,420</div>
        <div className="text-xs text-slate-500">tin nháº¯n hÃ´m nay</div>
      </motion.div>

      {}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-40 -right-10 bg-white p-4 rounded-xl shadow-xl z-20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <FiCpu />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">AI Ä‘ang xá»­ lÃ½</div>
            <div className="text-xs text-slate-500">PhÃ¢n tÃ­ch ngá»¯ cáº£nh...</div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

