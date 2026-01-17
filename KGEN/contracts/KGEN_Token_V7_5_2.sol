// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/*
KGEN Token V7.5.2 GENESIS (OZ v5)
Name   : KLINE GENESIS
Symbol : KGEN
- Total Tax: 0.30% (30 bps)
  - Burn:   0.10% (10 bps)
  - Bank:   0.10% (10 bps)
  - Reward: 0.05% ( 5 bps)
  - AutoLP: 0.05% ( 5 bps)

Hard Rules:
- Wallet -> Wallet transfers: NO TAX
- Tax applies ONLY when interacting with AMM pair (buy/sell)
- Tax-exempt addresses are always no-tax.
*/

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KGEN_Token_V7_5_2 is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 72_000_000 * 1e18;

    uint16 public constant TAX_BPS_TOTAL  = 30; // 0.30%
    uint16 public constant TAX_BPS_BURN   = 10; // 0.10%
    uint16 public constant TAX_BPS_BANK   = 10; // 0.10%
    uint16 public constant TAX_BPS_REWARD = 5;  // 0.05%
    uint16 public constant TAX_BPS_AUTOLP = 5;  // 0.05%

    error TaxBpsMismatch();
    error ZeroAddress();

    address public bankWallet;
    address public rewardWallet;
    address public autoLPWallet;

    mapping(address => bool) public isTaxExempt;
    mapping(address => bool) public isMarketMakerPair;

    event SetTaxWallets(address indexed bank, address indexed reward, address indexed autolp);
    event SetTaxExempt(address indexed account, bool exempt);
    event SetMarketMakerPair(address indexed pair, bool enabled);

    constructor(
        address initialOwner,
        address _bankWallet,
        address _rewardWallet,
        address _autoLPWallet
    )
        ERC20("KLINE GENESIS", "KGEN")
        Ownable(initialOwner)
    {
        if (initialOwner == address(0) || _bankWallet == address(0) || _rewardWallet == address(0) || _autoLPWallet == address(0)) {
            revert ZeroAddress();
        }
        if (TAX_BPS_BURN + TAX_BPS_BANK + TAX_BPS_REWARD + TAX_BPS_AUTOLP != TAX_BPS_TOTAL) {
            revert TaxBpsMismatch();
        }

        bankWallet = _bankWallet;
        rewardWallet = _rewardWallet;
        autoLPWallet = _autoLPWallet;

        _mint(initialOwner, TOTAL_SUPPLY);

        isTaxExempt[initialOwner] = true;
        isTaxExempt[_bankWallet] = true;
        isTaxExempt[_rewardWallet] = true;
        isTaxExempt[_autoLPWallet] = true;

        emit SetTaxWallets(_bankWallet, _rewardWallet, _autoLPWallet);
        emit SetTaxExempt(initialOwner, true);
        emit SetTaxExempt(_bankWallet, true);
        emit SetTaxExempt(_rewardWallet, true);
        emit SetTaxExempt(_autoLPWallet, true);
    }

    function setTaxWallets(address _bankWallet, address _rewardWallet, address _autoLPWallet) external onlyOwner {
        if (_bankWallet == address(0) || _rewardWallet == address(0) || _autoLPWallet == address(0)) {
            revert ZeroAddress();
        }
        bankWallet = _bankWallet;
        rewardWallet = _rewardWallet;
        autoLPWallet = _autoLPWallet;

        isTaxExempt[_bankWallet] = true;
        isTaxExempt[_rewardWallet] = true;
        isTaxExempt[_autoLPWallet] = true;

        emit SetTaxWallets(_bankWallet, _rewardWallet, _autoLPWallet);
        emit SetTaxExempt(_bankWallet, true);
        emit SetTaxExempt(_rewardWallet, true);
        emit SetTaxExempt(_autoLPWallet, true);
    }

    function setTaxExempt(address account, bool exempt) external onlyOwner {
        isTaxExempt[account] = exempt;
        emit SetTaxExempt(account, exempt);
    }

    function setMarketMakerPair(address pair, bool enabled) external onlyOwner {
        isMarketMakerPair[pair] = enabled;
        emit SetMarketMakerPair(pair, enabled);
    }

    function _update(address from, address to, uint256 value) internal override {
        if (from == address(0) || to == address(0) || value == 0) {
            super._update(from, to, value);
            return;
        }

        if (
            isTaxExempt[from] ||
            isTaxExempt[to] ||
            !(isMarketMakerPair[from] || isMarketMakerPair[to])
        ) {
            super._update(from, to, value);
            return;
        }

        uint256 taxTotal = (value * TAX_BPS_TOTAL) / 10_000;
        uint256 sendAmount = value - taxTotal;

        uint256 taxBurn   = (value * TAX_BPS_BURN)   / 10_000;
        uint256 taxBank   = (value * TAX_BPS_BANK)   / 10_000;
        uint256 taxReward = (value * TAX_BPS_REWARD) / 10_000;
        uint256 taxAutoLP = taxTotal - taxBurn - taxBank - taxReward;

        super._update(from, to, sendAmount);

        if (taxBurn > 0) {
            super._update(from, address(0), taxBurn);
        }
        if (taxBank > 0) {
            super._update(from, bankWallet, taxBank);
        }
        if (taxReward > 0) {
            super._update(from, rewardWallet, taxReward);
        }
        if (taxAutoLP > 0) {
            super._update(from, autoLPWallet, taxAutoLP);
        }
    }
}
