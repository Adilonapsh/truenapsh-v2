"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Map,
    Hexagon,
    Sparkles,
    Copy,
    TwitterIcon,
    GithubIcon,
    LinkedinIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    ZoomInIcon,
    ZoomOutIcon,
    RotateCwIcon,
    ArrowLeft,
    ArrowRight
} from "lucide-react";
import Navbar from "@/components/layouts/navbar";

// Main Page Component
export default function Home() {
    return (
        <div className="bg-background text-foreground min-h-screen">
            <Navbar />
            <HeroSection />
            <BrandsSection />
            <FeaturesSection />
            <TestimonialsSection />
            <FaqSection />
            <CtaSection />
            <Footer />
        </div>
    );
}

// Interactive Navbar with scroll animation
// const Navbar = () => {
//     const [scrolled, setScrolled] = useState(false);
//     const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//     useEffect(() => {
//         const handleScroll = () => {
//             setScrolled(window.scrollY > 20);
//         };

//         window.addEventListener('scroll', handleScroll);
//         return () => window.removeEventListener('scroll', handleScroll);
//     }, []);

//     return (
//         <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
//             <div className="container mx-auto flex items-center justify-between py-4 px-4">
//                 <div className="flex items-center gap-2">
//                     <Hexagon className="h-8 w-8 text-cyan-500" />
//                     <span className="font-bold text-xl">TrueMaps</span>
//                 </div>

//                 {/* Desktop Navigation */}
//                 <nav className="hidden md:flex items-center gap-8">
//                     <Link href="#features" className="hover:text-cyan-400 transition-colors">Features</Link>
//                     <Link href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link>
//                     <Link href="#docs" className="hover:text-cyan-400 transition-colors">Documentation</Link>
//                     <Link href="#about" className="hover:text-cyan-400 transition-colors">About</Link>
//                 </nav>

//                 <div className="flex items-center gap-4">
//                     <Link href="/auth/login" className="hidden md:block px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
//                         Sign in
//                     </Link>
//                     <Link href="/auth/register" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors">
//                         Get Started
//                     </Link>

//                     {/* Mobile Menu Button */}
//                     <button
//                         className="md:hidden text-gray-300 hover:text-white"
//                         onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//                     >
//                         {mobileMenuOpen ? (
//                             <span className="text-2xl">×</span>
//                         ) : (
//                             <span className="text-xl">☰</span>
//                         )}
//                     </button>
//                 </div>
//             </div>

//             {/* Mobile Menu */}
//             <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-64' : 'max-h-0'}`}>
//                 <div className="bg-gray-900 shadow-lg px-4 py-2">
//                     <nav className="flex flex-col gap-2 py-2">
//                         <Link
//                             href="#features"
//                             className="py-2 hover:text-cyan-400 transition-colors"
//                             onClick={() => setMobileMenuOpen(false)}
//                         >
//                             Features
//                         </Link>
//                         <Link
//                             href="#pricing"
//                             className="py-2 hover:text-cyan-400 transition-colors"
//                             onClick={() => setMobileMenuOpen(false)}
//                         >
//                             Pricing
//                         </Link>
//                         <Link
//                             href="#docs"
//                             className="py-2 hover:text-cyan-400 transition-colors"
//                             onClick={() => setMobileMenuOpen(false)}
//                         >
//                             Documentation
//                         </Link>
//                         <Link
//                             href="#about"
//                             className="py-2 hover:text-cyan-400 transition-colors"
//                             onClick={() => setMobileMenuOpen(false)}
//                         >
//                             About
//                         </Link>
//                         <Link
//                             href="/auth/login"
//                             className="py-2 hover:text-cyan-400 transition-colors"
//                             onClick={() => setMobileMenuOpen(false)}
//                         >
//                             Sign in
//                         </Link>
//                     </nav>
//                 </div>
//             </div>
//         </header>
//     );
// };

