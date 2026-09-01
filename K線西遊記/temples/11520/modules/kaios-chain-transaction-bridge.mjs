export const CHAIN_IDS = Object.freeze({ BSC_MAINNET: 56, BSC_TESTNET: 97 });

export const TOKEN_ADDRESSES = Object.freeze({
  56: Object.freeze({
    KGEN: '0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be',
    KAIOS: '0xD4E67B3a69e41524c424150E6b6e921b01D036db',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'
  }),
  97: Object.freeze({
    KGEN: '0x79b65388e6fd7e0b171147914384A0455c7A16E6',
    KAIOS: '0x74f7A95B40bB9a1Aa2ebCc680166e9A45494C225'
  })
});

export const PRODUCT_CONTRACTS = Object.freeze({
  56: Object.freeze({ ATM: null, CLEARING: null }),
  97: Object.freeze({ ATM: null, CLEARING: null })
});

export const ERC20_ABI = Object.freeze([
  'function balanceOf(address) view returns(uint256)',
  'function decimals() view returns(uint8)',
  'function allowance(address,address) view returns(uint256)',
  'function approve(address,uint256) returns(bool)'
]);

export const ATM_ABI = Object.freeze([
  'function nextQuoteId() view returns(uint256)',
  'function createTokenQuote(address makerToken,uint256 makerAmount,address takerToken,uint256 takerAmount,uint64 expiresAt) returns(uint256)',
  'function createBnbQuote(address takerToken,uint256 takerAmount,uint64 expiresAt) payable returns(uint256)',
  'function cancelQuote(uint256 quoteId)',
  'function acceptQuote(uint256 quoteId) payable',
  'function quotes(uint256) view returns(address maker,address makerToken,uint256 makerAmount,address takerToken,uint256 takerAmount,uint64 expiresAt,bool active)',
  'event QuoteAccepted(uint256 indexed quoteId,address indexed maker,address indexed taker,address makerToken,uint256 makerAmount,address takerToken,uint256 takerAmount)'
]);

export const CLEARING_ABI = Object.freeze([
  'function deposit(uint256 amount)',
  'function withdraw(uint256 amount)',
  'function cashBalance(address) view returns(uint256)',
  'function lockedMargin(address) view returns(uint256)',
  'function liquidityReserve() view returns(uint256)',
  'function openPosition(bytes32 symbol,bool isLong,uint128 warpE8,uint256 collateral) returns(uint256)',
  'function closePosition(uint256 positionId) returns(int256)',
  'function positions(uint256) view returns(address player,bytes32 symbol,bool isLong,uint128 warpE8,uint256 collateral,uint256 entryE8,uint64 openedAt,bool open)',
  'event PositionOpened(uint256 indexed positionId,address indexed player,bytes32 indexed symbol,bool isLong,uint128 warpE8,uint256 collateral,uint256 entryE8)',
  'event PositionClosed(uint256 indexed positionId,address indexed player,uint256 exitE8,int256 pnlKaiosWei,uint256 playerCashAfter)'
]);

function requireEthers(){const e=globalThis.ethers;if(!e)throw new Error('ETHERS_NOT_LOADED');return e;}
function requireAddress(value,code){if(!value)throw new Error(code);return value;}
function tokenAddress(chainId,symbol){const ethers=requireEthers();const s=String(symbol).toUpperCase();if(s==='BNB')return ethers.constants.AddressZero;return requireAddress(TOKEN_ADDRESSES[Number(chainId)]?.[s],`${s}_TOKEN_UNKNOWN`);}
function units(chainId,symbol,value){const ethers=requireEthers();const s=String(symbol).toUpperCase();const decimals=18;return ethers.utils.parseUnits(String(value),decimals);}

export async function connectedContext(rawProvider,{expectedChainId=null}={}){
  if(!rawProvider)throw new Error('WALLET_PROVIDER_REQUIRED');
  const ethers=requireEthers();const provider=new ethers.providers.Web3Provider(rawProvider,'any');const network=await provider.getNetwork();
  if(expectedChainId&&Number(network.chainId)!==Number(expectedChainId))throw new Error(`WRONG_CHAIN_${network.chainId}`);
  const signer=provider.getSigner();const account=await signer.getAddress();return Object.freeze({provider,signer,account,chainId:Number(network.chainId)});
}

export function productAvailability(chainId,contracts=PRODUCT_CONTRACTS){const c=contracts[Number(chainId)]||{};return Object.freeze({atm:Boolean(c.ATM),clearing:Boolean(c.CLEARING),fullyConnected:Boolean(c.ATM&&c.CLEARING),reason:c.ATM&&c.CLEARING?'READY_FOR_WALLET_SIGNATURE':'DEPLOYMENT_RECEIPTS_REQUIRED'});}

export async function ensureAllowance({signer,token,spender,amountWei}){
  const ethers=requireEthers();requireAddress(spender,'SPENDER_NOT_DEPLOYED');const owner=await signer.getAddress();const erc20=new ethers.Contract(token,ERC20_ABI,signer);const current=await erc20.allowance(owner,spender);
  if(current.gte(amountWei))return Object.freeze({approved:true,tx:null,receipt:null});const tx=await erc20.approve(spender,amountWei);const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('APPROVAL_REVERTED');return Object.freeze({approved:true,tx,receipt});
}

