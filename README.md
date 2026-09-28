# Provador de Medidas

Site 100% frontend (Next.js) em que a cliente escolhe a peça (sutiã ou calcinha), informa suas medidas, vê no manequim 3D onde medir e recebe o tamanho equivalente.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
```

## Como funciona

- Ao selecionar um campo, uma fita amarela no manequim 3D mostra onde medir e aparecem as instruções passo a passo (textos em `src/lib/medicao.ts`).
- **Sutiã:** sub-busto e busto (o sub-busto pesa mais no cálculo).
- **Calcinha:** cintura e quadril (o quadril pesa mais no cálculo).

## Tabelas de tamanhos

- Ficam em `src/data/tabela-sutia.json` e `src/data/tabela-calcinha.json` (PP a XXG, com faixas médias de mercado).
- Cada linha tem o nome do tamanho e as faixas `<medida>Min` / `<medida>Max` em cm.
- O tamanho recomendado é a linha em que todas as medidas caem dentro das faixas (empate: a mais próxima do centro). Se nenhuma linha contém as medidas, mostra a mais próxima com um aviso.
- Para alterar os tamanhos, edite o JSON e publique novamente.
- Para adicionar outra peça, cadastre-a em `src/lib/produtos.ts` com as medidas que ela usa.
