import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import solc from 'solc';
import ganache from 'ganache';
import { ethers } from 'ethers';

const mockSource=`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract MockERC20_11520 {
 string public name; string public symbol; uint8 public constant decimals=18; uint256 public totalSupply;
 mapping(address=>uint256) public balanceOf; mapping(address=>mapping(address=>uint256)) public allowance;
 event Transfer(address indexed from,address indexed to,uint256 value); event Approval(address indexed owner,address indexed spender,uint256 value);
 constructor(string memory n,string memory s,uint256 supply){name=n;symbol=s;_mint(msg.sender,supply);}
 function _mint(address to,uint256 v) internal {balanceOf[to]+=v;totalSupply+=v;emit Transfer(address(0),to,v);}
 function transfer(address to,uint256 v) external returns(bool){require(balanceOf[msg.sender]>=v,'BAL');balanceOf[msg.sender]-=v;balanceOf[to]+=v;emit Transfer(msg.sender,to,v);return true;}
 function approve(address s,uint256 v) external returns(bool){allowance[msg.sender][s]=v;emit Approval(msg.sender,s,v);return true;}
 function transferFrom(address f,address t,uint256 v) external returns(bool){require(balanceOf[f]>=v&&allowance[f][msg.sender]>=v,'ALLOW');allowance[f][msg.sender]-=v;balanceOf[f]-=v;balanceOf[t]+=v;emit Transfer(f,t,v);return true;}
}`;

function compile(){
  const sources={
    'MockERC20_11520.sol':{content:mockSource},
    'KAIOSAtmOTC11520V1.sol':{content:fs.readFileSync(new URL('../KGEN-KAIOS/contracts/KAIOSAtmOTC11520V1.sol',import.meta.url),'utf8')},
    'KAIOSWarpClearing11520V1.sol':{content:fs.readFileSync(new URL('../KGEN-KAIOS/contracts/KAIOSWarpClearing11520V1.sol',import.meta.url),'utf8')}
  };
  const input={language:'Solidity',sources,settings:{optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}};
  const out=JSON.parse(solc.compile(JSON.stringify(input)));
  const errors=(out.errors||[]).filter(e=>e.severity==='error');
  assert.deepEqual(errors,[],errors.map(e=>e.formattedMessage).join('\n'));
  const get=(file,name)=>out.contracts[file][name];
  return {mock:get('MockERC20_11520.sol','MockERC20_11520'),atm:get('KAIOSAtmOTC11520V1.sol','KAIOSAtmOTC11520V1'),clearing:get('KAIOSWarpClearing11520V1.sol','KAIOSWarpClearing11520V1')};
}

async function deploy(signer,artifact,args=[]){
  const f=new ethers.ContractFactory(artifact.abi,'0x'+artifact.evm.bytecode.object,signer);
  const c=await f.deploy(...args);await c.deployed();return c;
}
const u=v=>ethers.utils.parseEther(String(v));

async function latestTs(provider){return (await provider.getBlock('latest')).timestamp;}

const artifacts=compile();

