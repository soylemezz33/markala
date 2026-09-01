import sys, json, os
sys.path.insert(0, r"C:\Users\Administrator\.claude\skills\claude-seo\scripts")
from render_page import render_page

urls = [l.strip() for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
out_dir = sys.argv[2]
os.makedirs(out_dir, exist_ok=True)

results = []
for u in urls:
    try:
        res = render_page(u, mode="auto", extract_content=True)
        text = res.get("extracted_text") or ""
        pub = res.get("publication_date")
        wc = len(text.split())
        fname = u.rstrip("/").split("/")[-1] or "index"
        with open(os.path.join(out_dir, fname + ".txt"), "w", encoding="utf-8") as f:
            f.write(text)
        results.append({"url": u, "word_count": wc, "publication_date": str(pub), "error": res.get("error")})
        print(f"{wc:5d} words  {u}", file=sys.stderr)
    except Exception as e:
        results.append({"url": u, "error": str(e)})
        print(f"ERROR {u}: {e}", file=sys.stderr)

with open(os.path.join(out_dir, "_summary.json"), "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
