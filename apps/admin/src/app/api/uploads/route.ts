import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

// nodejs: server-side BFF. Tarayıcı token görmez; bu route session cookie ile
// dosyayı NestJS /api/uploads'a bearer token ekleyerek proxy'ler.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session?.accessToken) {
    return NextResponse.json({ message: "Oturum geçersiz." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Dosya bulunamadı." }, { status: 400 });
  }

  const upstream = new FormData();
  upstream.append("file", file, file.name);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: upstream,
    });
  } catch {
    return NextResponse.json(
      { message: "Yükleme sunucusuna ulaşılamadı." },
      { status: 502 },
    );
  }

  const data = await res
    .json()
    .catch(() => ({ message: "Yükleme başarısız." }));
  return NextResponse.json(data, { status: res.status });
}
