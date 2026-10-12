# Publishes the site to Cloudflare (gregstilepro.com).
# Run from anywhere:  powershell -File scripts\deploy.ps1
# Needs Node.js and a Cloudflare sign-in (run `npx wrangler login` once).
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

# Build dist\ from only the public site files
if (Test-Path dist) { Remove-Item -LiteralPath (Join-Path $PWD 'dist') -Recurse -Force -Confirm:$false }
New-Item -ItemType Directory dist | Out-Null
foreach ($f in 'index.html', '404.html', 'privacy.html', 'sitemap.xml', 'robots.txt', 'favicon.svg') { Copy-Item $f dist }
foreach ($d in 'css', 'js', 'assets') { Copy-Item $d dist -Recurse }

npx wrangler deploy
