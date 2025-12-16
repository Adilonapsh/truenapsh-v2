import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { decrypt } from "@/lib/crypt";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const awaitedParams = await Promise.resolve(params);
    const plain = decrypt(token.accessToken);
    const body = await req.json();
    const baseURL = process.env.NEXT_AUTH_URL;
    const res = await fetch(`${baseURL}/chat/sessions/${awaitedParams.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${plain}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const awaitedParams = await Promise.resolve(params);
    const plain = decrypt(token.accessToken);
    const baseURL = process.env.NEXT_AUTH_URL;
    const res = await fetch(`${baseURL}/chat/sessions/${awaitedParams.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${plain}`,
        Accept: "application/json",
      },
    });
    if (res.status === 204) {
      return NextResponse.json({ message: "Deleted" }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
