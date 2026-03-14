# JurisTrack

## Versão

- **SEMPRE bumpar a versão** em `package.json` antes de cada commit
- A versão aparece no header do site — é a forma de confirmar que o deploy mais recente está ativo
- Semver: PATCH para correções, MINOR para features, MAJOR para redesigns

## Auth

- Usar `getSession()` + `onAuthStateChange` para detectar logout
- NUNCA usar só `onAuthStateChange` — pode disparar null no carregamento inicial e causar redirect loop

## Design

- Light mode: bg-[#F8F9FA] canvas, bg-white surface, border-[#E5E7EB]
- Fontes: Inter (sans) + Playfair Display (serif para títulos)
- Raio: rounded (4px) para cards, rounded-full para badges/botões pill
- Template de referência: `template.html` na raiz do projeto
