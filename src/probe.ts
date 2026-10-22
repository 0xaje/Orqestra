import { ApiPromise, WsProvider } from '@polkadot/api';

const NATIVE_RPC = process.env.PORTALDOT_NATIVE_RPC ?? 'wss://test-node-v3.portaldot.dev';
const EVM_RPC = process.env.PORTALDOT_EVM_RPC ?? 'https://test-evm-rpc-v3.portaldot.dev';
const EXPECTED_EVM_CHAIN_ID = 420420777;

async function evmRequest(method: string): Promise<unknown> {
  const response = await fetch(EVM_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [] }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`EVM HTTP ${response.status}`);
  const payload = await response.json() as { result?: unknown; error?: unknown };
  if (payload.error) throw new Error(JSON.stringify(payload.error));
  if (payload.result === undefined) throw new Error(`EVM RPC missing result for ${method}`);
  return payload.result;
}

async function main(): Promise<void> {
  const output: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    nativeRpc: NATIVE_RPC,
    evmRpc: EVM_RPC,
  };
  let api: ApiPromise | undefined;
  let failed = false;

  try {
    const provider = new WsProvider(NATIVE_RPC, 5000);
    api = await ApiPromise.create({ provider, noInitWarn: true });
    const [chain, runtime, header, finalizedHash] = await Promise.all([
      api.rpc.system.chain(),
      api.rpc.state.getRuntimeVersion(),
      api.rpc.chain.getHeader(),
      api.rpc.chain.getFinalizedHead(),
    ]);
    const tx = api.tx as unknown as Record<string, Record<string, unknown> | undefined>;
    const modules = ['utility', 'assets', 'balances', 'contracts', 'evm', 'ethereum'];
    output.native = {
      chain: chain.toString(),
      blockNumber: header.number.toString(),
      finalizedHash: finalizedHash.toHex(),
      specName: runtime.specName.toString(),
      specVersion: runtime.specVersion.toNumber(),
      capabilities: Object.fromEntries(modules.map(name => [name, {
        present: !!tx[name],
        calls: tx[name] ? Object.keys(tx[name]) : [],
      }])),
      batchAllAvailable: typeof tx.utility?.batchAll === 'function',
    };
  } catch (error) {
    failed = true;
    output.nativeError = error instanceof Error ? error.message : String(error);
  } finally {
    if (api) await api.disconnect();
  }

  try {
    const [chainIdHex, blockHex] = await Promise.all([
      evmRequest('eth_chainId'),
      evmRequest('eth_blockNumber'),
    ]);
    const chainId = Number.parseInt(String(chainIdHex), 16);
    output.evm = {
      chainId,
      blockNumber: Number.parseInt(String(blockHex), 16),
      matchesExpectedChainId: chainId === EXPECTED_EVM_CHAIN_ID,
    };
    if (chainId !== EXPECTED_EVM_CHAIN_ID) failed = true;
  } catch (error) {
    failed = true;
    output.evmError = error instanceof Error ? error.message : String(error);
  }

  console.log(JSON.stringify(output, null, 2));
  if (failed) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
