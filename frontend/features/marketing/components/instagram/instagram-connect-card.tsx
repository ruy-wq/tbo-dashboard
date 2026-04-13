"use client";

import { useState } from "react";
import {
  IconBrandInstagram,
  IconBrandMeta,
  IconPlus,
  IconBuilding,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { getMetaOAuthUrl } from "../../services/instagram";

export function InstagramConnectCard() {
  const tenantId = useAuthStore((s) => s.tenantId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountType, setAccountType] = useState<"own" | "client">("own");
  const [clientName, setClientName] = useState("");

  function handleConnect() {
    if (!tenantId) return;
    const url = getMetaOAuthUrl(
      tenantId,
      accountType,
      accountType === "client" ? clientName : undefined
    );
    window.location.href = url;
  }

  return (
    <>
      <Card className="border-dashed border-2 hover:border-pink-400/40 transition-colors cursor-pointer group">
        <CardContent
          className="p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]"
          onClick={() => setDialogOpen(true)}
        >
          <div className="rounded-full p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 group-hover:from-purple-500/20 group-hover:to-pink-500/20 transition-colors">
            <IconBrandInstagram className="size-8 text-pink-500" />
          </div>
          <div>
            <p className="font-semibold text-sm">Conectar conta Instagram</p>
            <p className="text-xs text-muted-foreground mt-1">
              Via Meta Business API
            </p>
          </div>
          <IconPlus className="size-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBrandMeta className="size-5 text-blue-600" />
              Conectar Instagram via Meta
            </DialogTitle>
            <DialogDescription>
              Conecte contas Instagram Business para visualizar metricas,
              insights e gerenciar conteudo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Tipo de conta</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAccountType("own")}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                    accountType === "own"
                      ? "border-pink-500 bg-pink-500/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                >
                  <IconBrandInstagram
                    className={`size-4 ${accountType === "own" ? "text-pink-500" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-medium">TBO</p>
                    <p className="text-xs text-muted-foreground">
                      Conta propria
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setAccountType("client")}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                    accountType === "client"
                      ? "border-pink-500 bg-pink-500/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                >
                  <IconBuilding
                    className={`size-4 ${accountType === "client" ? "text-pink-500" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p className="font-medium">Cliente</p>
                    <p className="text-xs text-muted-foreground">
                      Conta de cliente
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {accountType === "client" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome do cliente</label>
                <Input
                  placeholder="Ex: Empresa ABC"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Como funciona:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Voce sera redirecionado para o Facebook</li>
                <li>Autorize o acesso as paginas com Instagram Business</li>
                <li>Todas as contas IG vinculadas serao importadas</li>
                <li>Os dados serao sincronizados automaticamente</li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConnect}
              disabled={accountType === "client" && !clientName.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <IconBrandMeta className="mr-1.5 size-4" />
              Conectar com Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
