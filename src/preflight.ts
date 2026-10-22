import { ApiPromise, WsProvider } from '@polkadot/api';

const endpoint = process.env.PORTALDOT_NATIVE_RPC ?? 'wss://test-node-v3.portaldot.dev';
const address = process.argv[2];
if (!address) {
  console.error('Usage: npx tsx src/preflight.ts <YOUR_PUBLIC_SS58_ADDRESS>');
  process.exit(2);
}
const api = await ApiPromise.create({ provider: new WsProvider(endpoint, 5000), noInitWarn: true });
try {
  const accountId = api.createType('AccountId', address);
  const [header, runtime, account, constants] = await Promise.all([
    api.rpc.chain.getHeader(),
    api.rpc.state.getRuntimeVersion(),
    api.query.system.account(accountId),
    Promise.resolve({
      assetDeposit: api.consts.assets?.assetDeposit?.toString() ?? null,
      metadataDepositBase: api.consts.assets?.metadataDepositBase?.toString() ?? null,
      metadataDepositPerByte: api.consts.assets?.metadataDepositPerByte?.toString() ?? null,
      existentialDeposit: api.consts.balances?.existentialDeposit?.toString() ?? null,
    }),
  ]);
  const data = account.toJSON() as Record<string, any>;
  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    address: accountId.toString(),
    blockNumber: header.number.toString(),
    specVersion: runtime.specVersion.toString(),
    account: { nonce: data.nonce, data: data.data },
    deposits: constants,
    note: 'Read-only account inspection; no transaction submitted. Balances are raw chain units.',
  }, null, 2));
} finally {
  await api.disconnect();
}
