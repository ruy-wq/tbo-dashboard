import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatório de Redes Sociais · TBO",
  description: "Relatório de desempenho de redes sociais gerado pela TBO.",
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 11px;
          }
          /* Evitar quebra dentro de cards e seções */
          section, [class*="Card"], table, tr, .rounded-lg {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Esconder elementos interativos */
          .print\\:hidden, button, [role="button"] {
            display: none !important;
          }
          /* Garantir fundo branco */
          * {
            background-color: white !important;
            box-shadow: none !important;
          }
          /* Manter cores de borda e texto */
          [class*="border-emerald"], [class*="border-orange"] {
            border-color: inherit !important;
          }
          /* Barras de progresso mantêm cor */
          [class*="bg-primary"], [class*="bg-orange"], [class*="bg-blue"], [class*="bg-emerald"] {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
