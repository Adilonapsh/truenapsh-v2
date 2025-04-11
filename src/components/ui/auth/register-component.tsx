'use client'


import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { register } from "@/server/users"
import { zodResolver } from "@hookform/resolvers/zod"
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

export default function RegisterComponent() {

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
        <div>
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold">Create your account</h1>
                        <p className="text-balance text-sm text-muted-foreground">Enter your details below to register your account</p>
                    </div>
                    <div className="grid gap-6">
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
                        <div className="text-center text-sm">
                            Have an account?{" "}
                            <a href="/auth/login" className="underline underline-offset-4">
                                Sign in
                            </a>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}