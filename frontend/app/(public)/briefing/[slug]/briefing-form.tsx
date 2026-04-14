"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* ─────────── Types ─────────── */
interface BriefingFormProps {
  slug: string;
  clientName: string;
  projectSlug: string;
  projectName: string;
  existingData?: Record<string, unknown>;
  briefingId?: string;
}

type FormValues = Record<string, string | boolean>;

/* ─────────── Component ─────────── */
export function BriefingForm({
  slug,
  clientName,
  projectSlug,
  projectName,
  existingData,
  briefingId,
}: BriefingFormProps) {
  const [current, setCurrent] = useState(0);
  const [values, setValues] = useState<FormValues>(() => {
    if (existingData && typeof existingData === "object") {
      const v: FormValues = {};
      for (const [k, val] of Object.entries(existingData)) {
        if (k !== "_meta") v[k] = val as string | boolean;
      }
      return v;
    }
    return {};
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const currentBriefingId = useRef(briefingId);

  const displayName = projectName
    ? `${clientName} — ${projectName}`
    : clientName;

  // ── Auto-save (debounced) ──
  const autoSave = useCallback(async () => {
    try {
      await fetch("/api/briefing/submit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          clientName,
          projectSlug,
          projectName,
          formData: values,
          briefingId: currentBriefingId.current,
        }),
      });
    } catch {
      // Silencioso — autosave não deve interromper o usuário
    }
  }, [slug, clientName, projectSlug, projectName, values]);

  useEffect(() => {
    if (Object.keys(values).length === 0) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(autoSave, 2000);
    return () => clearTimeout(saveTimer.current);
  }, [values, autoSave]);

  // ── Field handlers ──
  const set = (name: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const v = (name: string) => (values[name] as string) || "";
  // ── Navigation ──
  const go = (n: number) => {
    setCurrent(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Navigation without mandatory validation (free-flow) ──
  const validateAndGo = (_fromSection: number, toSection: number) => {
    go(toSection);
  };

  const progress =
    current === 0 ? 0 : current >= 7 ? 100 : Math.round((current / 6) * 100);

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/briefing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          clientName,
          projectSlug,
          projectName,
          formData: values,
          briefingId: currentBriefingId.current,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao enviar");
      }

      setSubmitted(true);
      go(7);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar briefing",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#09090b] text-zinc-300">
      {/* ── Background orbs ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#09090b]" />
        <div className="absolute left-[30%] top-[5%] h-[72vh] w-[58vw] animate-[orbit1_8s_cubic-bezier(0.4,0,0.2,1)_infinite] rounded-full bg-[radial-gradient(circle,rgba(220,100,30,0.95)_0%,rgba(200,75,15,0.4)_45%,transparent_70%)] blur-[50px]" />
        <div className="absolute right-[-10%] top-[-10%] h-[52vh] w-[46vw] animate-[orbit2_11s_cubic-bezier(0.4,0,0.2,1)_infinite] rounded-full bg-[radial-gradient(circle,rgba(240,228,210,0.8)_0%,rgba(220,200,170,0.2)_45%,transparent_65%)] blur-[50px]" />
        <div className="absolute bottom-[-12%] left-0 h-[58vh] w-[65vw] animate-[orbit3_9s_cubic-bezier(0.4,0,0.2,1)_infinite] rounded-full bg-[radial-gradient(circle,rgba(55,20,28,0.9)_0%,rgba(70,30,35,0.25)_50%,transparent_70%)] blur-[50px]" />
        <div className="absolute right-0 top-[25%] h-[46vh] w-[39vw] animate-[orbit4_7s_cubic-bezier(0.4,0,0.2,1)_infinite] rounded-full bg-[radial-gradient(circle,rgba(180,70,15,0.7)_0%,rgba(150,55,10,0.15)_50%,transparent_70%)] blur-[50px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_50%,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.35)_70%,rgba(0,0,0,0.25)_100%)]" />
      </div>

      {/* ── Progress bar ── */}
      <div className="fixed left-0 top-0 z-50 h-[3px] w-full">
        <div
          className="h-full bg-gradient-to-r from-[#E85102] to-[#EC7602] transition-[width] duration-400 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ── Main ── */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-6">
        <div className="mb-8">
          <span className="text-[32px] font-bold uppercase tracking-[8px] text-white">
            TBO
          </span>
        </div>

        <div className="w-full max-w-[520px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur-md md:p-8">
          {/* ── View 0: Intro ── */}
          <View active={current === 0}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[2.5px] text-[#E85102]">
              Briefing Criativo
            </p>
            <h1 className="mb-5 text-[28px] font-bold leading-tight text-white">
              Queremos entender o seu
              <br />
              empreendimento a fundo.
            </h1>
            <p className="mb-3 text-[15px] leading-relaxed text-zinc-300">
              Este briefing direciona toda a produção criativa da TBO para o seu
              projeto. Quanto mais detalhes, mais assertivo será o resultado.
            </p>
            <p className="mb-3 text-[13px] leading-relaxed text-zinc-400">
              Suas respostas são salvas automaticamente. Você pode fechar e
              voltar a qualquer momento.
            </p>
            <div className="my-5 flex items-start gap-3 rounded-xl bg-zinc-800/60 p-4">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#E85102]/15">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#E85102"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-[13px] leading-relaxed text-zinc-300">
                Link exclusivo para{" "}
                <strong className="text-white">{displayName}</strong>. O briefing
                será vinculado diretamente ao projeto.
              </p>
            </div>
            <div className="my-5 h-px bg-zinc-800" />
            <button className="btn-primary" onClick={() => go(1)}>
              Começar briefing
            </button>
            <div className="mt-4 flex items-center justify-center gap-2.5 text-xs text-zinc-500">
              <span>6 seções</span>
              <span className="text-zinc-700">&middot;</span>
              <span>~12 min</span>
              <span className="text-zinc-700">&middot;</span>
              <span>Salva automaticamente</span>
            </div>
          </View>

          {/* ── View 1: Dados do Empreendimento ── */}
          <View active={current === 1}>
            <SectionHeader num={1} title="Dados do Empreendimento" />
            <Field
              label="Nome do Empreendimento"
              required
              value={v("nome_empreendimento")}
              onChange={(val) => set("nome_empreendimento", val)}
              placeholder="Ex: Residencial Horizon"
            />
            <Field
              label="Incorporadora"
              required
              value={v("incorporadora")}
              onChange={(val) => set("incorporadora", val)}
              placeholder="Nome da incorporadora"
            />
            <Field
              label="Endereço completo"
              value={v("endereco")}
              onChange={(val) => set("endereco", val)}
              placeholder="Rua, número"
            />
            <FieldRow>
              <Field
                label="Bairro / Cidade / UF"
                value={v("bairro_cidade")}
                onChange={(val) => set("bairro_cidade", val)}
                placeholder="Batel, Curitiba/PR"
              />
              <SelectField
                label="Padrão"
                required
                value={v("padrao")}
                onChange={(val) => set("padrao", val)}
                options={[
                  { value: "", label: "Selecione..." },
                  { value: "popular", label: "Popular" },
                  { value: "medio", label: "Médio" },
                  { value: "alto", label: "Alto padrão" },
                  { value: "luxo", label: "Luxo" },
                ]}
              />
            </FieldRow>
            <FieldRow>
              <Field
                label="Número de torres"
                value={v("num_torres")}
                onChange={(val) => set("num_torres", val)}
                placeholder="Ex: 2"
              />
              <Field
                label="Total de unidades"
                required
                value={v("total_unidades")}
                onChange={(val) => set("total_unidades", val)}
                placeholder="Ex: 120"
              />
            </FieldRow>
            <Field
              label="Tipologias"
              required
              hint="Ex: 2Q, 3Q, cobertura"
              value={v("tipologias")}
              onChange={(val) => set("tipologias", val)}
              placeholder="Tipos de unidade"
            />
            <FieldRow>
              <Field
                label="Área privativa (de - até)"
                value={v("area_privativa")}
                onChange={(val) => set("area_privativa", val)}
                placeholder="65m² a 180m²"
              />
              <Field
                label="Previsão de lançamento"
                value={v("previsao_lancamento")}
                onChange={(val) => set("previsao_lancamento", val)}
                placeholder="Mar/2026"
              />
            </FieldRow>
            <Field
              label="VGV estimado (R$)"
              value={v("vgv")}
              onChange={(val) => set("vgv", val)}
              placeholder="R$ 80.000.000"
            />
            <NavRow onBack={() => go(0)} onNext={() => validateAndGo(1, 2)} />
          </View>

          {/* ── View 2: Público-Alvo ── */}
          <View active={current === 2}>
            <SectionHeader num={2} title="Público-Alvo" />
            <TextareaField
              label="Persona principal"
              required
              hint="Quem compra: idade, renda, fase da vida, motivação"
              value={v("persona_principal")}
              onChange={(val) => set("persona_principal", val)}
              placeholder="Descreva o comprador ideal..."
            />
            <TextareaField
              label="Persona secundária"
              hint="Quem influencia: cônjuge, pais, corretor"
              value={v("persona_secundaria")}
              onChange={(val) => set("persona_secundaria", val)}
              placeholder="Quem influencia a decisão?"
            />
            <Field
              label="Faixa de renda"
              value={v("faixa_renda")}
              onChange={(val) => set("faixa_renda", val)}
              placeholder="R$ 15.000 a R$ 30.000/mês"
            />
            <Field
              label="Motivação de compra"
              required
              hint="Moradia própria, investimento, upgrade"
              value={v("motivacao_compra")}
              onChange={(val) => set("motivacao_compra", val)}
              placeholder="Principal razão para comprar"
            />
            <Field
              label="O que mais valoriza"
              required
              hint="Localização? Lazer? Acabamento? Preço?"
              value={v("mais_valoriza")}
              onChange={(val) => set("mais_valoriza", val)}
              placeholder="Top 3 atributos"
            />
            <Field
              label="Maior medo / objeção"
              hint="Atraso? Preço? Construtora desconhecida?"
              value={v("medo_objecao")}
              onChange={(val) => set("medo_objecao", val)}
              placeholder="Principal barreira de compra"
            />
            <NavRow onBack={() => go(1)} onNext={() => validateAndGo(2, 3)} />
          </View>

          {/* ── View 3: O Produto ── */}
          <View active={current === 3}>
            <SectionHeader num={3} title="O Produto" />
            <TextareaField
              label="Principal diferencial competitivo"
              required
              hint="O que este empreendimento tem que os outros não têm?"
              value={v("diferencial_principal")}
              onChange={(val) => set("diferencial_principal", val)}
              placeholder="O que torna este empreendimento único..."
            />
            <TextareaField
              label="Diferenciais técnicos"
              hint="Estrutura, tecnologia construtiva, eficiência energética"
              value={v("diferenciais_tecnicos")}
              onChange={(val) => set("diferenciais_tecnicos", val)}
              placeholder="Aspectos construtivos relevantes"
            />
            <TextareaField
              label="Diferenciais de lazer"
              value={v("diferenciais_lazer")}
              onChange={(val) => set("diferenciais_lazer", val)}
              placeholder="Áreas de lazer destaque"
            />
            <TextareaField
              label="Diferenciais de localização"
              value={v("diferenciais_localizacao")}
              onChange={(val) => set("diferenciais_localizacao", val)}
              placeholder="O que o entorno agrega"
            />
            <TextareaField
              label="Concorrentes diretos"
              hint="Nome + bairro"
              value={v("concorrentes")}
              onChange={(val) => set("concorrentes", val)}
              placeholder="Empreendimentos concorrentes"
            />
            <Field
              label="Posicionamento vs concorrência"
              value={v("posicionamento")}
              onChange={(val) => set("posicionamento", val)}
              placeholder="Mais barato? Melhor localizado? Premium?"
            />
            <NavRow onBack={() => go(2)} onNext={() => validateAndGo(3, 4)} />
          </View>

          {/* ── View 4: Direção Criativa ── */}
          <View active={current === 4}>
            <SectionHeader num={4} title="Direção Criativa" />
            <Field
              label="Conceito / mote"
              hint="Frase-conceito que resume a essência"
              value={v("conceito")}
              onChange={(val) => set("conceito", val)}
              placeholder="Viver onde a cidade encontra a natureza"
            />
            <Field
              label="Tom de voz"
              required
              hint="Sofisticado? Acolhedor? Moderno? Aspiracional?"
              value={v("tom_voz")}
              onChange={(val) => set("tom_voz", val)}
              placeholder="Sofisticado e contemporâneo"
            />
            <TextareaField
              label="Referências visuais"
              hint="Links de moodboard, referências, marcas"
              value={v("referencias_visuais")}
              onChange={(val) => set("referencias_visuais", val)}
              placeholder="Cole links ou descreva"
            />
            <Field
              label="Paleta de cores desejada"
              value={v("paleta_cores")}
              onChange={(val) => set("paleta_cores", val)}
              placeholder="Tons terrosos + dourado, ou 'em aberto'"
            />
            <Field
              label="Estilo de fotografia / 3D"
              hint="Warm? Clean? Dramático? Minimalista?"
              value={v("estilo_foto_3d")}
              onChange={(val) => set("estilo_foto_3d", val)}
              placeholder="Estilo visual desejado"
            />
            <TextareaField
              label="O que NÃO queremos"
              value={v("nao_queremos")}
              onChange={(val) => set("nao_queremos", val)}
              placeholder="O que evitar na comunicação"
            />
            <NavRow onBack={() => go(3)} onNext={() => validateAndGo(4, 5)} />
          </View>

          {/* ── View 5: Digital 3D — Escopo & Direção ── */}
          <View active={current === 5}>
            <SectionHeader num={5} title="Digital 3D — Escopo & Direção" />
            <SelectField
              label="Fase do projeto"
              value={v("fase_projeto_3d")}
              onChange={(val) => set("fase_projeto_3d", val)}
              options={[
                { value: "", label: "Selecione..." },
                { value: "conceito", label: "Conceito" },
                { value: "pre-lancamento", label: "Pré-lançamento" },
                { value: "lancamento", label: "Lançamento" },
                { value: "institucional", label: "Institucional" },
              ]}
            />
            <TextareaField
              label="Principal objetivo das imagens 3D"
              hint="Ex: gerar desejo, apoiar vendas, posicionar marca, material institucional"
              value={v("objetivo_3d")}
              onChange={(val) => set("objetivo_3d", val)}
              placeholder="O que as imagens precisam comunicar?"
            />
            <TextareaField
              label="Quais são as imagens mais importantes do escopo?"
              hint="Liste as cenas prioritárias (ex: fachada diurna, piscina, rooftop)"
              value={v("imagens_importantes_3d")}
              onChange={(val) => set("imagens_importantes_3d", val)}
              placeholder="1. Fachada diurna&#10;2. Piscina&#10;3. ..."
              rows={4}
            />
            <Field
              label="Existe alguma cena considerada imagem-chave?"
              hint="A imagem que define o projeto"
              value={v("imagem_chave_3d")}
              onChange={(val) => set("imagem_chave_3d", val)}
              placeholder="Ex: Vista aérea lateral mostrando o entorno"
            />
            <SelectField
              label="A linguagem visual deve ser mais..."
              value={v("linguagem_3d")}
              onChange={(val) => set("linguagem_3d", val)}
              options={[
                { value: "", label: "Selecione..." },
                { value: "realista", label: "Realista" },
                { value: "poetica", label: "Poética" },
                { value: "conceitual", label: "Conceitual" },
                { value: "comercial", label: "Comercial" },
              ]}
            />
            <TextareaField
              label="Referências visuais obrigatórias"
              hint="Links de moodboard, projetos, fotógrafos ou renders que admira"
              value={v("referencias_3d")}
              onChange={(val) => set("referencias_3d", val)}
              placeholder="Cole links ou descreva referências"
            />
            <TextareaField
              label="Referências que NÃO representam o que buscam"
              value={v("anti_referencias_3d")}
              onChange={(val) => set("anti_referencias_3d", val)}
              placeholder="O que evitar visualmente"
            />
            <NavRow onBack={() => go(4)} onNext={() => validateAndGo(5, 6)} />
          </View>

          {/* ── View 6: Digital 3D — Atmosfera, Materiais & Aprovações ── */}
          <View active={current === 6}>
            <SectionHeader num={6} title="Digital 3D — Atmosfera & Materiais" />
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">Luz & Clima</p>
            <Field
              label="Qual clima melhor representa o projeto?"
              hint="Manhã, tarde, golden hour, noite, blue hour"
              value={v("clima_3d")}
              onChange={(val) => set("clima_3d", val)}
              placeholder="Ex: Golden hour + noite"
            />
            <SelectField
              label="A luz deve ser mais..."
              value={v("luz_3d")}
              onChange={(val) => set("luz_3d", val)}
              options={[
                { value: "", label: "Selecione..." },
                { value: "suave", label: "Suave" },
                { value: "dramatica", label: "Dramática" },
                { value: "natural", label: "Natural" },
                { value: "contrastada", label: "Contrastada" },
              ]}
            />
            <Field
              label="Atmosfera emocional desejada"
              hint="Ex: calma, imponência, intimidade, acolhimento"
              value={v("atmosfera_3d")}
              onChange={(val) => set("atmosfera_3d", val)}
              placeholder="O que o espectador deve sentir"
            />
            <div className="my-5 h-px bg-zinc-800" />
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">Materialidade</p>
            <Field
              label="Materiais protagonistas do projeto"
              hint="Ex: concreto, madeira, pedra, vidro, terracota"
              value={v("materiais_3d")}
              onChange={(val) => set("materiais_3d", val)}
              placeholder="Principais materiais e acabamentos"
            />
            <Field
              label="Sensação que o projeto deve transmitir"
              hint="Calor, neutralidade, sofisticação, brutalismo, leveza"
              value={v("sensacao_materiais_3d")}
              onChange={(val) => set("sensacao_materiais_3d", val)}
              placeholder="Ex: Sofisticação + leveza"
            />
            <div className="my-5 h-px bg-zinc-800" />
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">Paisagismo & Pessoas</p>
            <SelectField
              label="Papel do paisagismo nas imagens"
              value={v("paisagismo_3d")}
              onChange={(val) => set("paisagismo_3d", val)}
              options={[
                { value: "", label: "Selecione..." },
                { value: "protagonista", label: "Protagonista" },
                { value: "complementar", label: "Complementar" },
                { value: "discreto", label: "Discreto" },
              ]}
            />
            <Field
              label="Vegetação ou linguagem paisagística desejada"
              value={v("vegetacao_3d")}
              onChange={(val) => set("vegetacao_3d", val)}
              placeholder="Referências ou estilo de paisagismo"
            />
            <SelectField
              label="Presença de pessoas nas imagens?"
              value={v("pessoas_3d")}
              onChange={(val) => set("pessoas_3d", val)}
              options={[
                { value: "", label: "Selecione..." },
                { value: "sim", label: "Sim" },
                { value: "nao", label: "Não" },
              ]}
            />
            <Field
              label="Perfil das pessoas (se sim)"
              hint="Famílias, casais, jovens, editorial"
              value={v("perfil_pessoas_3d")}
              onChange={(val) => set("perfil_pessoas_3d", val)}
              placeholder="Ex: Casais 30+, homens e mulheres solteiros"
            />
            <Field
              label="Foco maior em arquitetura ou lifestyle?"
              value={v("foco_arq_lifestyle_3d")}
              onChange={(val) => set("foco_arq_lifestyle_3d", val)}
              placeholder="Arquitetura, lifestyle ou ambos"
            />
            <div className="my-5 h-px bg-zinc-800" />
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[2px] text-zinc-500">Aprovações</p>
            <Field
              label="Responsável pelas aprovações"
              value={v("responsavel_aprovacao_3d")}
              onChange={(val) => set("responsavel_aprovacao_3d", val)}
              placeholder="Nome e cargo"
            />
            <Field
              label="Restrição de prazo importante?"
              value={v("prazo_3d")}
              onChange={(val) => set("prazo_3d", val)}
              placeholder="Ex: Pré-lançamento em Junho/2026"
            />
            <TextareaField
              label="Como saberemos que as imagens foram bem-sucedidas?"
              value={v("criterio_sucesso_3d")}
              onChange={(val) => set("criterio_sucesso_3d", val)}
              placeholder="O que define uma imagem aprovada para vocês?"
            />
            <div className="mt-6 flex gap-2.5">
              <button type="button" className="nav-back" onClick={() => go(5)}>
                &larr;
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar Briefing ✓"}
              </button>
            </div>
          </View>

          {/* ── View 7: Success ── */}
          <View active={current === 7}>
            <div className="py-5 text-center">
              <div className="mb-5 inline-flex h-16 w-16 animate-[popIn_0.5s_ease] items-center justify-center rounded-full bg-[#E85102]/15 text-[28px]">
                &#10003;
              </div>
              <h2 className="mb-2 text-[22px] font-bold text-white">
                Briefing enviado!
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                O briefing foi vinculado ao projeto e a equipe criativa da TBO
                será notificada. Obrigado pelo detalhamento.
              </p>
            </div>
          </View>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-700">
          Powered by TBO OS
        </p>
      </div>

      {/* ── Keyframe animations ── */}
      <style jsx global>{`
        @keyframes orbit1 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          14% { transform: translate(12%, -14%) scale(1.18) rotate(4deg); }
          32% { transform: translate(-6%, -8%) scale(0.92) rotate(-2deg); }
          48% { transform: translate(-16%, 10%) scale(1.1) rotate(-5deg); }
          67% { transform: translate(8%, 16%) scale(0.88) rotate(3deg); }
          83% { transform: translate(14%, -4%) scale(1.14) rotate(-1deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes orbit2 {
          0% { transform: translate(0, 0) scale(1.05) rotate(0deg); }
          18% { transform: translate(-14%, -10%) scale(0.9) rotate(-4deg); }
          36% { transform: translate(-8%, 14%) scale(1.2) rotate(2deg); }
          52% { transform: translate(16%, 6%) scale(0.88) rotate(5deg); }
          71% { transform: translate(10%, -12%) scale(1.12) rotate(-3deg); }
          100% { transform: translate(0, 0) scale(1.05) rotate(0deg); }
        }
        @keyframes orbit3 {
          0% { transform: translate(0, 0) scale(1); }
          22% { transform: translate(10%, 14%) scale(1.22) rotate(3deg); }
          41% { transform: translate(-14%, 6%) scale(0.86) rotate(-4deg); }
          58% { transform: translate(-8%, -12%) scale(1.14) rotate(2deg); }
          76% { transform: translate(12%, -6%) scale(0.92) rotate(-2deg); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes orbit4 {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          16% { transform: translate(-12%, -8%) scale(1.16) rotate(-3deg); }
          35% { transform: translate(6%, -16%) scale(0.9) rotate(5deg); }
          53% { transform: translate(14%, 10%) scale(1.08) rotate(-4deg); }
          72% { transform: translate(-6%, 14%) scale(0.94) rotate(2deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes popIn {
          0% { transform: scale(0); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .btn-primary {
          width: 100%;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          border: none;
          cursor: pointer;
          background: linear-gradient(135deg, #E85102 0%, #EC7602 100%);
          box-shadow: 0 10px 25px -5px rgba(232, 81, 2, 0.3);
          transition: all 0.2s;
        }
        .btn-primary:hover { filter: brightness(1.1); box-shadow: 0 15px 35px -5px rgba(232, 81, 2, 0.4); }
        .btn-primary:active { transform: scale(0.98); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; filter: none; transform: none; }

        .nav-back {
          flex: 0 0 auto;
          border-radius: 10px;
          padding: 12px 18px;
          font-size: 13px;
          font-weight: 500;
          color: #a1a1aa;
          border: 1px solid #3f3f46;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-back:hover { border-color: #71717a; color: #e4e4e7; }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════ */

function View({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  if (!active) return null;
  return <div className="animate-[fadeUp_0.35s_ease]">{children}</div>;
}

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <>
      <p className="mb-1 text-[11px] uppercase tracking-[1.5px] text-zinc-500">
        Seção {num} de 6
      </p>
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#E85102]/15 text-[13px] font-semibold text-[#E85102]">
          {num}
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
    </>
  );
}

function Field({
  label,
  required,
  hint,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-[13px] font-medium text-zinc-200">
        {label}
        {required && <span className="text-[#E85102]"> *</span>}
      </label>
      {hint && <p className="mb-1.5 text-[11px] text-zinc-500">{hint}</p>}
      <input
        type={type}
        className="w-full rounded-[10px] border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-[#E85102] focus:ring-[3px] focus:ring-[#E85102]/15"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextareaField({
  label,
  required,
  hint,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-[13px] font-medium text-zinc-200">
        {label}
        {required && <span className="text-[#E85102]"> *</span>}
      </label>
      {hint && <p className="mb-1.5 text-[11px] text-zinc-500">{hint}</p>}
      <textarea
        className="min-h-[80px] w-full resize-y rounded-[10px] border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:border-[#E85102] focus:ring-[3px] focus:ring-[#E85102]/15"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

function SelectField({
  label,
  required,
  value,
  onChange,
  options,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="mb-4 last:mb-0">
      <label className="mb-1.5 block text-[13px] font-medium text-zinc-200">
        {label}
        {required && <span className="text-[#E85102]"> *</span>}
      </label>
      <select
        className="w-full cursor-pointer appearance-none rounded-[10px] border border-zinc-700 bg-zinc-800/50 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[right_12px_center] bg-no-repeat px-3.5 py-2.5 pr-8 text-sm text-white outline-none transition-all focus:border-[#E85102] focus:ring-[3px] focus:ring-[#E85102]/15"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-zinc-900">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}


function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
  );
}

function NavRow({
  onBack,
  onNext,
  disabled,
}: {
  onBack: () => void;
  onNext: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-6 flex gap-2.5">
      <button type="button" className="nav-back" onClick={onBack}>
        &larr;
      </button>
      <button
        type="button"
        disabled={disabled}
        className="flex-1 rounded-[10px] border-none bg-gradient-to-br from-[#E85102] to-[#EC7602] px-4 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
        onClick={onNext}
      >
        Próximo &rarr;
      </button>
    </div>
  );
}
