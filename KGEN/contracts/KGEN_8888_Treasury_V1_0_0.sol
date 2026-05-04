// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KGEN_8888_Treasury_V1_0_0.sol
 * 高老莊 8888｜凡間流通池 / 商店紅利池（最小可用金庫）
 *
 * 用途（只做一件事）：
 * - 安全收 K G E N（作為凡間池/紅利池）
 * - Owner 可提領到指定收款錢包（可在 lockConfig 前設定）
 *
 * ⚠️ 不做任何分紅、不做任何自動化，避免複雜。
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
}

abstract contract Ownable {
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    address public owner;
    modifier onlyOwner(){ require(msg.sender==owner, "ONLY_OWNER"); _; }
    constructor(address owner_){
        require(owner_!=address(0), "owner=0");
        owner = owner_;
        emit OwnershipTransferred(address(0), owner_);
    }
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner!=address(0),"owner=0");
        emit OwnershipTransferred(owner,newOwner);
        owner=newOwner;
    }
}

contract KGEN_8888_Treasury_V1_0_0 is Ownable {
    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event SetTreasuryWallet(address indexed wallet);
    event ConfigLocked();

    IERC20 public immutable kgen;
    address public treasuryWallet; // default = owner
    bool public configLocked;

    constructor(address owner_, address kgen_, address treasuryWallet_) Ownable(owner_) {
        require(kgen_ != address(0), "kgen=0");
        kgen = IERC20(kgen_);
        treasuryWallet = treasuryWallet_ == address(0) ? owner_ : treasuryWallet_;
    }

    function setTreasuryWallet(address w) external onlyOwner {
        require(!configLocked, "LOCKED");
        require(w != address(0), "wallet=0");
        treasuryWallet = w;
        emit SetTreasuryWallet(w);
    }

    function lockConfig() external onlyOwner {
        configLocked = true;
        emit ConfigLocked();
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "amount=0");
        require(kgen.transferFrom(msg.sender, address(this), amount), "transferFrom fail");
        emit Deposit(msg.sender, amount);
    }

    function balance() external view returns (uint256) {
        return kgen.balanceOf(address(this));
    }

    function withdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "amount=0");
        require(treasuryWallet != address(0), "wallet=0");
        require(kgen.transfer(treasuryWallet, amount), "transfer fail");
        emit Withdraw(treasuryWallet, amount);
    }

    function withdrawAll() external onlyOwner {
        uint256 amt = kgen.balanceOf(address(this));
        require(amt > 0, "empty");
        require(treasuryWallet != address(0), "wallet=0");
        require(kgen.transfer(treasuryWallet, amt), "transfer fail");
        emit Withdraw(treasuryWallet, amt);
    }
}
