import tabelaSutia from "@/data/tabela-sutia.json";
import tabelaCalcinha from "@/data/tabela-calcinha.json";
import type { AreaMedida } from "@/lib/medicao";

export type ProdutoId = "sutia" | "calcinha";

/** Linha da tabela: nome do tamanho + `<medida>Min` / `<medida>Max` em cm para cada medida do produto. */
export type LinhaTamanho = { tamanho: string } & Record<string, string | number>;

export type Produto = {
  id: ProdutoId;
  nome: string;
  /** Medidas usadas no cálculo, na ordem em que aparecem; `peso` define a importância no desempate. */
  medidas: { id: AreaMedida; peso: number }[];
  tabelaPadrao: LinhaTamanho[];
  /** Validação extra das medidas informadas; devolve uma mensagem de erro ou null. */
  validar?: (v: Partial<Record<AreaMedida, number>>) => string | null;
};

export const PRODUTOS: Record<ProdutoId, Produto> = {
  sutia: {
    id: "sutia",
    nome: "Sutiã",
    // O sub-busto define a firmeza da banda, por isso pesa mais.
    medidas: [
      { id: "subBusto", peso: 2 },
      { id: "busto", peso: 1 },
    ],
    tabelaPadrao: tabelaSutia,
    validar: ({ busto, subBusto }) =>
      busto !== undefined && subBusto !== undefined && busto <= subBusto
        ? "A medida do busto deve ser maior que a do sub-busto. Confira os valores."
        : null,
  },
  calcinha: {
    id: "calcinha",
    nome: "Calcinha",
    // O quadril é a medida principal para modelagem de calcinha.
    medidas: [
      { id: "cintura", peso: 1 },
      { id: "quadril", peso: 2 },
    ],
    tabelaPadrao: tabelaCalcinha,
  },
};

export const LISTA_PRODUTOS = Object.values(PRODUTOS);

export const chaveMin = (id: AreaMedida) => `${id}Min`;
export const chaveMax = (id: AreaMedida) => `${id}Max`;
