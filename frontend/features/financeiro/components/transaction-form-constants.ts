export const BU_OPTIONS = [
  "Branding",
  "Digital 3D",
  "Marketing",
  "Audiovisual",
  "Interiores",
] as const;

export const STATUS_OPTIONS = [
  { value: "previsto", label: "Previsto" },
  { value: "provisionado", label: "Provisionado" },
  { value: "pago", label: "Pago" },
  { value: "liquidado", label: "Liquidado" },
  { value: "parcial", label: "Parcial" },
  { value: "atrasado", label: "Atrasado" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const PAYMENT_METHODS = [
  "PIX",
  "Boleto",
  "Cartao de Credito",
  "Cartao de Debito",
  "Transferencia",
  "Dinheiro",
  "Cheque",
] as const;
