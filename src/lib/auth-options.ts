import { encrypt } from "@/lib/crypt";
import NextAuth, { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
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
        const res = await fetch(`${process.env.NEXT_AUTH_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
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
            token: response.token,
          };
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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_URL}/auth/user`,
          {
            headers: {
              Authorization: `Bearer ${credentials?.token}`,
              Accept: "application/json",
            },
          }
        );

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
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      console.log("Ini User Token", token);
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.accessToken = encrypt(user.token);
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user = {
        ...session.user,
        id: token.id,
        name: token.name || null,
        email: token.email || null,
        profile_picture: token.profile_picture || null,
        accessToken: token.accessToken,
      };
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
};
