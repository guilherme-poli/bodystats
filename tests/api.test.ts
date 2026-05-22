import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as registerPOST } from "../src/app/api/auth/register/route";
import { GET as clientsGET, POST as clientsPOST } from "../src/app/api/clients/route";
import { db } from "../src/lib/db";
import { getServerSession } from "next-auth/next";

// Mock the db module
vi.mock("../src/lib/db", () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
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

// Mock bcryptjs to speed up tests and keep them simple
vi.mock("bcryptjs", () => {
  return {
    default: {
      hash: vi.fn().mockResolvedValue("mocked-hash"),
    },
  };
});

describe("API Route - Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register a new user successfully", async () => {
    const mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Academia Admin",
        email: "trainer@fit.com",
        password: "securepassword",
        role: "PERSONAL_TRAINER",
      }),
    });

    // Mock db queries
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "user-uuid-1",
      name: "Academia Admin",
      email: "trainer@fit.com",
      role: "PERSONAL_TRAINER",
    } as any);

    const response = await registerPOST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Usuário registrado com sucesso!");
    expect(data.user.id).toBe("user-uuid-1");
    expect(db.user.create).toHaveBeenCalledTimes(1);
  });

  it("should return 400 if user email already exists", async () => {
    const mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate User",
        email: "duplicate@fit.com",
        password: "somepassword",
        role: "ALUNO",
      }),
    });

    vi.mocked(db.user.findUnique).mockResolvedValue({ id: "existing-id" } as any);

    const response = await registerPOST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Este e-mail já está sendo utilizado.");
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 if required fields are missing", async () => {
    const mockRequest = new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "missing-fields@fit.com",
      }),
    });

    const response = await registerPOST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Por favor, preencha todos os campos obrigatórios.");
  });
});

describe("API Route - Clients (Trainer Students)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 GET request if no active session", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await clientsGET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Acesso não autorizado.");
  });

  it("should return 401 GET request if session user is not a trainer", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "aluno-id",
        role: "ALUNO",
      },
    });

    const response = await clientsGET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Acesso não autorizado.");
  });

  it("should list students managed by the trainer", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "trainer-uuid-99",
        role: "PERSONAL_TRAINER",
      },
    });

    const mockStudents = [
      { id: "student-1", name: "Student One", email: "student1@test.com" },
      { id: "student-2", name: "Student Two", email: "student2@test.com" },
    ];
    vi.mocked(db.user.findMany).mockResolvedValue(mockStudents as any);

    const response = await clientsGET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Student One");
    expect(db.user.findMany).toHaveBeenCalledWith({
      where: { trainerId: "trainer-uuid-99" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("should create a student user under the personal trainer", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "trainer-uuid-99",
        role: "PERSONAL_TRAINER",
      },
    });

    const mockRequest = new Request("http://localhost/api/clients", {
      method: "POST",
      body: JSON.stringify({
        name: "New Student",
        email: "newstudent@test.com",
      }),
    });

    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "student-uuid-new",
      name: "New Student",
      email: "newstudent@test.com",
      role: "ALUNO",
      trainerId: "trainer-uuid-99",
    } as any);

    const response = await clientsPOST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.id).toBe("student-uuid-new");
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: "New Student",
        email: "newstudent@test.com",
        passwordHash: "mocked-hash",
        role: "ALUNO",
        trainerId: "trainer-uuid-99",
      },
    });
  });
});
