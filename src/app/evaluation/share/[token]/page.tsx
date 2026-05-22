"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Student {
  name: string;
  email: string;
}

interface Trainer {
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
  aluno?: Student | null;
  trainer?: Trainer | null;
}

export default function PublicSharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicEvaluation = async () => {
      try {
        const res = await fetch(`/api/evaluations/public?token=${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Avaliação não encontrada.");
        }
        setEvaluation(data);
      } catch (err: any) {
        setError(err.message || "Erro de conexão.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPublicEvaluation();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#111508] items-center justify-center text-[#e2e4cf]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c3f400] mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest font-bold">Carregando relatório público...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="flex min-h-screen bg-[#111508] items-center justify-center text-[#e2e4cf] px-6">
        <div className="text-center max-w-md glass-card rounded-2xl p-8 border border-white/10 rim-light">
          <div className="w-16 h-16 bg-red-950/40 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Relatório Indisponível</h2>
          <p className="text-xs text-on-surface-variant mb-6">
            {error || "Esta avaliação não foi encontrada ou não está compartilhada publicamente."}
          </p>
          <Link
            href="/"
            className="w-full h-11 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/15 transition-all flex items-center justify-center"
          >
            IR PARA O INÍCIO
          </Link>
        </div>
      </div>
    );
  }

  // Compositions math
  const weight = evaluation.weight;
  const bf = evaluation.bodyFatPercent;
  const leanPercent = 100 - bf;
  const fatMass = parseFloat(((weight * bf) / 100).toFixed(1));
  const leanMass = parseFloat((weight - fatMass).toFixed(1));

  const clientName = evaluation.aluno ? evaluation.aluno.name : "Visitante / Anônimo";
  const trainerName = evaluation.trainer ? evaluation.trainer.name : "BodyStat Pro AI Engine";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#111508] text-[#e2e4cf] pb-24">
      {/* Header section */}
      <header className="w-full pt-12 pb-8 px-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col items-start gap-2">
          <span className="text-[10px] font-bold text-[#c3f400] uppercase tracking-widest">
            RELATÓRIO DE COMPOSIÇÃO CORPORAL
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            {clientName}
          </h1>
          <div className="h-1 w-24 bg-[#c3f400] rounded-full mt-1"></div>
          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mt-2">
            Avaliado em: {formatDate(evaluation.createdAt)}
          </p>
        </div>
      </header>

      {/* Main Grid */}
      <main className="px-6 max-w-[1200px] mx-auto w-full space-y-6">
        {/* Statistics highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group rim-light">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#c3f400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Gordura Corporal
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl md:text-6xl font-extrabold text-white leading-none">
                  {bf}%
                </span>
                <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                  Fórmula Siri
                </span>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Massa Magra ({leanPercent.toFixed(1)}%)</span>
                <span>Massa Gorda ({bf.toFixed(1)}%)</span>
              </div>
              <div className="h-3 bg-white/5 rounded-full overflow-hidden flex">
                <div className="h-full bg-[#c3f400]" style={{ width: `${leanPercent}%` }}></div>
                <div className="h-full bg-white/20" style={{ width: `${bf}%` }}></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 flex items-center justify-between rim-light">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Peso Atual
                </p>
                <p className="text-2xl font-bold text-white">
                  {weight} <span className="text-xs font-normal text-on-surface-variant uppercase">kg</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center justify-between rim-light">
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
                  Massa Magra
                </p>
                <p className="text-2xl font-bold text-white">
                  {leanMass} <span className="text-xs font-normal text-on-surface-variant uppercase">kg</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Pollock 7 Dobras Detail Table */}
        <section className="glass-card rounded-2xl overflow-hidden rim-light">
          <div className="p-6 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">
              Dobras Cutâneas (Protocolo Jackson & Pollock)
            </h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
              Medições em Milímetros (mm)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 uppercase tracking-wider text-on-surface-variant font-bold">
                  <th className="px-6 py-4">Local da Medida</th>
                  <th className="px-6 py-4 text-right">Espessura (mm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { label: "Peitoral", val: evaluation.chest },
                  { label: "Axilar Média", val: evaluation.midaxillary },
                  { label: "Tríceps", val: evaluation.triceps },
                  { label: "Subescapular", val: evaluation.subscapular },
                  { label: "Abdominal", val: evaluation.abdominal },
                  { label: "Supra-ilíaca", val: evaluation.suprailiac },
                  { label: "Coxa", val: evaluation.thigh },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-white">{row.label}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#c3f400]">{row.val} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Info card describing the protocol */}
        <section className="glass-card p-6 rounded-2xl rim-light border border-white/5">
          <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wider">
            Informações sobre o Protocolo
          </h4>
          <p className="text-xs text-on-surface-variant leading-relaxed opacity-85">
            O protocolo de Jackson & Pollock de 7 dobras cutâneas é um método cinantropométrico validado cientificamente para estimar a densidade corporal. O cálculo utiliza a soma das espessuras das dobras do tríceps, subescapular, supra-ilíaca, abdominal, axilar média, peitoral e coxa. Posteriormente, a percentagem de gordura corporal (%BF) é obtida através da equação matemática de Siri: %BF = (4.95 / Densidade - 4.5) * 100.
          </p>
        </section>

        {/* Footer */}
        <footer className="w-full py-12 text-center border-t border-white/5">
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              Avaliação realizada por: <span className="text-[#c3f400]">{trainerName}</span>
            </span>
            <p className="text-[9px] text-on-surface-variant/40">
              © 2026 BodyStat Pro • Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
