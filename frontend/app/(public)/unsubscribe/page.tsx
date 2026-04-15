"use client";

// Feature #90 — Página pública de descadastro (LGPD compliance)

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconMailOff, IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type UnsubState = "confirm" | "submitting" | "success" | "error";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}

function UnsubscribeContent() {
  const params = useSearchParams();
  const email = params.get("e") || "";
  const campaignId = params.get("cid") || "";
  const tenantId = params.get("tid") || "";

  const [state, setState] = useState<UnsubState>("confirm");
  const [reason, setReason] = useState("");

  async function handleUnsubscribe() {
    if (!email || !tenantId) {
      setState("error");
      return;
    }

    setState("submitting");

    try {
      const res = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tenant_id: tenantId,
          campaign_id: campaignId || null,
          reason: reason || null,
        }),
      });

      if (res.ok) {
        setState("success");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {state === "confirm" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <IconMailOff size={32} className="text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Descadastrar Email</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Você não receberá mais emails de marketing de{" "}
                  <strong>TBO</strong> no endereço:
                </p>
                <p className="mt-1 font-medium">{email || "—"}</p>
              </div>

              <div className="text-left space-y-2">
                <label className="text-sm text-muted-foreground">
                  Motivo (opcional)
                </label>
                <Textarea
                  placeholder="Conte-nos por que está saindo..."
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleUnsubscribe}
                  variant="destructive"
                  className="w-full"
                >
                  Confirmar Descadastro
                </Button>
                <p className="text-xs text-muted-foreground">
                  Você poderá se recadastrar a qualquer momento.
                </p>
              </div>
            </>
          )}

          {state === "submitting" && (
            <div className="py-8">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Processando...</p>
            </div>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <IconCheck size={32} className="text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Descadastrado</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>{email}</strong> foi removido da nossa lista de emails.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pode levar até 48h para todas as comunicações cessarem.
                </p>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <IconAlertTriangle size={32} className="text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Erro</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Não foi possível processar o descadastro. Tente novamente ou
                  entre em contato: <strong>contato@agenciatbo.com.br</strong>
                </p>
              </div>
              <Button variant="outline" onClick={() => setState("confirm")}>
                Tentar Novamente
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

