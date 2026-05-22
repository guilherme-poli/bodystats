"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Evaluation {
  id: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  bodyFatPercent: number;
  createdAt: string;
  publicToken?: string | null;
  isPublic: boolean;
  alunoId?: string | null;
  aluno?: Student | null;
}


export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Navigation states
  const [activeTab, setActiveTab] = useState<"home" | "clients" | "history" | "profile">("home");

  // Trainer data states
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Search and modal states
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Aluno-specific states
  const [alunoEvaluations, setAlunoEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchData = async () => {
    if (!session || !session.user) return;
    setLoadingData(true);
    try {
      const userRole = (session.user as any).role;

      if (userRole === "PERSONAL_TRAINER") {
        // Fetch clients
        const clientsRes = await fetch("/api/clients");
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setStudents(clientsData);
        }

        // Fetch evaluations
        const evalsRes = await fetch("/api/evaluations");
        if (evalsRes.ok) {
          const evalsData = await evalsRes.json();
          setEvaluations(evalsData);
        }
      } else {
        // Aluno
        const evalsRes = await fetch("/api/evaluations");
        if (evalsRes.ok) {
          const evalsData = await evalsRes.json();
          setAlunoEvaluations(evalsData);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-[#111508] items-center justify-center text-[#e2e4cf]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c3f400] mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest font-bold">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const role = (session.user as any).role;
  const userName = session.user.name || "Usuário";

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setAdding(true);

    if (!newStudentName || !newStudentEmail) {
      setAddError("Nome e e-mail são obrigatórios.");
      setAdding(false);
      return;
    }

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStudentName,
          email: newStudentEmail,
          password: newStudentPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao adicionar aluno.");
      }

      setAddSuccess("Aluno cadastrado com sucesso!");
      setNewStudentName("");
      setNewStudentEmail("");
      setNewStudentPassword("");
      
      // Refresh students
      fetchData();
      
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || "Erro de conexão.");
    } finally {
      setAdding(false);
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to find latest BF for a student
  const getLatestBF = (studentId: string) => {
    const studentEvals = evaluations.filter((ev) => ev.alunoId === studentId);
    if (studentEvals.length === 0) return null;
    return studentEvals[0]; // Ordered by desc in API
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#111508] text-[#e2e4cf] pb-32">
      {/* Top App Bar */}
      <header className="bg-surface/85 backdrop-blur-xl border-b border-white/10 docked full-width top-0 z-40 fixed top-0 left-0 w-full px-6 h-14 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-xl text-[#c3f400]">BodyStat Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-on-surface-variant tracking-wider uppercase bg-surface-container-high px-3 py-1 rounded-full border border-white/5">
            {role === "PERSONAL_TRAINER" ? "Treinador" : "Aluno"}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-20 px-6 max-w-[1200px] w-full mx-auto flex-grow">
        {/* Welcome Header */}
        <section className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Olá, {userName}
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant font-medium">
            {role === "PERSONAL_TRAINER"
              ? `Você gerencia ${students.length} alunos cadastrados.`
              : "Acompanhe seus resultados e histórico de avaliações físicas."}
          </p>
        </section>

        {role === "PERSONAL_TRAINER" ? (
          <>
            {/* TRAINER VIEW: HOME TAB */}
            {activeTab === "home" && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card rounded-xl p-4 rim-light">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Alunos</span>
                    <span className="text-2xl font-bold text-white">{students.length}</span>
                  </div>
                  <div className="glass-card rounded-xl p-4 rim-light">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Avaliações</span>
                    <span className="text-2xl font-bold text-white">{evaluations.length}</span>
                  </div>
                  <div className="glass-card rounded-xl p-4 rim-light">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Este Mês</span>
                    <span className="text-2xl font-bold text-[#c3f400]">
                      {evaluations.filter(e => {
                        const date = new Date(e.createdAt);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                  <div className="glass-card rounded-xl p-4 rim-light">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Ativo em</span>
                    <span className="text-xs font-bold text-white uppercase">{formatDate(new Date().toISOString())}</span>
                  </div>
                </div>

                {/* Recent Activities Section */}
                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      Atividades Recentes
                    </h3>
                  </div>

                  {loadingData ? (
                    <p className="text-xs text-on-surface-variant">Carregando...</p>
                  ) : evaluations.length === 0 ? (
                    <div className="glass-card rounded-xl p-8 text-center rim-light">
                      <p className="text-sm text-on-surface-variant mb-4">
                        Nenhuma avaliação registrada ainda.
                      </p>
                      <Link
                        href="/evaluation/new"
                        className="inline-flex items-center gap-2 bg-[#c3f400] text-black px-4 py-2 rounded-xl text-xs font-bold"
                      >
                        Fazer Primeira Avaliação
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {evaluations.slice(0, 5).map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-4 p-4 glass-card rounded-xl rim-light hover:bg-white/5 transition-all"
                        >
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-[#c3f400]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-semibold text-white">
                              Avaliação Corporal — {ev.aluno ? ev.aluno.name : "Anônimo / Visitante"}
                            </p>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                              BF: {ev.bodyFatPercent}% • Peso: {ev.weight}kg • {formatDate(ev.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {ev.isPublic && ev.publicToken && (
                              <Link
                                href={`/evaluation/share/${ev.publicToken}`}
                                className="text-[10px] font-bold border border-white/10 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-white transition-colors"
                              >
                                VER RELATÓRIO PÚBLICO
                              </Link>
                            )}
                            <Link
                              href="/evaluation/history"
                              className="text-[10px] font-bold bg-white/10 px-3 py-1.5 rounded-lg text-white hover:bg-white/20 transition-all"
                            >
                              HISTÓRICO
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TRAINER VIEW: CLIENTS TAB */}
            {activeTab === "clients" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Search and Action Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                  <div className="relative flex-grow max-w-md">
                    <input
                      type="text"
                      placeholder="Buscar aluno por nome ou e-mail..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-11 bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 text-sm text-[#e2e4cf] focus:border-[#c3f400] focus:outline-none transition-all"
                    />
                    <svg
                      className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="h-11 bg-primary-container text-on-primary-container px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    NOVO ALUNO
                  </button>
                </div>

                {/* Clients Grid */}
                {loadingData ? (
                  <p className="text-xs text-on-surface-variant">Carregando alunos...</p>
                ) : filteredStudents.length === 0 ? (
                  <div className="glass-card rounded-xl p-12 text-center rim-light">
                    <p className="text-sm text-on-surface-variant">Nenhum aluno encontrado.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => {
                      const latest = getLatestBF(student.id);
                      return (
                        <div
                          key={student.id}
                          className="glass-card p-5 rounded-xl hover:bg-white/5 transition-all duration-300 flex flex-col justify-between group rim-light relative"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-base font-bold text-white leading-tight group-hover:text-[#c3f400] transition-colors">
                                {student.name}
                              </h4>
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block mt-1">
                                {student.email}
                              </span>
                            </div>
                            <Link
                              href={`/evaluation/new?alunoId=${student.id}`}
                              className="w-8 h-8 rounded-lg bg-[#c3f400]/10 flex items-center justify-center text-[#c3f400] hover:bg-[#c3f400] hover:text-black transition-all"
                              title="Nova avaliação"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </Link>
                          </div>

                          <div className="mt-4 pt-4 border-t border-white/5 flex items-baseline justify-between">
                            <div>
                              <span className="text-xs text-on-surface-variant block mb-1">Última Gordura Corporal</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-white">
                                  {latest ? latest.bodyFatPercent : "--"}
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-bold uppercase">% BF</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-bold text-on-surface-variant uppercase block">
                                {latest ? formatDate(latest.createdAt) : "SEM AVALIAÇÃO"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TRAINER VIEW: HISTORY TAB */}
            {activeTab === "history" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Histórico Geral de Avaliações
                </h3>

                {evaluations.length === 0 ? (
                  <div className="glass-card rounded-xl p-12 text-center rim-light">
                    <p className="text-sm text-on-surface-variant">Nenhuma avaliação realizada ainda.</p>
                  </div>
                ) : (
                  <div className="glass-card rounded-xl overflow-hidden border border-white/10 rim-light">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 uppercase tracking-wider text-on-surface-variant font-bold">
                            <th className="p-4">Aluno</th>
                            <th className="p-4">Data</th>
                            <th className="p-4 text-center">Idade / Gênero</th>
                            <th className="p-4 text-center">Peso</th>
                            <th className="p-4 text-center">BF%</th>
                            <th className="p-4 text-center">Relatório</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {evaluations.map((ev) => (
                            <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-bold text-white">
                                {ev.aluno ? ev.aluno.name : "Anônimo / Visitante"}
                              </td>
                              <td className="p-4 text-on-surface-variant">{formatDate(ev.createdAt)}</td>
                              <td className="p-4 text-center">
                                {ev.age} anos / {ev.gender}
                              </td>
                              <td className="p-4 text-center">{ev.weight} kg</td>
                              <td className="p-4 text-center font-bold text-[#c3f400]">
                                {ev.bodyFatPercent}%
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                  {ev.isPublic && ev.publicToken && (
                                    <Link
                                      href={`/evaluation/share/${ev.publicToken}`}
                                      className="bg-[#c3f400]/10 hover:bg-[#c3f400] text-[#c3f400] hover:text-black px-2 py-1 rounded text-[10px] font-bold transition-all"
                                    >
                                      PÚBLICO
                                    </Link>
                                  )}
                                  <Link
                                    href={`/evaluation/history?alunoId=${ev.alunoId || ""}`}
                                    className="bg-white/5 hover:bg-white/15 px-2 py-1 rounded text-[10px] font-bold text-white transition-all"
                                  >
                                    GRÁFICOS
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ALUNO VIEW: DASHBOARD AND HISTORY */}
            <div className="space-y-8 animate-in fade-in duration-300">
              {alunoEvaluations.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center rim-light flex flex-col items-center">
                  <p className="text-sm text-on-surface-variant mb-4">
                    Nenhuma avaliação física registrada para você ainda.
                  </p>
                  <p className="text-xs text-on-surface-variant mb-6">
                    Seu Personal Trainer cadastrará suas medições assim que realizar a primeira avaliação física, ou você pode realizar uma autoavaliação agora.
                  </p>
                  <Link
                    href="/evaluation/new"
                    className="inline-flex items-center gap-2 bg-[#c3f400] text-black px-4 py-2.5 rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    REALIZAR AUTOAVALIAÇÃO
                  </Link>
                </div>
              ) : (
                <>
                  {/* Latest Metrics & Siri Formula Ring */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card rounded-2xl p-6 rim-light flex flex-col justify-between col-span-1 md:col-span-2">
                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
                          ÚLTIMA AVALIAÇÃO
                        </span>
                        <h3 className="text-xl font-bold text-white mb-4">
                          Composição Corporal do Último Registro
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <div>
                            <span className="text-[10px] text-on-surface-variant font-bold block mb-1">PESO</span>
                            <span className="text-xl font-bold text-white">{alunoEvaluations[0].weight} kg</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant font-bold block mb-1">ALTURA</span>
                            <span className="text-xl font-bold text-white">{alunoEvaluations[0].height} m</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant font-bold block mb-1">IDADE</span>
                            <span className="text-xl font-bold text-white">{alunoEvaluations[0].age} anos</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant font-bold block mb-1">GORDURA%</span>
                            <span className="text-xl font-bold text-[#c3f400]">{alunoEvaluations[0].bodyFatPercent}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap gap-3">
                        {alunoEvaluations[0].isPublic && alunoEvaluations[0].publicToken && (
                          <Link
                            href={`/evaluation/share/${alunoEvaluations[0].publicToken}`}
                            className="bg-[#c3f400] text-black text-xs font-bold px-4 py-2.5 rounded-xl hover:scale-102 transition-all flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.885 2.502M8.684 13.258l4.885-2.502m-5.411 1.768a3.1 3.1 0 110-6.2 3.1 3.1 0 010 6.2zm11.37 5.163a3.1 3.1 0 11-6.2 0 3.1 3.1 0 01-6.2 0z" />
                            </svg>
                            VER RELATÓRIO PÚBLICO
                          </Link>
                        )}
                        <Link
                          href="/evaluation/history"
                          className="bg-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-white/15 transition-all"
                        >
                          VER TODOS GRÁFICOS
                        </Link>
                        <Link
                          href="/evaluation/new"
                          className="bg-white/10 hover:bg-white/15 text-[#c3f400] border border-[#c3f400]/25 text-xs font-bold px-4 py-2.5 rounded-xl hover:scale-102 transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          NOVA AUTOAVALIAÇÃO
                        </Link>
                      </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 rim-light flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-6">
                        BF CORPORAL ATUAL
                      </span>
                      <div className="relative w-36 h-36 mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            className="text-surface-container-high"
                            cx="72"
                            cy="72"
                            fill="transparent"
                            r="60"
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="8"
                          />
                          <circle
                            className="text-[#c3f400]"
                            cx="72"
                            cy="72"
                            fill="transparent"
                            r="60"
                            stroke="#c3f400"
                            strokeDasharray="377"
                            strokeDashoffset={377 - (377 * Math.min(100, alunoEvaluations[0].bodyFatPercent)) / 100}
                            strokeWidth="8"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-extrabold text-white leading-none">
                            {alunoEvaluations[0].bodyFatPercent}%
                          </span>
                          <span className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider mt-1">
                            Siri Formula
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-[#e2e4cf] font-semibold">
                        Último registro em: {formatDate(alunoEvaluations[0].createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* History List */}
                  <section className="mt-8">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                      Histórico de Registros
                    </h3>
                    <div className="space-y-3">
                      {alunoEvaluations.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between p-4 glass-card rounded-xl rim-light hover:bg-white/5 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-[#c3f400]">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">
                                Avaliação Física de 7 Dobras
                              </p>
                              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                                {formatDate(ev.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <span className="text-[9px] text-on-surface-variant font-bold block">BF</span>
                              <span className="text-base font-bold text-[#c3f400]">{ev.bodyFatPercent}%</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-on-surface-variant font-bold block">PESO</span>
                              <span className="text-base font-bold text-white">{ev.weight}kg</span>
                            </div>
                            {ev.isPublic && ev.publicToken && (
                              <Link
                                href={`/evaluation/share/${ev.publicToken}`}
                                className="text-[10px] font-bold border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white transition-all"
                              >
                                RELATÓRIO
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </>
        )}

        {/* PROFILE TAB (Applies to both roles) */}
        {activeTab === "profile" && (
          <div className="max-w-md mx-auto glass-card rounded-2xl p-6 rim-light animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-white mb-6 text-center">Perfil do Usuário</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Nome</span>
                <span className="text-sm text-white font-medium">{session.user.name}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">E-mail</span>
                <span className="text-sm text-white font-medium">{session.user.email}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Tipo de Perfil</span>
                <span className="text-sm text-[#c3f400] font-bold uppercase">
                  {role === "PERSONAL_TRAINER" ? "Personal Trainer" : "Aluno"}
                </span>
              </div>
              
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full h-11 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold mt-6 hover:bg-red-950/60 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                SAIR DO SISTEMA
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (Nova Avaliação) */}
      {activeTab !== "profile" && (
        <Link
          href="/evaluation/new"
          className="fixed bottom-28 right-6 w-14 h-14 bg-[#c3f400] text-black rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform duration-150 z-40 hover:scale-105"
          title={role === "PERSONAL_TRAINER" ? "Nova Avaliação" : "Nova Autoavaliação"}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="bg-surface/85 backdrop-blur-xl border-t border-white/10 shadow-lg bottom-0 rounded-t-xl fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 h-20">
        <button
          onClick={() => { setActiveTab("home"); setSearchQuery(""); }}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === "home" ? "text-[#c3f400] font-bold scale-105" : "text-on-surface-variant hover:text-white"
          }`}
        >
          <svg className="w-5 h-5" fill={activeTab === "home" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-wider">Painel</span>
        </button>

        {role === "PERSONAL_TRAINER" && (
          <button
            onClick={() => { setActiveTab("clients"); setSearchQuery(""); }}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "clients" ? "text-[#c3f400] font-bold scale-105" : "text-on-surface-variant hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill={activeTab === "clients" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-[10px] uppercase font-bold tracking-wider">Alunos</span>
          </button>
        )}

        {role === "PERSONAL_TRAINER" && (
          <button
            onClick={() => { setActiveTab("history"); setSearchQuery(""); }}
            className={`flex flex-col items-center justify-center gap-1 transition-all ${
              activeTab === "history" ? "text-[#c3f400] font-bold scale-105" : "text-on-surface-variant hover:text-white"
            }`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[10px] uppercase font-bold tracking-wider">Histórico</span>
          </button>
        )}

        <button
          onClick={() => { setActiveTab("profile"); setSearchQuery(""); }}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === "profile" ? "text-[#c3f400] font-bold scale-105" : "text-on-surface-variant hover:text-white"
          }`}
        >
          <svg className="w-5 h-5" fill={activeTab === "profile" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-wider">Perfil</span>
        </button>
      </nav>

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#1e2113] border border-white/10 rounded-2xl p-6 relative rim-light shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Cadastrar Novo Aluno</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Cadastre o aluno para começar a registrar as avaliações físicas dele. Ele poderá acessar o sistema usando este e-mail e senha.
            </p>

            {addError && (
              <div className="bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl p-3 text-xs mb-4 text-center">
                {addError}
              </div>
            )}

            {addSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs mb-4 text-center">
                {addSuccess}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">
                  Nome Completo
                </label>
                <input
                  type="text"
                  placeholder="Nome do Aluno"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full h-11 bg-surface border border-white/10 rounded-xl px-4 text-sm text-[#e2e4cf] focus:border-[#c3f400] focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">
                  E-mail do Aluno
                </label>
                <input
                  type="email"
                  placeholder="aluno@exemplo.com"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  className="w-full h-11 bg-surface border border-white/10 rounded-xl px-4 text-sm text-[#e2e4cf] focus:border-[#c3f400] focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">
                  Senha Inicial (Opcional)
                </label>
                <input
                  type="password"
                  placeholder="Se deixado em branco, será '123456'"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  className="w-full h-11 bg-surface border border-white/10 rounded-xl px-4 text-sm text-[#e2e4cf] focus:border-[#c3f400] focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full h-11 bg-[#c3f400] text-black rounded-xl text-sm font-bold mt-2 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50"
              >
                {adding ? "Cadastrando..." : "Confirmar Cadastro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
