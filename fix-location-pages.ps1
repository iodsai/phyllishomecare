$base = 'c:\Users\yawus\OneDrive\Documents\phyllishomecare'
$dirs = @(
    'home-care-camden-de','home-care-claymont-de','home-care-georgetown-de',
    'home-care-hockessin-de','home-care-laurel-de','home-care-middletown-de',
    'home-care-wilmington-de','in-home-care-bear-de','in-home-care-bridgeville-de',
    'in-home-care-lewes-de','in-home-care-milford-de','in-home-care-millsboro-de',
    'in-home-care-smyrna-de','senior-care-dover-de','senior-care-elsmere-de',
    'senior-care-harrington-de','senior-care-new-castle-de','senior-care-newark-de',
    'senior-care-rehoboth-beach-de','senior-care-seaford-de'
)

$ogBlock = '<link rel="apple-touch-icon" href="/favicon.svg"><meta property="og:type" content="website"><meta property="og:image" content="https://phyllishomecare.com/images/hero.webp"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:site_name" content="Phyllis Homecare"><meta property="og:locale" content="en_US"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://phyllishomecare.com/images/hero.webp"><meta http-equiv="X-Content-Type-Options" content="nosniff"><meta name="referrer" content="strict-origin-when-cross-origin">'

foreach ($d in $dirs) {
    $f = Join-Path $base "$d\index.html"
    $c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

    # Fix CSS/JS version strings
    $c = $c -replace 'href="/css/style\.css"',  'href="/css/style.css?v=20260307"'
    $c = $c -replace 'href="/css/pages\.css"',  'href="/css/pages.css?v=20260307"'
    $c = $c -replace 'src="/js/main\.js" defer','src="/js/main.js?v=20260307" defer'

    # Fix CTA button: /contact/ -> /intake.html
    $c = $c -replace 'href="/contact/" class="btn btn--white btn--lg"','href="/intake.html" class="btn btn--white btn--lg"'

    # Add OG/security meta after canonical (only if not already present)
    if ($c -notmatch 'og:image') {
        $c = $c -replace '(<link rel="canonical"[^>]+>)', "`$1`n    $ogBlock"
    }

    [System.IO.File]::WriteAllText($f, $c, [System.Text.Encoding]::UTF8)
    Write-Host "Fixed: $d"
}
Write-Host "All 20 location pages updated."
