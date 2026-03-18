#!/bin/bash
# Render build: pip install + playwright chromium
# rootDir=backend ise: Build Command = bash build.sh
set -e
pip install -r requirements.txt
python -m playwright install chromium
