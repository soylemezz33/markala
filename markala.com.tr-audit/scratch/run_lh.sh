#!/bin/bash
set -e
declare -A urls=(
  [home]="https://markala.com.tr/"
  [category]="https://markala.com.tr/kategori/vinil-branda-afis"
  [product]="https://markala.com.tr/urun/yelken-bayrak-damla"
  [guide]="https://markala.com.tr/rehber/isg-zorunlu-uyari-levhalari"
)
for name in "${!urls[@]}"; do
  url="${urls[$name]}"
  if [ "$name" != "home" ]; then
    npx lighthouse "$url" --output json --output-path "scratch/lh/${name}-mobile.json" --preset=perf --form-factor=mobile --screenEmulation.mobile --throttling-method=simulate --only-categories=performance --chrome-flags="--headless=new --no-sandbox" --quiet > "scratch/lh/${name}-mobile.log" 2>&1 || true
  fi
  npx lighthouse "$url" --output json --output-path "scratch/lh/${name}-desktop.json" --preset=desktop --throttling-method=simulate --only-categories=performance --chrome-flags="--headless=new --no-sandbox" --quiet > "scratch/lh/${name}-desktop.log" 2>&1 || true
done
echo "ALL_DONE"
