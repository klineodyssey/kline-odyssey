// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KGEN_16888_Universe_V5_20_0.sol
 * 16888｜廣寒宮 · 單池宇宙（懷孕池唯一版）— Final Integrated Secure-ish Version
 *
 * ✅ 你定案的「單池」規則（V5.20：Floor=1688）
 * - 所有收入（下單/點燈/許願/還願）都進同一個池（本合約持幣餘額）
 * - 達到 16888 觸發「下凡投胎」一輪（Round）
 * - 每輪只分配固定 ROUND_TOTAL = 10000（=16888 - MIN_FLOOR 敘事差值），避免一次把超額全分導致連續觸發
 * - 池底線改為 MIN_FLOOR = 1688：允許對賭後池子變薄，但不允許賠付後低於 1688（避免抽乾到 0）
 *
 * ✅ 每輪分配（ROUND_TOTAL=10000 KGEN）
 * - 40% → A 即時（4000）
 * - 40% → B 即時（4000）
 * - 10% → A 紅包托管（1000）
 * - 10% → B 紅包托管（1000）
 *
 * ✅ 3+3
 * - 前 3 天：表態期 vow()，必須真的轉 1~2 KGEN 給對方
 * - 後 3 天：戀愛期 claimWeddingEscrow()，必須雙方都表態才可領各自托管
 * - 逾期：recycleWeddingEscrow()，未領托管回收進池（留在合約內）
 *
 * ✅ PoolDuel（漲/跌遊戲）
 * - 玩家下單 amountIn 真 transferFrom 進合約
 * - 即時 pseudo-random 決勝負（0=UP,1=DOWN）
 * - 贏：拿回 2x stake；輸：stake 留在池
 * - 手續費 5%：1% → 8888 高老莊（treasury8888），4% 留池
 *
 * ⚠️ 注意
 * - pseudo-random 不是賭場級安全，只是敘事遊戲。
 * - B 的抽選：從「近期互動玩家池」隨機挑出（不需要找人、可自動化）。
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address a) external view returns (uint256);
}

library SafeERC20 {
    function _call(address token, bytes memory data) private returns (bool) {
        (bool ok, bytes memory ret) = token.call(data);
        if (!ok) return false;
        if (ret.length == 0) return true; // non-standard ERC20
        if (ret.length == 32) {
            uint256 r;
            assembly { r := mload(add(ret, 32)) }
            return r != 0;
        }
        return false;
    }

    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        require(_call(address(token), abi.encodeWithSelector(token.transfer.selector, to, amount)), "TRANSFER_FAIL");
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        require(_call(address(token), abi.encodeWithSelector(token.transferFrom.selector, from, to, amount)), "TRANSFERFROM_FAIL");
    }
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

abstract contract ReentrancyGuard {
    uint256 private _status;
    modifier nonReentrant() {
        require(_status != 2, "REENTRANT");
        _status = 2;
        _;
        _status = 1;
    }
    constructor(){ _status = 1; }
}

