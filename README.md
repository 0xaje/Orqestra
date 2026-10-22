# Orqestra

**Compose. Execute. Verify.**

Orqestra is a runtime-aware workflow compiler and verification layer being developed for Portaldot V3.

**Current status:** ORQ-001 read-only capability probe is implemented, but **live network results have not yet been verified**. This repository does not claim successful on-chain execution or atomic native-to-EVM compatibility.

## Run in Ubuntu (WSL)

Requirements: Node.js 20+.

```bash
git clone https://github.com/0xaje/Orqestra.git
cd Orqestra
npm install
npm run probe | tee orqestra-probe.json
```

The probe contacts the real native Substrate WebSocket and EVM JSON-RPC endpoints and prints runtime metadata-derived capabilities. Network/RPC failures return a nonzero exit code. No fabricated responses are used.

Native: `wss://test-node-v3.portaldot.dev`  
EVM: `https://test-evm-rpc-v3.portaldot.dev`  
Expected EVM chain ID: `420420777`

Override endpoints with `PORTALDOT_NATIVE_RPC` and `PORTALDOT_EVM_RPC`.

## Security

Never commit seed phrases, private keys, signing credentials, or wallet exports. Read-only probes do not prove successful transactions. Native atomic batching does not establish native-to-EVM atomicity.

## Next gates

1. Record actual chain capabilities, finalized block and runtime version.
2. Select a real, authorized multi-operation workflow.
3. Implement compiler and wallet-approved signing.
4. Submit a successful testnet atomic workflow and independently verify final state.
5. Submit a deliberately failing workflow and verify rollback.
6. Build evidence receipts, frontend, backend, and end-to-end tests.

See [ORQ-001 acceptance criteria](docs/ORQ-001.md).
