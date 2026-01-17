
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract KGEN_GalacticBank_V7_5_2 is Ownable {
    event DepositToken(address indexed token, address indexed from, uint256 amount);
    event WithdrawToken(address indexed token, address indexed to, uint256 amount);
    event DepositNative(address indexed from, uint256 amount);
    event WithdrawNative(address indexed to, uint256 amount);

    constructor(address owner_) Ownable(owner_) {
        require(owner_ != address(0), "owner=0");
    }

    receive() external payable {
        emit DepositNative(msg.sender, msg.value);
    }

    function depositToken(address token, uint256 amount) external {
        require(amount > 0, "amount=0");
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit DepositToken(token, msg.sender, amount);
    }

    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        IERC20(token).transfer(to, amount);
        emit WithdrawToken(token, to, amount);
    }

    function withdrawNative(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "native transfer failed");
        emit WithdrawNative(to, amount);
    }
}
