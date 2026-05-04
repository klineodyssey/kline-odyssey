// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}

library SafeERC20Lite2 {
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "SAFE_TRANSFER_FAILED");
    }
}

abstract contract OwnableLite {
    address public owner;
    event OwnershipTransferred(address indexed prev, address indexed next);
    modifier onlyOwner() { require(msg.sender == owner, "ONLY_OWNER"); _; }
    constructor() { owner = msg.sender; emit OwnershipTransferred(address(0), msg.sender); }
    function transferOwnership(address next) external onlyOwner {
        require(next != address(0), "ZERO_ADDR");
        emit OwnershipTransferred(owner, next);
        owner = next;
    }
}

abstract contract ReentrancyGuardLite {
    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "REENTRANCY");
        _locked = 2;
        _;
        _locked = 1;
    }
}

contract KGEN_ZhanyaoTaxSplitter_V1_0_1 is OwnableLite, ReentrancyGuardLite {
    using SafeERC20Lite2 for IERC20;

    // ===== Config Lock =====
    bool public configLocked;
    event ConfigLocked();
    modifier whenUnlocked() { require(!configLocked, "CONFIG_LOCKED"); _; }

    // ===== Keeper (可選，不影響 anyone split；主要用於設定/救援流程) =====
    mapping(address => bool) public isKeeper;
    event KeeperSet(address indexed keeper, bool enabled);
    modifier onlyOwnerOrKeeper() {
        require(msg.sender == owner || isKeeper[msg.sender], "ONLY_OWNER_OR_KEEPER");
        _;
    }

    IERC20 public kgen;

    address public autoLP;
    address[9] public demons;

    // 固定比例：10% AutoLP + 90% Demons
    uint256 public constant AUTO_BPS  = 1000;  // 10%
    uint256 public constant DEMON_BPS = 9000;  // 90%

    event TokenSet(address indexed token);
    event AutoLPSet(address indexed autoLP);
    event DemonsSet(address[9] demons);
    event Split(uint256 total, uint256 toAutoLP, uint256 toDemonsTotal, uint256 toEach, uint256 remainder);
    event Rescue(address indexed token, address indexed to, uint256 amount);

    function setToken(address token) external onlyOwner whenUnlocked {
        require(token != address(0), "ZERO_ADDR");
        kgen = IERC20(token);
        emit TokenSet(token);
    }

    function setAutoLP(address _autoLP) external onlyOwner whenUnlocked {
        require(_autoLP != address(0), "ZERO_ADDR");
        autoLP = _autoLP;
        emit AutoLPSet(_autoLP);
    }

    function setDemons(address[9] calldata _demons) external onlyOwner whenUnlocked {
        for (uint256 i = 0; i < 9; i++) {
            require(_demons[i] != address(0), "ZERO_DEMON");
            demons[i] = _demons[i];
        }
        emit DemonsSet(_demons);
    }

    function setKeeper(address k, bool enabled) external onlyOwner whenUnlocked {
        require(k != address(0), "ZERO_ADDR");
        isKeeper[k] = enabled;
        emit KeeperSet(k, enabled);
    }

    function lockConfig() external onlyOwner whenUnlocked {
        configLocked = true;
        emit ConfigLocked();
    }

    // 稅收先進到本合約，任何人可觸發分流（鏈上留事件）
    function split() external nonReentrant {
        require(address(kgen) != address(0), "TOKEN_NOT_SET");
        require(autoLP != address(0), "AUTOLP_NOT_SET");

        // demons 必須先設好（避免有人忘了 setDemons 就開始分）
        for (uint256 i = 0; i < 9; i++) {
            require(demons[i] != address(0), "DEMONS_NOT_SET");
        }

        uint256 bal = kgen.balanceOf(address(this));
        require(bal > 0, "NO_BAL");

        uint256 toAuto = (bal * AUTO_BPS) / 10000;
        uint256 toDemTotal = bal - toAuto;

        // AutoLP
        if (toAuto > 0) {
            kgen.safeTransfer(autoLP, toAuto);
        }

        // 9 demons equally
        uint256 each = toDemTotal / 9;
        uint256 paidDem = 0;
        if (each > 0) {
            for (uint256 i = 0; i < 9; i++) {
                kgen.safeTransfer(demons[i], each);
                paidDem += each;
            }
        }

        uint256 remainder = toDemTotal - paidDem; // rounding stays
        emit Split(bal, toAuto, toDemTotal, each, remainder);
    }

    // 救援：有人誤轉其它 token 進來（只限 owner/keeper）
    function rescueToken(address token, address to, uint256 amount) external onlyOwnerOrKeeper nonReentrant {
        require(to != address(0), "ZERO_TO");
        require(amount > 0, "AMOUNT_ZERO");
        IERC20(token).transfer(to, amount);
        emit Rescue(token, to, amount);
    }
}
