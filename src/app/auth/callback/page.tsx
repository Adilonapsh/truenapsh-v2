'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Github from 'next-auth/providers/github';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { AiFillGithub, AiFillGoogleCircle } from 'react-icons/ai';

export default function AuthCallbackPage() {
    const router = useRouter();
    const params = useSearchParams();
    const token = params.get('token');
    const provider = params.get('provider');

    const [isLoading, setIsLoading] = useState(false)

    console.log("token", token);
    console.log("provider", provider);

    useEffect(() => {
        const handleSignIn = async () => {
            setIsLoading(true)
            if (!token) return;
            try {
                const result = await signIn("laravel-github", {
                    token,
                    redirect: false,
                    callbackUrl: "/admin/dashboard",
                });
                console.log("Sign in result:", result);

                if (result?.ok) {
                    router.push("/admin/dashboard");
                } else {
                    console.error("Login failed:", result?.error);
                }
            } catch (error) {
                console.error("Sign in error:", error);
                setIsLoading(false)
            }
        };

        handleSignIn();
    }, [token, router]);

    return (
        <div>
            <div className="flex flex-col items-center gap-2 text-center">
                {
                    provider === 'github' ?
                        (<AiFillGithub className="mr-2" size={100} />) :
                        provider === 'google' ?
                            (<AiFillGoogleCircle className="mr-2" size={100} />) :
                            (<AiFillGoogleCircle className="mr-2" size={100} />)
                }
                <h1 className="text-2xl font-bold">Logging you in</h1>
                <p className="text-balance text-sm text-muted-foreground">Please wait while we authenticate your session...</p>
            </div>
        </div>
    );
}
