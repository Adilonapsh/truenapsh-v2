import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: Request) {
    console.log(req.url);
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const status = token ? 'authenticated' : 'unauthenticated';
    console.log(status)

    if (!token && !(req.url.includes("auth"))) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    if (token && (req.url.includes("auth"))) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }


    // // Contoh: Membatasi akses hanya untuk admin
    // if (token.role !== 'admin') {
    //     return NextResponse.redirect(new URL('/not-authorized', req.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/auth/:path*',
        '/admin/:path*',
        '/map/:path*'
    ],
};