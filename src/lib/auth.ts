import { encrypt } from "@/lib/crypt";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "laravel-auth",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/auth/login`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const response = await res.json();

                    console.log("Ini Respon credential biasa", response);

                    if (res.ok && response) {
                        const user = {
                            ...response.user,
                            token: response.token
                        };
                        return user;
                    }
                } catch (error) {
                    console.error("Login error:", error);
                }
                return null;
            },
        }),
        CredentialsProvider({
            id: "laravel-github",
            name: "LaravelGitHub",
            credentials: {
                token: { label: "Token", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.token) {
                    return null;
                }

                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/auth/user`, {
                        headers: {
                            Authorization: `Bearer ${credentials.token}`,
                            Accept: "application/json",
                        },
                    });
                
                    const response = await res.json();
                
                    if (res.ok && response) {
                        const user = {
                            ...response,
                            token: credentials.token,
                        };
                        return user;
                    }
                } catch (error) {
                    console.error("GitHub auth error:", error);
                }
            
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.accessToken = encrypt(user.token);
                token.profile_picture = user.profile_picture;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            session.user = {
                ...token,
                name: token.name || null,
                email: token.email || null,
                profile_picture: token.profile_picture || null,
            };
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
};