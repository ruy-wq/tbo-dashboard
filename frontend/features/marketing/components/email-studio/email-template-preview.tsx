"use client";

// Feature #90 — Preview de template de email antes de enviar

import { useState } from "react";
import { IconDeviceMobile, IconDeviceDesktop, IconEye } from "@tabler/icons-react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  htmlContent: string;
  subject: string;
  trigger?: React.ReactNode;
}

export function EmailTemplatePreview({ htmlContent, subject, trigger }: Props) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  const sanitized = sanitizeHtml(htmlContent);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-1.5">
            <IconEye size={14} />
            Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview: {subject}</span>
            <Tabs value={device} onValueChange={(v) => setDevice(v as "desktop" | "mobile")}>
              <TabsList className="h-8">
                <TabsTrigger value="desktop" className="h-6 gap-1 text-xs px-2">
                  <IconDeviceDesktop size={12} />
                  Desktop
                </TabsTrigger>
                <TabsTrigger value="mobile" className="h-6 gap-1 text-xs px-2">
                  <IconDeviceMobile size={12} />
                  Mobile
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto rounded-lg border bg-white">
          <div
            className="mx-auto transition-all duration-200"
            style={{
              maxWidth: device === "mobile" ? "375px" : "100%",
              padding: device === "mobile" ? "0" : "0",
            }}
          >
            {/* Email header simulado */}
            <div className="border-b bg-muted/20 px-4 py-3 text-xs space-y-1">
              <div className="flex gap-2">
                <span className="text-muted-foreground">De:</span>
                <span>TBO OS &lt;noreply@agenciatbo.com.br&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Assunto:</span>
                <span className="font-medium">{subject}</span>
              </div>
            </div>

            {/* Corpo do email */}
            <div
              className="p-4 text-sm"
              dangerouslySetInnerHTML={{ __html: sanitized }}
            />

            {/* Footer simulado (unsubscribe) */}
            <div className="border-t px-4 py-3 text-center text-[11px] text-muted-foreground">
              <a href="#" className="text-muted-foreground underline" onClick={(e) => e.preventDefault()}>
                Descadastrar deste email
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
