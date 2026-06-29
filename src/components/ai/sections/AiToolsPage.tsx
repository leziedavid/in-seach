"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { listAiTools, executeAiTool, AiToolSummary } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page de test des AI Tools (MCP). Liste les tools enregistrés côté backend
 * (ai-mcp/services/ai-tool-registry.service.ts) et permet d'en exécuter un
 * avec des paramètres JSON libres, pour vérifier rapidement qu'un tool
 * fonctionne avant de le brancher sur un client MCP externe.
 */
export default function AiToolsPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.ai.tools,
    queryFn: async () => (await listAiTools()).data ?? [],
  });

  const [selected, setSelected] = useState<AiToolSummary | null>(null);
  const [inputText, setInputText] = useState("{}");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ output: any; durationMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectTool = (tool: AiToolSummary) => {
    setSelected(tool);
    setInputText("{}");
    setResult(null);
    setError(null);
  };

  const runTool = async () => {
    if (!selected) return;
    let parsedInput: Record<string, any>;
    try {
      parsedInput = JSON.parse(inputText || "{}");
    } catch {
      toast.error("Le JSON saisi est invalide.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await executeAiTool(selected.name, parsedInput);
      if (response.statusCode >= 400) throw new Error(response.message);
      setResult({ output: response.data?.result, durationMs: response.data?.durationMs ?? 0 });
      toast.success("Tool exécuté avec succès");
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'exécution du tool.");
      toast.error("Échec de l'exécution du tool");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      {/* Liste des tools */}
      <Card className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-2">
          AI Tools disponibles
        </p>
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {(data ?? []).map((tool) => (
              <button
                key={tool.name}
                onClick={() => selectTool(tool)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  selected?.name === tool.name
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted text-foreground/80"
                }`}
              >
                {tool.name}
              </button>
            ))}
            {(data ?? []).length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-4">Aucun tool enregistré.</p>
            )}
          </div>
        )}
      </Card>

      {/* Panneau de test */}
      <Card className="p-5">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 text-muted-foreground">
            <Icon icon="solar:widget-bold-duotone" width={32} className="mb-2" />
            <p className="text-sm">Sélectionnez un tool à gauche pour le tester.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">{selected.name}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{selected.description}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Rôles autorisés : {Array.isArray(selected.allowedRoles) ? selected.allowedRoles.join(", ") : "Tous"}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Paramètres (JSON)
                </label>
                <button
                  onClick={() => setInputText(JSON.stringify(selected.inputSchema?.properties ?? {}, null, 2))}
                  className="text-[11px] text-primary hover:underline"
                >
                  Voir le schéma
                </button>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                className="w-full font-mono text-xs p-3 rounded-lg border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <Button onClick={runTool} disabled={isRunning} className="w-full">
              {isRunning ? (
                <Icon icon="solar:refresh-bold-duotone" className="animate-spin" width={18} />
              ) : (
                <Icon icon="solar:play-bold-duotone" width={18} />
              )}
              Exécuter
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-600 text-sm">{error}</div>
            )}

            {result && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Résultat
                  </label>
                  <span className="text-[11px] text-muted-foreground">{result.durationMs} ms</span>
                </div>
                <pre className="w-full max-h-96 overflow-auto font-mono text-xs p-3 rounded-lg border border-border bg-muted/30">
                  {JSON.stringify(result.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
