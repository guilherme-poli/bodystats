import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token de compartilhamento não fornecido." },
        { status: 400 }
      );
    }

    const evaluation = await db.physicalEvaluation.findFirst({
      where: {
        publicToken: token,
        isPublic: true,
      },
      include: {
        aluno: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json(
        { error: "Avaliação física não encontrada ou não compartilhada publicamente." },
        { status: 404 }
      );
    }

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("Erro ao buscar avaliação pública:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
