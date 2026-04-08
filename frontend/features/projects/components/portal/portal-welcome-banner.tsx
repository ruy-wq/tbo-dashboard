"use client";

interface PortalWelcomeBannerProps {
  clientName: string | null;
  projectName: string;
  accentColor?: string;
  onSearch?: (query: string) => void;
}

export function PortalWelcomeBanner({
  clientName,
  projectName,
  accentColor = "#c45a1a",
}: PortalWelcomeBannerProps) {
  return (
    <div
      className="relative overflow-hidden px-8 py-10"
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
          {clientName ? `Ola, ${clientName}` : "Bem-vindo"}
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