// Interactive Hero Section with animated elements
const HeroSection = () => {
    const [copied, setCopied] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [typedText, setTypedText] = useState("");
    const fullText = "built for the cloud";

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            setTypedText(fullText.substring(0, index));
            index++;

            if (index > fullText.length) {
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText("npx create-once-ui-app@latest");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="relative min-h-screen pt-24 pb-20 flex items-center overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 to-black"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_500px_at_50%_200px,rgba(0,180,180,0.1),transparent)]"></div>
            </div>

            <div className="flex items-center container mx-auto h-full px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-8">
                        <div
                            className="inline-block bg-cyan-800/20 rounded-full px-4 py-2 transform transition-transform duration-300 hover:scale-105 cursor-pointer"
                            onMouseEnter={() => setHovered(true)}
                            onMouseLeave={() => setHovered(false)}
                        >
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-cyan-600">
                                    <span className="text-xs">📣</span>
                                </div>
                                <p className="text-sm text-cyan-400">Introducing TrueMaps</p>
                                {hovered && (
                                    <span className="text-xs text-cyan-400 animate-pulse">Click to learn more</span>
                                )}
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                Spatial analytics
                            </span>
                            <span className="block">‍{typedText}<span className="animate-blink">|</span></span>
                        </h1>

                        <p className="text-xl text-gray-400">
                            Bring spatial analysis into your cloud ecosystem for unparalleled security, speed, and scalability.
                        </p>

                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-8 w-8 rounded-full bg-gray-800 border-2 border-cyan-500 transition-all duration-300 hover:scale-110 hover:z-10 cursor-pointer"
                                        style={{ transitionDelay: `${i * 50}ms` }}
                                    ></div>
                                ))}
                            </div>
                            <span className="text-sm text-gray-400">
                                <span className="font-bold text-cyan-400 animate-pulse">1,000+</span> indie creators trust us
                            </span>
                        </div>

                        <div className="relative flex flex-col sm:flex-row gap-4">

                            <div className="mt-[-10px]">
                                <div className="relative p-2 group transition-all duration-300">
                                    <div
                                        className="absolute inset-0 rounded-md overflow-hidden bg-gradient-to-r from-blue-500/30 to-blue-500/30"
                                        style={{ filter: "blur(10px)" }}
                                    >
                                        <div className="absolute inset-0 bg-background group-hover:bg-gradient-to-br from-cyan-600/80 to-blue-600/90" />
                                    </div>
                                    <Link
                                        href="/auth/login"
                                        className="relative z-10 inline-flex items-center justify-center rounded-md text-sm font-medium w-full h-10 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        <span className="font-semibold">Start building</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <MapVisualizer />
                </div>
            </div>
        </section>
    );
};

