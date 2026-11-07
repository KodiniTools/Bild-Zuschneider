#!/usr/bin/env bash
#
# deploy.sh – Deployment des Bild-Zuschneiders direkt aus dem Git-Repository.
#
# Wird AUF DEM VPS ausgeführt: holt den aktuellen Stand vom Branch, baut ihn
# in einem separaten Build-Verzeichnis und veröffentlicht nur das fertige
# dist/ im Webroot.
#
#   sudo ./deploy.sh              # ohne Rückfrage (Löschliste wird nur angezeigt)
#   sudo ./deploy.sh --ask        # mit Rückfrage vor dem Löschen
#   sudo ./deploy.sh --dry-run    # zeigt nur, was passieren würde
#   sudo BRANCH=develop ./deploy.sh
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Konfiguration (per Umgebungsvariable überschreibbar)
# ---------------------------------------------------------------------------
REPO_URL="${REPO_URL:-https://github.com/KodiniTools/Bild-Zuschneider.git}"
BRANCH="${BRANCH:-main}"

# Arbeitsverzeichnis für Clone + Build – bewusst NICHT im Webroot,
# damit node_modules und Quellcode nicht öffentlich erreichbar sind.
BUILD_DIR="${BUILD_DIR:-/opt/bild-zuschneider}"

# Zielverzeichnis im Webroot (entspricht base: '/bild-zuschneider/' in vite.config.ts)
TARGET_DIR="${TARGET_DIR:-/var/www/kodinitools.com/bild-zuschneider}"

BACKUP_DIR="${BACKUP_DIR:-/var/backups/bild-zuschneider}"
KEEP_BACKUPS="${KEEP_BACKUPS:-5}"

WEB_USER="${WEB_USER:-www-data}"
WEB_GROUP="${WEB_GROUP:-www-data}"

RELOAD_NGINX="${RELOAD_NGINX:-1}"

# Pfade im Zielverzeichnis, die NICHT gelöscht werden dürfen (relativ zu TARGET_DIR).
# Wichtig, falls dort z. B. ein Backend oder Uploads liegen.
# Mehrere Einträge mit Leerzeichen trennen: RSYNC_EXCLUDES="api/ uploads/"
RSYNC_EXCLUDES="${RSYNC_EXCLUDES:-api/}"

# Standard: ohne Rückfrage. Vor jedem Deploy wird ohnehin ein Backup angelegt.
# Mit --ask oder ASSUME_YES=0 kommt die Rückfrage vor dem Löschen zurück.
ASSUME_YES="${ASSUME_YES:-1}"
DRY_RUN=0

# ---------------------------------------------------------------------------
# Argumente
# ---------------------------------------------------------------------------
while [ $# -gt 0 ]; do
  case "$1" in
    -y|--yes)     ASSUME_YES=1 ;;  # Standard, bleibt für bestehende Aufrufe gültig
    -a|--ask)     ASSUME_YES=0 ;;
    -n|--dry-run) DRY_RUN=1 ;;
    -b|--branch)  BRANCH="${2:?--branch benötigt einen Wert}"; shift ;;
    -h|--help)
      sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)
      echo "Unbekannte Option: $1 (siehe --help)" >&2
      exit 2 ;;
  esac
  shift
done

# ---------------------------------------------------------------------------
# Ausgabe-Helfer
# ---------------------------------------------------------------------------
GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
step() { printf "\n${CYAN}==> %s${NC}\n" "$*"; }
ok()   { printf "${GREEN}  ✓ %s${NC}\n" "$*"; }
warn() { printf "${YELLOW}  ! %s${NC}\n" "$*"; }
die()  { printf "${RED}  ✗ %s${NC}\n" "$*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Vorbedingungen
# ---------------------------------------------------------------------------
step "Prüfe Voraussetzungen"

case "$TARGET_DIR" in
  ""|"/"|"/var"|"/var/www") die "TARGET_DIR ist unsicher gesetzt: '$TARGET_DIR'" ;;
esac

for cmd in git node npm rsync; do
  command -v "$cmd" >/dev/null 2>&1 || die "'$cmd' ist nicht installiert."
done

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node.js 18+ erforderlich, gefunden: $(node -v)"
ok "Node $(node -v), npm $(npm -v), rsync vorhanden"

if [ "$(id -u)" -ne 0 ]; then
  warn "Läuft ohne root – Rechte setzen und nginx-Reload werden ggf. übersprungen."
fi

printf "\n  Repository : %s (%s)\n" "$REPO_URL" "$BRANCH"
printf "  Build-Dir  : %s\n"       "$BUILD_DIR"
printf "  Ziel       : %s\n"       "$TARGET_DIR"
[ "$DRY_RUN" -eq 1 ] && warn "DRY-RUN: es wird nichts verändert"

# ---------------------------------------------------------------------------
# Quellcode holen
# ---------------------------------------------------------------------------
step "Hole Quellcode ($BRANCH)"

if [ -d "$BUILD_DIR/.git" ]; then
  git -C "$BUILD_DIR" fetch --prune origin "$BRANCH"
  git -C "$BUILD_DIR" checkout -q "$BRANCH" 2>/dev/null || git -C "$BUILD_DIR" checkout -qb "$BRANCH" "origin/$BRANCH"
  # Harter Reset: der Build-Ordner ist eine Wegwerf-Kopie, keine Arbeitskopie.
  git -C "$BUILD_DIR" reset --hard "origin/$BRANCH"
  git -C "$BUILD_DIR" clean -fd
else
  [ -e "$BUILD_DIR" ] && [ -n "$(ls -A "$BUILD_DIR" 2>/dev/null)" ] &&
    die "$BUILD_DIR existiert, ist aber kein Git-Repo und nicht leer."
  mkdir -p "$BUILD_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$BUILD_DIR"