contract KGEN_16888_Universe_V5_20_0 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /* ========= Events ========= */
    event SetTreasury(address indexed treasury8888);
    event SetOrderLimits(uint256 minOrder, uint256 maxOrder);
    event SetWindows(uint32 vowWindowSec, uint32 loveWindowSec);
    event ConfigLocked();

    event PlayerSeen(address indexed user);
    event RitualDeposit(address indexed from, uint256 amount, bytes32 indexed tag);

    event OrderPlaced(address indexed user, uint8 side, uint256 amountIn, uint256 feeTotal, uint256 feeToTreasury, uint256 feeToPool, uint256 stake);
    event OrderResolved(address indexed user, uint8 side, uint8 outcome, bool win, uint256 payout);

    event RoundTriggered(uint256 indexed roundId, address indexed playerA, address indexed playerB, uint256 poolBefore);
    event RoundSettled(uint256 indexed roundId, address indexed playerA, address indexed playerB, uint256 toAInstant, uint256 toBInstant, uint256 escrowA, uint256 escrowB, uint40 settledAt, uint40 vowDeadlineAt, uint40 loveDeadlineAt);

    event Vowed(uint256 indexed roundId, address indexed from, address indexed to, uint256 amount);
    event WeddingEscrowClaimed(uint256 indexed roundId, address indexed user, uint256 amount);
    event WeddingEscrowRecycled(uint256 indexed roundId, address indexed user, uint256 amount);

    /* ========= Constants ========= */
    IERC20 public immutable kgen;

    // 敘事節點：下凡落點（不再作為賠付硬底線）
    uint256 public constant STORY_FLOOR = 1688e18;  // UI/敘事顯示用：可下探到的最低底（不等於觸發門檻）
    uint256 public constant MIN_FLOOR = 1688e18;

    // 觸發點：16888 才下凡投胎
    uint256 public constant ROUND_TOTAL = 10000e18;
    uint256 public constant TRIGGER = 16888e18;

    // 5% fee total: 1% to treasury, 4% stays in pool
    uint16 public constant FEE_BPS_TOTAL = 500;
    uint16 public constant FEE_BPS_TREASURY = 100;

    /* ========= Config ========= */
    address public treasury8888;      // 高老莊（凡間流通池）
    uint256 public minOrder = 1e18;   // 1 KGEN
    uint256 public maxOrder = 1000e18;// 1000 KGEN

    // 3+3 default
    uint32 public vowWindowSec  = 3 days;
    uint32 public loveWindowSec = 3 days;

    bool public configLocked;

    /* ========= Player Pool (for auto-select B) ========= */
    uint16 public constant PLAYER_CAP = 1024;
    address[PLAYER_CAP] public playerRing;
    uint16 public playerCount;  // <= PLAYER_CAP
    uint16 public playerIdx;    // next write index
    mapping(address => bool) public isKnownPlayer;

    /* ========= Round State ========= */
    struct Round {
        address a;
        address b;
        uint40  settledAt;
        uint40  vowDeadlineAt;
        uint40  loveDeadlineAt;
        uint256 escrowA;
        uint256 escrowB;
        bool    aVowed;
        bool    bVowed;
        bool    aClaimed;
        bool    bClaimed;
        bool    settled;
    }

    uint256 public roundId;
    mapping(uint256 => Round) public rounds;

    /* ========= Random nonce ========= */
    uint256 public nonce;

    /* ========= Constructor ========= */
    constructor(
        address owner_,
        address kgen_,
        address treasury8888_
    ) Ownable(owner_) {
        require(kgen_ != address(0), "kgen=0");
        kgen = IERC20(kgen_);
        treasury8888 = treasury8888_;
    }

    /* ========= Admin ========= */
    function setTreasury(address t) external onlyOwner {
        require(!configLocked, "LOCKED");
        treasury8888 = t;
        emit SetTreasury(t);
    }

    function setOrderLimits(uint256 minOrder_, uint256 maxOrder_) external onlyOwner {
        require(!configLocked, "LOCKED");
        require(minOrder_ > 0, "min=0");
        require(maxOrder_ >= minOrder_, "max<min");
        minOrder = minOrder_;
        maxOrder = maxOrder_;
        emit SetOrderLimits(minOrder_, maxOrder_);
    }

    function setWindows(uint32 vowWindowSec_, uint32 loveWindowSec_) external onlyOwner {
        require(!configLocked, "LOCKED");
        require(vowWindowSec_ >= 1 hours, "vow<1h");
        require(loveWindowSec_ >= 1 hours, "love<1h");
        vowWindowSec = vowWindowSec_;
        loveWindowSec = loveWindowSec_;
        emit SetWindows(vowWindowSec_, loveWindowSec_);
    }

    function lockConfig() external onlyOwner {
        configLocked = true;
        emit ConfigLocked();
    }

    /* ========= Views ========= */
    function poolBalance() public view returns (uint256) {
        return kgen.balanceOf(address(this));
    }

    function canTriggerRound() public view returns (bool) {
        return poolBalance() >= TRIGGER;
    }

    function playerPoolSize() public view returns (uint256) {
        return playerCount;
    }

    /* ========= Internal: track player ========= */
    function _touchPlayer(address user) internal {
        if (user == address(0)) return;
        if (!isKnownPlayer[user]) {
            isKnownPlayer[user] = true;
            playerRing[playerIdx] = user;
            if (playerCount < PLAYER_CAP) playerCount++;
            playerIdx = uint16((playerIdx + 1) % PLAYER_CAP);
            emit PlayerSeen(user);
        }
    }

    /* ========= Ritual Income (wish / repay / zodiac light) ========= */
    function ritualDeposit(uint256 amount, bytes32 tag) external nonReentrant {
        require(amount > 0, "amount=0");
        kgen.safeTransferFrom(msg.sender, address(this), amount);
        _touchPlayer(msg.sender);
        emit RitualDeposit(msg.sender, amount, tag);
        _maybeTriggerRound();
    }

    /* ========= Pool Duel (UP/DOWN) ========= */
    function placeOrder(uint8 side, uint256 amountIn) external nonReentrant {
        require(side == 0 || side == 1, "side");
        require(amountIn >= minOrder && amountIn <= maxOrder, "amount");

        _touchPlayer(msg.sender);

        // 真成交
        kgen.safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 feeTotal = (amountIn * FEE_BPS_TOTAL) / 10_000;
        uint256 feeToTreasury = (amountIn * FEE_BPS_TREASURY) / 10_000;
        uint256 feeToPool = feeTotal - feeToTreasury; // 4%
        uint256 stake = amountIn - feeTotal;

        // ensure pool can pay 2x stake while keeping MIN_FLOOR
        // current balance already includes amountIn
        require(poolBalance() >= (MIN_FLOOR + (stake * 2)), "POOL_THIN");

        if (feeToTreasury > 0) {
            require(treasury8888 != address(0), "treasury=0");
            kgen.safeTransfer(treasury8888, feeToTreasury);
        }
        // feeToPool remains in contract

        emit OrderPlaced(msg.sender, side, amountIn, feeTotal, feeToTreasury, feeToPool, stake);

        uint8 outcome = _coinflip(msg.sender); // 0=UP, 1=DOWN
        bool win = (outcome == side);

        uint256 payout = 0;
        if (win) {
            payout = stake * 2;
            kgen.safeTransfer(msg.sender, payout);
        }

        emit OrderResolved(msg.sender, side, outcome, win, payout);

        _maybeTriggerRound();
    }

    /* ========= Round Trigger ========= */
    function triggerRound() external nonReentrant returns (uint256 newRoundId) {
        require(canTriggerRound(), "NOT_READY");
        return _triggerRoundInternal();
    }

    function _maybeTriggerRound() internal {
        if (canTriggerRound()) {
            _triggerRoundInternal();
        }
    }

    function _pickTwoPlayers(address preferA) internal view returns (address A, address B) {
        A = preferA;
        if (A == address(0) || !isKnownPlayer[A]) {
            if (playerCount == 0) return (address(0), address(0));
            uint16 last = playerIdx == 0 ? (PLAYER_CAP - 1) : (playerIdx - 1);
            A = playerRing[last];
        }

        if (playerCount < 2) {
            return (A, address(0));
        }

        uint256 tries = 0;
        uint16 idx = uint16(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, nonce, A, address(this)))) % PLAYER_CAP);
        B = playerRing[idx];

        while ((B == address(0) || B == A) && tries < 8) {
            idx = uint16((idx + 97) % PLAYER_CAP);
            B = playerRing[idx];
            tries++;
        }
        if (B == address(0) || B == A) {
            for (uint16 i=0; i<PLAYER_CAP; i++) {
                address c = playerRing[i];
                if (c != address(0) && c != A) { B = c; break; }
            }
        }
    }

    function _triggerRoundInternal() internal returns (uint256 newRoundId) {
        uint256 balBefore = poolBalance();
        require(balBefore >= TRIGGER, "POOL<16888");

        (address A, address B) = _pickTwoPlayers(msg.sender);
        require(A != address(0) && B != address(0) && A != B, "NEED_2_PLAYERS");

        emit RoundTriggered(roundId + 1, A, B, balBefore);

        uint256 toAInstant = (ROUND_TOTAL * 40) / 100; // 4000
        uint256 toBInstant = (ROUND_TOTAL * 40) / 100; // 4000
        uint256 eA         = (ROUND_TOTAL * 10) / 100; // 1000
        uint256 eB         = (ROUND_TOTAL * 10) / 100; // 1000
// transfers (instants)
        kgen.safeTransfer(A, toAInstant);
        kgen.safeTransfer(B, toBInstant);

        newRoundId = ++roundId;
        Round storage r = rounds[newRoundId];
        r.a = A;
        r.b = B;
        r.settledAt = uint40(block.timestamp);
        r.vowDeadlineAt  = uint40(block.timestamp + vowWindowSec);
        r.loveDeadlineAt = uint40(block.timestamp + vowWindowSec + loveWindowSec);
        r.escrowA = eA;
        r.escrowB = eB;
        r.settled = true;

        emit RoundSettled(newRoundId, A, B, toAInstant, toBInstant, eA, eB, r.settledAt, r.vowDeadlineAt, r.loveDeadlineAt);
    }

    /* ========= Vow / Claim / Recycle ========= */
    function vow(uint256 id, uint256 amount, address partner) external nonReentrant {
        Round storage r = rounds[id];
        require(r.settled, "NO_ROUND");
        require(block.timestamp <= r.vowDeadlineAt, "VOW_DEADLINE");
        require(amount >= 1e18 && amount <= 2e18, "RANGE_1_2");
        require(msg.sender == r.a || msg.sender == r.b, "NOT_AB");
        require(partner == r.a || partner == r.b, "PARTNER_AB");
        require(partner != msg.sender, "SELF");

        kgen.safeTransferFrom(msg.sender, partner, amount);

        if (msg.sender == r.a) r.aVowed = true;
        else r.bVowed = true;

        emit Vowed(id, msg.sender, partner, amount);
        _touchPlayer(msg.sender);
    }

    function bothVowed(uint256 id) public view returns (bool) {
        Round storage r = rounds[id];
        return r.settled && r.aVowed && r.bVowed;
    }

    function claimWeddingEscrow(uint256 id) external nonReentrant {
        Round storage r = rounds[id];
        require(r.settled, "NO_ROUND");
        require(block.timestamp > r.vowDeadlineAt, "LOVE_NOT_STARTED");
        require(block.timestamp <= r.loveDeadlineAt, "LOVE_DEADLINE");
        require(msg.sender == r.a || msg.sender == r.b, "NOT_AB");
        require(bothVowed(id), "NOT_MARRIED");

        if (msg.sender == r.a) {
            require(!r.aClaimed, "CLAIMED");
            r.aClaimed = true;
            uint256 amt = r.escrowA;
            require(amt > 0, "NO_ESCROW");
            r.escrowA = 0;
            kgen.safeTransfer(r.a, amt);
            emit WeddingEscrowClaimed(id, r.a, amt);
        } else {
            require(!r.bClaimed, "CLAIMED");
            r.bClaimed = true;
            uint256 amt = r.escrowB;
            require(amt > 0, "NO_ESCROW");
            r.escrowB = 0;
            kgen.safeTransfer(r.b, amt);
            emit WeddingEscrowClaimed(id, r.b, amt);
        }
    }

    function recycleWeddingEscrow(uint256 id, address user) external nonReentrant {
        Round storage r = rounds[id];
        require(r.settled, "NO_ROUND");
        require(block.timestamp > r.loveDeadlineAt, "NOT_DUE");
        require(user == r.a || user == r.b, "NOT_AB");

        if (user == r.a) {
            if (r.aClaimed) return;
            uint256 amt = r.escrowA;
            if (amt == 0) return;
            r.escrowA = 0;
            emit WeddingEscrowRecycled(id, r.a, amt);
        } else {
            if (r.bClaimed) return;
            uint256 amt = r.escrowB;
            if (amt == 0) return;
            r.escrowB = 0;
            emit WeddingEscrowRecycled(id, r.b, amt);
        }
    }

    /* ========= Pseudo Random ========= */
    function _coinflip(address user) internal returns (uint8) {
        unchecked { nonce += 1; }
        uint256 r = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            block.prevrandao,
            user,
            nonce,
            address(this),
            poolBalance()
        )));
        return uint8(r & 1);
    }
}
