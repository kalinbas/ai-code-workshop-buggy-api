#!/usr/bin/env bash
set -euo pipefail
pytest --collect-only -q
pytest tests/test_04_refactor_safety.py -q
