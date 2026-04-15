"use client";

import { useEffect } from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createLogger } from "@/lib/logger";

const log = createLogger("financeiro:recorrentes");

export default function RecorrentesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error("Erro em regras recorrentes", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <div className="rounded-full bg-red-500/10 p-3">
            <IconAlertTriangle className="size-6 text-red-500" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-lg font-semibold">Algo deu errado</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "Erro ao carregar regras recorrentes."}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground font-mono">
                Codigo: {error.digest}
              </p>
            )}
          </div>
          <Button onClick={reset} variant="outline" size="sm">
            <IconRefresh className="size-3.5 mr-1.5" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
