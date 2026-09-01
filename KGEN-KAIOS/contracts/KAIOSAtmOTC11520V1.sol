// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20_11520 {
    function transfer(address to,uint256 value) external returns(bool);
    function transferFrom(address from,address to,uint256 value) external returns(bool);
}

/// @notice 11520 mobile ATM/UFO bilateral exchange candidate.
/// @dev No fixed exchange rate. Maker chooses both assets and exact amounts, escrows
///      the offered leg, and taker either accepts the entire quote atomically or not at all.
///      address(0) means native BNB. KAIOS is only another settlement asset here: this
///      contract never mints KAIOS and never invokes the White-Hole KGEN->KAIOS mechanism.
contract KAIOSAtmOTC11520V1 {
    struct Quote {
        address maker;
        address makerToken; // escrowed asset; address(0)=BNB
        uint256 makerAmount;
        address takerToken; // requested asset; address(0)=BNB
        uint256 takerAmount;
        uint64 expiresAt;
        bool active;
    }

    address public immutable kaios;
    uint256 public nextQuoteId=1;
    uint256 private lockState=1;
    mapping(uint256=>Quote) public quotes;

    event QuoteCreated(uint256 indexed quoteId,address indexed maker,address indexed makerToken,uint256 makerAmount,address takerToken,uint256 takerAmount,uint64 expiresAt);
    event QuoteCancelled(uint256 indexed quoteId,address indexed maker);
    event QuoteAccepted(uint256 indexed quoteId,address indexed maker,address indexed taker,address makerToken,uint256 makerAmount,address takerToken,uint256 takerAmount);

    modifier nonReentrant(){require(lockState==1,"REENTRANCY");lockState=2;_;lockState=1;}

    constructor(address kaiosToken){require(kaiosToken!=address(0),"ZERO_KAIOS");kaios=kaiosToken;}

    function _safeTransfer(address token,address to,uint256 value) private {
        (bool ok,bytes memory data)=token.call(abi.encodeWithSelector(IERC20_11520.transfer.selector,to,value));
        require(ok&&(data.length==0||abi.decode(data,(bool))),"TRANSFER_FAILED");
    }
    function _safeTransferFrom(address token,address from,address to,uint256 value) private {
        (bool ok,bytes memory data)=token.call(abi.encodeWithSelector(IERC20_11520.transferFrom.selector,from,to,value));
        require(ok&&(data.length==0||abi.decode(data,(bool))),"TRANSFER_FROM_FAILED");
    }
    function _sendBnb(address to,uint256 value) private {
        (bool ok,)=to.call{value:value}(""); require(ok,"BNB_TRANSFER_FAILED");
    }

    /// @notice Maker escrows an ERC20 asset and requests either another ERC20 or BNB.
    function createTokenQuote(address makerToken,uint256 makerAmount,address takerToken,uint256 takerAmount,uint64 expiresAt) external nonReentrant returns(uint256 quoteId){
        require(makerToken!=address(0),"USE_BNB_MAKER_PATH");
        require(makerToken!=takerToken,"SAME_ASSET");
        require(makerAmount>0&&takerAmount>0,"ZERO_AMOUNT");
        require(expiresAt>block.timestamp,"BAD_EXPIRY");
        _safeTransferFrom(makerToken,msg.sender,address(this),makerAmount);
        quoteId=nextQuoteId++;
        quotes[quoteId]=Quote(msg.sender,makerToken,makerAmount,takerToken,takerAmount,expiresAt,true);
        emit QuoteCreated(quoteId,msg.sender,makerToken,makerAmount,takerToken,takerAmount,expiresAt);
    }

    /// @notice Maker escrows native BNB and requests an ERC20 asset. BNB<->BNB is forbidden.
    function createBnbQuote(address takerToken,uint256 takerAmount,uint64 expiresAt) external payable nonReentrant returns(uint256 quoteId){
        require(msg.value>0&&takerAmount>0,"ZERO_AMOUNT");
        require(takerToken!=address(0),"SAME_ASSET");
        require(expiresAt>block.timestamp,"BAD_EXPIRY");
        quoteId=nextQuoteId++;
        quotes[quoteId]=Quote(msg.sender,address(0),msg.value,takerToken,takerAmount,expiresAt,true);
        emit QuoteCreated(quoteId,msg.sender,address(0),msg.value,takerToken,takerAmount,expiresAt);
    }

    function cancelQuote(uint256 quoteId) external nonReentrant {
        Quote storage q=quotes[quoteId];
        require(q.active,"NOT_ACTIVE"); require(q.maker==msg.sender,"ONLY_MAKER");
        q.active=false;
        if(q.makerToken==address(0)) _sendBnb(q.maker,q.makerAmount);
        else _safeTransfer(q.makerToken,q.maker,q.makerAmount);
        emit QuoteCancelled(quoteId,q.maker);
    }

    /// @notice Taker pays the requested leg; the escrowed maker leg is released atomically.
    ///         If takerToken is BNB, msg.value must exactly equal takerAmount.
    function acceptQuote(uint256 quoteId) external payable nonReentrant {
        Quote storage q=quotes[quoteId];
        require(q.active&&block.timestamp<=q.expiresAt,"QUOTE_UNAVAILABLE");
        q.active=false;

        if(q.takerToken==address(0)){
            require(msg.value==q.takerAmount,"EXACT_BNB_REQUIRED");
            _sendBnb(q.maker,msg.value);
        }else{
            require(msg.value==0,"UNEXPECTED_BNB");
            _safeTransferFrom(q.takerToken,msg.sender,q.maker,q.takerAmount);
        }

        if(q.makerToken==address(0)) _sendBnb(msg.sender,q.makerAmount);
        else _safeTransfer(q.makerToken,msg.sender,q.makerAmount);

        emit QuoteAccepted(quoteId,q.maker,msg.sender,q.makerToken,q.makerAmount,q.takerToken,q.takerAmount);
    }
}
