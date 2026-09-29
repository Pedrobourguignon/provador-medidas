import type { AreaMedida } from "@/lib/medicao";
import { chaveMax, chaveMin, type LinhaTamanho, type MedidaPeso } from "@/lib/produtos";

export type { LinhaTamanho };

export type Resultado = {
  linha: LinhaTamanho;
  exato: boolean;
};

/** Distância de um valor até a faixa [min, max]; 0 quando está dentro. */
function foraDaFaixa(valor: number, min: number, max: number) {
  if (valor < min) return min - valor;
  if (valor > max) return valor - max;
  return 0;
}

/**
 * Encontra o tamanho que melhor atende às medidas de uma parte da peça.
 * Prioriza linhas em que todas as medidas estão dentro da faixa, desempatando
 * pela proximidade ao centro das faixas (ponderada pelo peso de cada medida).
 * Se nenhuma linha contém as medidas, devolve a mais próxima.
 */
export function encontrarTamanho(
  tabela: LinhaTamanho[],
  medidas: MedidaPeso[],
  valores: Record<AreaMedida, number>,
): Resultado | null {
  let melhor: { linha: LinhaTamanho; fora: number; centro: number } | null = null;

  for (const linha of tabela) {
    let fora = 0;
    let centro = 0;
    for (const { id, peso } of medidas) {
      const min = Number(linha[chaveMin(id)]);
      const max = Number(linha[chaveMax(id)]);
      fora += peso * foraDaFaixa(valores[id], min, max);
      centro += peso * Math.abs(valores[id] - (min + max) / 2);
    }
    if (!melhor || fora < melhor.fora || (fora === melhor.fora && centro < melhor.centro)) {
      melhor = { linha, fora, centro };
    }
  }

  return melhor ? { linha: melhor.linha, exato: melhor.fora === 0 } : null;
}
