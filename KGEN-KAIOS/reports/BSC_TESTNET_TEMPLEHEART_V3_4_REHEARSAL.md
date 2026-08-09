# BSC Testnet TempleHeart V3.4 Rehearsal

Status: **TEMPLEHEART_V3_4_TESTNET_REHEARSAL_PASS**

Execution class: **REAL_BSC_TESTNET**

Time-boundary class: **LOCAL_TIME_SIMULATION**

Chain ID: **97**

Public signer: `0x3a909988E4d5c9C2326A7a0596714482AB25eE0A`

Starting balance: **0.29958203084 tBNB**

Final balance: **0.29786283124 tBNB**

No private key, mnemonic, authenticated RPC URL, or Mainnet address is recorded in this evidence.

## Contracts

| Component | BSC Testnet address |
|---|---|
| testKgen | `0x79b65388e6fd7e0b171147914384A0455c7A16E6` |
| testKaiosProofSource | `0x74f7A95B40bB9a1Aa2ebCc680166e9A45494C225` |
| testAlchemyFurnace18911 | `0xB4075952F1FD17C482488FB457e2A63C6B7f53a3` |
| testTreasury11520 | `0x6AEd9782963003DA8401DdB91d811d6Eb3989bBf` |
| testOrganRegistry | `0x577eb07d3d24aC26f3393771F0E48608C4871DeA` |
| testFortuneGame | `0xfd9eF63776C8467E329B17e32a46E1a04463af04` |
| templeHeartV332Implementation | `0xf99B61f90bA7d12c9DcF990B6cc0941246D1F21d` |
| templeHeartProxy | `0xa74F84942ADe7F668009BC4cB9E73C05ed5A3296` |
| templeHeartV340Implementation | `0x52FFbEDAdD60c94a7FFc5B2EA36D57Cf666ab3f2` |

## Upgrade and storage

- Upgrade transaction: `0x8692f2874e6a4bf82dbcb84d5e12c9f9583e8e87bc3cdcba95860b121853fe94`
- V3.3.2 baseline slots: 58
- V3.4.0 candidate slots: 73
- Append-only slots: 15
- Legacy state preservation: **PASS**
- ERC1967 implementation verification: **PASS**

## Runtime and security

- 108000 normalization to governed Test 11520: **PASS**
- Test Fortune Game real payout and 1888 rejection: **PASS**
- Fortune 1–8 KGEN ownership: **PASS**
- Voluntary repayment qualification: **PASS**
- Proof replay rejection: **PASS**
- Beneficiary redirect rejection: **PASS**
- Wrong civilization rejection: **PASS**
- Unauthorized upgrade rejection: **PASS**
- Unauthorized operator operation rejection: **PASS**
- Admin clawback/seizure functions absent: **PASS**
- Heartbeat/Ignite/hour/day/30-day time boundaries: **LOCAL_TIME_SIMULATION — 30/30 deterministic tests PASS**

## Transactions

