# NOTICE — Atribuições de Software de Terceiros

**Projeto:** system-forge-landing-page
**Gerado em:** 2026-03-29

Este projeto utiliza os seguintes componentes de software de terceiros:

---

## Licenças Permissivas (MIT, Apache, BSD, ISC, etc.)

O projeto inclui **194 pacotes de produção** distribuídos sob licenças permissivas (MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, BlueOak-1.0.0). Uso livre em projetos proprietários. Sem restrições de distribuição.

Principais dependências diretas e suas licenças:

| Pacote | Versão | Licença |
|--------|--------|---------|
| `next` | 16.2.1 | MIT |
| `react` | 19.2.4 | MIT |
| `react-dom` | 19.2.4 | MIT |
| `zod` | 3.25.76 | MIT |
| `tailwind-merge` | 3.5.x | MIT |
| `clsx` | 2.1.x | MIT |
| `lucide-react` | 1.0.x | ISC |
| `next-themes` | 0.4.x | MIT |
| `fuse.js` | 7.1.x | Apache-2.0 |
| `sonner` | 2.0.x | MIT |
| `class-variance-authority` | 0.7.x | Apache-2.0 |
| `glob` | 11.0.x | ISC |
| `remark-gfm` | 4.0.x | MIT |
| `velite` | 0.3.x | MIT |
| `rehype-sanitize` | 6.0.0 | MIT |

---

## Licenças LGPL-3.0-or-later (Copyleft Fraco)

Os pacotes abaixo estão licenciados sob LGPL-3.0-or-later. Uso permitido em projetos proprietários via dynamic linking/binding sem obrigação de abrir o código do projeto. Modificações ao código da biblioteca devem ser abertas.

| Pacote | Versão | Licença | Uso | Observação |
|--------|--------|---------|-----|------------|
| `@img/sharp-libvips-linux-x64` | 1.2.4 | LGPL-3.0-or-later | Produção (via `sharp`) | Biblioteca nativa C; usada via binding pelo sharp para processamento de imagens |
| `@img/sharp-libvips-linuxmusl-x64` | 1.2.4 | LGPL-3.0-or-later | Produção (via `sharp`) | Binário nativo para Linux musl; usada via binding pelo sharp |

**Avaliação de conformidade:** O projeto não modifica o código-fonte da `libvips`. O uso é exclusivamente via binding dinâmico pelo pacote `sharp`. Uso conforme LGPL-3.0-or-later.

---

## Licenças OFL-1.1 (Open Font License)

| Pacote | Versão | Licença | Observação |
|--------|--------|---------|------------|
| `@fontsource/inter` | 5.2.x | OFL-1.1 | Fonte Inter self-hosted |
| `@fontsource/jetbrains-mono` | 5.2.x | OFL-1.1 | Fonte JetBrains Mono self-hosted |

**Avaliação:** OFL-1.1 permite incorporação em projetos (incluindo comerciais) desde que as fontes não sejam vendidas isoladamente. Uso conforme.

---

*Gerado automaticamente por /dependency-audit. Revisar antes de distribuição pública.*