/// Maker offers KAIOS and requests KGEN/USDT/WBNB/BNB. This is the normal deposit-side ATM quote.
export async function createKaiosSellQuote({signer,chainId,payAsset,payAmount,kaiosAmount,expiresAt,contracts=PRODUCT_CONTRACTS}){
  const ethers=requireEthers();const atm=requireAddress(contracts[Number(chainId)]?.ATM,'ATM_NOT_DEPLOYED');const kaios=tokenAddress(chainId,'KAIOS');const requested=tokenAddress(chainId,payAsset);const kaiosWei=units(chainId,'KAIOS',kaiosAmount);const payWei=units(chainId,payAsset,payAmount);
  await ensureAllowance({signer,token:kaios,spender:atm,amountWei:kaiosWei});const c=new ethers.Contract(atm,ATM_ABI,signer);const tx=await c.createTokenQuote(kaios,kaiosWei,requested,payWei,Math.floor(new Date(expiresAt).getTime()/1000));const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('QUOTE_CREATE_REVERTED');return receipt;
}

/// Maker offers a payout asset and requests KAIOS. This is the reverse/withdrawal-side ATM quote.
export async function createAssetSellQuote({signer,chainId,offerAsset,offerAmount,kaiosAmount,expiresAt,contracts=PRODUCT_CONTRACTS}){
  const ethers=requireEthers();const atm=requireAddress(contracts[Number(chainId)]?.ATM,'ATM_NOT_DEPLOYED');const kaios=tokenAddress(chainId,'KAIOS');const offered=tokenAddress(chainId,offerAsset);const offerWei=units(chainId,offerAsset,offerAmount);const kaiosWei=units(chainId,'KAIOS',kaiosAmount);const c=new ethers.Contract(atm,ATM_ABI,signer);let tx;
  if(String(offerAsset).toUpperCase()==='BNB')tx=await c.createBnbQuote(kaios,kaiosWei,Math.floor(new Date(expiresAt).getTime()/1000),{value:offerWei});
  else{await ensureAllowance({signer,token:offered,spender:atm,amountWei:offerWei});tx=await c.createTokenQuote(offered,offerWei,kaios,kaiosWei,Math.floor(new Date(expiresAt).getTime()/1000));}
  const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('REVERSE_QUOTE_CREATE_REVERTED');return receipt;
}

export async function acceptAtmQuoteOnChain({signer,chainId,quoteId,contracts=PRODUCT_CONTRACTS}){
  const ethers=requireEthers();const atm=requireAddress(contracts[Number(chainId)]?.ATM,'ATM_NOT_DEPLOYED');const c=new ethers.Contract(atm,ATM_ABI,signer);const q=await c.quotes(quoteId);if(!q.active)throw new Error('QUOTE_NOT_ACTIVE');let tx;
  if(q.takerToken===ethers.constants.AddressZero)tx=await c.acceptQuote(quoteId,{value:q.takerAmount});
  else{await ensureAllowance({signer,token:q.takerToken,spender:atm,amountWei:q.takerAmount});tx=await c.acceptQuote(quoteId);}
  const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('ATM_SWAP_REVERTED');return receipt;
}

export async function depositKaiosMargin({signer,chainId,amountKaios,contracts=PRODUCT_CONTRACTS}){const ethers=requireEthers();const clearing=requireAddress(contracts[Number(chainId)]?.CLEARING,'CLEARING_NOT_DEPLOYED');const kaios=tokenAddress(chainId,'KAIOS');const amountWei=units(chainId,'KAIOS',amountKaios);await ensureAllowance({signer,token:kaios,spender:clearing,amountWei});const c=new ethers.Contract(clearing,CLEARING_ABI,signer);const tx=await c.deposit(amountWei);const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('MARGIN_DEPOSIT_REVERTED');return receipt;}
export async function openWarpPositionOnChain({signer,chainId,symbol,direction,warpC,collateralKaios,contracts=PRODUCT_CONTRACTS}){const ethers=requireEthers();const clearing=requireAddress(contracts[Number(chainId)]?.CLEARING,'CLEARING_NOT_DEPLOYED');const c=new ethers.Contract(clearing,CLEARING_ABI,signer);const symbolKey=ethers.utils.formatBytes32String(String(symbol).slice(0,31));const warpE8=ethers.BigNumber.from(Math.round(Number(warpC)*1e8).toString());const collateral=units(chainId,'KAIOS',collateralKaios);const tx=await c.openPosition(symbolKey,String(direction).toUpperCase()==='LONG',warpE8,collateral);const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('POSITION_OPEN_REVERTED');return receipt;}
export async function closeWarpPositionOnChain({signer,chainId,positionId,contracts=PRODUCT_CONTRACTS}){const ethers=requireEthers();const clearing=requireAddress(contracts[Number(chainId)]?.CLEARING,'CLEARING_NOT_DEPLOYED');const c=new ethers.Contract(clearing,CLEARING_ABI,signer);const tx=await c.closePosition(positionId);const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('POSITION_CLOSE_REVERTED');return receipt;}
export async function withdrawKaiosMargin({signer,chainId,amountKaios,contracts=PRODUCT_CONTRACTS}){const ethers=requireEthers();const clearing=requireAddress(contracts[Number(chainId)]?.CLEARING,'CLEARING_NOT_DEPLOYED');const c=new ethers.Contract(clearing,CLEARING_ABI,signer);const tx=await c.withdraw(units(chainId,'KAIOS',amountKaios));const receipt=await tx.wait(1);if(receipt.status!==1)throw new Error('MARGIN_WITHDRAW_REVERTED');return receipt;}
export async function readClearingBalance({providerOrSigner,chainId,account,contracts=PRODUCT_CONTRACTS}){const ethers=requireEthers();const clearing=requireAddress(contracts[Number(chainId)]?.CLEARING,'CLEARING_NOT_DEPLOYED');const c=new ethers.Contract(clearing,CLEARING_ABI,providerOrSigner);const[cash,locked]=await Promise.all([c.cashBalance(account),c.lockedMargin(account)]);return Object.freeze({cashKaios:ethers.utils.formatUnits(cash,18),lockedKaios:ethers.utils.formatUnits(locked,18)});}
