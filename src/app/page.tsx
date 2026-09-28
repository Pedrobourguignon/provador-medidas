"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DICAS_GERAIS, INSTRUCOES, type AreaMedida } from "@/lib/medicao";
import { LISTA_PRODUTOS, PRODUTOS, type ProdutoId } from "@/lib/produtos";
import { encontrarTamanho } from "@/lib/sizes";

const Mannequin3D = dynamic(() => import("@/components/Mannequin3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-stone-500">Carregando manequim…</div>
  ),
});

function numero(v: string) {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

export default function Home() {
  const [produtoId, setProdutoId] = useState<ProdutoId>("sutia");
  const [valores, setValores] = useState<Record<AreaMedida, string>>({
    subBusto: "",
    busto: "",
    cintura: "",
    quadril: "",
  });
  const [ativo, setAtivo] = useState<AreaMedida>("subBusto");
  const [mostrarPeca, setMostrarPeca] = useState(true);
  const inputs = useRef<Partial<Record<AreaMedida, HTMLInputElement | null>>>({});

  const produto = PRODUTOS[produtoId];
  const numeros = Object.fromEntries(
    Object.entries(valores).map(([k, v]) => [k, numero(v)]),
  ) as Record<AreaMedida, number>;
  const medidasValidas = produto.medidas.every((m) => Number.isFinite(numeros[m.id]));
  const erro = medidasValidas ? (produto.validar?.(numeros) ?? null) : null;
  const resultado = medidasValidas && !erro ? encontrarTamanho(produto.tabelaPadrao, produtoId, numeros) : null;
  const instrucao = INSTRUCOES[ativo];
  const nomesMedidas = produto.medidas.map((m) => INSTRUCOES[m.id].rotulo.toLowerCase()).join(" e ");

  function trocarProduto(id: ProdutoId) {
    setProdutoId(id);
    setAtivo(PRODUTOS[id].medidas[0].id);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 md:py-12">
      <header>
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-rose-600">Provador virtual</p>
          <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Descubra o seu tamanho</h1>
          <p className="mt-2 max-w-xl text-stone-600">
            Escolha a peça e informe suas medidas em centímetros. Ao selecionar um campo, o manequim mostra onde
            passar a fita métrica.
          </p>
        </div>
      </header>

      <div role="tablist" className="flex w-fit gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-stone-200">
        {LISTA_PRODUTOS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={produtoId === p.id}
            onClick={() => trocarProduto(p.id)}
            className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
              produtoId === p.id ? "bg-rose-600 text-white" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {p.nome}
          </button>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
        <section className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
          <h2 className="text-lg font-semibold">Suas medidas para {produto.nome.toLowerCase()}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {produto.medidas.map(({ id }) => {
              const c = INSTRUCOES[id];
              return (
                <label key={id} className="flex flex-col gap-1">
                  <span className={`text-sm font-medium ${ativo === id ? "text-amber-600" : ""}`}>{c.rotulo}</span>
                  <div className="relative">
                    <input
                      ref={(el) => {
                        inputs.current[id] = el;
                      }}
                      inputMode="decimal"
                      placeholder="0"
                      value={valores[id]}
                      onFocus={() => setAtivo(id)}
                      onChange={(e) => setValores((v) => ({ ...v, [id]: e.target.value }))}
                      className={`w-full rounded-lg border px-3 py-2 pr-10 outline-none placeholder:text-stone-300 focus:ring-2 ${
                        ativo === id
                          ? "border-amber-500 ring-2 ring-amber-200 focus:ring-amber-200"
                          : "border-stone-300 focus:ring-amber-200"
                      }`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-400">
                      cm
                    </span>
                  </div>
                  <span className="text-xs text-stone-500">{c.resumo}</span>
                </label>
              );
            })}
          </div>

          <div className="rounded-xl bg-stone-50 p-5 ring-1 ring-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Como medir</h3>
              <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-stone-200">
                {produto.medidas.map(({ id }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setAtivo(id);
                      inputs.current[id]?.focus();
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      ativo === id ? "bg-amber-500 text-white" : "text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {INSTRUCOES[id].rotulo}
                  </button>
                ))}
              </div>
            </div>
            <ol className="mt-4 flex flex-col gap-2.5 text-sm text-stone-700">
              {instrucao.passos.map((passo, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                    {i + 1}
                  </span>
                  <span>{passo}</span>
                </li>
              ))}
            </ol>
            <ul className="mt-4 flex flex-col gap-1 border-t border-stone-200 pt-3 text-xs text-stone-500">
              {DICAS_GERAIS.map((d) => (
                <li key={d}>• {d}</li>
              ))}
            </ul>
          </div>

          <div className="mt-auto rounded-xl bg-rose-50 p-5 ring-1 ring-rose-100">
            {!medidasValidas && <p className="text-stone-600">Preencha {nomesMedidas} para ver o seu tamanho.</p>}
            {erro && <p className="text-rose-700">{erro}</p>}
            {resultado && (
              <div>
                <p className="text-sm text-stone-600">Seu tamanho de {produto.nome.toLowerCase()} recomendado</p>
                <p className="text-5xl font-bold text-rose-600">{resultado.linha.tamanho}</p>
                {!resultado.exato && (
                  <p className="mt-2 text-sm text-stone-600">
                    Suas medidas ficam entre dois tamanhos da tabela; este é o mais próximo. Se tiver dúvida,
                    fale com a nossa equipe.
                  </p>
                )}
              </div>
            )}
            {medidasValidas && !erro && !resultado && (
              <p className="text-stone-600">Nenhuma tabela de tamanhos cadastrada.</p>
            )}
          </div>
        </section>

        <section className="relative h-[480px] overflow-hidden rounded-2xl bg-gradient-to-b from-rose-50 to-stone-100 ring-1 ring-stone-200 md:h-auto md:min-h-[560px]">
          <Mannequin3D peca={produtoId} mostrarPeca={mostrarPeca} destaque={ativo} />
          <p className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs text-stone-600 backdrop-blur">
            <span className="h-2 w-5 rounded-full bg-amber-500" /> Onde medir: {instrucao.rotulo.toLowerCase()}
          </p>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3 text-xs text-stone-500">
            <span>Arraste para girar · role para aproximar</span>
            <label className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 backdrop-blur">
              <input
                type="checkbox"
                checked={mostrarPeca}
                onChange={(e) => setMostrarPeca(e.target.checked)}
                className="accent-rose-600"
              />
              Mostrar {produto.nome.toLowerCase()}
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}
