#!/bin/bash
# Deploy UltraRentzToken (URZ) to multiple EVM chains using Foundry
# Make sure to set the following environment variables before running:
#   LISK_RPC_URL, LISK_PRIVATE_KEY
#   BASE_RPC_URL, BASE_PRIVATE_KEY
#   OPTIMISM_RPC_URL, OPTIMISM_PRIVATE_KEY
#   ARBITRUM_RPC_URL, ARBITRUM_PRIVATE_KEY
#   AVALANCHE_RPC_URL, AVALANCHE_PRIVATE_KEY
#   CHAINLINK_RPC_URL, CHAINLINK_PRIVATE_KEY

set -e

SCRIPT_PATH="script/DeployURZ.s.sol"
CONTRACT="DeployURZ"

function deploy() {
  local name=$1
  local rpc_url=$2
  local priv_key=$3
  if [[ -z "$rpc_url" || -z "$priv_key" ]]; then
    echo "Skipping $name: missing RPC URL or private key."
    return
  fi
  echo "\nDeploying to $name..."
  forge script "$SCRIPT_PATH" --sig "run()" --rpc-url "$rpc_url" --private-key "$priv_key" --broadcast --verify || echo "$name deployment failed."
}

deploy "Lisk" "$LISK_RPC_URL" "$LISK_PRIVATE_KEY"
deploy "Base" "$BASE_RPC_URL" "$BASE_PRIVATE_KEY"
deploy "Optimism" "$OPTIMISM_RPC_URL" "$OPTIMISM_PRIVATE_KEY"
deploy "Arbitrum" "$ARBITRUM_RPC_URL" "$ARBITRUM_PRIVATE_KEY"
deploy "Avalanche C" "$AVALANCHE_RPC_URL" "$AVALANCHE_PRIVATE_KEY"
deploy "Chainlink" "$CHAINLINK_RPC_URL" "$CHAINLINK_PRIVATE_KEY"

echo "\nDeployment script finished. Check above for results."
