'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRoundIcon } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from "react-hook-form"
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FaGithub } from "react-icons/fa6"
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from "../alert"
import { Form, FormControl, FormField, FormItem, FormMessage } from "../form"
import { Checkbox } from "../checkbox"


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
            const result = await signIn("laravel-auth", {
                email: formData.identifier,
                password: formData.password,
                redirect: false,
                callbackUrl: "/admin/dashboard",
            });

            if (result?.ok) {
                console.log("Login successful!");
                setIsLoading(true);
                router.push("/admin/dashboard");
            } else {
                console.log("Login failed!");
                form.setError("identifier", {
                    type: "manual",
                    message: "Invalid credentials"
                });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                switch ((error as any).type) {
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

    const handleGithubLogin = () => {
        window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/github/redirect`;
    };

    return (
        <div>
            <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-2 items-center text-center">
                        <h1 className="text-2xl font-bold">Login to your account</h1>
                        <p className="text-sm text-balance text-muted-foreground">Enter your email below to login to your account</p>
                    </div>
                    <div className="grid gap-6">
                        {error && (
                            <Alert variant={'destructive'} className="flex gap-6 items-center">
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
                                <FormItem className="flex gap-2 items-center">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <p className="text-gray-700 dark:text-gray-300 !m-0">Remember me</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full text-white bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black">
                            {isLoading ? (
                                <AiOutlineLoading3Quarters className='animate-spin' />
                            ) : (
                                <p>Sign in</p>
                            )}
                        </Button>
                        <div className="relative text-sm text-center after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                            <span className="relative z-10 px-2 bg-background text-muted-foreground">Or continue with</span>
                        </div>
                        {/* <Button type="button" variant="outline" className="w-full" onClick={() => signIn('github')}>
                            <GitHubLogoIcon className="mr-2" size={"20"} />
                            Login with GitHub
                        </Button> */}
                        <Button type="button" variant="outline" className="w-full" onClick={handleGithubLogin}>
                            <FaGithub className="mr-2" size={"20"} />
                            Login with GitHub
                        </Button>
                    </div>
                    <div className="text-sm text-center">
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
