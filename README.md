# speed-estoque

Controle de estoque da Speed Burger com:
- login simples (Kevin / Kevin2236)
- importação de CSV/Excel do Goomer e Ceofood
- faturamento total por fonte
- custo teórico e lucro bruto estimado
- estoque em verde / amarelo / vermelho
- ficha técnica por produto
- fornecedores com link automático para WhatsApp
- relatório visual para imprimir / salvar em PDF

## Tecnologias
- React + Vite
- Supabase (opcional, com fallback local)
- XLSX para ler CSV/Excel

## Variáveis de ambiente
Crie um `.env.local` com:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Rodar localmente
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy na Vercel
- Preset: `Other` ou `Vite`
- Root directory: `./`
- Variáveis:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Supabase
Rode o arquivo `supabase_schema.sql` para criar as tabelas.
