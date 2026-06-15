import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { email: session.email, name: session.name, role: session.role } });
}
