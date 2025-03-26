'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { register } from "@/server/users"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from 'framer-motion'
import { CompassIcon, GithubIcon, TwitterIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { z } from 'zod'


const registerSchema = z.object({
    name: z.string()
        .min(4, "Full name must be at least 4 characters")
        .max(50, "Full name cannot exceed 50 characters")
        .trim(),

    username: z.string()
        .min(8, "Username must be at least 8 characters")
        .max(30, "Username cannot exceed 30 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores and hyphens")
        .trim(),

    email: z.string()
        .email("Please enter a valid email address")
        .toLowerCase()
        .trim(),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters")
        .regex(
            /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
            "Password must contain at least 1 uppercase letter, 1 number and 1 special character"
        ),

    confirm_password: z.string()
}).refine(
    (data) => data.password === data.confirm_password,
    {
        message: "Passwords must match",
        path: ["confirm_password"]
    }
)


type RegisterForm = z.infer<typeof registerSchema>


export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            username: "",
            email: "",
            password: "",
            confirm_password: "",
        },
    })

    const onSubmit = async (formData: RegisterForm) => {
        setIsLoading(true);

        try {
            const data = await register(formData);
            if (data) {
                window.location.href = `/auth/login`;
            }
        } catch (err) {
            console.error(err);
        }

        setIsLoading(false);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br flex items-center from-gray-100 to-gray-200 p-4 lg:p-8">
            <div className="mx-auto max-w-6xl">
                <motion.div
                    className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="col-span-full lg:col-span-1 flex flex-col justify-center items-center text-center overflow-hidden bg-white dark:bg-gray-800">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                        >
                            <CardHeader>
                                <div className="mx-auto rounded-full bg-gray-100 p-3 shadow-md">
                                    <CompassIcon size={64} className="text-gray-800 dark:text-gray-200" />
                                </div>
                                <CardTitle className="text-3xl font-bold mt-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white">
                                    Join MapExplorer
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400">Start your mapping adventure today!</p>
                            </CardContent>
                        </motion.div>
                    </Card>

                    <Card className="col-span-full lg:col-span-2 overflow-hidden bg-white dark:bg-gray-800">
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">Create your account</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <p className="text-gray-700 dark:text-gray-300">Full Name</p>
                                                    <FormControl>
                                                        <Input placeholder="Full Name" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <p className="text-gray-700 dark:text-gray-300">Username</p>
                                                    <FormControl>
                                                        <Input placeholder="budicimiww" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <p className="text-gray-700 dark:text-gray-300">Email</p>
                                                    <FormControl>
                                                        <Input placeholder="Budi@truenapsh.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <p className="text-gray-700 dark:text-gray-300">Password</p>
                                                    <FormControl>
                                                        <Input type="password" placeholder="**********" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="confirm_password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <p className="text-gray-700 dark:text-gray-300">Password</p>
                                                    <FormControl>
                                                        <Input type="password" placeholder="**********" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black">
                                            {isLoading ? (
                                                <AiOutlineLoading3Quarters className='animate-spin' />
                                            ) : (
                                                <p>Create Account</p>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </motion.div>
                    </Card>

                    <Card className="col-span-full md:col-span-1 overflow-hidden bg-white dark:bg-gray-800">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                        >
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Quick Sign Up</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <GithubIcon className="mr-2 h-4 w-4" />
                                    Sign up with GitHub
                                </Button>
                                <Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <TwitterIcon className="mr-2 h-4 w-4" />
                                    Sign up with Twitter
                                </Button>
                            </CardContent>
                        </motion.div>
                    </Card>

                    <Card className="col-span-full md:col-span-1 overflow-hidden bg-white dark:bg-gray-800">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Returning Explorer?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-gray-600 dark:text-gray-400">Already have an account? Sign in to continue your journey.</p>
                                <Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                                    <a href="/auth/login">Sign In</a>
                                </Button>
                            </CardContent>
                        </motion.div>
                    </Card>

                    <Card className="col-span-full md:col-span-1 lg:col-span-1 overflow-hidden bg-white dark:bg-gray-800">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Need Assistance?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-gray-600 dark:text-gray-400">Our support team is here to help you get started.</p>
                                <Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                                    <Link href="/support">Get Help</Link>
                                </Button>
                            </CardContent>
                        </motion.div>
                    </Card>
                </motion.div>
            </div >
        </div >
    )
}

