"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Settings, Shield, Zap } from 'lucide-react'

const iconVariants = {
    rotate: {
        rotate: 360,
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
        }
    }
}

const backgroundVariants = {
    pulse: {
        scale: [1, 1.05, 1],
        opacity: [0.9, 0.8, 0.9],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
}

const loadingTexts = [
    "Wait for a second",
    "Preparing the project",
    "Hold on, tidying up some data here...",
    "Just a sec, summoning the data ninjas!",
    "Hang tight, brewing something cool for you...",
    "Grab a coffee, the process is running smoothly!",
    "Almost there! Just adding the final touch...",
    "Don't go anywhere! We're wrapping it up...",
    "This loading screen is brought to you by your patience...",
    "Hang on, the data is getting a little makeover!",
    "Chewing through the data... Almost done!",
    "Speeding through this, 90% of the highway is covered!"
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
        <div className="fixed inset-0 flex items-center justify-center bg-white">
            <motion.div
                className="absolute inset-0 bg-black"
                variants={backgroundVariants}
                animate="pulse"
            />
            <div className="relative z-10 flex flex-col items-center justify-center space-y-5">
                {/* <h1 className="text-4xl font-bold text-white mb-1">Waiting</h1> */}
                <div className="flex items-center justify-center space-x-8">
                    <motion.div
                        className="w-8 h-8 border-[3px] border-[#ffffff] border-t-transparent rounded-full"
                        animate={{
                            rotate: 360
                        }}
                        transition={{
                            duration: 0.8,
                            ease: "linear",
                            repeat: Infinity
                        }}
                    />
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentText}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="h-8" // Fixed height to prevent layout shift
                    >
                        <p className="text-xl font-medium text-white">{currentText}</p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

export default AnimatedLoadingScreen

