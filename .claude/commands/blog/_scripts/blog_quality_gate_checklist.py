#!/usr/bin/env python3
"""Blog Quality Gate Checklist — valida artigos reviewed.md pre-publicacao."""

import argparse
import json
import os
import re
import sys
from pathlib import Path

import yaml


def parse_args():
    parser = argparse.ArgumentParser(description="Blog Quality Gate Checklist")
    parser.add_argument("--input", required=True, help="Input path")
    parser.add_argument("--mode", default="default", choices=["default", "stockpile", "promote"])
    parser.add_argument("--locale", required=True, help="Locale code")
    parser.add_argument("--format", default="json", choices=["json"])
    return parser.parse_args()


def load_config(cwd):
    config_path = os.path.join(cwd, ".claude", "blog", "config.json")
    with open(config_path) as f:
        return json.load(f)


def find_articles(input_path, mode, locale, cwd):
    articles = []
    if mode == "stockpile":
        stockpile_root = os.path.join(cwd, ".claude", "blog", "data", "stockpile", "packages")
        if os.path.isdir(stockpile_root):
            pattern = os.path.join(stockpile_root, "*", locale, "reviewed.md")
            for path in Path(stockpile_root).glob(f"*/{locale}/reviewed.md"):
                articles.append(str(path))
    else:
        reviewed_dir = os.path.join(cwd, input_path, "reviewed")
        if os.path.isdir(reviewed_dir):
            for path in Path(reviewed_dir).glob("*.md"):
                articles.append(str(path))
    return sorted(articles)


def extract_frontmatter(content):
    match = re.match(r'^---\n(.*?)\n---\n', content, re.DOTALL)
    if not match:
        return None, content
    try:
        fm = yaml.safe_load(match.group(1))
        body = content[match.end():]
        return fm, body
    except yaml.YAMLError:
        return None, content


def is_kebab_case(s):
    if not s:
        return False
    return re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', s) is not None


def count_faq(body):
    return len(re.findall(r'^### ', body, re.MULTILINE))


def has_direct_answer(body, min_words=100):
    words = body.split()
    first_100 = ' '.join(words[:min_words])
    # Deve ter dados concretos (numeros, moedas, prazos)
    has_numbers = bool(re.search(r'\d', first_100))
    has_currency = bool(re.search(r'[\$\€\£\¥]|R\$', first_100))
    return has_numbers or has_currency


def has_cta(body, cta_patterns):
    lower = body.lower()
    for pattern in cta_patterns:
        if pattern.lower() in lower:
            return True
    # Verificar links WhatsApp
    if re.search(r'wa\.me/\d+', body):
        return True
    if re.search(r'whatsapp', lower):
        return True
    return False


def check_currency(body, currency_symbol):
    # Verificar se a moeda correta aparece no corpo
    return currency_symbol in body


def check_locale_language(body, locale):
    # Heuristica simples: verificar palavras comuns por locale
    checks = {
        "pt-BR": ["você", "pra", "não", "mais", "como"],
        "it-IT": ["che", "non", "per", "con", "una"],
        "en": ["the", "and", "you", "for", "that"],
        "es-ES": ["que", "no", "para", "con", "una"],
    }
    words = checks.get(locale, [])
    if not words:
        return True
    lower = body.lower()
    found = sum(1 for w in words if w in lower)
    return found >= 3


