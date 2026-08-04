"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy,
  Check,
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  createMcpTokenAction,
  renewMcpTokenAction,
  revokeMcpTokenAction,
  type McpTokenView,
} from "@/app/(app)/settings/mcp-actions";

const TTL_DAYS = 30;

function daysLeft(expiresAt: string): number {
  return Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );
}

function StatusBadge({ token }: { token: McpTokenView }) {
  if (token.revokedAt) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#e9e7df] text-[#535766] uppercase tracking-wider">
        Revocado
      </span>
    );
  }
  const days = daysLeft(token.expiresAt);
  if (days <= 0) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-600 uppercase tracking-wider">
        Vencido
      </span>
    );
  }
  if (days <= 7) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-100 text-amber-700 uppercase tracking-wider">
        Vence en {days}d
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-100 text-emerald-700 uppercase tracking-wider">
      Activo · {days}d
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 text-xs border-[#d3cfc6]"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="w-3 h-3 mr-1 text-emerald-600" />
      ) : (
        <Copy className="w-3 h-3 mr-1" />
      )}
      {label ?? (copied ? "Copiado" : "Copiar")}
    </Button>
  );
}

export function McpSection({ tokens: initialTokens }: { tokens: McpTokenView[] }) {
  const [tokens, setTokens] = useState(initialTokens);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Plaintext of a freshly created token; shown once, never persisted.
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const mcpUrl = `${origin || "https://<tu-dominio>"}/api/mcp`;
  const configSnippet = JSON.stringify(
    {
      mcpServers: {
        "thesis-tracker": {
          type: "http",
          url: mcpUrl,
          headers: { Authorization: "Bearer <TU_TOKEN>" },
        },
      },
    },
    null,
    2
  );

  async function handleCreate() {
    setCreating(true);
    try {
      const { token, record } = await createMcpTokenAction(newName || undefined);
      setTokens((t) => [record, ...t]);
      setFreshToken(token);
      setNewName("");
      setShowCreate(false);
      toast.success("Token creado. Copialo ahora: no se vuelve a mostrar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear token");
    } finally {
      setCreating(false);
    }
  }

  async function handleRenew(token: McpTokenView) {
    setBusyId(token.id);
    try {
      const updated = await renewMcpTokenAction(token.id);
      setTokens((t) => t.map((x) => (x.id === updated.id ? updated : x)));
      toast.success(`Renovado por ${TTL_DAYS} días más (mismo token)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al renovar");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevoke(token: McpTokenView) {
    if (
      !confirm(
        `Revocar el token ${token.tokenHint}? Los clientes que lo usen dejarán de funcionar.`
      )
    )
      return;
    setBusyId(token.id);
    try {
      const updated = await revokeMcpTokenAction(token.id);
      setTokens((t) => t.map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Token revocado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al revocar");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* CONNECTION INFO */}
      <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[#1a1c24]">Servidor MCP</h3>
        <p className="text-xs text-[#535766]">
          Conectá Claude, Cursor u otro cliente MCP al tracker. El endpoint usa
          Streamable HTTP con autenticación por token Bearer. Cada token dura{" "}
          {TTL_DAYS} días y podés renovarlo manualmente por {TTL_DAYS} días más
          sin que cambie el valor.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-[#f2f0ea]/70 border border-[#d3cfc6]/30 text-xs text-[#383c48] font-mono break-all">
            {mcpUrl}
          </code>
          <CopyButton text={mcpUrl} label="Copiar URL" />
        </div>
        <details className="group">
          <summary className="text-xs text-[#535766] cursor-pointer hover:text-[#ff7c11] transition-colors">
            Ver configuración de ejemplo para el cliente
          </summary>
          <div className="mt-2 relative">
            <pre className="p-3 rounded-lg bg-[#f2f0ea]/70 border border-[#d3cfc6]/30 text-[11px] text-[#383c48] font-mono overflow-x-auto">
              {configSnippet}
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={configSnippet} />
            </div>
          </div>
        </details>
      </div>

      {/* FRESH TOKEN REVEAL */}
      {freshToken && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-sm font-semibold">
              Copiá tu token ahora — no se vuelve a mostrar
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs text-[#383c48] font-mono break-all">
              {freshToken}
            </code>
            <CopyButton text={freshToken} />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-amber-300 text-amber-700"
            onClick={() => setFreshToken(null)}
          >
            Ya lo guardé
          </Button>
        </div>
      )}

      {/* TOKEN LIST */}
      <div className="rounded-2xl bg-white/60 border border-[#d3cfc6]/40 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#1a1c24]">
            Tokens de acceso
          </h3>
          <Button
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
            className="text-xs bg-[#ff7c11] hover:bg-[#ff9a3e] text-white"
          >
            <Plus className="w-3 h-3 mr-1" />
            Nuevo token
          </Button>
        </div>

        {showCreate && (
          <div className="flex items-end gap-2 p-3 rounded-xl bg-[#f2f0ea]/50 border border-[#d3cfc6]/30">
            <div className="space-y-1 flex-1">
              <Label className="text-[#535766] text-xs">Nombre (opcional)</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder='Ej: "Claude Code de Bruno"'
                className="h-9 bg-white border-[#d3cfc6] text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={creating}
              className="h-9 text-xs bg-[#ff7c11] text-white"
            >
              {creating ? "Creando…" : "Crear"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreate(false)}
              className="h-9 text-xs border-[#d3cfc6]"
            >
              ✕
            </Button>
          </div>
        )}

        {tokens.length === 0 ? (
          <p className="text-xs text-[#535766] py-2">
            Todavía no creaste ningún token.
          </p>
        ) : (
          <div className="space-y-2">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl border border-[#d3cfc6]/30 bg-white/40"
              >
                <KeyRound className="w-4 h-4 text-[#535766] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#1a1c24] truncate">
                      {token.name}
                    </p>
                    <code className="text-[10px] text-[#535766] font-mono">
                      {token.tokenHint}
                    </code>
                  </div>
                  <p className="text-[10px] text-[#535766]">
                    Creado {format(new Date(token.createdAt), "d/M/yyyy")} ·
                    Vence {format(new Date(token.expiresAt), "d/M/yyyy")}
                    {token.lastUsedAt &&
                      ` · Último uso ${format(new Date(token.lastUsedAt), "d/M/yyyy HH:mm")}`}
                  </p>
                </div>
                <StatusBadge token={token} />
                {!token.revokedAt && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRenew(token)}
                      disabled={busyId === token.id}
                      className="text-xs text-[#535766] hover:text-[#ff7c11]"
                      title={`Renovar ${TTL_DAYS} días (mismo token)`}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(token)}
                      disabled={busyId === token.id}
                      className="text-xs text-[#535766] hover:text-red-500"
                      title="Revocar token"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-[#535766] leading-relaxed">
          Los tokens se guardan hasheados (SHA-256): el valor completo solo se
          muestra al crearlo. Renovar extiende el vencimiento {TTL_DAYS} días
          sin cambiar el token. Revocar es inmediato e irreversible. Máximo 5
          tokens activos por usuario.
        </p>
      </div>
    </div>
  );
}
