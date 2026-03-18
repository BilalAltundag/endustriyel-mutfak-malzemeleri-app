#!/bin/bash
# Render build: pip install + playwright chromium + uv (browser-use uvx gerektirir)
# chromium_headless_shell Render'da cache sorunları veriyor; full chromium kullanıyoruz
set -e
pip install -r requirements.txt
# uv (requirements.txt'te): browser-use uvx gerektirir
python -m playwright install chromium --no-shell
python -m playwright install-deps chromium
