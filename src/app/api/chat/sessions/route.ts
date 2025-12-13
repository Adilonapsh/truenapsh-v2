import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { decrypt } from "@/lib/crypt";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const plain = decrypt(token.accessToken);
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    const baseURL = process.env.NEXT_AUTH_URL;
    const url = project_id
      ? `${baseURL}/chat/sessions?project_id=${project_id}`
      : `${baseURL}/chat/sessions`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${plain}`,
        Accept: "application/json",
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const plain = decrypt(token.accessToken);
    const body = await req.json();
    const baseURL = process.env.NEXT_AUTH_URL;
    const res = await fetch(`${baseURL}/chat/sessions`, {
      method: "POST",
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

