// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

/**
 * RewardVault: 獎池金庫（不碰 core 稅制）
 * - Vault 先由你從 reward 錢包轉 KGEN 進來
 * - 之後由 DailyIgnite 呼叫發小獎
 */
contract KGEN_RewardVault_V1 {
    IERC20 public immutable kgen;
    address public owner;
    address public dailyIgnite; // 授權呼叫發獎的合約

    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event DailyIgniteSet(address indexed dailyIgnite);
    event Payout(address indexed to, uint256 amount, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    modifier onlyDailyIgnite() {
        require(msg.sender == dailyIgnite, "NOT_DAILY_IGNITE");
        _;
    }

    constructor(address _kgen, address _owner) {
        require(_kgen != address(0) && _owner != address(0), "ZERO_ADDR");
        kgen = IERC20(_kgen);
        owner = _owner;
        emit OwnerChanged(address(0), _owner);
    }

    function setDailyIgnite(address _dailyIgnite) external onlyOwner {
        require(_dailyIgnite != address(0), "ZERO_ADDR");
        dailyIgnite = _dailyIgnite;
        emit DailyIgniteSet(_dailyIgnite);
    }

    /// 給 DailyIgnite 發放守門人小獎（permissioned）
    function payout(address to, uint256 amount, string calldata reason) external onlyDailyIgnite {
        require(to != address(0), "ZERO_TO");
        require(amount > 0, "ZERO_AMOUNT");
        require(kgen.transfer(to, amount), "TRANSFER_FAIL");
        emit Payout(to, amount, reason);
    }

    /// 緊急/手動支付（你要做每月5日薪水也可先用這個）
    function ownerPayout(address to, uint256 amount, string calldata reason) external onlyOwner {
        require(to != address(0), "ZERO_TO");
        require(amount > 0, "ZERO_AMOUNT");
        require(kgen.transfer(to, amount), "TRANSFER_FAIL");
        emit Payout(to, amount, reason);
    }

    function vaultBalance() external view returns (uint256) {
        return kgen.balanceOf(address(this));
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_NEW_OWNER");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }
}
