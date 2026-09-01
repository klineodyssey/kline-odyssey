// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Review candidate for 11520 mobile ATM/UFO bilateral conversion.
/// @dev No fixed exchange rate. Maker locks KAIOS inventory and chooses a quote;
///      taker accepts exactly or not at all. This contract does not mint KAIOS and
///      does not invoke the KGEN->KAIOS White-Hole mechanism.
interface IERC20_11520 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract KAIOSAtmOTC11520V1 {
    struct Quote {
        address maker;
        address payToken; // address(0) = native BNB
        uint256 payAmount;
        uint256 kaiosAmount;
        uint64 expiresAt;
        bool active;
    }

    IERC20_11520 public immutable kaios;
    uint256 public nextQuoteId = 1;
    uint256 private lockState = 1;
    mapping(uint256 => Quote) public quotes;

    event QuoteCreated(uint256 indexed quoteId,address indexed maker,address indexed payToken,uint256 payAmount,uint256 kaiosAmount,uint64 expiresAt);
    event QuoteCancelled(uint256 indexed quoteId,address indexed maker);
    event QuoteAccepted(uint256 indexed quoteId,address indexed maker,address indexed taker,address payToken,uint256 payAmount,uint256 kaiosAmount);

    modifier nonReentrant() {
        require(lockState == 1, "REENTRANCY");
        lockState = 2;
        _;
        lockState = 1;
    }

    constructor(address kaiosToken) {
        require(kaiosToken != address(0), "ZERO_KAIOS");
        kaios = IERC20_11520(kaiosToken);
    }

    function _safeTransfer(IERC20_11520 token,address to,uint256 value) private {
        (bool ok,bytes memory data)=address(token).call(abi.encodeWithSelector(token.transfer.selector,to,value));
        require(ok && (data.length==0 || abi.decode(data,(bool))),"TRANSFER_FAILED");
    }
    function _safeTransferFrom(IERC20_11520 token,address from,address to,uint256 value) private {
        (bool ok,bytes memory data)=address(token).call(abi.encodeWithSelector(token.transferFrom.selector,from,to,value));
        require(ok && (data.length==0 || abi.decode(data,(bool))),"TRANSFER_FROM_FAILED");
    }

    /// @notice Maker chooses the exact bilateral rate by choosing payAmount and kaiosAmount.
    ///         KAIOS is locked here so an accepted quote cannot be unfunded.
    function createQuote(address payToken,uint256 payAmount,uint256 kaiosAmount,uint64 expiresAt) external nonReentrant returns(uint256 quoteId) {
        require(payToken != address(kaios),"PAY_TOKEN_KAIOS_FORBIDDEN");
        require(payAmount > 0 && kaiosAmount > 0,"ZERO_AMOUNT");
        require(expiresAt > block.timestamp,"BAD_EXPIRY");
        _safeTransferFrom(kaios,msg.sender,address(this),kaiosAmount);
        quoteId = nextQuoteId++;
        quotes[quoteId] = Quote(msg.sender,payToken,payAmount,kaiosAmount,expiresAt,true);
        emit QuoteCreated(quoteId,msg.sender,payToken,payAmount,kaiosAmount,expiresAt);
    }

    function cancelQuote(uint256 quoteId) external nonReentrant {
        Quote storage q=quotes[quoteId];
        require(q.active,"NOT_ACTIVE");
        require(q.maker==msg.sender,"ONLY_MAKER");
        q.active=false;
        _safeTransfer(kaios,q.maker,q.kaiosAmount);
        emit QuoteCancelled(quoteId,q.maker);
    }

    /// @notice ERC20 pay-token path. Both legs settle atomically in one transaction.
    function acceptTokenQuote(uint256 quoteId) external nonReentrant {
        Quote storage q=quotes[quoteId];
        require(q.active && block.timestamp <= q.expiresAt,"QUOTE_UNAVAILABLE");
        require(q.payToken != address(0),"USE_BNB_PATH");
        q.active=false;
        _safeTransferFrom(IERC20_11520(q.payToken),msg.sender,q.maker,q.payAmount);
        _safeTransfer(kaios,msg.sender,q.kaiosAmount);
        emit QuoteAccepted(quoteId,q.maker,msg.sender,q.payToken,q.payAmount,q.kaiosAmount);
    }

    /// @notice Native BNB path. Exact amount prevents accidental rate drift.
    function acceptBnbQuote(uint256 quoteId) external payable nonReentrant {
        Quote storage q=quotes[quoteId];
        require(q.active && block.timestamp <= q.expiresAt,"QUOTE_UNAVAILABLE");
        require(q.payToken == address(0),"USE_TOKEN_PATH");
        require(msg.value == q.payAmount,"EXACT_BNB_REQUIRED");
        q.active=false;
        (bool ok,)=q.maker.call{value:msg.value}("");
        require(ok,"BNB_TRANSFER_FAILED");
        _safeTransfer(kaios,msg.sender,q.kaiosAmount);
        emit QuoteAccepted(quoteId,q.maker,msg.sender,address(0),q.payAmount,q.kaiosAmount);
    }
}
