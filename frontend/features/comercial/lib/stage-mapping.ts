/**
 * Maps an RD Station pipeline stage name to the internal CRM stage key.
 * Falls back to "lead" when no match is found.
 */
export function mapStageToInternal(stageName: string): string {
  const normalized = stageName.toLowerCase().trim();
  const map: Record<string, string> = {
    qualificação: "qualificacao",
    qualificacao: "qualificacao",
    proposta: "proposta",
    negociação: "negociacao",
    negociacao: "negociacao",
    fechamento: "negociacao",
    ganho: "fechado_ganho",
    "fechado ganho": "fechado_ganho",
    perdido: "fechado_perdido",
    "fechado perdido": "fechado_perdido",
    prospecção: "lead",
    prospeccao: "lead",
    "contato inicial": "lead",
  };
  for (const [key, value] of Object.entries(map)) {
    if (normalized.includes(key)) return value;
  }
  return "lead";
}
