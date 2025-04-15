import { encrypt } from "@/lib/crypt";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    providers: [
        CredentialsProvider({
            id: "laravel-auth",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const res = await fetch(`${process.env.NEXT_AUTH_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    body: JSON.stringify({
                        email: credentials?.email,
                        password: credentials?.password,
                    }),
                });

                const response = await res.json();

                console.log("Ini Respon credential biasa", response);

                if (res.ok && response) {
                    const user = {
                        ...response.user,
                        token: response.token
                    };
                    // console.log("awdawdwa",user)
                    return user;
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
                const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}/auth/user`, {
                    headers: {
                        Authorization: `Bearer ${credentials?.token}`,
                        Accept: "application/json",
                    },
                });
            
                const response = await res.json();
            
                if (res.ok && response) {
                    const user = {
                        ...response,
                        token: credentials?.token,
                    };
                    return user;
                }
            
                return null;
            },
        }),
        // GitHubProvider({
        //     clientId: process.env.GITHUB_ID!,
        //     clientSecret: process.env.GITHUB_SECRET!,
        // }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.accessToken = encrypt(user.token);
            }
            // console.log("Ini User Token", token);
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            // console.log("Ini Token :", token);
            session.user = {
                ...token,
                name: token.name || null,
                email: token.email || null,
                profile_picture: token.profile_picture || null,
            };
            // console.log("Ini Session :", session);
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
        error: "/auth/login",
    },
    debug: true,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
} satisfies NextAuthOptions;

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
