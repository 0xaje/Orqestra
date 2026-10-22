import { ApiPromise, WsProvider } from '@polkadot/api';

const endpoint = process.env.PORTALDOT_NATIVE_RPC ?? 'wss://test-node-v3.portaldot.dev';
const api = await ApiPromise.create({ provider: new WsProvider(endpoint, 5000), noInitWarn: true });
try {
  const pallets = ['utility', 'assets', 'balances', 'contracts'];
  const result: Record<string, unknown> = {};
  for (const pallet of pallets) {
    const calls = (api.tx as unknown as Record<string, Record<string, any>>)[pallet];
    if (!calls) continue;
    result[pallet] = Object.fromEntries(Object.entries(calls).filter(([, fn]) => typeof fn === 'function').map(([name, fn]) => [
      name, { args: fn.meta.args.map((a: any) => ({ name: a.name.toString(), type: a.type.toString() })) },
    ]));
  }
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    runtime: (await api.rpc.state.getRuntimeVersion()).specVersion.toString(),
    calls: result,
  }, null, 2));
} finally {
  await api.disconnect();
}
