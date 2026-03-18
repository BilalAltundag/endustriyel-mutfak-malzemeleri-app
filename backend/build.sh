#!/bin/bash
# Render build: pip install + playwright (chromium + chromium-headless-shell)
# PLAYWRIGHT_BROWSERS_PATH: build cache runtime'a taşınmayabilir; proje içine kur
set -e
pip install -r requirements.txt
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$PWD/.playwright-browsers}"
python -m playwright install chromium chromium-headless-shell
python -m playwright install-deps chromium
