import tabelaSutia from "@/data/tabela-sutia.json";
import tabelaCalcinha from "@/data/tabela-calcinha.json";
import tabelaPijamaCamisa from "@/data/tabela-pijama-camisa.json";
import tabelaPijamaShort from "@/data/tabela-pijama-short.json";
import tabelaBabyDoll from "@/data/tabela-baby-doll.json";
import type { AreaMedida } from "@/lib/medicao";

export type ProdutoId = "sutia" | "calcinha" | "pijama" | "babyDoll";

/** Linha da tabela: nome do tamanho + `<medida>Min` / `<medida>Max` em cm para cada medida da parte. */
export type LinhaTamanho = { tamanho: string } & Record<string, string | number>;

/** Medidas usadas no cálculo, na ordem em que aparecem; `peso` define a importância no desempate. */
export type MedidaPeso = { id: AreaMedida; peso: number };

/** Parte da peça que recebe um tamanho próprio (ex.: camisa e short do pijama). */
export type Parte = {
  nome: string;
  medidas: MedidaPeso[];
  tabelaPadrao: LinhaTamanho[];
};

export type Produto = {
  id: ProdutoId;
  nome: string;
  partes: Parte[];
  /** Validação extra das medidas informadas; devolve uma mensagem de erro ou null. */
  validar?: (v: Partial<Record<AreaMedida, number>>) => string | null;
};

export const PRODUTOS: Record<ProdutoId, Produto> = {
  sutia: {
    id: "sutia",
    nome: "Sutiã",
    partes: [
      {
        nome: "Sutiã",
        // O sub-busto define a firmeza da banda, por isso pesa mais.
        medidas: [
          { id: "subBusto", peso: 2 },
          { id: "busto", peso: 1 },
        ],
        tabelaPadrao: tabelaSutia,
      },
    ],
    validar: ({ busto, subBusto }) =>
      busto !== undefined && subBusto !== undefined && busto <= subBusto
        ? "A medida do busto deve ser maior que a do sub-busto. Confira os valores."
        : null,
  },
  calcinha: {
    id: "calcinha",
    nome: "Calcinha",
    partes: [
      {
        nome: "Calcinha",
        // O quadril é a medida principal para modelagem de calcinha.
        medidas: [
          { id: "cintura", peso: 1 },
          { id: "quadril", peso: 2 },
        ],
        tabelaPadrao: tabelaCalcinha,
      },
    ],
  },
  pijama: {
    id: "pijama",
    nome: "Pijama",
    partes: [
      {
        nome: "Camisa",
        // A camisa precisa fechar no busto sem repuxar os botões.
        medidas: [
          { id: "busto", peso: 2 },
          { id: "cintura", peso: 1 },
        ],
        tabelaPadrao: tabelaPijamaCamisa,
      },
      {
        nome: "Short",
        medidas: [
          { id: "cintura", peso: 1 },
          { id: "quadril", peso: 2 },
        ],
        tabelaPadrao: tabelaPijamaShort,
      },
    ],
  },
  babyDoll: {
    id: "babyDoll",
    nome: "Baby doll",
    partes: [
      {
        nome: "Baby doll",
        // Vendido em conjunto: blusa (busto) e short/calcinha (quadril) pesam igual.
        medidas: [
          { id: "busto", peso: 1 },
          { id: "quadril", peso: 1 },
        ],
        tabelaPadrao: tabelaBabyDoll,
      },
    ],
  },
};

export const LISTA_PRODUTOS = Object.values(PRODUTOS);

/** Medidas que a cliente precisa informar para a peça (sem repetir as compartilhadas entre partes). */
export function medidasDoProduto(produto: Produto): AreaMedida[] {
  return [...new Set(produto.partes.flatMap((p) => p.medidas.map((m) => m.id)))];
}

export const chaveMin = (id: AreaMedida) => `${id}Min`;
export const chaveMax = (id: AreaMedida) => `${id}Max`;
