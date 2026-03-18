#!/bin/bash
# Render build: pip install + playwright chromium
# --with-deps KULLANMA: root gerektirir, Render'da yok. Ubuntu build ortami cogu lib'i zaten icerir.
set -e
pip install -r requirements.txt
python -m playwright install chromium
