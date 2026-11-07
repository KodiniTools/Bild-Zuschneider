# Bild-Zuschneider

Bilder in verschiedenen Formaten direkt im Browser zuschneiden – lokal, ohne Upload.
Teil von [KodiniTools](https://kodinitools.com), erreichbar unter `/bild-zuschneider/`.

Struktur und Tooling folgen [KodiniTools/Bildkonverter](https://github.com/KodiniTools/Bildkonverter),
das Design-System stammt aus [KodiniTools/Collage-Maker](https://github.com/KodiniTools/Collage-Maker).

Der Aufbau erfolgt schrittweise über Pull Requests.

## Deployment

Ziel: `https://kodinitools.com/bild-zuschneider/` → `/var/www/kodinitools.com/bild-zuschneider` (statische SPA, kein Backend).

Von Windows aus (PowerShell 5.1 oder 7, OpenSSH-Client, SSH-Schlüssel für den Server):

```powershell
# Erstes Mal: nginx-Snippet + Include + Zielordner einrichten, dann deployen
.\deploy-to-server.ps1 -Server <IP-oder-Host> -Setup

# Jedes weitere Deployment (Stand von main)
.\deploy-to-server.ps1 -Server <IP-oder-Host>

# Nur anzeigen, was passieren würde
.\deploy-to-server.ps1 -Server <IP-oder-Host> -DryRun
```

| Datei                                | Läuft             | Zweck                                                                                                                                                                                                                                      |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deploy-to-server.ps1`               | Windows           | lädt die Skripte per `scp` hoch, führt sie per `ssh` aus, prüft danach die Seite (inkl. SSI)                                                                                                                                               |
| `deploy/server-setup.sh`             | Server, einmalig  | sichert die nginx-Konfiguration, installiert `/etc/nginx/snippets/bild-zuschneider.conf`, fügt `include …/bild-zuschneider.conf;` per `sed` nach `video-studio.conf` ein, legt den Zielordner an, `nginx -t` (bei Fehler Rollback), Reload |
| `deploy/nginx-bild-zuschneider.conf` | Server            | `location`-Blöcke: Assets 1 Jahr `immutable`, `index.html` 60 s, SPA-Fallback, versteckte Dateien gesperrt                                                                                                                                 |
| `deploy.sh`                          | Server, jedes Mal | holt `main` nach `/opt/bild-zuschneider`, `npm ci` + Build, Backup, `rsync` ins Webroot, Rechte, nginx-Reload                                                                                                                              |

Rückgängig machen (Einrichtung): Die Befehle gibt `server-setup.sh` am Ende aus; die Sicherung liegt unter `/var/backups/nginx/`.
