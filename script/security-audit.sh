#!/bin/bash
# Security audit script for Solidity contracts using Slither
# Usage: ./security-audit.sh [contract-path]

CONTRACT_PATH=${1:-src/contracts}
REPORT_FILE="audit-report.txt"

if ! command -v slither &> /dev/null; then
  echo "Slither not found. Installing..."
  pip install slither-analyzer
fi

echo "Running Slither on $CONTRACT_PATH..."
slither $CONTRACT_PATH > $REPORT_FILE

echo "Audit complete. See $REPORT_FILE for details."
