// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Review-only 11520 KAIOS margin custody primitive.
/// @dev Deposit/withdraw is player-owned. It intentionally does NOT implement
///      an oracle, leverage, liquidation or arbitrary operator debit. Those must
///      be independently reviewed before real-money position settlement.
interface IERC20Margin11520 {
    function transfer(address to,uint256 value) external returns(bool);
    function transferFrom(address from,address to,uint256 value) external returns(bool);
}

contract KAIOSMarginVault11520V1 {
    IERC20Margin11520 public immutable kaios;
    mapping(address=>uint256) public balanceOf;
    uint256 public totalDeposits;
    uint256 private lockState=1;

    event MarginDeposited(address indexed player,uint256 amount);
    event MarginWithdrawn(address indexed player,uint256 amount);

    modifier nonReentrant(){require(lockState==1,"REENTRANCY");lockState=2;_;lockState=1;}

    constructor(address kaiosToken){require(kaiosToken!=address(0),"ZERO_KAIOS");kaios=IERC20Margin11520(kaiosToken);}

    function _safeTransfer(address to,uint256 value) private {
        (bool ok,bytes memory data)=address(kaios).call(abi.encodeWithSelector(kaios.transfer.selector,to,value));
        require(ok&&(data.length==0||abi.decode(data,(bool))),"TRANSFER_FAILED");
    }
    function _safeTransferFrom(address from,address to,uint256 value) private {
        (bool ok,bytes memory data)=address(kaios).call(abi.encodeWithSelector(kaios.transferFrom.selector,from,to,value));
        require(ok&&(data.length==0||abi.decode(data,(bool))),"TRANSFER_FROM_FAILED");
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount>0,"ZERO_AMOUNT");
        _safeTransferFrom(msg.sender,address(this),amount);
        balanceOf[msg.sender]+=amount;
        totalDeposits+=amount;
        emit MarginDeposited(msg.sender,amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount>0&&balanceOf[msg.sender]>=amount,"INSUFFICIENT");
        balanceOf[msg.sender]-=amount;
        totalDeposits-=amount;
        _safeTransfer(msg.sender,amount);
        emit MarginWithdrawn(msg.sender,amount);
    }
}
