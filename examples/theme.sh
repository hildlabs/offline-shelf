#!/bin/sh
# offline-shelf theme switcher for a docker compose setup.
#
# Lives next to docker-compose.yml. The compose file reads the active pack
# from KIWIX_THEME in the .env file next to it:
#   KIWIX_SERVE_CUSTOMIZED_RESOURCES: /themes/offline-shelf/${KIWIX_THEME:-papier+lampenlicht}/resources.txt
#
#   ./theme.sh                 show the active pack and all choices
#   ./theme.sh zeitung rotlicht  switch: light theme first, dark theme second
#   ./theme.sh off             back to the stock Kiwix look
#
# SPDX-License-Identifier: GPL-3.0-or-later
set -eu
cd "$(dirname "$0")"
PACKS=${PACKS:-./themes/offline-shelf}
SERVICE=${SERVICE:-kiwix}
ENVF=.env

current() { sed -n 's/^KIWIX_THEME=//p' "$ENVF" 2>/dev/null | tail -n 1; }

if [ $# -eq 0 ]; then
  echo "Active: $(current || true)"
  echo
  echo "Light themes: $(ls -d "$PACKS"/*+* | sed 's#.*/##; s/+.*//' | sort -u | tr '\n' ' ')"
  echo "Dark themes:  $(ls -d "$PACKS"/*+* | sed 's#.*+##' | sort -u | tr '\n' ' ')"
  echo
  echo "Switch with: $0 <light> <dark>   (e.g. $0 zeitung rotlicht)"
  exit 0
fi

if [ "$1" = off ]; then
  pack=off
  mkdir -p "$PACKS/off" && : > "$PACKS/off/resources.txt"   # empty: stock look
else
  [ $# -eq 2 ] || { echo "usage: $0 <light> <dark> | off" >&2; exit 1; }
  pack="$1+$2"
  [ -f "$PACKS/$pack/resources.txt" ] || { echo "unknown pack: $pack (run $0 to list)" >&2; exit 1; }
fi

touch "$ENVF"
grep -v '^KIWIX_THEME=' "$ENVF" > "$ENVF.tmp" || true
echo "KIWIX_THEME=$pack" >> "$ENVF.tmp"
mv "$ENVF.tmp" "$ENVF"

docker compose up -d "$SERVICE"
echo "Theme set to $pack. Reload the page with Ctrl+F5."
