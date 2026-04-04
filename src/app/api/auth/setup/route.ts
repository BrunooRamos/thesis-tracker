import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email y contraseña (mín. 6 caracteres) requeridos" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  if (!user.needsSetup) {
    return NextResponse.json(
      { error: "Este usuario ya configuró su contraseña" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { email },
    data: {
      password: hashSync(password, 10),
      needsSetup: false,
    },
  });

  return NextResponse.json({ success: true });
}
