'use client'
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";


const formSchema = z.object({
    email: z.string().email().min(1, "Email Is Required"),
})

type FormValues = z.infer<typeof formSchema>

export const CtaSection = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    })

    const onSubmit = async (data: FormValues) => {
        const formData = {
            ...data,
        }
        try {
            // console.log(formData);
            setIsSubmitted(true);
        } catch (err) {
            console.error(err);
        }

        form.reset()
    }

    return (
        <section className="py-24 relative">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2"></div>
            </div>

            <div className="container mx-auto px-4">
                <div className="mx-auto bg-background backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-900 shadow-xl relative overflow-hidden">
                    {/* Animated glow effects */}
                    <div className="absolute -top-40 -right-40 h-80 w-80 bg-cyan-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 bg-blue-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-700 dark:text-white">
                            Ready to transform your
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                spatial analytics workflow?
                            </span>
                        </h2>

                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Join thousands of professionals and organizations who've unlocked the power of cloud-based spatial analytics.
                        </p>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="max-w-md mx-auto mt-8 relative"
                            >
                                <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                                    <div className="relative flex items-center justify-between">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="relative flex-grow py-3 px-4 bg-background border border-background rounded-l-lg focus:outline-none focus:border-cyan-500 transition-colors">
                                                    <FormControl>
                                                        <input
                                                            {...field}
                                                            placeholder="Enter your email"
                                                            className={`w-full bg-transparent focus:outline-none`}
                                                            disabled={isSubmitting || isSubmitted}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="absolute top-[.40rem] right-3" />
                                                </FormItem>
                                            )}
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
                            </form>
                        </Form>

                        {isSubmitted && (
                            <p className="absolute left-0 -bottom-6 text-sm text-green-500 mt-1 animate-fadeIn">
                                Success! Check your inbox for next steps.
                            </p>
                        )}

                        <p className="text-sm text-gray-400 max-w-md mx-auto">
                            No credit card required. Free 14-day trial with full access to all features.
                        </p>
                    </div>
                </div>
            </div>
        </section >
    );
};
