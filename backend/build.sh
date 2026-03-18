#!/bin/bash
# Render build: pip install + playwright chromium (--no-shell = sadece full chromium)
# chromium_headless_shell Render'da cache sorunları veriyor; full chromium kullanıyoruz
set -e
pip install -r requirements.txt
python -m playwright install chromium --no-shell
python -m playwright install-deps chromium
