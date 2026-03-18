#!/bin/bash
# Render build: pip install + playwright chromium + uv (browser-use uvx gerektirir)
# chromium_headless_shell Render'da yok; --no-shell ile full chromium, channel="chromium" ile launch
set -e
pip install -r requirements.txt
# uv (requirements.txt'te): browser-use uvx gerektirir
# --no-shell = sadece full chromium (headless shell yok), kodda channel="chromium" kullan
python -m playwright install chromium --no-shell
python -m playwright install-deps chromium