test('EVM full loop: KGEN -> KAIOS -> margin -> LONG fill -> KAIOS withdraw -> KGEN cash-out',async()=>{
  const g=ganache.provider({logging:{quiet:true},wallet:{totalAccounts:5,defaultBalance:1000},chain:{chainId:1337}});
  const provider=new ethers.providers.Web3Provider(g);
  const admin=provider.getSigner(0), maker=provider.getSigner(1), player=provider.getSigner(2);
  const adminAddr=await admin.getAddress(), makerAddr=await maker.getAddress(), playerAddr=await player.getAddress();

  const kaios=await deploy(admin,artifacts.mock,['KAIOS','KAIOS',u(1000000)]);
  const kgen=await deploy(admin,artifacts.mock,['KGEN','KGEN',u(1000000)]);
  const atm=await deploy(admin,artifacts.atm,[kaios.address]);
  const clearing=await deploy(admin,artifacts.clearing,[kaios.address,adminAddr]);

  await (await kaios.transfer(makerAddr,u(5000))).wait();
  await (await kgen.transfer(makerAddr,u(100))).wait();
  await (await kgen.transfer(playerAddr,u(2))).wait();

  // Deposit-side ATM: maker independently quotes 777 KAIOS for 1 KGEN.
  await (await kaios.connect(maker).approve(atm.address,u(777))).wait();
  const expiry=(await latestTs(provider))+3600;
  await (await atm.connect(maker).createTokenQuote(kaios.address,u(777),kgen.address,u(1),expiry)).wait();
  await (await kgen.connect(player).approve(atm.address,u(1))).wait();
  await (await atm.connect(player).acceptQuote(1)).wait();
  assert.equal(ethers.utils.formatEther(await kaios.balanceOf(playerAddr)),'777.0');
  assert.equal(ethers.utils.formatEther(await kgen.balanceOf(playerAddr)),'1.0');

  // Fully-funded counterparty reserve and player margin deposit.
  await (await kaios.approve(clearing.address,u(1000))).wait();
  await (await clearing.fundReserve(u(1000))).wait();
  await (await kaios.connect(player).approve(clearing.address,u(700))).wait();
  await (await clearing.connect(player).deposit(u(700))).wait();
  assert.equal(ethers.utils.formatEther(await clearing.cashBalance(playerAddr)),'700.0');

  const symbol=ethers.utils.formatBytes32String('BTC/USDT');
  let ts=await latestTs(provider);
  await (await clearing.setMark(symbol,ethers.BigNumber.from('10000000000000'),ts)).wait(); // 100,000 * 1e8
  await (await clearing.connect(player).openPosition(symbol,true,ethers.BigNumber.from('10000000000'),u(100))).wait(); // 100C
  assert.equal(ethers.utils.formatEther(await clearing.lockedMargin(playerAddr)),'100.0');

  // +0.5 index point at 100C => +50 KAIOS. Oracle mark must be current.
  ts=await latestTs(provider);
  await (await clearing.setMark(symbol,ethers.BigNumber.from('10000050000000'),ts)).wait();
  await (await clearing.connect(player).closePosition(1)).wait();
  assert.equal(ethers.utils.formatEther(await clearing.cashBalance(playerAddr)),'750.0');
  assert.equal(ethers.utils.formatEther(await clearing.liquidityReserve()),'950.0');

  // Withdraw all clearing cash back to wallet: 77 wallet KAIOS + 750 = 827.
  await (await clearing.connect(player).withdraw(u(750))).wait();
  assert.equal(ethers.utils.formatEther(await kaios.balanceOf(playerAddr)),'827.0');
  assert.equal(ethers.utils.formatEther(await clearing.cashBalance(playerAddr)),'0.0');

  // Reverse ATM cash-out: maker offers 1 KGEN and asks 700 KAIOS. Player accepts.
  await (await kgen.connect(maker).approve(atm.address,u(1))).wait();
  await (await atm.connect(maker).createTokenQuote(kgen.address,u(1),kaios.address,u(700),(await latestTs(provider))+3600)).wait();
  await (await kaios.connect(player).approve(atm.address,u(700))).wait();
  await (await atm.connect(player).acceptQuote(2)).wait();
  assert.equal(ethers.utils.formatEther(await kgen.balanceOf(playerAddr)),'2.0');
  assert.equal(ethers.utils.formatEther(await kaios.balanceOf(playerAddr)),'127.0');
});

test('EVM ATM supports native BNB as maker or taker leg',async()=>{
  const g=ganache.provider({logging:{quiet:true},wallet:{totalAccounts:4,defaultBalance:1000},chain:{chainId:1338}});
  const provider=new ethers.providers.Web3Provider(g);const admin=provider.getSigner(0),maker=provider.getSigner(1),taker=provider.getSigner(2);
  const adminAddr=await admin.getAddress(),takerAddr=await taker.getAddress();
  const kaios=await deploy(admin,artifacts.mock,['KAIOS','KAIOS',u(100000)]);const atm=await deploy(admin,artifacts.atm,[kaios.address]);
  await (await kaios.transfer(takerAddr,u(100))).wait();
  await (await atm.connect(maker).createBnbQuote(kaios.address,u(10),(await latestTs(provider))+3600,{value:u(1)})).wait();
  await (await kaios.connect(taker).approve(atm.address,u(10))).wait();
  await (await atm.connect(taker).acceptQuote(1)).wait();
  assert.equal((await provider.getBalance(atm.address)).toString(),'0');
  assert.equal(ethers.utils.formatEther(await kaios.balanceOf(takerAddr)),'90.0');
  assert.ok(adminAddr);
});
