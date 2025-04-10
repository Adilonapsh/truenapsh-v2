'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from 'framer-motion'
import { GithubIcon, KeyIcon, KeyRoundIcon, MapIcon, TwitterIcon } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormMessage } from "../form"
import { Alert, AlertDescription, AlertTitle } from "../alert"


const loginSchema = z.object({
    identifier: z.string(),
    password: z.string(),
    rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginComponent() {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: "",
            password: "",
            rememberMe: false
        },
    })

    const searchParams = new URLSearchParams(window.location.search);
    const error = searchParams.get('error');


    const onSubmit = async (formData: LoginForm) => {
        setIsLoading(true);

        const result = await signIn("credentials", {
            email: formData.identifier,
            password: formData.password,
            redirect: true,
            callbackUrl: error ? "" : "/admin/dashboard",
        });

        if (result?.ok) {
            console.log("Login successful!");
        } else {
            console.log("Login failed!");
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
                                    <MapIcon size={64} className="text-gray-800 dark:text-gray-200" />
                                </div>
                                <CardTitle className="text-3xl font-bold mt-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white">
                                    Welcome to MapExplorer
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400">Your journey begins here!</p>
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
                                <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">Sign in to your account</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {error && (
                                    <Alert variant={'destructive'} className="flex items-center gap-6 mb-5">
                                        <KeyRoundIcon className="mt-2" size={"20"}/>
                                        <div className="mt-2">
                                            <AlertTitle>Login Failed</AlertTitle>
                                            <AlertDescription>
                                                <p>Please check your credentials and try again.</p>
                                            </AlertDescription>
                                        </div>
                                    </Alert>
                                )}
                                <Form {...form}>
                                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                                        <FormField
                                            control={form.control}
                                            name="identifier"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <p className="text-gray-700 dark:text-gray-300">Email/Username</p>
                                                    <FormControl>
                                                        <Input placeholder="Email/Username" {...field} />
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
                                                        <Input type="password" placeholder="Password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="rememberMe"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center gap-2">
                                                    <FormControl>
                                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" {...field} checked={field.value} />
                                                    </FormControl>
                                                    <p className="text-gray-700 dark:text-gray-300 !m-0">Remember me</p>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black">
                                            {isLoading ? (
                                                <AiOutlineLoading3Quarters className='animate-spin' />
                                            ) : (
                                                <p>Sign in</p>
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
                                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Social Login</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <GithubIcon className="mr-2 h-4 w-4" />
                                    Continue with GitHub
                                </Button>
                                <Button variant="outline" className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <TwitterIcon className="mr-2 h-4 w-4" />
                                    Continue with Twitter
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
                                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">New Explorer?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-gray-600 dark:text-gray-400">Create an account to start your mapping journey.</p>
                                <Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                                    <a href="/auth/register">Create Account</a>
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
                                <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">Lost?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-4 text-gray-600 dark:text-gray-400">Our support team is here to guide you.</p>
                                <Button variant="secondary" className="w-full bg-gray-200 hover:bg-gray-300 text-black dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                                    <Link href="/support">Get Directions</Link>
                                </Button>
                            </CardContent>
                        </motion.div>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

