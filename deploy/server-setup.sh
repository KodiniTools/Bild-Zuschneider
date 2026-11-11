#!/usr/bin/env bash
#
# server-setup.sh – Einmalige Einrichtung des Bild-Zuschneiders auf dem VPS.
#
# Läuft AUF DEM SERVER als root (deploy-to-server.ps1 -Setup lädt es hoch):
#   1. sichert die nginx-Konfiguration von kodinitools.com
#   2. installiert das Snippet nach /etc/nginx/snippets/bild-zuschneider.conf
#   3. fügt "include .../bild-zuschneider.conf;" per sed nach dem Anker ein
#      (nur falls noch nicht vorhanden – mehrfaches Ausführen ist unschädlich)
#   4. legt /var/www/kodinitools.com/bild-zuschneider an (www-data)
#   5. prüft mit "nginx -t"; bei Fehler wird alles zurückgerollt, sonst reload
#
#   sudo bash server-setup.sh [pfad/zum/nginx-bild-zuschneider.conf]
#
set -euo pipefail

SNIPPET_SRC="${1:-$(dirname "$0")/nginx-bild-zuschneider.conf}"
NGINX_DIR="${NGINX_DIR:-/etc/nginx}"
SNIPPET_DST="${SNIPPET_DST:-$NGINX_DIR/snippets/bild-zuschneider.conf}"
SITE_CONF="${SITE_CONF:-}"   # leer = automatisch suchen
ANCHOR="${ANCHOR:-include /etc/nginx/snippets/video-studio.conf;}"
INCLUDE_LINE="    include /etc/nginx/snippets/bild-zuschneider.conf;"
TARGET_DIR="${TARGET_DIR:-/var/www/kodinitools.com/bild-zuschneider}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/nginx}"
WEB_USER="${WEB_USER:-www-data}"
RELOAD_NGINX="${RELOAD_NGINX:-1}"
STAMP="$(date +%Y%m%d_%H%M%S)"

say()  { printf '\n==> %s\n' "$*"; }
ok()   { printf '    OK  %s\n' "$*"; }
die()  { printf '\nFEHLER: %s\n' "$*" >&2; exit 1; }

[ -f "$SNIPPET_SRC" ] || die "Snippet nicht gefunden: $SNIPPET_SRC"
command -v nginx >/dev/null || die "nginx nicht gefunden"

# Windows-Zeilenenden entfernen (falls die Datei mit CRLF hochgeladen wurde)
sed -i 's/\r$//' "$SNIPPET_SRC"

# ---------------------------------------------------------------------------
say "Suche die nginx-Konfiguration von kodinitools.com"
if [ -z "$SITE_CONF" ]; then
  mapfile -t candidates < <(grep -lE '^[[:space:]]*server_name[[:space:]]+kodinitools\.com;' \
    "$NGINX_DIR"/sites-enabled/* "$NGINX_DIR"/conf.d/*.conf 2>/dev/null || true)
  [ "${#candidates[@]}" -eq 1 ] || die "Erwartet genau eine Datei mit 'server_name kodinitools.com;', gefunden: ${#candidates[@]} (${candidates[*]:-keine}). Mit SITE_CONF=... angeben."
  SITE_CONF="$(readlink -f "${candidates[0]}")"
fi
[ -f "$SITE_CONF" ] || die "Konfiguration nicht gefunden: $SITE_CONF"
ok "$SITE_CONF"

grep -qF "$ANCHOR" "$SITE_CONF" || die "Anker nicht gefunden: '$ANCHOR'. Mit ANCHOR=... eine andere Zeile im server{}-Block angeben."
[ "$(grep -cF "$ANCHOR" "$SITE_CONF")" -eq 1 ] || die "Anker kommt mehrfach vor: '$ANCHOR'"

# ---------------------------------------------------------------------------
say "Sichere die bestehende Konfiguration"
# Bewusst außerhalb von sites-enabled, sonst würde nginx die Kopie mitladen
mkdir -p "$BACKUP_DIR"
SITE_BACKUP="$BACKUP_DIR/$(basename "$SITE_CONF").$STAMP"
cp -a "$SITE_CONF" "$SITE_BACKUP"
ok "$SITE_BACKUP"
SNIPPET_BACKUP=""
if [ -f "$SNIPPET_DST" ]; then
  SNIPPET_BACKUP="$BACKUP_DIR/$(basename "$SNIPPET_DST").$STAMP"
  cp -a "$SNIPPET_DST" "$SNIPPET_BACKUP"
  ok "$SNIPPET_BACKUP"
fi

rollback() {
  printf '\n    Rolle zurück …\n' >&2
  cp -a "$SITE_BACKUP" "$SITE_CONF"
  if [ -n "$SNIPPET_BACKUP" ]; then cp -a "$SNIPPET_BACKUP" "$SNIPPET_DST"; else rm -f "$SNIPPET_DST"; fi
  printf '    Konfiguration wiederhergestellt, nginx wurde nicht neu geladen.\n' >&2
}

# ---------------------------------------------------------------------------
say "Installiere das Snippet"
install -m 644 "$SNIPPET_SRC" "$SNIPPET_DST"
ok "$SNIPPET_DST"

say "Binde das Snippet ein"
if grep -qF "include /etc/nginx/snippets/bild-zuschneider.conf;" "$SITE_CONF"; then
  ok "Include ist bereits vorhanden – keine Änderung"
else
  # sed: neue Zeile direkt nach dem Anker (Schrägstriche im Anker maskieren)
  anchor_re="$(printf '%s' "$ANCHOR" | sed 's/[][\/.*^$]/\\&/g')"
  sed -i "/$anchor_re/a\\
$INCLUDE_LINE" "$SITE_CONF"
  grep -qF "include /etc/nginx/snippets/bild-zuschneider.conf;" "$SITE_CONF" || { rollback; die "Einfügen fehlgeschlagen"; }
  ok "nach: $ANCHOR"
fi

# ---------------------------------------------------------------------------
say "Lege das Zielverzeichnis an"
mkdir -p "$TARGET_DIR"
chown "$WEB_USER:$WEB_USER" "$TARGET_DIR"
chmod 755 "$TARGET_DIR"
ok "$TARGET_DIR"

# ---------------------------------------------------------------------------
say "Prüfe die nginx-Konfiguration"
if ! nginx -t; then
  rollback
  die "nginx -t ist fehlgeschlagen (siehe oben)"
fi
ok "nginx -t erfolgreich"

if [ "$RELOAD_NGINX" = "1" ]; then
  # systemd bevorzugt; ohne systemd (z. B. Container) direkt per Signal
  systemctl reload nginx 2>/dev/null || nginx -s reload
  ok "nginx neu geladen"
fi

say "Fertig. Rückgängig machen:"
printf '    cp %s %s && rm -f %s && nginx -t && systemctl reload nginx\n' "$SITE_BACKUP" "$SITE_CONF" "$SNIPPET_DST"
