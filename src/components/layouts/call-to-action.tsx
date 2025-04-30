'use client'
import { CheckIcon } from "lucide-react";
import { useState } from "react";

export const CtaSection = () => {
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
                <div className="absolute inset-0 bg-gradient-to-b from-background/10 to-gray-900"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(0,180,180,0.15),transparent)]"></div>
            </div>

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 shadow-xl relative overflow-hidden">
                    {/* Animated glow effects */}
                    <div className="absolute -top-40 -right-40 h-80 w-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-blue-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
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
