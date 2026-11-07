<#
.SYNOPSIS
    Deployt den Bild-Zuschneider per SSH auf den VPS (kodinitools.com/bild-zuschneider/).

.DESCRIPTION
    Laedt die Deploy-Skripte per scp hoch und fuehrt sie auf dem Server aus:
      -Setup  (einmalig)  deploy/server-setup.sh: nginx-Snippet installieren, Include
                          per sed einfuegen, Ordner anlegen, nginx -t, Reload
                          (bei Fehler automatischer Rollback)
      immer               deploy.sh: Repo nach /opt/bild-zuschneider holen, bauen,
                          Backup, dist/ per rsync nach /var/www/kodinitools.com/bild-zuschneider
    Danach wird die Seite per HTTPS geprueft.

    Laeuft mit Windows PowerShell 5.1 und PowerShell 7. Benoetigt ssh/scp (OpenSSH,
    in Windows 10/11 enthalten) und einen SSH-Schluessel fuer den Server.

.EXAMPLE
    .\deploy-to-server.ps1 -Server 203.0.113.10 -Setup     # erstes Mal
.EXAMPLE
    .\deploy-to-server.ps1 -Server 203.0.113.10            # jedes weitere Deployment
.EXAMPLE
    .\deploy-to-server.ps1 -Server 203.0.113.10 -DryRun    # nur anzeigen, was passieren wuerde
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Server,

    [string]$User = "root",

    [int]$Port = 22,

    # Einmalige Einrichtung: nginx-Snippet + Include + Zielordner
    [switch]$Setup,

    # deploy.sh --dry-run: baut, zeigt Aenderungen, veroeffentlicht nichts
    [switch]$DryRun,

    [string]$Branch = "main",

    [string]$CheckUrl = "https://kodinitools.com/bild-zuschneider/",

    [switch]$SkipCheck
)

$ErrorActionPreference = "Stop"
$RemoteDir = "/tmp/bild-zuschneider-deploy"
$Target = "$User@$Server"
$SshOpts = @("-p", "$Port", "-o", "ConnectTimeout=10")
$ScpOpts = @("-P", "$Port", "-o", "ConnectTimeout=10")
# Nicht-root-Benutzer brauchen sudo (Passwortabfrage -> Terminal mit -t)
$Sudo = ""
if ($User -ne "root") {
    $Sudo = "sudo "
    $SshOpts += "-t"
}

function Write-Step([string]$Text) { Write-Host "`n==> $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host "    OK  $Text" -ForegroundColor Green }
function Fail([string]$Text) {
    Write-Host "`nFEHLER: $Text`n" -ForegroundColor Red
    exit 1
}

# Fuehrt einen Befehl auf dem Server aus und bricht bei Fehler ab
function Invoke-Remote([string]$Command, [string]$What) {
    & ssh @SshOpts $Target $Command
    if ($LASTEXITCODE -ne 0) { Fail "$What (Exit-Code $LASTEXITCODE)" }
}

# --- Vorbereitung -------------------------------------------------------
$Root = $PSScriptRoot
$Files = @("$Root/deploy.sh")
if ($Setup) {
    $Files += "$Root/deploy/server-setup.sh"
    $Files += "$Root/deploy/nginx-bild-zuschneider.conf"
}
foreach ($f in $Files) {
    if (-not (Test-Path $f)) { Fail "Datei fehlt: $f" }
}
foreach ($cmd in @("ssh", "scp")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Fail "'$cmd' nicht gefunden. OpenSSH-Client installieren (Windows: Optionale Features)."
    }
}

Write-Host "`n========================================"
Write-Host "   BILD-ZUSCHNEIDER DEPLOYMENT"
Write-Host "========================================"
Write-Host "Server : $Target (Port $Port)"
Write-Host "Branch : $Branch"
Write-Host "Setup  : $($Setup.IsPresent)"
Write-Host "DryRun : $($DryRun.IsPresent)"

# --- Verbindung ---------------------------------------------------------
Write-Step "Teste SSH-Verbindung"
& ssh -p $Port -o ConnectTimeout=10 -o BatchMode=yes $Target "echo OK" | Out-Null
if ($LASTEXITCODE -ne 0) {
    Fail "Keine SSH-Verbindung zu $Target. Server, Benutzer und SSH-Schluessel pruefen."
}
Write-Ok "Verbunden"

# --- Hochladen ----------------------------------------------------------
Write-Step "Lade Deploy-Skripte hoch"
Invoke-Remote "rm -rf $RemoteDir && mkdir -p $RemoteDir" "Temp-Ordner anlegen"
& scp @ScpOpts @Files "${Target}:$RemoteDir/"
if ($LASTEXITCODE -ne 0) { Fail "Upload fehlgeschlagen" }
# Falls Git unter Windows CRLF ausgecheckt hat: auf dem Server auf LF umstellen
Invoke-Remote "sed -i 's/\r$//' $RemoteDir/* && chmod +x $RemoteDir/*.sh" "Zeilenenden umstellen"
Write-Ok "$($Files.Count) Datei(en) nach $RemoteDir"

# --- Einrichtung (einmalig) --------------------------------------------
if ($Setup) {
    Write-Step "Einrichtung: nginx-Snippet und Zielordner"
    Invoke-Remote "${Sudo}bash $RemoteDir/server-setup.sh $RemoteDir/nginx-bild-zuschneider.conf" "Einrichtung"
}

# --- Deployment ---------------------------------------------------------
Write-Step "Deployment (deploy.sh)"
$DeployArgs = ""
if ($DryRun) { $DeployArgs = "--dry-run" }
Invoke-Remote "${Sudo}env BRANCH=$Branch bash $RemoteDir/deploy.sh $DeployArgs" "Deployment"

Invoke-Remote "rm -rf $RemoteDir" "Aufraeumen"

# --- Pruefung -----------------------------------------------------------
if ($DryRun -or $SkipCheck) {
    Write-Host "`nPruefung uebersprungen.`n"
    exit 0
}

Write-Step "Pruefe $CheckUrl"
$Checks = @("", "guide", "faq?lang=en")
foreach ($path in $Checks) {
    $url = "$CheckUrl$path"
    try {
        $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20
    } catch {
        Fail "$url nicht erreichbar: $($_.Exception.Message)"
    }
    if ($res.StatusCode -ne 200 -or $res.Content -notmatch 'id="overlay-root"') {
        Fail "$url liefert nicht die App (Status $($res.StatusCode))"
    }
    if ($res.Content -match '<!--#include') {
        Fail "${url}: SSI wird nicht ausgewertet (Nav/Footer fehlen)"
    }
    Write-Ok "$url"
}

Write-Host "`n========================================"
Write-Host "   DEPLOYMENT ERFOLGREICH"
Write-Host "========================================"
Write-Host "$CheckUrl`n"
