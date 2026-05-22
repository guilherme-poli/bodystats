"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#111508] text-[#e2e4cf]">
      {/* Abstract Geometry Background Elements */}
      <div
        className="absolute top-20 right-0 w-96 h-96 bg-primary-fixed/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
        }}
      ></div>
      <div
        className="absolute bottom-40 left-0 w-64 h-64 bg-primary-fixed/5 rounded-full blur-[80px] pointer-events-none transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePos.x * 40}px, ${mousePos.y * 40}px)`,
        }}
      ></div>

      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-xl border-b border-white/10 docked full-width top-0 z-40 flex justify-between items-center w-full px-6 h-14 fixed">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-fixed">BodyStat Pro</span>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <Link
              href="/dashboard"
              className="text-xs font-bold px-4 py-2 bg-primary-container text-on-primary-container rounded-lg hover:scale-105 transition-all"
            >
              DASHBOARD
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2 border border-white/20 text-[#e2e4cf] rounded-lg hover:bg-white/5 transition-all"
            >
              LOGIN
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow pt-24 pb-32 px-6 hero-gradient flex items-center justify-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Hero Section */}
          <section className="mt-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full glass-card mb-6">
              <span className="w-2 h-2 rounded-full bg-primary-fixed animate-pulse"></span>
              <span className="text-xs font-semibold tracking-wider text-on-surface-variant uppercase">
                Protocolo Jackson & Pollock
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-2xl leading-tight tracking-tight">
              BodyStat Pro - Precisão em suas mãos
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant max-w-xl mx-auto mb-10 opacity-80 leading-relaxed">
              A ferramenta definitiva para personal trainers e atletas monitorarem a evolução corporal com o protocolo de 7 dobras de Jackson & Pollock.
            </p>

            {/* Hero Visual (Bento-like Preview) */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 max-w-3xl">
              <div className="md:col-span-2 h-48 rounded-xl glass-card overflow-hidden relative rim-light p-6 flex flex-col justify-end text-left group hover:border-primary-fixed/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <div className="relative z-20">
                  <span className="text-[10px] font-bold text-primary-fixed mb-1 block uppercase tracking-widest">
                    DASHBOARD DE EVOLUÇÃO
                  </span>
                  <h3 className="text-xl font-bold text-white">Análise de Composição Corporal</h3>
                </div>
              </div>
              <div className="h-48 rounded-xl glass-card rim-light p-6 flex flex-col items-center justify-center gap-3 hover:border-primary-fixed/30 transition-all duration-300">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      className="text-surface-container-high"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="6"
                    ></circle>
                    <circle
                      className="text-primary-fixed"
                      cx="48"
                      cy="48"
                      fill="transparent"
                      r="40"
                      stroke="#c3f400"
                      strokeDasharray="251.2"
                      strokeDashoffset="75.3"
                      strokeWidth="6"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-white leading-none">14.2%</span>
                    <span className="text-[9px] text-on-surface-variant font-semibold">BF</span>
                  </div>
                </div>
                <span className="text-xs text-[#e2e4cf] text-center font-medium">Zona Ótima</span>
              </div>
            </div>
          </section>

          {/* Action Zone */}
          <section className="w-full max-w-sm flex flex-col gap-4 mt-4 px-6">
            <Link
              href="/evaluation/new"
              className="bg-primary-container text-on-primary-container h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary-fixed/10"
            >
              Começar Avaliação Rápida
              <span className="material-symbols-outlined text-base">bolt</span>
            </Link>
            {!session && (
              <>
                <Link
                  href="/login?role=PERSONAL_TRAINER"
                  className="border border-white/20 text-white h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 glass-card transition-all duration-200 hover:scale-[1.02] active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  Área do Personal Trainer
                </Link>
                <Link
                  href="/login?role=ALUNO"
                  className="text-xs text-on-surface-variant hover:text-primary-fixed transition-colors py-2 uppercase tracking-widest text-center font-bold"
                >
                  Acessar como Aluno
                </Link>
              </>
            )}
            {session && (
              <Link
                href="/dashboard"
                className="border border-white/20 text-white h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 glass-card transition-all duration-200 hover:scale-[1.02] active:scale-95"
              >
                Ir para o Dashboard
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            )}
          </section>
        </div>
      </main>

      {/* Bottom Footer / Info */}
      <footer className="w-full text-center py-6 text-[10px] text-on-surface-variant uppercase tracking-widest border-t border-white/5 bg-surface/40 backdrop-blur-md">
        © 2026 BodyStat Pro • Protocolo Jackson & Pollock 7 Dobras
      </footer>
    </div>
  );
}