fi

COMMIT="$(git -C "$BUILD_DIR" rev-parse --short HEAD)"
SUBJECT="$(git -C "$BUILD_DIR" log -1 --pretty=%s)"
ok "Stand: $COMMIT – $SUBJECT"

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
step "Installiere Abhängigkeiten und baue"

cd "$BUILD_DIR"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  warn "package-lock.json fehlt – nutze 'npm install'"
  npm install --no-audit --no-fund
fi

npm run build

[ -f "$BUILD_DIR/dist/index.html" ] || die "Build fehlgeschlagen: dist/index.html fehlt."
[ -d "$BUILD_DIR/dist/assets" ]     || die "Build fehlgeschlagen: dist/assets fehlt."

# Der base-Pfad muss zum Zielverzeichnis passen, sonst laden die Assets nicht.
BASE_PATH="/$(basename "$TARGET_DIR")/"
if grep -q "src=\"$BASE_PATH" "$BUILD_DIR/dist/index.html"; then
  ok "Asset-Pfade passen zu $BASE_PATH"
else
  warn "dist/index.html referenziert nicht '$BASE_PATH' – base in vite.config.ts prüfen!"
fi
ok "Build fertig ($(du -sh "$BUILD_DIR/dist" | cut -f1))"

# ---------------------------------------------------------------------------
# Backup
# ---------------------------------------------------------------------------
if [ -d "$TARGET_DIR" ] && [ -n "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
  step "Sichere aktuellen Stand"
  STAMP="$(date +%Y%m%d_%H%M%S)"
  if [ "$DRY_RUN" -eq 1 ]; then
    warn "übersprungen (dry-run)"
  else
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/bild-zuschneider_$STAMP.tar.gz" -C "$TARGET_DIR" . 2>/dev/null
    ok "Backup: $BACKUP_DIR/bild-zuschneider_$STAMP.tar.gz"
    # Nur die letzten N Backups behalten
    ls -1t "$BACKUP_DIR"/bild-zuschneider_*.tar.gz 2>/dev/null |
      tail -n "+$((KEEP_BACKUPS + 1))" | xargs -r rm -f
  fi
fi

# ---------------------------------------------------------------------------
# Veröffentlichen
# ---------------------------------------------------------------------------
step "Veröffentliche nach $TARGET_DIR"

RSYNC_ARGS=(-a --delete --human-readable)
for pattern in $RSYNC_EXCLUDES; do
  RSYNC_ARGS+=(--exclude "$pattern")
  warn "ausgenommen (bleibt unangetastet): $pattern"
done

[ "$DRY_RUN" -eq 0 ] && mkdir -p "$TARGET_DIR"

# Erst zeigen, was gelöscht würde – Löschen ist nicht umkehrbar.
if [ -d "$TARGET_DIR" ]; then
  DELETIONS="$(rsync "${RSYNC_ARGS[@]}" --dry-run --out-format='%o %n' \
    "$BUILD_DIR/dist/" "$TARGET_DIR/" 2>/dev/null | grep '^del\.' || true)"
  if [ -n "$DELETIONS" ]; then
    COUNT="$(printf '%s\n' "$DELETIONS" | wc -l)"
    printf "\n  %s Datei(en)/Ordner werden im Ziel gelöscht:\n" "$COUNT"
    printf '%s\n' "$DELETIONS" | head -20 | sed 's/^/    /'
    [ "$COUNT" -gt 20 ] && printf "    … und %s weitere\n" "$((COUNT - 20))"
    if [ "$DRY_RUN" -eq 0 ] && [ "$ASSUME_YES" -eq 0 ]; then
      printf "\n  Fortfahren? [j/N] "
      read -r answer </dev/tty
      case "$answer" in [jJyY]*) ;; *) die "Abgebrochen." ;; esac
    fi
  fi
fi

if [ "$DRY_RUN" -eq 1 ]; then
  rsync "${RSYNC_ARGS[@]}" --dry-run --itemize-changes "$BUILD_DIR/dist/" "$TARGET_DIR/"
  step "Dry-Run beendet – es wurde nichts verändert."
  exit 0
fi

rsync "${RSYNC_ARGS[@]}" "$BUILD_DIR/dist/" "$TARGET_DIR/"
ok "Dateien übertragen"

# Version für spätere Nachvollziehbarkeit ablegen
printf '%s %s\n%s\n' "$COMMIT" "$BRANCH" "$(date -Is)" > "$TARGET_DIR/.deployed"

# ---------------------------------------------------------------------------
# Rechte + Webserver
# ---------------------------------------------------------------------------
if [ "$(id -u)" -eq 0 ]; then
  step "Setze Berechtigungen"
  chown -R "$WEB_USER:$WEB_GROUP" "$TARGET_DIR"
  find "$TARGET_DIR" -type d -exec chmod 755 {} +
  find "$TARGET_DIR" -type f -exec chmod 644 {} +
  ok "Eigentümer $WEB_USER:$WEB_GROUP, Ordner 755, Dateien 644"

  if [ "$RELOAD_NGINX" = "1" ] && command -v nginx >/dev/null 2>&1; then
    step "Lade nginx neu"
    if nginx -t >/dev/null 2>&1; then
      { systemctl reload nginx 2>/dev/null || nginx -s reload; } && ok "nginx neu geladen"
    else
      warn "nginx -t meldet Fehler – Reload übersprungen:"
      nginx -t 2>&1 | sed 's/^/    /'
    fi
  fi
else
  warn "Kein root: Berechtigungen und nginx-Reload übersprungen."
fi

step "Deployment erfolgreich – $COMMIT auf $BRANCH"
printf "  https://kodinitools.com%s\n\n" "$BASE_PATH"
