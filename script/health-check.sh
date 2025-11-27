#!/bin/bash
# UltraRentz Multi-Chain Health Check Script 🧠
# Usage: bash scripts/health-check.sh

echo "==========================================="
echo "🔍 ULTRARENTZ MULTI-CHAIN HEALTH CHECK"
echo "==========================================="

# Load environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  source .env
else
  echo "❌ No .env file found. Please ensure it exists in the root directory."
  exit 1
fi

# Function to check a chain
check_chain() {
  local NAME=$1
  local RPC=$2
  local EXPECTED_CHAIN_ID=$3
  local TOKEN_ADDR=$4
  local ESCROW_ADDR=$5

  echo ""
  echo "-------------------------------------------"
  echo "🌐 Checking $NAME network..."
  echo "-------------------------------------------"

  if [ -z "$RPC" ]; then
    echo "❌ No RPC URL found for $NAME. Skipping..."
    return
  fi

  # Check RPC connectivity
  echo "⏳ Fetching Chain ID..."
  CHAIN_ID=$(cast chain-id --rpc-url "$RPC" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "✅ Chain ID: $CHAIN_ID"
  else
    echo "❌ Could not connect to RPC for $NAME."
    return
  fi

  # Check balance of contract addresses (if provided)
  if [ -n "$TOKEN_ADDR" ]; then
    echo "🔹 Checking URZ Token address..."
    cast code "$TOKEN_ADDR" --rpc-url "$RPC" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ URZ Token contract exists at $TOKEN_ADDR"
    else
      echo "⚠️  No contract code found at $TOKEN_ADDR"
    fi
  fi

  if [ -n "$ESCROW_ADDR" ]; then
    echo "🔹 Checking Escrow address..."
    cast code "$ESCROW_ADDR" --rpc-url "$RPC" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ Escrow contract exists at $ESCROW_ADDR"
    else
      echo "⚠️  No contract code found at $ESCROW_ADDR"
    fi
  fi
}

# Example deployed addresses (replace with yours as needed)
POLYGON_URZ="0x19f8a847Fca917363a5f1Cb23c9A8829DBa38989"
POLYGON_ESCROW="0x3B8e4cD1Ce9369C146a9EDb96948562662C7820E"

# Run checks
check_chain "Polygon Amoy" "$POLYGON_RPC" "80002" "$POLYGON_URZ" "$POLYGON_ESCROW"
check_chain "Optimism Sepolia" "$OPTIMISM_RPC" "11155420"
check_chain "Arbitrum Sepolia" "$ARBITRUM_RPC" "421614"
check_chain "Avalanche Fuji" "$AVALANCHE_RPC" "43113"
check_chain "Lisk Testnet" "$LISK_RPC" "4202"

echo ""
echo "==========================================="
echo "✅ HEALTH CHECK COMPLETE"
echo "==========================================="
