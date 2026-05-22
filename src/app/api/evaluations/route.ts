import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { calculateJacksonPollock7 } from "@/lib/calculations";
import crypto from "crypto";

// GET: Retrieve evaluations based on session role or anonymous token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);

    if (session && session.user) {
      const userId = (session.user as any).id;
      const role = (session.user as any).role;

      if (role === "PERSONAL_TRAINER") {
        const alunoId = searchParams.get("alunoId");
        if (alunoId) {
          const evaluations = await db.physicalEvaluation.findMany({
            where: { alunoId, trainerId: userId },
            orderBy: { createdAt: "desc" },
          });
          return NextResponse.json(evaluations);
        } else {
          const evaluations = await db.physicalEvaluation.findMany({
            where: { trainerId: userId },
            include: { aluno: true },
            orderBy: { createdAt: "desc" },
          });
          return NextResponse.json(evaluations);
        }
      } else {
        // ALUNO
        const evaluations = await db.physicalEvaluation.findMany({
          where: { alunoId: userId },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(evaluations);
      }
    } else {
      // Anonymous request
      const anonymousToken = searchParams.get("anonymousToken");
      if (anonymousToken) {
        const evaluations = await db.physicalEvaluation.findMany({
          where: { anonymousToken },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(evaluations);
      }
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error("Erro ao carregar avaliações:", error);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor.",
        details: error.message || String(error),
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

// POST: Register a new evaluation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const {
      age,
      gender,
      weight,
      height,
      triceps,
      subscapular,
      suprailiac,
      abdominal,
      midaxillary,
      chest,
      thigh,
      alunoId,
      anonymousToken,
      isPublic,
    } = body;

    // Validate inputs
    if (
      age === undefined ||
      !gender ||
      weight === undefined ||
      height === undefined ||
      triceps === undefined ||
      subscapular === undefined ||
      suprailiac === undefined ||
      abdominal === undefined ||
      midaxillary === undefined ||
      chest === undefined ||
      thigh === undefined
    ) {
      return NextResponse.json(
        { error: "Todos os campos de medidas são obrigatórios." },
        { status: 400 }
      );
    }

    // Compute results using Jackson-Pollock 7 formula
    const skinfolds = { triceps, subscapular, suprailiac, abdominal, midaxillary, chest, thigh };
    const calcResult = calculateJacksonPollock7(
      Number(age),
      gender as "M" | "F",
      Number(weight),
      skinfolds
    );

        const publicToken = isPublic ? crypto.randomUUID() : null;

    const dbData: any = {
      age: Number(age),
      gender,
      weight: Number(weight),
      height: Number(height),
      triceps: Number(triceps),
      subscapular: Number(subscapular),
      suprailiac: Number(suprailiac),
      abdominal: Number(abdominal),
      midaxillary: Number(midaxillary),
      chest: Number(chest),
      thigh: Number(thigh),
      bodyFatPercent: calcResult.bodyFatPercent,
      isPublic: !!isPublic,
      publicToken,
    };

    if (session && session.user) {
      const userId = (session.user as any).id;
      const role = (session.user as any).role;

      if (role === "PERSONAL_TRAINER") {
        dbData.trainerId = userId;
        if (alunoId) {
          dbData.alunoId = alunoId;
        }
      } else {
        dbData.alunoId = userId;
      }
    } else {
      // Anonymous
      dbData.anonymousToken = anonymousToken || null;
    }

    const evaluation = await db.physicalEvaluation.create({
      data: dbData,
    });

    return NextResponse.json({
      evaluation,
      results: calcResult,
    });
  } catch (error: any) {
    console.error("Erro ao registrar avaliação:", error);
    return NextResponse.json(
      { 
        error: "Erro interno do servidor.",
        details: error.message || String(error),
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