def validate_article(path, mode, locale, config):
    with open(path) as f:
        content = f.read()

    fm, body = extract_frontmatter(content)
    results = []
    critical_fails = []

    if fm is None:
        results.append({"check": "frontmatter_valid", "status": "FAIL", "reason": "YAML invalido ou ausente"})
        critical_fails.append("frontmatter_invalid")
        return {"path": path, "slug": "unknown", "status": "RETIDO", "checks": results, "critical_fails": critical_fails}

    slug = fm.get("slug", "")
    publish_rules = config.get("publish_rules", {})
    min_words = publish_rules.get("min_word_count", 1200)
    require_faq = publish_rules.get("require_faq", True)
    require_meta = publish_rules.get("require_meta_description", True)
    require_cta = publish_rules.get("require_cta", True)
    require_author = publish_rules.get("require_author", True)
    require_related = publish_rules.get("require_related_service", True)
    min_internal_links = publish_rules.get("require_internal_links", 3)

    locale_config = config.get("locales", {}).get(locale, {})
    currency_symbol = locale_config.get("currency_symbol", "")
    cta_modes = locale_config.get("cta_modes", [])
    cta_labels = [m.get("label", "") for m in cta_modes]

    # 1. frontmatter completo
    required_fm = ["title", "slug", "description", "date", "locale", "author", "tags", "relatedService", "canonical"]
    if mode == "stockpile":
        required_fm.extend(["brief", "equivalence_id", "approved", "seo_score", "conversion_score"])
    missing = [f for f in required_fm if f not in fm]
    if missing:
        results.append({"check": "frontmatter_complete", "status": "FAIL", "reason": f"Campos ausentes: {', '.join(missing)}"})
        critical_fails.append("frontmeter_incomplete")
    else:
        results.append({"check": "frontmatter_complete", "status": "PASS"})

    # 2. approved
    if not fm.get("approved", False):
        results.append({"check": "approved", "status": "FAIL", "reason": "approved != true"})
        critical_fails.append("not_approved")
    else:
        results.append({"check": "approved", "status": "PASS"})

    # 3. word count
    body_words = len(body.split())
    if body_words < min_words:
        results.append({"check": "word_count", "status": "FAIL", "reason": f"{body_words} < {min_words}"})
        critical_fails.append("word_count_low")
    else:
        results.append({"check": "word_count", "status": "PASS", "detail": f"{body_words} palavras"})

    # 4. FAQ
    faq_count = count_faq(body)
    if require_faq and faq_count < 5:
        results.append({"check": "faq", "status": "FAIL", "reason": f"{faq_count} FAQs (min 5)"})
        critical_fails.append("faq_missing")
    else:
        results.append({"check": "faq", "status": "PASS", "detail": f"{faq_count} FAQs"})

    # 5. CTA
    if require_cta and not has_cta(body, cta_labels):
        results.append({"check": "cta", "status": "FAIL", "reason": "CTA nao encontrado"})
        critical_fails.append("cta_missing")
    else:
        results.append({"check": "cta", "status": "PASS"})

    # 6. slug kebab-case
    if not is_kebab_case(slug):
        results.append({"check": "slug_format", "status": "FAIL", "reason": f"slug '{slug}' nao e kebab-case"})
        critical_fails.append("slug_invalid")
    else:
        results.append({"check": "slug_format", "status": "PASS"})

    # 7. locale correto
    if fm.get("locale") != locale:
        results.append({"check": "locale", "status": "FAIL", "reason": f"locale={fm.get('locale')} != {locale}"})
        critical_fails.append("locale_mismatch")
    else:
        results.append({"check": "locale", "status": "PASS"})

    # 8. idioma
    if not check_locale_language(body, locale):
        results.append({"check": "language", "status": "WARN", "reason": "Possivel traducao literal detectada"})
    else:
        results.append({"check": "language", "status": "PASS"})

    # 9. moeda
    if currency_symbol and not check_currency(body, currency_symbol):
        results.append({"check": "currency", "status": "FAIL", "reason": f"Moeda {currency_symbol} nao encontrada"})
        critical_fails.append("currency_wrong")
    else:
        results.append({"check": "currency", "status": "PASS"})

    # 10. resposta direta
    if not has_direct_answer(body):
        results.append({"check": "direct_answer", "status": "FAIL", "reason": "Sem resposta direta nos primeiros 100 palavras"})
        critical_fails.append("no_direct_answer")
    else:
        results.append({"check": "direct_answer", "status": "PASS"})

    # 11. meta description
    desc = fm.get("description", "")
    if require_meta and len(desc) > 160:
        results.append({"check": "meta_description", "status": "FAIL", "reason": f"Description {len(desc)} chars (max 160)"})
        critical_fails.append("meta_too_long")
    else:
        results.append({"check": "meta_description", "status": "PASS", "detail": f"{len(desc)} chars"})

    # 12. author
    if require_author and not fm.get("author"):
        results.append({"check": "author", "status": "FAIL", "reason": "Author ausente"})
        critical_fails.append("author_missing")
    else:
        results.append({"check": "author", "status": "PASS"})

    # 13. tags
    tags = fm.get("tags", [])
    if not tags or len(tags) > 10:
        results.append({"check": "tags", "status": "FAIL", "reason": f"{len(tags)} tags (min 1, max 10)"})
        critical_fails.append("tags_invalid")
    else:
        results.append({"check": "tags", "status": "PASS", "detail": f"{len(tags)} tags"})

    # 14. relatedService
    if require_related and not fm.get("relatedService"):
        results.append({"check": "related_service", "status": "FAIL", "reason": "relatedService ausente"})
        critical_fails.append("related_service_missing")
    else:
        results.append({"check": "related_service", "status": "PASS"})

    # 15. internal links (DESABILITADO em stockpile)
    if mode != "stockpile":
        internal_links = len(re.findall(r'\[.*?\]\(/blog/.*?\)', body)) + len(re.findall(r'\[.*?\]\(/servicios/.*?\)', body)) + len(re.findall(r'\[.*?\]\(/services/.*?\)', body)) + len(re.findall(r'\[.*?\]\(/servizi/.*?\)', body))
        if internal_links < min_internal_links:
            results.append({"check": "internal_links", "status": "FAIL", "reason": f"{internal_links} links (min {min_internal_links})"})
            critical_fails.append("internal_links_low")
        else:
            results.append({"check": "internal_links", "status": "PASS", "detail": f"{internal_links} links"})
    else:
        results.append({"check": "internal_links", "status": "SKIP", "reason": "Desabilitado em stockpile"})

    # 16. scores >= thresholds
    thresholds = config.get("quality_thresholds", {})
    auto_hold = thresholds.get("auto_hold_below", 6)
    scores = {
        "seo": fm.get("seo_score", 0),
        "conversion": fm.get("conversion_score", 0),
        "authority": fm.get("authority_score", 0),
        "uniqueness": fm.get("uniqueness_score", 0),
    }
    low_scores = [k for k, v in scores.items() if v < auto_hold]
    if low_scores:
        results.append({"check": "quality_scores", "status": "FAIL", "reason": f"Scores abaixo de {auto_hold}: {', '.join(low_scores)}"})
        critical_fails.append("quality_scores_low")
    else:
        results.append({"check": "quality_scores", "status": "PASS"})

    # Classificar
    fail_count = sum(1 for r in results if r["status"] == "FAIL")
    if critical_fails or fail_count >= 3:
        status = "RETIDO"
    elif fail_count >= 1:
        status = "APROVADO_COM_RESSALVAS"
    else:
        status = "APROVADO"

    return {
        "path": path,
        "slug": slug,
        "status": status,
        "checks": results,
        "critical_fails": critical_fails,
        "word_count": body_words,
    }


def main():
    args = parse_args()
    cwd = os.getcwd()

    try:
        config = load_config(cwd)
    except Exception as e:
        print(json.dumps({"error": f"Config load failed: {e}"}), file=sys.stderr)
        sys.exit(1)

    if args.locale not in config.get("supported_locales", []):
        print(json.dumps({"error": f"Locale {args.locale} not supported"}), file=sys.stderr)
        sys.exit(1)

    articles = find_articles(args.input, args.mode, args.locale, cwd)

    results = []
    summary = {"aprovado": 0, "com_ressalvas": 0, "retido": 0, "total": len(articles)}
    all_critical_fails = []

    for path in articles:
        result = validate_article(path, args.mode, args.locale, config)
        results.append(result)
        if result["status"] == "APROVADO":
            summary["aprovado"] += 1
        elif result["status"] == "APROVADO_COM_RESSALVAS":
            summary["com_ressalvas"] += 1
        else:
            summary["retido"] += 1
        all_critical_fails.extend(result["critical_fails"])

    output = {
        "articles": results,
        "summary": summary,
        "critical_fails": all_critical_fails,
    }

    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
