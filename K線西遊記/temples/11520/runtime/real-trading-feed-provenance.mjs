/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE_SAFE_PROVENANCE
PURPOSE: Repository-owned provenance for 11520 primary BNB Chain price feeds. This registry is read-only and does not authorize production settlement.
*/

const EVM_ADDRESS=/^0x[0-9a-fA-F]{40}$/;

export const PRIMARY_FEED_PROVENANCE=Object.freeze({
  KX:Object.freeze({
    axis:'KX',market:'BTCUSDT',pair:'BTC/USD',chainId:56,provider:'CHAINLINK_DATA_FEEDS',
    address:'0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf',decimals:8,
    officialProduct:'BTC/USD-RefPrice-DF-Binance-001',
    officialUrl:'https://data.chain.link/feeds/bsc/mainnet/btc-usd',
    explorerLabel:'Chainlink: BTC/USD Price Feed',
    provenanceStatus:'PRIMARY_FEED_IDENTITY_VERIFIED'
  }),
  KY:Object.freeze({
    axis:'KY',market:'ETHUSDT',pair:'ETH/USD',chainId:56,provider:'CHAINLINK_DATA_FEEDS',
    address:'0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e',decimals:8,
    officialProduct:'ETH/USD-RefPrice-DF-Binance-001',
    officialUrl:'https://data.chain.link/feeds/bsc/mainnet/eth-usd',
    explorerLabel:'Chainlink: ETH/USD Price Feed',
    provenanceStatus:'PRIMARY_FEED_IDENTITY_VERIFIED'
  }),
  KZ:Object.freeze({
    axis:'KZ',market:'BNBUSDT',pair:'BNB/USD',chainId:56,provider:'CHAINLINK_DATA_FEEDS',
    address:'0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',decimals:8,
    officialProduct:'BNB/USD-RefPrice-DF-Binance-001',
    officialUrl:'https://data.chain.link/feeds/bsc/mainnet/bnb-usd',
    explorerLabel:'Chainlink: BNB/USD Price Feed',
    provenanceStatus:'PRIMARY_FEED_IDENTITY_VERIFIED'
  })
});

export const ORACLE_QUORUM_POLICY=Object.freeze({
  requiredValidSources:2,
  maxConfiguredSources:3,
  providerIndependenceRequired:true,
  productionQuorumReady:false,
  reason:'SECOND_INDEPENDENT_PRODUCTION_FEED_REQUIRED'
});

export function getPrimaryFeedProvenance(axis){
  const key=String(axis??'').trim().toUpperCase();
  const feed=PRIMARY_FEED_PROVENANCE[key];
  if(!feed)throw new Error('PRIMARY_FEED_AXIS_NOT_SUPPORTED');
  if(!EVM_ADDRESS.test(feed.address))throw new Error('PRIMARY_FEED_ADDRESS_INVALID');
  return feed;
}

export function inspectProductionOracleReadiness(axis,{independentFeeds=[]}={}){
  const primary=getPrimaryFeedProvenance(axis);
  const normalized=[primary,...independentFeeds].filter(Boolean);
  const addresses=new Set(normalized.map(feed=>String(feed.address||'').toLowerCase()).filter(address=>EVM_ADDRESS.test(address)));
  const providers=new Set(normalized.map(feed=>String(feed.provider||'').trim()).filter(Boolean));
  const validSourceCount=addresses.size;
  const providerIndependent=providers.size>=ORACLE_QUORUM_POLICY.requiredValidSources;
  const ready=validSourceCount>=ORACLE_QUORUM_POLICY.requiredValidSources&&providerIndependent;
  const blockers=[];
  if(validSourceCount<ORACLE_QUORUM_POLICY.requiredValidSources)blockers.push('SECOND_INDEPENDENT_PRODUCTION_FEED_REQUIRED');
  if(!providerIndependent)blockers.push('ORACLE_PROVIDER_INDEPENDENCE_REQUIRED');
  return Object.freeze({primary,validSourceCount,providerIndependent,ready,blockers:Object.freeze(blockers)});
}
