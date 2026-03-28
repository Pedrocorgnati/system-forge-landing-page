# Email DNS Setup — SPF/DKIM/DMARC para Newsletter

Configuração DNS obrigatória para entregabilidade de emails via Resend.
Registros devem ser criados no painel do provedor de DNS de cada domínio.

---

## Domínio: systemforge.it (IT — GDPR obrigatório)

| Tipo | Nome | Valor |
|------|------|-------|
| TXT | @ | `v=spf1 include:amazonses.com ~all` |
| CNAME | `resend._domainkey` | Conforme dashboard Resend > Domains > systemforge.it |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@systemforge.it` |

**Passos:**
1. Acessar Resend > Settings > Domains > Add Domain > `systemforge.it`
2. Copiar os registros DKIM gerados pelo Resend e adicionar ao DNS
3. Verificar status "Verified" no dashboard Resend (pode levar até 48h)
4. GDPR: SPF/DKIM são obrigatórios para identificação do remetente

---

## Domínio: forjadesistemas.com.br (BR — LGPD)

| Tipo | Nome | Valor |
|------|------|-------|
| TXT | @ | `v=spf1 include:amazonses.com ~all` |
| CNAME | `resend._domainkey` | Conforme dashboard Resend > Domains > forjadesistemas.com.br |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@forjadesistemas.com.br` |

**Passos:**
1. Acessar Resend > Settings > Domains > Add Domain > `forjadesistemas.com.br`
2. Copiar os registros DKIM gerados e adicionar ao DNS do domínio .com.br
3. Verificar status "Verified" no dashboard Resend

---

## Domínio: systemforgesoftware.com (EN — CAN-SPAM)

| Tipo | Nome | Valor |
|------|------|-------|
| TXT | @ | `v=spf1 include:amazonses.com ~all` |
| CNAME | `resend._domainkey` | Conforme dashboard Resend > Domains > systemforgesoftware.com |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@systemforgesoftware.com` |

**Passos:**
1. Acessar Resend > Settings > Domains > Add Domain > `systemforgesoftware.com`
2. Copiar os registros DKIM e adicionar ao DNS
3. Verificar "Verified" no dashboard Resend

---

## Verificação

Após adicionar os registros DNS, verificar com:
```bash
# SPF
dig TXT forjadesistemas.com.br | grep spf
dig TXT systemforge.it | grep spf
dig TXT systemforgesoftware.com | grep spf

# DMARC
dig TXT _dmarc.forjadesistemas.com.br
dig TXT _dmarc.systemforge.it
dig TXT _dmarc.systemforgesoftware.com
```

## RFC 8058 (Worker EN)

O Worker EN envia headers `List-Unsubscribe` e `List-Unsubscribe-Post` em todos os emails,
conforme exigência Google/Yahoo 2024. Configurado em `workers/worker-en/src/email.ts`.

## Referências

- [Resend Domain Verification](https://resend.com/docs/dashboard/domains/introduction)
- [SPF Record Syntax](https://tools.ietf.org/html/rfc7208)
- [DMARC RFC 7489](https://tools.ietf.org/html/rfc7489)
- [RFC 8058 — One-Click Unsubscribe](https://tools.ietf.org/html/rfc8058)
