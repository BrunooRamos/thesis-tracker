"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al configurar");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f2f0ea]">
      {/* Warm gradient blobs */}
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
          {success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-sm font-semibold text-[#1a1c24] mb-1">
                ¡Listo!
              </h2>
              <p className="text-xs text-[#535766]">
                Contraseña configurada. Redirigiendo al login...
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-[#1a1c24] mb-1">
                Configurar contraseña
              </h2>
              <p className="text-xs text-[#535766] mb-5">
                Primera vez que entrás. Elegí tu contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[#535766] text-xs font-medium">
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="tu@correo.um.edu.uy"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 bg-[#f2f0ea]/60 border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] focus:ring-[#ff7c11]/20 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#535766] text-xs font-medium">
                    Nueva contraseña
                  </Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 bg-[#f2f0ea]/60 border-[#d3cfc6] text-[#383c48] placeholder:text-[#535766]/50 focus:border-[#ff7c11] focus:ring-[#ff7c11]/20 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#535766] text-xs font-medium">
                    Confirmar contraseña
                  </Label>
                  <Input
                    type="password"
                    placeholder="Repetí tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Configurar
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-5 pt-4 border-t border-[#d3cfc6]/40">
            <p className="text-xs text-[#535766] text-center">
              ¿Ya tenés contraseña?{" "}
              <Link
                href="/login"
                className="text-[#ff7c11] hover:text-[#9a4a00] font-medium transition-colors"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
