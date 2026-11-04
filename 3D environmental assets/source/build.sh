#!/bin/sh
# builds the models into out/, then the two pages: out/pieces.html and out/forest.html
set -e
cd "$(dirname "$0")"
rm -rf out && node gen/build.mjs out
node gen/data.mjs out
for p in pieces forest; do
  [ -f viewer/src/$p.js ] || continue
  npx esbuild viewer/src/$p.js --bundle --minify --format=iife --log-level=warning --outfile=viewer/dist/$p.js
  node -e "const fs=require('fs');const css=fs.readFileSync('viewer/shell/style.css','utf8'),h=fs.readFileSync('viewer/shell/$p.html','utf8'),j=fs.readFileSync('viewer/dist/$p.js','utf8').replace(/<\/script/gi,'<\\\\/script');fs.writeFileSync('out/$p.html',h.replace('/*CSS*/',()=>css).replace('<!--APP-->',()=>'<script>'+j+'</script>'))"
  ls -la out/$p.html | awk '{print $9, $5, "bytes"}'
done
