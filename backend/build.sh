#!/bin/bash
# Render build: pip install + playwright chromium (--with-deps = sistem kutuphaneleri dahil)
set -e
pip install -r requirements.txt
python -m playwright install chromium --with-deps
