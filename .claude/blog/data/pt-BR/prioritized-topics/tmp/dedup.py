#!/usr/bin/env python3
import json
import os
import re
import glob
from collections import defaultdict

LOCALE = "pt-BR"
BLOG_CONTENT_PATH = "output/workspace/system-forge-landing-page/content/pt-BR/blog"
BLOG_DATA_PATH = ".claude/blog/data/pt-BR"
STOCKPILE_DIR = ".claude/blog/data/stockpile/packages"

def extract_frontmatter_mdx(filepath):
    """Extract frontmatter from mdx file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return {}
    fm_text = match.group(1)
    result = {}
    for line in fm_text.split('\n'):
        if ':' in line and not line.startswith('#'):
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key in ('tags', 'relatedService'):
                try:
                    result[key] = json.loads(val.replace("'", '"'))
                except:
                    result[key] = val
            else:
                result[key] = val
    return result

def extract_title_md(filepath):
    """Extract first H1 from markdown"""
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('# '):
                return line[2:].strip()
    return ""

def load_inventory():
    existente = []
    for filepath in glob.glob(os.path.join(BLOG_CONTENT_PATH, "*.mdx")):
        slug = os.path.splitext(os.path.basename(filepath))[0]
        fm = extract_frontmatter_mdx(filepath)
        existente.append({
            "slug": slug,
            "title": fm.get("title", ""),
            "description": fm.get("description", ""),
            "tags": fm.get("tags", []),
        })

    gerado = []
    for filepath in glob.glob(os.path.join(BLOG_DATA_PATH, "reviewed", "*.md")):
        slug = os.path.splitext(os.path.basename(filepath))[0]
        title = extract_title_md(filepath)
        gerado.append({"slug": slug, "title": title, "source": "reviewed"})
    for filepath in glob.glob(os.path.join(BLOG_DATA_PATH, "drafts", "*.md")):
        slug = os.path.splitext(os.path.basename(filepath))[0]
        title = extract_title_md(filepath)
        gerado.append({"slug": slug, "title": title, "source": "drafts"})

    stockpile = []
    if os.path.isdir(STOCKPILE_DIR):
        for pkg_dir in glob.glob(os.path.join(STOCKPILE_DIR, "*")):
            if not os.path.isdir(pkg_dir):
                continue
            eqid = os.path.basename(pkg_dir)
            meta_path = os.path.join(pkg_dir, LOCALE, "metadata.json")
            pkgjson_path = os.path.join(pkg_dir, "package.json")
            if os.path.exists(meta_path) and os.path.exists(pkgjson_path):
                with open(meta_path, 'r', encoding='utf-8') as f:
                    meta = json.load(f)
                with open(pkgjson_path, 'r', encoding='utf-8') as f:
                    pkg = json.load(f)
                pstate = pkg.get("promotion_state", "available")
                stockpile.append({
                    "slug": meta.get("slug", ""),
                    "title": meta.get("title", ""),
                    "equivalence_id": eqid,
                    "promotion_state": pstate,
                })

    return existente, gerado, stockpile

def normalize_words(s):
    """Return set of significant words (length >= 3) from string"""
    words = re.findall(r'[a-zA-Z0-9\u00C0-\u00FF]+', s.lower())
    return {w for w in words if len(w) >= 3}

def normalize_slug(s):
    return s.lower().strip().replace(" ", "-")

def slug_match(a, b):
    return normalize_slug(a) == normalize_slug(b)

def keyword_in_title_strict(keyword, title):
    """Check if the keyword (or its core words) appears in the title"""
    kw_words = normalize_words(keyword)
    title_words = normalize_words(title)
    if not kw_words:
        return False
    # Require at least 70% of keyword words to appear in title
    overlap = kw_words.intersection(title_words)
    return len(overlap) / len(kw_words) >= 0.7

def shared_keywords_ratio(kws1, kws2):
    """Return overlap ratio of significant words between two lists of strings"""
    set1 = set()
    for k in kws1:
        set1.update(normalize_words(k))
    set2 = set()
    for k in kws2:
        set2.update(normalize_words(k))
    if not set1 or not set2:
        return 0.0
    inter = set1.intersection(set2)
    return len(inter) / max(len(set1), len(set2))

def classify_cluster(cluster, existente, gerado, stockpile):
    slug = cluster.get("slug", "")
    keyword_principal = cluster.get("keyword_principal", "")
    keywords_secundarias = cluster.get("keywords_secundarias", [])
    all_keywords = [keyword_principal] + keywords_secundarias
    cluster_id = cluster.get("cluster_id", "")

    # 1. Exact slug match with existente
    for art in existente:
        if slug_match(slug, art["slug"]):
            return {
                "classification": "JA_COBERTO",
                "action": "skip",
                "details": f"Slug identico ao artigo publicado: {art['slug']}",
                "existing_slug": art["slug"],
                "stockpile_equivalence_id": None,
                "stockpile_promotion_state": None,
            }

    # 2. Keyword principal strongly present in existente title
    for art in existente:
        if keyword_in_title_strict(keyword_principal, art["title"]):
            return {
                "classification": "JA_COBERTO",
                "action": "skip",
                "details": f"Keyword principal '{keyword_principal}' coberta pelo artigo existente: {art['slug']}",
                "existing_slug": art["slug"],
                "stockpile_equivalence_id": None,
                "stockpile_promotion_state": None,
            }

    # 3. High keyword overlap with existente (tags + title + description)
    for art in existente:
        art_texts = [art["title"], art["description"]]
        art_tags = art.get("tags", [])
        if isinstance(art_tags, list):
            art_texts.extend(art_tags)
        elif isinstance(art_tags, str):
            art_texts.append(art_tags)
        overlap = shared_keywords_ratio(all_keywords, art_texts)
        if overlap >= 0.7:
            return {
                "classification": "JA_COBERTO",
                "action": "skip",
                "details": f"Intencao muito similar ({overlap:.0%} overlap) ao artigo existente: {art['slug']}",
                "existing_slug": art["slug"],
                "stockpile_equivalence_id": None,
                "stockpile_promotion_state": None,
            }
        elif overlap >= 0.45:
            return {
                "classification": "EXPANDIR",
                "action": "expandir",
                "details": f"Artigo existente cobre parcialmente ({overlap:.0%} overlap): {art['slug']}",
                "existing_slug": art["slug"],
                "stockpile_equivalence_id": None,
                "stockpile_promotion_state": None,
            }

    # 4. Exact slug match with gerado
    for art in gerado:
        if slug_match(slug, art["slug"]):
            return {
                "classification": "JA_GERADO",
                "action": "skip",
                "details": f"Slug identico em {art['source']}: {art['slug']}",
                "existing_slug": art["slug"],
                "stockpile_equivalence_id": None,
                "stockpile_promotion_state": None,
            }

    # 5. Intent match with gerado
    for art in gerado:
        if keyword_in_title_strict(keyword_principal, art["title"]):
            return {
                "classification": "FUNDIR",
                "action": "merge",
                "details": f"Intencao similar em {art['source']}: {art['slug']}",
                "existing_slug": art["slug"],
                "stockpile_equivalence_id": None,
                "stockpile_promotion_state": None,
            }

    # 6. Exact slug match with stockpile
    for art in stockpile:
        if slug_match(slug, art["slug"]):
            return {
                "classification": "JA_NO_ESTOQUE",
                "action": "skip",
                "details": f"Slug identico no stockpile ({art['promotion_state']}): {art['slug']}",
                "existing_slug": None,
                "stockpile_equivalence_id": art["equivalence_id"],
                "stockpile_promotion_state": art["promotion_state"],
            }

    # 7. Intent match with stockpile
    for art in stockpile:
        sp_texts = [art["title"], art["slug"].replace("-", " ")]
        overlap = shared_keywords_ratio(all_keywords, sp_texts)
        if overlap >= 0.6:
            return {
                "classification": "JA_NO_ESTOQUE",
                "action": "skip",
                "details": f"Intencao identica no stockpile ({art['promotion_state']}): {art['slug']}",
                "existing_slug": None,
                "stockpile_equivalence_id": art["equivalence_id"],
                "stockpile_promotion_state": art["promotion_state"],
            }

    # Default: NOVO
    return {
        "classification": "NOVO",
        "action": "gerar",
        "details": "Intencao nao coberta por nenhum artigo existente, gerado ou no estoque",
        "existing_slug": None,
        "stockpile_equivalence_id": None,
        "stockpile_promotion_state": None,
    }

def main():
    print("Locale ativo: pt-BR — Brasil (Português Brasileiro)")
    print("Carregando inventarios...")
    existente, gerado, stockpile = load_inventory()
    print(f"  Artigos publicados: {len(existente)}")
    print(f"  Artigos gerados: {len(gerado)}")
    print(f"  Pacotes no stockpile: {len(stockpile)}")

    with open(os.path.join(BLOG_DATA_PATH, "prioritized-topics", "prioritized-topics.json"), 'r', encoding='utf-8') as f:
        clusters = json.load(f)
    print(f"Clusters priorizados: {len(clusters)}")

    results = []
    expansions = []
    merges = []

    for cluster in clusters:
        res = classify_cluster(cluster, existente, gerado, stockpile)
        entry = {
            "cluster_id": cluster.get("cluster_id", ""),
            "classification": res["classification"],
            "action": res["action"],
            "details": res["details"],
            "stockpile_equivalence_id": res["stockpile_equivalence_id"],
            "stockpile_promotion_state": res["stockpile_promotion_state"],
        }
        results.append(entry)

        if res["classification"] == "EXPANDIR":
            existing_title = next((a["title"] for a in existente if a["slug"] == res["existing_slug"]), "")
            expansions.append({
                "cluster_id": cluster.get("cluster_id", ""),
                "action": "EXPANDIR",
                "existing_slug": res["existing_slug"],
                "existing_title": existing_title,
                "sections_to_add": [f"H2: {cluster.get('keyword_principal', '')}"],
                "keywords_to_incorporate": [cluster.get("keyword_principal", "")] + cluster.get("keywords_secundarias", [])[:2],
                "justification": res["details"],
            })
        elif res["classification"] == "FUNDIR":
            merges.append({
                "cluster_id": cluster.get("cluster_id", ""),
                "merge_target_slug": res["existing_slug"],
                "justification": res["details"],
            })

    counts = defaultdict(int)
    for r in results:
        counts[r["classification"]] += 1

    output = {
        "locale": LOCALE,
        "total_clusters_avaliados": len(clusters),
        "novos": counts.get("NOVO", 0),
        "ja_cobertos": counts.get("JA_COBERTO", 0),
        "expandir": counts.get("EXPANDIR", 0),
        "fundir": counts.get("FUNDIR", 0),
        "ja_gerados": counts.get("JA_GERADO", 0),
        "ja_no_estoque": counts.get("JA_NO_ESTOQUE", 0),
        "clusters": results,
        "expansions": expansions,
        "merges": merges,
    }

    out_path = os.path.join(BLOG_DATA_PATH, "prioritized-topics", "deduplicated-topics.json")
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n## Resultado da Deduplicacao ({LOCALE})")
    print(f"- Locale: {LOCALE} — Brasil (Português Brasileiro)")
    print(f"- Clusters avaliados: {len(clusters)}")
    print(f"- NOVOS (gerar artigo): {counts.get('NOVO', 0)}")
    print(f"- JA COBERTOS (skip): {counts.get('JA_COBERTO', 0)}")
    print(f"- EXPANDIR (atualizar existente): {counts.get('EXPANDIR', 0)}")
    print(f"- FUNDIR (merge clusters): {counts.get('FUNDIR', 0)}")
    print(f"- JA GERADOS (skip): {counts.get('JA_GERADO', 0)}")
    print(f"- JA NO ESTOQUE (skip): {counts.get('JA_NO_ESTOQUE', 0)}")
    if len(clusters) > 0:
        print(f"- Taxa de aproveitamento: {counts.get('NOVO',0)/len(clusters)*100:.1f}%")
    print(f"\nArquivo salvo em: {out_path}")

if __name__ == "__main__":
    main()
