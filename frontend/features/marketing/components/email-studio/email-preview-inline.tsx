"use client";

import { useMemo, useState } from "react";
import { IconDeviceMobile, IconDeviceDesktop } from "@tabler/icons-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface EmailMergeVars {
  FNAME?: string;
  COMPANY?: string;
  EMAIL?: string;
}

interface Props {
  htmlContent: string;
  subject: string;
  /** Valores para merge tags no formato Mailchimp *|TAG|*. Se omitido, usa valores de exemplo. */
  mergeVars?: EmailMergeVars;
  /** Altura máxima do preview (default 500px) */
  maxHeight?: number;
}

const DEFAULT_VARS: Required<EmailMergeVars> = {
  FNAME: "Maria",
  COMPANY: "Construtora Exemplo",
  EMAIL: "exemplo@incorporadora.com.br",
};

function applyMergeTags(html: string, vars: Required<EmailMergeVars>): string {
  return html
    .replace(/\*\|\s*FNAME\s*\|\*/g, vars.FNAME || "")
    .replace(/\*\|\s*COMPANY\s*\|\*/g, vars.COMPANY || "")
    .replace(/\*\|\s*EMAIL\s*\|\*/g, vars.EMAIL || "");
}

export function EmailPreviewInline({
  htmlContent,
  subject,
  mergeVars,
  maxHeight = 500,
}: Props) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const resolved = useMemo(() => {
    const vars: Required<EmailMergeVars> = {
      FNAME: mergeVars?.FNAME?.trim() || DEFAULT_VARS.FNAME,
      COMPANY: mergeVars?.COMPANY?.trim() || DEFAULT_VARS.COMPANY,
      EMAIL: mergeVars?.EMAIL?.trim() || DEFAULT_VARS.EMAIL,
    };
    return {
      subject: applyMergeTags(subject, vars),
      html: applyMergeTags(htmlContent, vars),
      vars,
    };
  }, [htmlContent, subject, mergeVars]);

  const hasMockData = !mergeVars?.FNAME && !mergeVars?.COMPANY;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {hasMockData ? (
            <>
              Dados de exemplo:{" "}
              <code className="text-[11px]">{resolved.vars.FNAME}</code> /{" "}
              <code className="text-[11px]">{resolved.vars.COMPANY}</code>
            </>
          ) : (
            <>
              Preview com:{" "}
              <code className="text-[11px]">{resolved.vars.FNAME}</code> ·{" "}
              <code className="text-[11px]">{resolved.vars.COMPANY}</code>
            </>
          )}
        </div>
        <Tabs value={device} onValueChange={(v) => setDevice(v as "desktop" | "mobile")}>
          <TabsList className="h-7">
            <TabsTrigger value="desktop" className="h-5 gap-1 text-[11px] px-2">
              <IconDeviceDesktop size={11} />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="h-5 gap-1 text-[11px] px-2">
              <IconDeviceMobile size={11} />
              Mobile
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-md border border-border overflow-hidden bg-white dark:bg-zinc-900">
        {/* Header simulando client de email */}
        <div className="border-b border-border bg-muted/40 px-3 py-2 text-[11px] space-y-0.5">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-14 shrink-0">De:</span>
            <span className="font-mono">TBO &lt;contato@agenciatbo.com.br&gt;</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-14 shrink-0">Para:</span>
            <span className="font-mono">{resolved.vars.EMAIL}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-14 shrink-0">Assunto:</span>
            <span className="font-medium">{resolved.subject}</span>
          </div>
        </div>

        {/* Iframe sandbox — isola CSS do email do app */}
        <div
          className="bg-zinc-100 dark:bg-zinc-950 p-3 overflow-auto"
          style={{ maxHeight: `${maxHeight}px` }}
        >
          <div
            className="mx-auto bg-white shadow-sm transition-all"
            style={{ maxWidth: device === "mobile" ? "375px" : "640px" }}
          >
            <iframe
              srcDoc={resolved.html}
              sandbox=""
              title={`Preview: ${resolved.subject}`}
              className="w-full border-0"
              style={{ minHeight: `${maxHeight - 40}px` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
