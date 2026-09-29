# Provador de Medidas

Site 100% frontend (Next.js) em que a cliente escolhe a peça (sutiã, calcinha, pijama ou baby doll), informa suas medidas, vê no manequim 3D onde medir e recebe o tamanho equivalente.

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
- **Pijama:** busto, cintura e quadril. Recomenda um tamanho para a **camisa** (busto pesa mais) e outro para o **short** (quadril pesa mais); se ficarem diferentes, sugere o maior para quem compra o conjunto.
- **Baby doll:** busto e quadril, com o mesmo peso (vendido em conjunto, um tamanho só).

## Tabelas de tamanhos

- Ficam em `src/data/` (PP a XXG, com faixas médias de mercado): `tabela-sutia.json`, `tabela-calcinha.json`, `tabela-pijama-camisa.json`, `tabela-pijama-short.json` e `tabela-baby-doll.json`.
- Cada linha tem o nome do tamanho e as faixas `<medida>Min` / `<medida>Max` em cm.
- O tamanho recomendado é a linha em que todas as medidas caem dentro das faixas (empate: a mais próxima do centro). Se nenhuma linha contém as medidas, mostra a mais próxima com um aviso.
- Para alterar os tamanhos, edite o JSON e publique novamente.
- Para adicionar outra peça, cadastre-a em `src/lib/produtos.ts` com as partes que recebem tamanho próprio (cada uma com suas medidas e tabela) e desenhe-a no manequim em `src/components/Mannequin3D.tsx`.
