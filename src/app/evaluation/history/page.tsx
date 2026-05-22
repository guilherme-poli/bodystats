"use client";

import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Evaluation {
  id: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  bodyFatPercent: number;
  triceps: number;
  subscapular: number;
  suprailiac: number;
  abdominal: number;
  midaxillary: number;
  chest: number;
  thigh: number;
  createdAt: string;
  publicToken?: string | null;
  isPublic: boolean;
  alunoId?: string | null;
}


function HistoryContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const initialAlunoId = searchParams.get("alunoId") || "";

  // Dropdown list for Trainers
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState(initialAlunoId);

  // Evaluations history
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  // Sharing toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Trainer's students if applicable
  useEffect(() => {
    const fetchStudents = async () => {
      if (session && (session.user as any).role === "PERSONAL_TRAINER") {
        try {
          const res = await fetch("/api/clients");
          if (res.ok) {
            const data = await res.json();
            setStudents(data);
          }
        } catch (err) {
          console.error("Erro ao buscar alunos:", err);
        }
      }
    };
    if (status === "authenticated") {
      fetchStudents();
    }
  }, [status, session]);

  // Load evaluations based on selected student or anonymous token
  useEffect(() => {
    const fetchEvaluations = async () => {
      setLoading(true);
      try {
        let url = "/api/evaluations";
        if (session) {
          if ((session.user as any).role === "PERSONAL_TRAINER" && selectedAlunoId) {
            url += `?alunoId=${selectedAlunoId}`;
          }
        } else {
          // Unauthenticated: fetch using anonymous token from localStorage
          const anonToken = localStorage.getItem("bodystat_anon_token");
          if (anonToken) {
            url += `?anonymousToken=${anonToken}`;
          } else {
            setEvaluations([]);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // The API returns desc (newest first). Let's keep desc for the list, 
          // but we'll reverse for the chart (chronological, oldest first).
          setEvaluations(data);
        }
      } catch (err) {
        console.error("Erro ao buscar avaliações:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [session, selectedAlunoId]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const generateShareLink = (ev: Evaluation) => {
    if (!ev.isPublic || !ev.publicToken) {
      showToast("Por favor, ative a opção de relatório público para esta avaliação.");
      return;
    }
    const link = `${window.location.origin}/evaluation/share/${ev.publicToken}`;
    navigator.clipboard.writeText(link);
    showToast("Link copiado para a área de transferência!");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase();
  };

  const isTrainer = session && (session.user as any).role === "PERSONAL_TRAINER";

  // Data helpers for the latest evaluation
  const latestEvaluation = evaluations[0]; // descending list
  const currentWeight = latestEvaluation ? latestEvaluation.weight : 0;
  const currentBF = latestEvaluation ? latestEvaluation.bodyFatPercent : 0;
  const leanPercent = latestEvaluation ? 100 - currentBF : 100;
  const fatMass = latestEvaluation ? parseFloat(((currentWeight * currentBF) / 100).toFixed(1)) : 0;
  const leanMass = latestEvaluation ? parseFloat((currentWeight - fatMass).toFixed(1)) : 0;

  // Chart preparation
  // We need chronological order (oldest first)
  const chronologicalEvals = [...evaluations].reverse();
  const chartPointsCount = chronologicalEvals.length;

  // Generate SVG Line Chart Path
  let svgPath = "";
  let svgGradientPath = "";
  const svgWidth = 1000;
  const svgHeight = 400;
  const chartPoints: { x: number; y: number; val: number; date: string }[] = [];

  if (chartPointsCount > 0) {
    const bfValues = chronologicalEvals.map((e) => e.bodyFatPercent);
    const minBF = Math.min(...bfValues, 5); // Default min 5%
    const maxBF = Math.max(...bfValues, 25); // Default max 25%
    const range = maxBF - minBF || 1;

    chronologicalEvals.forEach((ev, idx) => {
      // Calculate X coordinate
      const x = chartPointsCount === 1 
        ? svgWidth / 2 
        : idx * (svgWidth / (chartPointsCount - 1));

      // Calculate Y coordinate (higher value is higher in chart, so smaller Y value)
      // Map to height range 50 to 350
      const y = 350 - ((ev.bodyFatPercent - minBF) / range) * 300;

      chartPoints.push({
        x,
        y,
        val: ev.bodyFatPercent,
        date: new Date(ev.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
        }).toUpperCase(),
      });
    });

    // Build the lines
    if (chartPoints.length === 1) {
      // Draw a flat line or dot
      svgPath = `M 0 ${chartPoints[0].y} L ${svgWidth} ${chartPoints[0].y}`;
      svgGradientPath = `M 0 ${chartPoints[0].y} L ${svgWidth} ${chartPoints[0].y} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;
    } else {
      svgPath = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
      chartPoints.slice(1).forEach((pt) => {
        svgPath += ` L ${pt.x} ${pt.y}`;
      });

      svgGradientPath = `${svgPath} L ${chartPoints[chartPoints.length - 1].x} ${svgHeight} L ${chartPoints[0].x} ${svgHeight} Z`;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#111508] text-[#e2e4cf] pb-32">
      {/* Top App Bar */}
      <header className="bg-surface/85 backdrop-blur-xl border-b border-white/10 docked full-width top-0 z-40 fixed top-0 left-0 w-full px-6 h-14 flex justify-between items-center">
        <Link
          href={session ? "/dashboard" : "/"}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <h1 className="font-bold text-xl text-[#c3f400] text-center flex-grow pr-8">
          Histórico & Evolução
        </h1>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 max-w-screen-xl w-full mx-auto flex-grow space-y-8">
        {/* Student Selector (Trainer Only) */}
        {isTrainer && (
          <section className="glass-card rounded-xl p-4 border border-white/10 max-w-md">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2 block mb-2">
              Filtrar por Aluno
            </label>
            <select
              value={selectedAlunoId}
              onChange={(e) => setSelectedAlunoId(e.target.value)}
              className="w-full h-11 bg-surface border border-white/10 rounded-xl px-4 text-xs font-bold text-[#e2e4cf] focus:outline-none focus:border-[#c3f400]"
            >
              <option value="">Avaliações Gerais / Minhas Realizadas</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} ({student.email})
                </option>
              ))}
            </select>
          </section>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#c3f400] mx-auto mb-2"></div>
            <p className="text-xs text-on-surface-variant uppercase tracking-widest">Buscando histórico...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center rim-light">
            <p className="text-sm text-on-surface-variant mb-4">Nenhum registro de avaliação física encontrado.</p>
            <Link
              href="/evaluation/new"
              className="bg-[#c3f400] text-black text-xs font-bold px-4 py-2.5 rounded-xl hover:scale-102 transition-all inline-block"
            >
              Realizar Nova Avaliação
            </Link>
          </div>
        ) : (
          <>
            {/* Bento Statistics Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-36 rim-light">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  PESO ATUAL
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#c3f400]">{currentWeight}</span>
                  <span className="text-xs text-on-surface-variant font-bold uppercase">kg</span>
                </div>
                <div className="flex items-center gap-1 text-[#c3f400]/70">
                  <span className="text-[10px] font-bold uppercase">ÚLTIMO REGISTRO ATIVO</span>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-36 border-[#c3f400]/20 rim-light">
                <span className="text-[10px] font-bold text-[#c3f400] uppercase tracking-wider block">
                  PERCENTUAL GORDURA (BF)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#c3f400]">{currentBF}%</span>
                </div>
                <div className="flex items-center gap-1 text-[#c3f400]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase">Calculado via Fórmula Siri</span>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-36 rim-light">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                  MASSA MAGRA (LEAN MASS)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-[#c3f400]">{leanMass}</span>
                  <span className="text-xs text-on-surface-variant font-bold uppercase">kg</span>
                </div>
                <div className="flex items-center gap-1 text-[#c3f400]/70">
                  <span className="text-[10px] font-bold uppercase">Massa Livre de Gordura</span>
                </div>
              </div>
            </section>

            {/* Evolution Trend Chart */}
            <section className="glass-card p-6 rounded-xl space-y-6 rim-light">
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Tendência de Evolução</h2>
                <p className="text-xs text-on-surface-variant">Percentual de Gordura Corporal (%)</p>
              </div>

              <div className="relative w-full h-64 mt-4 select-none">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 400" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="100" x2="1000" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="0" y1="200" x2="1000" y2="200" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="0" y1="300" x2="1000" y2="300" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <line x1="0" y1="400" x2="1000" y2="400" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />

                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c3f400" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#c3f400" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area */}
                  {svgGradientPath && <path d={svgGradientPath} fill="url(#chartGradient)" />}

                  {/* Main Line */}
                  {svgPath && (
                    <path
                      d={svgPath}
                      fill="none"
                      stroke="#c3f400"
                      strokeLinecap="round"
                      strokeWidth="4"
                    />
                  )}

                  {/* Intersect Points */}
                  {chartPoints.map((pt, index) => (
                    <g key={index}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6"
                        fill="#c3f400"
                        stroke="#111508"
                        strokeWidth="2"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 12}
                        textAnchor="middle"
                        fill="white"
                        className="text-[10px] font-bold"
                      >
                        {pt.val}%
                      </text>
                    </g>
                  ))}
                </svg>

                {/* X Axis Labels */}
                <div className="flex justify-between mt-4 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                  {chartPoints.map((pt, idx) => (
                    <span key={idx}>{pt.date}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* Detailed Composition breakdown & Historical Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ratio section */}
              <section className="glass-card p-6 rounded-xl space-y-6 rim-light flex flex-col justify-center">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  Composição de Massa
                </h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke="#c3f400"
                        strokeDasharray="301.6"
                        strokeDashoffset={301.6 - (301.6 * leanPercent) / 100}
                        strokeWidth="10"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-extrabold text-white">{leanPercent.toFixed(0)}%</span>
                      <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-wider">
                        Magra
                      </span>
                    </div>
                  </div>

                  <div className="flex-grow space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#e2e4cf]">Massa Magra</span>
                        <span className="text-[#c3f400]">{leanMass} kg</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#c3f400]" style={{ width: `${leanPercent}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-[#e2e4cf]">Massa Gorda</span>
                        <span className="text-on-surface-variant">{fatMass} kg</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-white/30" style={{ width: `${currentBF}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Past Assessments List */}
              <section className="glass-card p-6 rounded-xl flex flex-col max-h-[340px] rim-light">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  Histórico de Registros
                </h3>
                <div className="overflow-y-auto space-y-3 flex-1 pr-2">
                  {evaluations.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-white/5 p-4 rounded-xl flex justify-between items-center border border-white/5"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{formatDate(ev.createdAt)}</p>
                        <p className="text-[9px] text-on-surface-variant font-bold uppercase">
                          Dobras: {ev.triceps + ev.subscapular + ev.suprailiac + ev.abdominal + ev.midaxillary + ev.chest + ev.thigh} mm total
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-sm font-bold text-[#c3f400]">{ev.bodyFatPercent}% BF</p>
                          <p className="text-[9px] text-on-surface-variant font-semibold">
                            {ev.weight} kg • {ev.age} anos
                          </p>
                        </div>
                        <button
                          onClick={() => generateShareLink(ev)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                          title="Copiar Link de Compartilhamento"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 10.742l4.885 2.502M8.684 13.258l4.885-2.502m-5.411 1.768a3.1 3.1 0 110-6.2 3.1 3.1 0 010 6.2zm11.37 5.163a3.1 3.1 0 11-6.2 0 3.1 3.1 0 01-6.2 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#c3f400] text-black px-6 py-3 rounded-full font-bold text-xs shadow-lg z-[60] animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-[#111508] text-[#e2e4cf] justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#c3f400] mb-2"></div>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest">Carregando...</p>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
