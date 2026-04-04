"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Credenciales inválidas. ¿Ya configuraste tu contraseña?");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f2f0ea]">
      {/* Warm gradient blobs — Horizon style */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-[#ff7c11]/20 via-[#ff9a3e]/10 to-transparent blur-[60px]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#ff7c11]/10 via-[#dedad0]/30 to-transparent blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#1a1c24"/>
              <path d="M7 9h14M7 13h10M7 17h12" stroke="#ff7c11" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-xl font-semibold text-[#1a1c24] tracking-tight">
              horizon
            </span>
          </div>
          <p className="text-xs text-[#535766] tracking-wide">
            Thesis Tracker
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-[#d3cfc6]/60 shadow-sm p-7">
          <h2 className="text-sm font-semibold text-[#1a1c24] mb-5">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[#535766] text-xs font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.um.edu.uy"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-[#f2f0ea]/60 border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] focus:ring-[#ff7c11]/20 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#535766] text-xs font-medium">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-[#f2f0ea]/60 border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] focus:ring-[#ff7c11]/20 text-sm"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#ff7c11] hover:bg-[#ff9a3e] text-white font-medium text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#d3cfc6]/40">
            <p className="text-xs text-[#535766] text-center">
              ¿Primera vez?{" "}
              <Link
                href="/setup"
                className="text-[#ff7c11] hover:text-[#9a4a00] font-medium transition-colors"
              >
                Configurá tu contraseña
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[#535766]/50 text-[10px] mt-6 tracking-wide">
          Proyecto de Fin de Carrera · 2026
        </p>
      </div>
    </div>
  );
}
