"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { calculateJacksonPollock7 } from "@/lib/calculations";

interface Student {
  id: string;
  name: string;
  email: string;
}

function NewEvaluationContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAlunoId = searchParams.get("alunoId") || "";

  // Dropdown list for Personal Trainers
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState(initialAlunoId);

  // Form inputs
  const [age, setAge] = useState<number>(25);
  const [gender, setGender] = useState<"M" | "F">("M");
  const [weight, setWeight] = useState<number>(75);
  const [height, setHeight] = useState<number>(175); // in cm

  // Skinfolds (mm)
  const [triceps, setTriceps] = useState<number>(12);
  const [subscapular, setSubscapular] = useState<number>(10);
  const [suprailiac, setSuprailiac] = useState<number>(15);
  const [abdominal, setAbdominal] = useState<number>(18);
  const [midaxillary, setMidaxillary] = useState<number>(11);
  const [chest, setChest] = useState<number>(10);
  const [thigh, setThigh] = useState<number>(14);

  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);

  // Real-time calculation
  const [realtimeBF, setRealtimeBF] = useState<number>(14.5);

  useEffect(() => {
    // Recalculate BF in real time
    const result = calculateJacksonPollock7(age, gender, weight, {
      triceps,
      subscapular,
      suprailiac,
      abdominal,
      midaxillary,
      chest,
      thigh,
    });
    setRealtimeBF(result.bodyFatPercent);
  }, [age, gender, weight, triceps, subscapular, suprailiac, abdominal, midaxillary, chest, thigh]);

  useEffect(() => {
    // If trainer logged in, fetch list of students
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

  const handleAdjust = (field: string, delta: number) => {
    const setters: Record<string, Function> = {
      triceps: (val: number) => setTriceps(Math.max(0, parseFloat((val + delta).toFixed(1)))),
      subscapular: (val: number) => setSubscapular(Math.max(0, parseFloat((val + delta).toFixed(1)))),
      suprailiac: (val: number) => setSuprailiac(Math.max(0, parseFloat((val + delta).toFixed(1)))),
      abdominal: (val: number) => setAbdominal(Math.max(0, parseFloat((val + delta).toFixed(1)))),
      midaxillary: (val: number) => setMidaxillary(Math.max(0, parseFloat((val + delta).toFixed(1)))),
      chest: (val: number) => setChest(Math.max(0, parseFloat((val + delta).toFixed(1)))),
      thigh: (val: number) => setThigh(Math.max(0, parseFloat((val + delta).toFixed(1)))),
    };

    const values: Record<string, number> = {
      triceps,
      subscapular,
      suprailiac,
      abdominal,
      midaxillary,
      chest,
      thigh,
    };

    if (setters[field]) {
      setters[field](values[field]);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      // Get or create anonymous token if not logged in
      let anonymousToken = null;
      if (!session) {
        anonymousToken = localStorage.getItem("bodystat_anon_token");
        if (!anonymousToken) {
          anonymousToken = crypto.randomUUID();
          localStorage.setItem("bodystat_anon_token", anonymousToken);
        }
      }

      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          gender,
          weight,
          height: height / 100, // convert cm to m
          triceps,
          subscapular,
          suprailiac,
          abdominal,
          midaxillary,
          chest,
          thigh,
          alunoId: selectedAlunoId || null,
          anonymousToken,
          isPublic,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ocorreu um erro ao salvar avaliação.");
      }

      setSuccessResult(data);
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const isTrainer = session && (session.user as any).role === "PERSONAL_TRAINER";

  return (
    <div className="flex flex-col min-h-screen bg-[#111508] text-[#e2e4cf] pb-40">
      {/* Top App Bar */}
      <header className="bg-surface/85 backdrop-blur-xl border-b border-white/10 docked full-width top-0 z-40 fixed top-0 left-0 w-full px-6 h-14 flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="font-bold text-xl text-[#c3f400] text-center flex-grow pr-8">
          Nova Avaliação
        </h1>
      </header>

      {/* Sticky Real-time BF Bar */}
      <div className="fixed top-14 left-0 right-0 z-30 px-6 pt-4 pointer-events-none">
        <div className="glass-card rounded-xl p-4 flex justify-between items-center neo-shadow border-primary/20 pointer-events-auto max-w-lg mx-auto bg-[#1e2113]/90 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Jackson-Pollock 7 Dobras
            </p>
            <p className="text-sm font-semibold text-white">Gordura Corporal Calculada</p>
          </div>
          <div className="text-right">
            <span className="text-2xl md:text-3xl font-extrabold text-[#c3f400]">
              {realtimeBF}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="pt-36 px-6 max-w-lg mx-auto w-full flex-grow">
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl p-3 text-xs mb-6 text-center">
            {error}
          </div>
        )}

        <section className="space-y-6">
          {/* Client Selection (Trainer Only) */}
          {isTrainer && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">
                Selecionar Aluno
              </label>
              <select
                value={selectedAlunoId}
                onChange={(e) => setSelectedAlunoId(e.target.value)}
                className="w-full h-12 bg-surface-container-high border border-white/5 rounded-xl px-4 text-xs font-semibold text-[#e2e4cf] focus:outline-none focus:border-[#c3f400]"
              >
                <option value="">Avaliação Rápida / Avulsa (Sem Vincular)</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Basic Metrics Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">
                Idade (Anos)
              </label>
              <input
                type="number"
                placeholder="Idade"
                value={age || ""}
                onChange={(e) => setAge(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-12 bg-surface-container-high border border-white/5 rounded-xl px-4 text-sm text-[#e2e4cf] focus:outline-none focus:border-[#c3f400]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">
                Gênero
              </label>
              <div className="flex bg-surface-container-high rounded-xl h-12 p-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => setGender("M")}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all ${
                    gender === "M"
                      ? "bg-primary-container text-on-primary-container font-extrabold"
                      : "text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  Masculino
                </button>
                <button
                  type="button"
                  onClick={() => setGender("F")}
                  className={`flex-1 rounded-lg text-xs font-bold transition-all ${
                    gender === "F"
                      ? "bg-primary-container text-on-primary-container font-extrabold"
                      : "text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  Feminino
                </button>
              </div>
            </div>
          </div>

          {/* Basic Metrics Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">
                Peso Corporal (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Peso"
                value={weight || ""}
                onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full h-12 bg-surface-container-high border border-white/5 rounded-xl px-4 text-sm text-[#e2e4cf] focus:outline-none focus:border-[#c3f400]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant px-2">
                Altura (cm)
              </label>
              <input
                type="number"
                placeholder="Altura"
                value={height || ""}
                onChange={(e) => setHeight(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-12 bg-surface-container-high border border-white/5 rounded-xl px-4 text-sm text-[#e2e4cf] focus:outline-none focus:border-[#c3f400]"
              />
            </div>
          </div>

          {/* Sharing configuration */}
          <div className="glass-card rounded-xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Tornar Relatório Público</p>
              <p className="text-[10px] text-on-surface-variant">Gera um link compartilhavel para visualização sem login.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c3f400]"></div>
            </label>
          </div>

          {/* Skinfolds Divider */}
          <div className="flex items-center gap-4 py-2">
            <div className="h-px bg-white/10 flex-1"></div>
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Dobras Cutâneas (mm)
            </h3>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          {/* 7 Skinfold Fields */}
          <div className="space-y-5">
            {[
              { label: "Tríceps", value: triceps, key: "triceps" },
              { label: "Subescapular", value: subscapular, key: "subscapular" },
              { label: "Supra-ilíaca", value: suprailiac, key: "suprailiac" },
              { label: "Abdominal", value: abdominal, key: "abdominal" },
              { label: "Axilar Média", value: midaxillary, key: "midaxillary" },
              { label: "Peitoral", value: chest, key: "chest" },
              { label: "Coxa", value: thigh, key: "thigh" },
            ].map((fold) => (
              <div key={fold.key} className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <label className="text-sm font-bold text-white">{fold.label}</label>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase">Milímetros</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleAdjust(fold.key, -1)}
                    className="w-14 h-14 rounded-xl glass-card flex items-center justify-center text-white hover:bg-white/5 active:scale-90 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </button>
                  <div className="flex-1 h-14 glass-card rounded-xl flex items-center justify-center focus-within:border-[#c3f400] transition-all">
                    <input
                      type="number"
                      step="0.1"
                      value={fold.value}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        if (fold.key === "triceps") setTriceps(val);
                        else if (fold.key === "subscapular") setSubscapular(val);
                        else if (fold.key === "suprailiac") setSuprailiac(val);
                        else if (fold.key === "abdominal") setAbdominal(val);
                        else if (fold.key === "midaxillary") setMidaxillary(val);
                        else if (fold.key === "chest") setChest(val);
                        else if (fold.key === "thigh") setThigh(val);
                      }}
                      className="bg-transparent border-none focus:ring-0 text-center font-bold text-xl w-full text-[#c3f400]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdjust(fold.key, 1)}
                    className="w-14 h-14 rounded-xl glass-card flex items-center justify-center text-white hover:bg-white/5 active:scale-90 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-surface via-surface/90 to-transparent z-40 flex justify-center">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full max-w-lg h-14 bg-[#c3f400] text-black rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl shadow-primary-fixed/20 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Finalizar Avaliação"}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>

      {/* SUCCESS DIALOG / SUMMARY */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1e2113] border border-white/10 rounded-2xl p-6 relative rim-light shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-[#c3f400]/10 text-[#c3f400] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Avaliação Finalizada!</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Composição corporal calculada através do Protocolo de Jackson & Pollock (7 Dobras).
            </p>

            <div className="glass-card rounded-xl p-5 mb-6 text-left space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Percentual de Gordura
                </span>
                <span className="text-xl font-extrabold text-[#c3f400]">
                  {successResult.evaluation.bodyFatPercent}%
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Massa Gorda Estimada
                </span>
                <span className="text-sm font-bold text-white">
                  {successResult.results.fatMass} kg
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Massa Magra Estimada
                </span>
                <span className="text-sm font-bold text-white">
                  {successResult.results.leanMass} kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Densidade Corporal
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {successResult.results.bodyDensity} g/cm³
                </span>
              </div>
            </div>

            {successResult.evaluation.isPublic && successResult.evaluation.publicToken && (
              <div className="mb-6">
                <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block mb-2 text-left">
                  Link de Compartilhamento Público
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/evaluation/share/${successResult.evaluation.publicToken}`}
                    className="flex-grow h-10 bg-surface border border-white/10 rounded-lg px-3 text-xs text-on-surface-variant select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/evaluation/share/${successResult.evaluation.publicToken}`
                      );
                      alert("Link copiado para a área de transferência!");
                    }}
                    className="h-10 bg-[#c3f400] text-black px-3 rounded-lg text-xs font-bold"
                  >
                    COPIAR
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (session) {
                  router.push("/dashboard");
                } else {
                  router.push("/");
                }
              }}
              className="w-full h-11 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/15 transition-all"
            >
              VOLTAR AO PAINEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-[#111508] text-[#e2e4cf] justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#c3f400] mb-2"></div>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest">Carregando...</p>
      </div>
    }>
      <NewEvaluationContent />
    </Suspense>
  );
}
