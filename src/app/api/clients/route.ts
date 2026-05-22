import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET: Retrieve students for the currently logged-in Personal Trainer
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "PERSONAL_TRAINER") {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const trainerId = (session.user as any).id;
    const students = await db.user.findMany({
      where: { trainerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.error("Erro ao listar alunos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}

// POST: Create a new student (Aluno) managed by the logged-in trainer
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "PERSONAL_TRAINER") {
      return NextResponse.json(
        { error: "Acesso não autorizado." },
        { status: 401 }
      );
    }

    const trainerId = (session.user as any).id;
    const { name, email, password } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e e-mail são obrigatórios." },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está em uso por outro aluno/usuário." },
        { status: 400 }
      );
    }

    // Default password is "123456" if not provided
    const userPassword = password || "123456";
    const passwordHash = await bcrypt.hash(userPassword, 10);

    const student = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ALUNO",
        trainerId,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar aluno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
