"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "PERSONAL_TRAINER";
  const authError = searchParams.get("error");

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<string>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authError) {
      if (authError === "OAuthSignin" || authError === "OAuthCallback") {
        setError("Erro na autenticação com o Google. Tente novamente.");
      } else if (authError === "CredentialsSignin") {
        setError("Credenciais inválidas. Verifique seu e-mail e senha.");
      } else {
        setError("Ocorreu um erro ao fazer login.");
      }
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!email || !password || (isRegister && !name)) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        // Register API Call
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Ocorreu um erro no cadastro.");
        }

        setSuccess("Cadastro realizado com sucesso! Faça login para continuar.");
        setIsRegister(false);
        setPassword("");
      } else {
        // Login flow
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError(result.error === "CredentialsSignin" 
            ? "Credenciais incorretas. Tente novamente." 
            : result.error);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-[#111508] text-[#e2e4cf] justify-center items-center px-6">
      {/* Background blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-fixed/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary-fixed/5 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="absolute top-0 left-0 w-full px-6 h-14 flex items-center justify-between border-b border-white/10 bg-surface/85 backdrop-blur-md z-30">
        <Link href="/" className="text-xl font-bold text-[#c3f400] flex items-center gap-2">
          <span>BodyStat Pro</span>
        </Link>
        <Link href="/" className="text-xs font-bold text-on-surface-variant hover:text-white transition-colors">
          VOLTAR
        </Link>
      </header>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 relative z-10 rim-light shadow-2xl mt-14 mb-8">
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {isRegister ? "Criar nova conta" : "Acesse sua conta"}
        </h2>
        <p className="text-xs text-on-surface-variant text-center mb-6">
          {isRegister 
            ? "Cadastre-se para começar a gerenciar avaliações físicas" 
            : "Entre para visualizar e monitorar composição corporal"}
        </p>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl p-3 text-xs mb-4 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-xl p-3 text-xs mb-4 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">
                Nome Completo
              </label>
              <input
                type="text"
                placeholder="Ex: Treinador Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 bg-surface-container border border-white/10 rounded-xl px-4 text-sm text-[#e2e4cf] focus:border-[#c3f400] focus:outline-none transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">
              E-mail
            </label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 bg-surface-container border border-white/10 rounded-xl px-4 text-sm text-[#e2e4cf] focus:border-[#c3f400] focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1 block">
              Senha
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 bg-surface-container border border-white/10 rounded-xl px-4 text-sm text-[#e2e4cf] focus:border-[#c3f400] focus:outline-none transition-all"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
                Tipo de Perfil
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("PERSONAL_TRAINER")}
                  className={`h-10 rounded-xl text-xs font-bold transition-all border ${
                    role === "PERSONAL_TRAINER"
                      ? "bg-primary-container text-on-primary-container border-primary-container"
                      : "border-white/10 text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  Personal Trainer
                </button>
                <button
                  type="button"
                  onClick={() => setRole("ALUNO")}
                  className={`h-10 rounded-xl text-xs font-bold transition-all border ${
                    role === "ALUNO"
                      ? "bg-primary-container text-on-primary-container border-primary-container"
                      : "border-white/10 text-on-surface-variant hover:bg-white/5"
                  }`}
                >
                  Aluno
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary-container text-on-primary-container rounded-xl text-sm font-bold mt-2 hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? "Processando..." : isRegister ? "Registrar" : "Entrar com E-mail"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="text-[10px] font-bold text-on-surface-variant px-3 uppercase tracking-widest">OU</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full h-11 border border-white/20 hover:bg-white/5 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all active:scale-98"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
          Entrar com o Google
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
              setSuccess(null);
            }}
            className="text-xs text-[#c3f400] hover:underline bg-transparent border-none cursor-pointer"
          >
            {isRegister 
              ? "Já possui uma conta? Faça Login" 
              : "Não tem uma conta? Cadastre-se"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-[#111508] text-[#e2e4cf] justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#c3f400] mb-2"></div>
        <p className="text-xs text-on-surface-variant uppercase tracking-widest">Carregando...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
