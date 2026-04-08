import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatorio de Redes Sociais · TBO",
  description: "Relatorio de desempenho de redes sociais gerado pela TBO.",
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
