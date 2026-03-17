#!/bin/bash
# Render build: pip install + playwright chromium (uvx hatasını önler)
# rootDir=backend ise: Build Command = bash build.sh
# rootDir=boş ise: Build Command = cd backend && bash build.sh
set -e
pip install -r requirements.txt
python -m playwright install chromium