// Interactive Map component that responds to user interaction
const MapVisualizer = () => {
    const [activePoint, setActivePoint] = useState<number | null>(null);
    const [isRotated, setIsRotated] = useState(true);
    const [animatePoints, setAnimatePoints] = useState(false);

    useEffect(() => {
        // Start animations after component mounts
        setTimeout(() => setAnimatePoints(true), 500);

        // Auto-rotate the map periodically
        const interval = setInterval(() => {
            setIsRotated(prev => !prev);
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    const dataPoints = [
        { id: 1, x: "20%", y: "30%", label: "New York", value: 8.4 },
        { id: 2, x: "35%", y: "45%", label: "Chicago", value: 2.7 },
        { id: 3, x: "15%", y: "60%", label: "Los Angeles", value: 4.0 },
        { id: 4, x: "60%", y: "35%", label: "London", value: 8.9 },
        { id: 5, x: "70%", y: "50%", label: "Paris", value: 2.2 },
        { id: 6, x: "80%", y: "30%", label: "Tokyo", value: 9.3 },
    ];

    return (
        <div className="relative">
            <div className="relative h-[500px] w-full">
                <div
                    className={`absolute top-0 -right-20 w-[120%] h-[500px] rounded-xl overflow-hidden shadow-xl transition-transform duration-[8000ms] ease-in-out ${isRotated ? 'rotate-2' : '-rotate-2'}`}
                    style={{ transformOrigin: 'center center' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/95 backdrop-blur-sm rounded-xl"></div>

                    {/* We use a placeholder for demo, but in actual implementation you'd use Image from next/image */}
                    <div className="absolute inset-0 bg-gray-800 opacity-60">
                        <div className="w-full h-full grid grid-cols-12 grid-rows-8">
                            {Array.from({ length: 96 }).map((_, i) => (
                                <div key={i} className="border-[0.5px] border-gray-700/30"></div>
                            ))}
                        </div>
                    </div>

                    {/* Interactive data points with animation */}
                    {dataPoints.map((point, index) => (
                        <div
                            key={point.id}
                            className={`absolute cursor-pointer transform transition-all duration-500 ${animatePoints ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                                }`}
                            style={{
                                left: point.x,
                                top: point.y,
                                transitionDelay: `${index * 150}ms`
                            }}
                            onMouseEnter={() => setActivePoint(point.id)}
                            onMouseLeave={() => setActivePoint(null)}
                        >
                            <div className={`h-3 w-3 rounded-full ${activePoint === point.id ? 'bg-cyan-400' : 'bg-cyan-600'}`}>
                                <div className={`absolute h-full w-full rounded-full animate-ping bg-cyan-400/50 ${activePoint === point.id ? 'opacity-100' : 'opacity-40'}`}></div>
                            </div>

                            {activePoint === point.id && (
                                <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg z-10 min-w-[120px] whitespace-nowrap animate-fadeIn">
                                    <p className="font-semibold text-cyan-400">{point.label}</p>
                                    <div className="flex justify-between text-xs text-gray-300">
                                        <span>Activity:</span>
                                        <span className="font-mono">{point.value}M</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Interactive Map Controls */}
                    <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                            className="h-8 w-8 rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-cyan-400 transition-colors"
                            onClick={() => setIsRotated(!isRotated)}
                            title="Rotate map"
                        >
                            <RotateCwIcon size={14} />
                        </button>
                        <button
                            className="h-8 w-8 rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-cyan-400 transition-colors"
                            title="Zoom in"
                        >
                            <ZoomInIcon size={14} />
                        </button>
                        <button
                            className="h-8 w-8 rounded-full bg-gray-800/80 hover:bg-gray-700/80 flex items-center justify-center text-cyan-400 transition-colors"
                            title="Zoom out"
                        >
                            <ZoomOutIcon size={14} />
                        </button>
                    </div>

                    {/* Data Layers Toggle */}
                    <div className="absolute top-4 left-4">
                        <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-2 text-xs text-gray-300">
                                <div className="h-3 w-3 rounded-full bg-cyan-500"></div>
                                <span>Population density</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-300">
                                <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                                <span>Economic activity</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Animated brand logos section with infinite marquee
const BrandsSection = () => {
    return (
        <section className="py-20 flex items-center justify-center overflow-hidden">
            <div className="flex flex-col justify-center items-center gap-10 container">
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold">
                        Powering creative minds.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Used by professionals working at:
                        </span>
                    </h2>
                </div>

                <div className="relative w-full overflow-hidden">
                    <style jsx>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>

                    <div className="flex items-center gap-10" style={{ animation: 'marquee 30s linear infinite', width: 'fit-content' }}>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                            <div
                                key={num}
                                className="h-16 w-32 bg-gray-800 rounded-md flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110 cursor-pointer"
                            >
                                <div className="h-10 w-24 bg-gray-700 rounded opacity-70"></div>
                            </div>
                        ))}
                        {/* Duplicate for seamless loop */}
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                            <div
                                key={`dup-${num}`}
                                className="h-16 w-32 bg-gray-800 rounded-md flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 hover:scale-110 cursor-pointer"
                            >
                                <div className="h-10 w-24 bg-gray-700 rounded opacity-70"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// Feature cards with hover effects and interactive elements
const FeaturesSection = () => {
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

    const features = [
        {
            id: 1,
            title: "Real-time Data Visualization",
            description: "Visualize spatial data in real-time with interactive maps and customizable dashboards.",
            icon: <Map size={24} className="text-cyan-400" />
        },
        {
            id: 2,
            title: "Advanced Analytics",
            description: "Perform complex spatial analyses with our intuitive and powerful analytics engine.",
            icon: <Sparkles size={24} className="text-cyan-400" />
        },
        {
            id: 3,
            title: "Secure Cloud Infrastructure",
            description: "Keep your data safe with our enterprise-grade security and compliance features.",
            icon: <Hexagon size={24} className="text-cyan-400" />
        },
        {
            id: 4,
            title: "Collaborative Workspaces",
            description: "Work together seamlessly with team collaboration tools designed for spatial projects.",
            icon: <Map size={24} className="text-cyan-400" />
        },
        {
            id: 5,
            title: "Custom Integrations",
            description: "Connect TrueMaps with your existing tools through our extensive API ecosystem.",
            icon: <Sparkles size={24} className="text-cyan-400" />
        },
        {
            id: 6,
            title: "Team Collaboration",
            description: "Enable real-time collaboration with shared editing, commenting, and version control for your entire team.",
            icon: <LinkedinIcon size={24} className="text-cyan-400" />
        }
    ];

    return (
        <section id="features" className="py-20">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-12">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Powerful features
                    </span> for spatial professionals
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.id}
                            className={`rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-800/50 p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full relative overflow-hidden cursor-pointer ${hoveredFeature === feature.id ? 'shadow-cyan-500/20' : ''
                                }`}
                            onMouseEnter={() => setHoveredFeature(feature.id)}
                            onMouseLeave={() => setHoveredFeature(null)}
                        >
                            {/* Animated background gradient when hovered */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 opacity-0 transition-opacity duration-300 -z-10 ${hoveredFeature === feature.id ? 'opacity-100' : ''
                                    }`}
                            ></div>

                            <div className="h-12 w-12 rounded-lg bg-cyan-900/30 flex items-center justify-center mb-4">
                                {feature.icon}
                            </div>

                            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-400">{feature.description}</p>

                            <div className={`mt-4 flex items-center gap-1 text-cyan-400 text-sm transition-opacity duration-300 ${hoveredFeature === feature.id ? 'opacity-100' : 'opacity-0'
                                }`}>
                                <span>Learn more</span>
                                <span className="text-xs">→</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

// Interactive testimonials with slider functionality
const TestimonialsSection = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const testimonials = [
        {
            id: 1,
            name: "Alex Johnson",
            role: "Full Stack Developer",
            company: "TechFlow",
            content: "This platform saved me weeks of setup time. The cloud integration is flawless, and the spatial components are beautiful and easy to customize. Worth every penny!",
            rating: 5
        },
        {
            id: 2,
            name: "Sarah Miller",
            role: "Frontend Engineer",
            company: "DesignHub",
            content: "I've used many spatial platforms, but TrueMaps stands out for its clean architecture and attention to detail. The TypeScript support is excellent, and the documentation is comprehensive.",
            rating: 5
        },
        {
            id: 3,
            name: "Michael Chen",
            role: "Product Manager",
            company: "InnovateLabs",
            content: "Our team was able to launch our spatial MVP in record time thanks to TrueMaps. The analytics flow and user management features worked right out of the box. Highly recommended!",
            rating: 5
        }
    ];

    useEffect(() => {
        // Auto-rotate testimonials
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [testimonials.length]);

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    // Touch handling for mobile swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 50) {
            // Swipe left
            handleNext();
        }

        if (touchStart - touchEnd < -50) {
            // Swipe right
            handlePrev();
        }
    };

    return (
        <section className="py-20 bg-gradient-to-b from-background to-cyan-900">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl text-foreground font-bold text-center mb-12">
                    Loved By <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Community Members</span>
                </h2>

                <div className="max-w-3xl mx-auto relative">
                    <div
                        className="overflow-hidden rounded-lg bg-gray-800/30 backdrop-blur-sm p-8 border border-gray-700"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div
                            className="transition-all duration-500 flex"
                            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                        >
                            {testimonials.map((testimonial) => (
                                <div
                                    key={testimonial.id}
                                    className="min-w-full px-4"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-16 w-16 rounded-full overflow-hidden mb-4 border-2 border-cyan-500 bg-gray-700"></div>

                                        <div className="flex items-center mb-4">
                                            {[...Array(5)].map((_, i) => (
                                                <span
                                                    key={i}
                                                    className={`text-lg ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-gray-300 italic mb-6">"{testimonial.content}"</p>

                                        <h4 className="font-semibold">{testimonial.name}</h4>
                                        <p className="text-sm text-gray-400">{testimonial.role} @ {testimonial.company}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Controls */}
                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
                        <button
                            onClick={handlePrev}
                            className="h-10 w-10 rounded-full bg-gray-800/80 text-white flex items-center justify-center pointer-events-auto hover:bg-cyan-900/80 transition-colors"
                        >
                            <ArrowLeft />
                        </button>
                        <button
                            onClick={handleNext}
                            className="h-10 w-10 rounded-full bg-gray-800/80 text-white flex items-center justify-center pointer-events-auto hover:bg-cyan-900/80 transition-colors"
                        >
                            <ArrowRight />
                        </button>
                    </div>

                    {/* Progress indicators */}
                    <div className="flex justify-center mt-6 gap-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                className={`h-2 w-2 rounded-full transition-all duration-300 ${index === activeIndex ? 'bg-cyan-500 w-6' : 'bg-gray-600'
                                    }`}
                                onClick={() => setActiveIndex(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

// Continuing from the FAQ section that was partially shown

const FaqSection = () => {
    const [openItem, setOpenItem] = useState<string | null>(null);

    const faqs = [
        {
            id: "item-1",
            question: "What is TrueMaps?",
            answer: "TrueMaps is a cloud-based spatial analytics platform that enables organizations to perform advanced geographic analysis securely and efficiently in the cloud."
        },
        {
            id: "item-2",
            question: "How does TrueMaps handle data security?",
            answer: "TrueMaps implements enterprise-grade security measures including end-to-end encryption, role-based access control, and compliance with major security standards to ensure your spatial data remains protected."
        },
        {
            id: "item-3",
            question: "What types of analysis can I perform?",
            answer: "TrueMaps supports a wide range of spatial analytics including proximity analysis, hotspot detection, network analysis, and custom geographic visualizations. Our platform is extensible to accommodate specialized analysis needs for your specific use case."
        },
        {
            id: "item-4",
            question: "Can I integrate TrueMaps with my existing tools?",
            answer: "Yes, TrueMaps offers a comprehensive API and pre-built connectors for popular data sources, business intelligence tools, and cloud services. Our developer documentation provides step-by-step guides for integration."
        },
        {
            id: "item-5",
            question: "What support options are available?",
            answer: "TrueMaps offers multiple tiers of support including community forums, comprehensive documentation, email support, and premium support with dedicated response times. Enterprise plans include a dedicated customer success manager."
        }
    ];

    const toggleItem = (id: string) => {
        setOpenItem(openItem === id ? null : id);
    };

    return (
        <section className="py-20 container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
                Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Questions</span>
            </h2>

            <div className="max-w-3xl mx-auto divide-y divide-gray-800">
                {faqs.map((faq) => (
                    <div key={faq.id} className="py-5">
                        <button
                            className="flex w-full justify-between items-center text-left"
                            onClick={() => toggleItem(faq.id)}
                            aria-expanded={openItem === faq.id}
                        >
                            <h3 className="text-lg font-medium">{faq.question}</h3>
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-800 ml-2">
                                {openItem === faq.id ? (
                                    <ChevronUpIcon size={16} className="text-cyan-400" />
                                ) : (
                                    <ChevronDownIcon size={16} className="text-gray-400" />
                                )}
                            </span>
                        </button>

                        <div
                            className={`mt-2 overflow-hidden transition-all duration-300 ${openItem === faq.id ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <p className="text-gray-400">{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-12">
                <p className="text-gray-400">
                    Have more questions? <Link href="/contact" className="text-cyan-400 hover:underline">Reach out to our support team</Link>.
                </p>
            </div>
        </section>
    );
};

// CTA Section with interactive form and visual effects
const CtaSection = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isErrored, setIsErrored] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setIsErrored(true);
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
            setEmail("");

            // Reset success state after a few seconds
            setTimeout(() => {
                setIsSubmitted(false);
            }, 3000);
        }, 1500);
    };

    return (
        <section className="py-24 relative">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-black to-gray-900"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(0,180,180,0.15),transparent)]"></div>
            </div>

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 shadow-xl relative overflow-hidden">
                    {/* Animated glow effects */}
                    <div className="absolute -top-40 -right-40 h-80 w-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-blue-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Ready to transform your
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                spatial analytics workflow?
                            </span>
                        </h2>

                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                            Join thousands of professionals and organizations who've unlocked the power of cloud-based spatial analytics.
                        </p>

                        <form
                            onSubmit={handleSubmit}
                            className="max-w-md mx-auto mt-8 relative"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                                <div className="relative flex items-center">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className={`flex-grow py-3 px-4 bg-gray-800 border ${isErrored ? 'border-red-500' : 'border-gray-700'
                                            } rounded-l-lg focus:outline-none focus:border-cyan-500 transition-colors`}
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setIsErrored(false);
                                        }}
                                        disabled={isSubmitting || isSubmitted}
                                    />
                                    <button
                                        type="submit"
                                        className={`py-3 px-6 rounded-r-lg font-medium transition-all ${isSubmitting ? 'bg-gray-700 text-gray-300' :
                                            isSubmitted ? 'bg-green-600 text-white' :
                                                'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
                                            }`}
                                        disabled={isSubmitting || isSubmitted}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                        ) : isSubmitted ? (
                                            <CheckIcon size={20} />
                                        ) : (
                                            'Start Free'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {isErrored && (
                                <p className="absolute left-0 -bottom-6 text-sm text-red-500 mt-1">
                                    Please enter a valid email address
                                </p>
                            )}

                            {isSubmitted && (
                                <p className="absolute left-0 -bottom-6 text-sm text-green-500 mt-1 animate-fadeIn">
                                    Success! Check your inbox for next steps.
                                </p>
                            )}
                        </form>

                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                            No credit card required. Free 14-day trial with full access to all features.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

// Footer with interactive elements and organized navigation
const Footer = () => {
    const [emailFocus, setEmailFocus] = useState(false);
    const [email, setEmail] = useState("");

    const footerLinks = {
        product: [
            { name: "Features", href: "#features" },
            { name: "Pricing", href: "#pricing" },
            { name: "Documentation", href: "#docs" },
            { name: "Release Notes", href: "#releases" }
        ],
        company: [
            { name: "About", href: "#about" },
            { name: "Blog", href: "#blog" },
            { name: "Careers", href: "#careers" },
            { name: "Contact", href: "#contact" }
        ],
        resources: [
            { name: "Community", href: "#community" },
            { name: "Help Center", href: "#help" },
            { name: "Partners", href: "#partners" },
            { name: "Status", href: "#status" }
        ],
        legal: [
            { name: "Privacy", href: "#privacy" },
            { name: "Terms", href: "#terms" },
            { name: "Security", href: "#security" },
            { name: "Compliance", href: "#compliance" }
        ]
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Newsletter submission logic
        setEmail("");
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 pt-20 pb-8 border-t border-gray-800">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Hexagon className="h-7 w-7 text-cyan-500" />
                            <span className="font-bold text-xl">TrueMaps</span>
                        </div>

                        <p className="text-gray-400 mb-6 max-w-md">
                            Enterprise-grade spatial analytics platform built for the cloud. Secure, scalable, and optimized for performance.
                        </p>

                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-300">Subscribe to our newsletter</h4>
                            <form onSubmit={handleSubmit} className="flex">
                                <div className={`relative flex-grow transition-all duration-300 ${emailFocus ? 'border-cyan-500' : 'border-gray-700'
                                    }`}>
                                    <input
                                        type="email"
                                        placeholder="Your email address"
                                        className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-l-md focus:outline-none"
                                        onFocus={() => setEmailFocus(true)}
                                        onBlur={() => setEmailFocus(false)}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-r-md transition-colors"
                                >
                                    Subscribe
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Product</h3>
                        <ul className="space-y-2">
                            {footerLinks.product.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Company</h3>
                        <ul className="space-y-2">
                            {footerLinks.company.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Resources</h3>
                        <ul className="space-y-2">
                            {footerLinks.resources.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom footer with social links and copyright */}
                <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-foreground text-sm">
                        © {currentYear} TrueMaps. All rights reserved.
                    </p>

                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <a
                            href="#"
                            className="text-gray-400 hover:text-cyan-400 transition-colors"
                            aria-label="Twitter"
                        >
                            <TwitterIcon size={20} />
                        </a>
                        <a
                            href="#"
                            className="text-gray-400 hover:text-cyan-400 transition-colors"
                            aria-label="GitHub"
                        >
                            <GithubIcon size={20} />
                        </a>
                        <a
                            href="#"
                            className="text-gray-400 hover:text-cyan-400 transition-colors"
                            aria-label="LinkedIn"
                        >
                            <LinkedinIcon size={20} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
