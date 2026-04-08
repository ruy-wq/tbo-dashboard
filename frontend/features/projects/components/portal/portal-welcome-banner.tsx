"use client";

interface PortalWelcomeBannerProps {
  clientName: string | null;
  clientCompany?: string | null;
  projectName: string;
  accentColor?: string;
  onSearch?: (query: string) => void;
}

export function PortalWelcomeBanner({
  clientName,
  clientCompany,
  projectName,
  accentColor = "#c45a1a",
}: PortalWelcomeBannerProps) {
  // Prefer "Olá, equipe {Company}" over individual name
  const greeting = clientCompany
    ? `Ola, equipe ${clientCompany.replace(/\s*(incorporadora|construtora|empreendimentos|engenharia)\s*/gi, "").trim()}`
    : clientName
      ? `Ola, ${clientName}`
      : "Bem-vindo";
  return (
    <div
      className="relative overflow-hidden rounded-lg px-8 py-10"
      style={{ backgroundColor: "#1a1a1a" }}
    >
      {/* Accent line */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative z-10 pl-6">
        <span
          className="text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: accentColor }}
        >
          Portal do Cliente
        </span>
        <h1
          className="mt-3 text-3xl font-light tracking-tight text-white md:text-4xl"
          style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
        >
          {greeting}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Acompanhe o progresso de{" "}
          <span className="font-medium text-zinc-300">{projectName}</span>{" "}
          em tempo real
        </p>
      </div>
    </div>
  );
}
