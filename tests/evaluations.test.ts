import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as evaluationsGET, POST as evaluationsPOST } from "../src/app/api/evaluations/route";
import { GET as publicGET } from "../src/app/api/evaluations/public/route";
import { db } from "../src/lib/db";
import { getServerSession } from "next-auth/next";

// Mock the db module
vi.mock("../src/lib/db", () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
      },
      physicalEvaluation: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    },
  };
});

// Mock NextAuth's getServerSession
vi.mock("next-auth/next", () => {
  return {
    getServerSession: vi.fn(),
  };
});

describe("API Route - Evaluations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET Evaluations", () => {
    it("should list evaluations for an authenticated student (Aluno)", async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: {
          id: "student-uuid-1",
          role: "ALUNO",
        },
      });

      const mockEvaluations = [
        { id: "eval-1", weight: 70, bodyFatPercent: 15.2, alunoId: "student-uuid-1" },
      ];
      vi.mocked(db.physicalEvaluation.findMany).mockResolvedValue(mockEvaluations as any);

      const mockRequest = new Request("http://localhost/api/evaluations");
      const response = await evaluationsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("eval-1");
      expect(db.physicalEvaluation.findMany).toHaveBeenCalledWith({
        where: { alunoId: "student-uuid-1" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should list evaluations using anonymousToken if not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const mockEvaluations = [
        { id: "eval-anon", weight: 80, bodyFatPercent: 18.0, anonymousToken: "anon-token-123" },
      ];
      vi.mocked(db.physicalEvaluation.findMany).mockResolvedValue(mockEvaluations as any);

      const mockRequest = new Request("http://localhost/api/evaluations?anonymousToken=anon-token-123");
      const response = await evaluationsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe("eval-anon");
      expect(db.physicalEvaluation.findMany).toHaveBeenCalledWith({
        where: { anonymousToken: "anon-token-123" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("POST Evaluations", () => {
    it("should save physical evaluation and return computed results", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null); // Anonymous test

      const mockRequest = new Request("http://localhost/api/evaluations", {
        method: "POST",
        body: JSON.stringify({
          age: 25,
          gender: "M",
          weight: 75,
          height: 175,
          triceps: 12,
          subscapular: 10,
          suprailiac: 15,
          abdominal: 18,
          midaxillary: 11,
          chest: 10,
          thigh: 14,
          anonymousToken: "anon-cookie-token",
          isPublic: true,
        }),
      });

      const mockSavedEval = {
        id: "new-eval-id",
        age: 25,
        gender: "M",
        weight: 75,
        height: 175,
        bodyFatPercent: 12.6,
        anonymousToken: "anon-cookie-token",
        isPublic: true,
        publicToken: "random-uuid-token",
      };

      vi.mocked(db.physicalEvaluation.create).mockResolvedValue(mockSavedEval as any);

      const response = await evaluationsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.evaluation.id).toBe("new-eval-id");
      expect(data.results.bodyFatPercent).toBe(12.6);
      expect(data.results.fatMass).toBe(9.43);
      expect(db.physicalEvaluation.create).toHaveBeenCalledTimes(1);
    });

    it("should return 400 if measuring inputs are missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const mockRequest = new Request("http://localhost/api/evaluations", {
        method: "POST",
        body: JSON.stringify({
          age: 25,
          gender: "M",
          weight: 75,
          // Missing other measurements
        }),
      });

      const response = await evaluationsPOST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Todos os campos de medidas são obrigatórios.");
    });
  });
});

describe("API Route - Public shareable report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the evaluation if token matches and isPublic is true", async () => {
    const mockEval = {
      id: "public-eval-1",
      weight: 70,
      bodyFatPercent: 14.5,
      isPublic: true,
      publicToken: "valid-share-token",
      aluno: { name: "Test Student", email: "student@test.com" },
    };

    vi.mocked(db.physicalEvaluation.findFirst).mockResolvedValue(mockEval as any);

    const mockRequest = new Request("http://localhost/api/evaluations/public?token=valid-share-token");
    const response = await publicGET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe("public-eval-1");
    expect(data.aluno.name).toBe("Test Student");
  });

  it("should return 404 if token does not match or isPublic is false", async () => {
    vi.mocked(db.physicalEvaluation.findFirst).mockResolvedValue(null);

    const mockRequest = new Request("http://localhost/api/evaluations/public?token=invalid-token");
    const response = await publicGET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Avaliação física não encontrada ou não compartilhada publicamente.");
  });
});
