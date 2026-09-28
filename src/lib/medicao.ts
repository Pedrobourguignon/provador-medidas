export type AreaMedida = "subBusto" | "busto" | "cintura" | "quadril";

export type InstrucaoMedida = {
  id: AreaMedida;
  rotulo: string;
  resumo: string;
  passos: string[];
};

export const INSTRUCOES: Record<AreaMedida, InstrucaoMedida> = {
  subBusto: {
    id: "subBusto",
    rotulo: "Sub-busto",
    resumo: "Logo abaixo dos seios, onde fica o elástico do sutiã.",
    passos: [
      "Fique em pé, com a postura ereta e os braços relaxados ao lado do corpo.",
      "Passe a fita métrica logo abaixo dos seios, na linha onde fica o elástico do sutiã.",
      "Deixe a fita justa e firme, mas sem apertar a ponto de marcar a pele.",
      "Confira no espelho se a fita está paralela ao chão também nas costas.",
      "Solte o ar normalmente e anote a medida.",
    ],
  },
  busto: {
    id: "busto",
    rotulo: "Busto",
    resumo: "Na parte mais saliente dos seios, sem apertar.",
    passos: [
      "Meça sem sutiã ou usando um sutiã sem bojo, para não alterar o volume.",
      "Passe a fita pela parte mais saliente dos seios (normalmente na altura dos mamilos).",
      "A fita deve apenas encostar no corpo, sem apertar.",
      "Mantenha a fita reta e paralela ao chão, passando pelas costas na mesma altura.",
      "Respire normalmente e anote a medida.",
    ],
  },
  cintura: {
    id: "cintura",
    rotulo: "Cintura",
    resumo: "Na parte mais fina do tronco, acima do umbigo.",
    passos: [
      "Fique em pé, relaxada, com os pés levemente afastados.",
      "Localize a parte mais fina do tronco, geralmente dois dedos acima do umbigo.",
      "Passe a fita ao redor dessa linha, sem encolher nem estufar a barriga.",
      "Deixe a fita confortável, apenas encostando no corpo e paralela ao chão.",
      "Solte o ar normalmente e anote a medida.",
    ],
  },
  quadril: {
    id: "quadril",
    rotulo: "Quadril",
    resumo: "Na parte mais larga do quadril e do bumbum.",
    passos: [
      "Fique em pé com os pés juntos.",
      "De lado para o espelho, encontre a parte mais saliente do bumbum.",
      "Passe a fita nessa altura, contornando também a parte mais larga do quadril.",
      "Mantenha a fita paralela ao chão e sem apertar.",
      "Anote a medida.",
    ],
  },
};

export const DICAS_GERAIS = [
  "Use uma fita métrica flexível, de costura.",
  "Meça sobre a pele ou com roupas bem finas.",
  "Meça em frente a um espelho ou peça ajuda a outra pessoa.",
];
