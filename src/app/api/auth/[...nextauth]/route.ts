import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const res = await fetch("http://localhost:8000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: credentials?.email,
                        password: credentials?.password,
                    }),
                });

                const user = await res.json();
                console.log(user);

                if (res.ok && user) {
                    return user; // Return user object on successful login
                }

                return null; // Return null if login fails
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.accessToken = user.token;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = token;
            return session;
        },
    },
    pages: {
        signIn: "/auth/login",
    },
    debug: true,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
