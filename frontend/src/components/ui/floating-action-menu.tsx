"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FloatingActionMenuProps = {
  options: {
    label: string;
    onClick: () => void;
    Icon?: React.ReactNode;
  }[];
  className?: string;
};

const FloatingActionMenu = ({ options, className }: FloatingActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("fixed bottom-8 right-8 z-50", className)}>
      <Button
        onClick={() => setIsOpen((open) => !open)}
        className="h-11 w-11 rounded-full bg-[#111111cc] p-0 text-white shadow-[0_12px_30px_rgba(15,23,42,0.25)] hover:bg-[#111111]"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
        >
          <Plus className="h-6 w-6" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 10, y: 10, filter: "blur(10px)" }}
            transition={{
              duration: 0.45,
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.05,
            }}
            className="absolute bottom-12 right-0 mb-2"
          >
            <div className="flex flex-col items-end gap-2">
              {options.map((option, index) => (
                <motion.div
                  key={option.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.04,
                  }}
                >
                  <Button
                    onClick={() => {
                      option.onClick();
                      setIsOpen(false);
                    }}
                    size="sm"
                    className="flex h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-white/10 bg-[#111111cc] px-3 text-white shadow-[0_12px_30px_rgba(15,23,42,0.2)] backdrop-blur-sm hover:bg-[#111111]"
                  >
                    {option.Icon}
                    <span>{option.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionMenu;