| Operation | Transaction hash | Block | Gas used |
|---|---|---:|---:|
| Deploy KAIOSOrganRegistry | `0x833fcb04aa7b82eec939ee6722b495faf3bd9bf3459a3fd71af46962e8ba27c2` | 124035486 | 623580 |
| Deploy MockKGEN | `0x8103eb0a77adb68dd0ea6ee0a0a1126e7ab77c5804e79726239f73800a81bec7` | 124035497 | 552904 |
| Deploy KAIOS | `0xe2272c14fecfc51a2978415c482c57f96b7f0c014370d73d854b151c99afe809` | 124035508 | 1394116 |
| Deploy KAIOSAlchemyFurnace | `0x1e7dc915d2d6ee988d7eda08a68fa009640450bc563b2c656ea171af91238ba4` | 124035518 | 506642 |
| Deploy MockOrgan | `0xaf59fec0622a794b443cbc35af3b62cec389a2067d9a4d48281ac014c7589db8` | 124035529 | 57091 |
| Deploy TestFortuneGame | `0x798e772b6c38a42b3b60a6081b93d6b601749f03fa88ceb427a91d9fcf0dfa7a` | 124035539 | 113879 |
| Register Test Furnace 18911 | `0xc9baac10a63d0d26239799eda4de1e3409fcf1cd6b470851659a69d474688fb7` | 124035552 | 55173 |
| Register Test Treasury 11520 | `0x87c0aa9f6059e8334909d100ddc27bb60bbb471605bf661e36d9bca0f090d88b` | 124035561 | 55173 |
| Seal Test Organ Registry bootstrap | `0xeef0b66b2e02b4e48912d440d8a4134b68c0d5ce55b739e753bda6e932b08556` | 124035572 | 24801 |
| Burn Test KGEN for Test KAIOS | `0xb914fa994216c412ac90c68025ba4efd76d54ba7bf225996ad73f22d47b48e8a` | 124035583 | 33555 |
| Settle Test KAIOS supply | `0x70c3c953ec0e29afc6dafd98af2386f1ae705864628b335bfd86d131324a5b99` | 124035593 | 143435 |
| Deploy KGEN_TempleHeart_V3_3_2_Baseline | `0xb9cc8be395dbafe3b164e9f3a68b9bea9cd199448beb6c51438d5e6226ae62f7` | 124035607 | 4031376 |
| Deploy ERC1967Proxy | `0xcf73e7f7e7b945991b36e8b1185967e6fd58e080005f54b57f8d5a2484018fce` | 124035624 | 916709 |
| Bind Fortune Game | `0x4dfc2fee580796b1090a5c1e16fdbecf08e92a51a7ec3410b791e01bebe99408` | 124035630 | 53060 |
| Create pre-upgrade wish state | `0xbb98be84e8c88e432807a1efde95f9d70587ead3e9f4c42064a6712e912a3b3d` | 124035640 | 259684 |
| Create representative organ state | `0x1a4329cc4d3566738b40926390def615e2aec167edbf2d382b593a869cb7b389` | 124035650 | 121322 |
| Create baseline heartbeat state | `0x839bc38f6c4261b8ffb2ee91633fca7a5221ef880acfca95595b89e2f9fcde23` | 124035661 | 153542 |
| Create baseline cross-day state | `0xa1679615c2d341759b7b437e91ecd25239a3b1fe1f27961cd30f77e414d4b024` | 124035672 | 134477 |
| Deploy KGEN_TempleHeart_Upgradeable | `0x065c173e70549174cc6aa77c41b6c2b5aaa458b9e17c98d3e139810359a93c99` | 124035685 | 5167455 |
| Upgrade V3.3.2 -> V3.4.0 | `0x8692f2874e6a4bf82dbcb84d5e12c9f9583e8e87bc3cdcba95860b121853fe94` | 124035697 | 156305 |
| Rollback V3.4.0 -> V3.3.2 | `0xc6be3517a1042c4307c6d88385826f9710110588f9f10e12e68a57bce75e68e8` | 124035711 | 39002 |
| Restore V3.4.0 after rollback | `0x3d5761fe4907c1af08ed4dfb04c0aa457ba001f409b3c57558ef6fe5353b79c3` | 124035721 | 39046 |
| Fund rehearsal Heart | `0x9b0749bfd3f9a70b93da6f054c3279f58971d4660d5cc1e632876d8ab80bc825` | 124035732 | 51366 |
| Normalize Heart to 108000 | `0xb1b80fbae2bdaaa90470ffce290f785daaa2f2d68d73eedd7aaeed160d7be7a2` | 124035742 | 80823 |
| Test Fortune Game real 1 KGEN payout | `0x888c6cd17cc948b819a1218fa0a002af684f2d2a7ec2a5eea12051309e3b10a8` | 124035754 | 67580 |
| Holy Cup VALID | `0xe9e9d125f8142544da230011553a63f59e7398584a9d3c4393f31a9942437943` | 124035768 | 111670 |
| Approve KAIOS VALID | `0x5459ba26a6972c37ef84b588afcd52fdb1997df5e14ea657dce38522b55acd04` | 124035775 | 46008 |
| Create Alchemy proof VALID | `0x94051b4268cf49dbfd0ded4ab50f74dc03c5a92fe0f39d67507bbb4d5964f846` | 124035786 | 451665 |
| fortuneClaim smoke | `0x2c5d4cb34b65491bc3210031d83f3dd2bdb15c3bbbf2a5e4e2c15755c3a83807` | 124035797 | 342690 |
| Approve voluntary Fortune repayment | `0x491b433279e20c8799c5a6d9c21f0c8f674f31bc91a0350bee85f7f9d0b0baa1` | 124035808 | 45981 |
| Voluntary Fortune repayment | `0x13fa893fa1ff62dab076ed41bd56f311ad79e7b0824a719ba11d2a7c660a5ef0` | 124035818 | 160588 |
| Create redirect-rejection wish | `0xc5e7aa22660167ad5686eed590e9d95f2f10e18180a03cc0d37a1f64f504cecd` | 124035829 | 177529 |
| Holy Cup REDIRECT | `0x8e448255291683167304b21c71c82bcb3d5fc5ff41d01ac2d55c75b25c1a0f68` | 124035840 | 96811 |
| Approve KAIOS REDIRECT | `0xb4a0337774deb664c0563277f8e5fcad616323437e4311dd703672ae9f8974c4` | 124035849 | 46008 |
| Create Alchemy proof REDIRECT | `0x35d4cf7286f7a775bef6d73e979b2bf04993fadab3438de210a2a1e2ec49a134` | 124035861 | 417465 |
| Approve KAIOS WRONG_CIVILIZATION | `0xcb798dd4f477a8e1a36cbc60a22c1f1e5f1758cd12506e63049008eb66c93e62` | 124035871 | 46008 |
| Create Alchemy proof WRONG_CIVILIZATION | `0x8138fba063d73f99489655b72d2039b53a4dd89c9d0a2228ae57ed3e494a0c90` | 124035882 | 417477 |

Total gas used: **17191996**

## Safety boundary

`MAINNET_DEPLOY = BLOCKED`
