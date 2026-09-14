/* KGEN_META
VERSION: 1.1.0
STATUS: ACTIVE_SAFE_PROVENANCE
PURPOSE: Repository-owned provenance for 11520 BNB Chain price feeds. This registry is read-only and does not authorize production settlement.
*/

const EVM_ADDRESS=/^0x[0-9a-fA-F]{40}$/;
const REDSTONE_BNB_FEED_LIST='https://app.redstone.finance/push-feeds?networks=bnb&testnets=true';

export const PRIMARY_FEED_PROVENANCE=Object.freeze({
  KX:Object.freeze({axis:'KX',market:'BTCUSDT',pair:'BTC/USD',chainId:56,provider:'CHAINLINK_DATA_FEEDS',address:'0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf',decimals:8,officialProduct:'BTC/USD-RefPrice-DF-Binance-001',officialUrl:'https://data.chain.link/feeds/bsc/mainnet/btc-usd',explorerLabel:'Chainlink: BTC/USD Price Feed',provenanceStatus:'PRIMARY_FEED_IDENTITY_VERIFIED'}),
  KY:Object.freeze({axis:'KY',market:'ETHUSDT',pair:'ETH/USD',chainId:56,provider:'CHAINLINK_DATA_FEEDS',address:'0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e',decimals:8,officialProduct:'ETH/USD-RefPrice-DF-Binance-001',officialUrl:'https://data.chain.link/feeds/bsc/mainnet/eth-usd',explorerLabel:'Chainlink: ETH/USD Price Feed',provenanceStatus:'PRIMARY_FEED_IDENTITY_VERIFIED'}),
  KZ:Object.freeze({axis:'KZ',market:'BNBUSDT',pair:'BNB/USD',chainId:56,provider:'CHAINLINK_DATA_FEEDS',address:'0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',decimals:8,officialProduct:'BNB/USD-RefPrice-DF-Binance-001',officialUrl:'https://data.chain.link/feeds/bsc/mainnet/bnb-usd',explorerLabel:'Chainlink: BNB/USD Price Feed',provenanceStatus:'PRIMARY_FEED_IDENTITY_VERIFIED'})
});

export const SECONDARY_FEED_PROVENANCE=Object.freeze({
  KX:Object.freeze({axis:'KX',market:'BTCUSDT',pair:'BTC/USD',chainId:56,provider:'REDSTONE_PUSH',address:'0xa51738d1937FFc553d5070f43300B385AA2D9F55',heartbeatSeconds:60,deviationBps:10,officialUrl:REDSTONE_BNB_FEED_LIST,interfaceCompatibility:'CHAINLINK_AGGREGATOR_V3_COMPATIBLE',provenanceStatus:'SECONDARY_FEED_IDENTITY_REVIEWED'}),
  KY:Object.freeze({axis:'KY',market:'ETHUSDT',pair:'ETH/USD',chainId:56,provider:'REDSTONE_PUSH',address:'0x9cF19D284862A66378c304ACAcB0E857EBc3F856',heartbeatSeconds:21600,deviationBps:50,officialUrl:REDSTONE_BNB_FEED_LIST,interfaceCompatibility:'CHAINLINK_AGGREGATOR_V3_COMPATIBLE',provenanceStatus:'SECONDARY_FEED_IDENTITY_REVIEWED'}),
  KZ:Object.freeze({axis:'KZ',market:'BNBUSDT',pair:'BNB/USD',chainId:56,provider:'REDSTONE_PUSH',address:'0x8dd2D85C7c28F43F965AE4d9545189C7D022ED0e',heartbeatSeconds:60,deviationBps:10,officialUrl:REDSTONE_BNB_FEED_LIST,interfaceCompatibility:'CHAINLINK_AGGREGATOR_V3_COMPATIBLE',provenanceStatus:'SECONDARY_FEED_IDENTITY_REVIEWED'})
});

export const ORACLE_QUORUM_POLICY=Object.freeze({
  requiredValidSources:2,
  maxConfiguredSources:3,
  providerIndependenceRequired:true,
  secondarySourceProvenanceReady:true,
  productionQuorumReady:false,
  reason:'LIVE_ORACLE_OBSERVATION_AND_PRODUCTION_CONFIGURATION_NOT_VERIFIED'
});

function normalizeAxis(axis){
  return String(axis??'').trim().toUpperCase();
}

function assertFeed(feed,addressError){
  if(!feed)throw new Error('ORACLE_FEED_AXIS_NOT_SUPPORTED');
  if(!EVM_ADDRESS.test(feed.address))throw new Error(addressError);
  return feed;
}

export function getPrimaryFeedProvenance(axis){
  const key=normalizeAxis(axis);
  if(!PRIMARY_FEED_PROVENANCE[key])throw new Error('PRIMARY_FEED_AXIS_NOT_SUPPORTED');
  return assertFeed(PRIMARY_FEED_PROVENANCE[key],'PRIMARY_FEED_ADDRESS_INVALID');
}

export function getSecondaryFeedProvenance(axis){
  const key=normalizeAxis(axis);
  if(!SECONDARY_FEED_PROVENANCE[key])throw new Error('SECONDARY_FEED_AXIS_NOT_SUPPORTED');
  return assertFeed(SECONDARY_FEED_PROVENANCE[key],'SECONDARY_FEED_ADDRESS_INVALID');
}

export function inspectProductionOracleReadiness(axis,callerOverride){
  if(callerOverride!==undefined)throw new Error('CALLER_FEED_OVERRIDE_FORBIDDEN');
  const primary=getPrimaryFeedProvenance(axis);
  const secondary=getSecondaryFeedProvenance(axis);
  const addresses=new Set([primary.address,secondary.address].map(address=>address.toLowerCase()));
  const providers=new Set([primary.provider,secondary.provider]);
  const validSourceCount=addresses.size;
  const providerIndependent=providers.size>=ORACLE_QUORUM_POLICY.requiredValidSources;
  const provenanceReady=primary.provenanceStatus==='PRIMARY_FEED_IDENTITY_VERIFIED'&&secondary.provenanceStatus==='SECONDARY_FEED_IDENTITY_REVIEWED'&&secondary.interfaceCompatibility==='CHAINLINK_AGGREGATOR_V3_COMPATIBLE';
  const structuralQuorumReady=validSourceCount>=ORACLE_QUORUM_POLICY.requiredValidSources&&providerIndependent&&provenanceReady;
  const blockers=[];
  if(validSourceCount<ORACLE_QUORUM_POLICY.requiredValidSources)blockers.push('SECOND_INDEPENDENT_PRODUCTION_FEED_REQUIRED');
  if(!providerIndependent)blockers.push('ORACLE_PROVIDER_INDEPENDENCE_REQUIRED');
  if(!provenanceReady)blockers.push('SECONDARY_FEED_PROVENANCE_NOT_READY');
  if(!ORACLE_QUORUM_POLICY.productionQuorumReady){
    blockers.push('LIVE_ORACLE_OBSERVATION_NOT_MACHINE_VERIFIED');
    blockers.push('PRODUCTION_ORACLE_CONFIGURATION_NOT_AUTHORIZED');
  }
  return Object.freeze({primary,secondary,validSourceCount,providerIndependent,provenanceReady,structuralQuorumReady,ready:structuralQuorumReady&&ORACLE_QUORUM_POLICY.productionQuorumReady,blockers:Object.freeze(blockers)});
}
