"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const loadingTexts = [
  "Wait for a second",
  "Preparing the project",
  "Hold on, tidying up some data here...",
  "Almost there! Just adding the final touch...",
  "Hang tight, brewing something cool for you...",
]

const AnimatedLoadingScreen: React.FC = () => {
  const [currentText, setCurrentText] = useState(loadingTexts[0])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(loadingTexts[Math.floor(Math.random() * loadingTexts.length)])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0B0B0F]">
      {/* Animated Gradient Overlay */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(120deg, hsl(var(--hue1) 80% 70%), hsl(var(--hue2) 80% 70%))`,
        }}
        animate={{
          '--hue1': [0, 360],
          '--hue2': [180, 540],
        }}
        transition={{
          repeat: Infinity,
          duration: 8,
          ease: "linear",
        }}
      />

      {/* Loading Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
        <motion.div
          className="w-10 h-10 border-4 border-white border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={currentText}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="h-8 text-center"
          >
            <p className="text-xl font-medium text-white drop-shadow-md">{currentText}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AnimatedLoadingScreen
