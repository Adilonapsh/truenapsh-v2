'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRoundIcon } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from "../alert"
import { Form, FormControl, FormField, FormItem, FormMessage } from "../form"
import { useSearchParams } from 'next/navigation'
import { useRouter } from "next/navigation";


const loginSchema = z.object({
    identifier: z.string()
        .min(4, "Username / email must be at least 4 characters")
        .trim(),
    password: z.string(),
    rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginComponent() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const router = useRouter();

    const form = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            identifier: "",
            password: "",
            rememberMe: false
        },
    })

    const onSubmit = async (formData: LoginForm) => {
        setIsLoading(true);

        try {
            const result = await signIn("credentials", {
                email: formData.identifier,
                password: formData.password,
                redirect: false,
                callbackUrl: "/admin/dashboard",
            });

            console.log("ini result", result);

            if (result?.ok) {
                console.log("Login successful!");
                router.push("/admin/dashboard");
            } else {
                console.log("Login failed!");
            }
        } catch (error) {
            if (error instanceof AuthError) {
                switch (error.type) {
                    case "CredentialsSignin":
                        return { error: "Invalid Credentials" }
                    default:
                        return { error: "Something went wronng" }
                }
            }
            throw error;
        }
        setIsLoading(false);
    }

    return (
        <div>
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold">Login to your account</h1>
                        <p className="text-balance text-sm text-muted-foreground">Enter your email below to login to your account</p>
                    </div>
                    <div className="grid gap-6">
                        {error && (
                            <Alert variant={'destructive'} className="flex items-center gap-6">
                                <KeyRoundIcon className="mt-2" size={"20"} />
                                <div className="mt-2">
                                    <AlertTitle>Login Failed</AlertTitle>
                                    <AlertDescription>
                                        <p>Please check your credentials and try again.</p>
                                    </AlertDescription>
                                </div>
                            </Alert>
                        )}
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
                        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                            <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                        <Button variant="outline" className="w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path
                                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                                    fill="currentColor"
                                />
                            </svg>
                            Login with GitHub
                        </Button>
                    </div>
                    <div className="text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <a href="/auth/register" className="underline underline-offset-4">
                            Sign up
                        </a>
                    </div>
                </form>
            </Form >
        </div>
    )
}
