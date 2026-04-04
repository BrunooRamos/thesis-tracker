"use client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error, reset
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Algo salio mal</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "Ocurrio un error inesperado. Intenta de nuevo."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </Button>
          <Link href="/">
            <Button className="bg-[#ff7c11] hover:bg-[#ff9a3e] text-white gap-2">
              <Home className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
