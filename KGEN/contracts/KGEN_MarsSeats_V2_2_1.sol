
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KGEN_MarsSeats_V2_2_1.sol  (PATCH)
 * - notifyReward 強制要求「錢真的在合約裡」才允許記帳（避免帳面可領但領不到）
 * - transferSeat 轉讓前自動結算 pending 給原主人（避免未領收益直接消失）
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from,address to,uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
    function decimals() external view returns (uint8);
}

library SafeERC20Lite {
    function safeTransfer(IERC20 token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data,(bool))), "SAFE_TRANSFER_FAILED");
    }
    function safeTransferFrom(IERC20 token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data,(bool))), "SAFE_TRANSFER_FROM_FAILED");
    }
}

abstract contract OwnableLite {
    address public owner;
    event OwnershipTransferred(address indexed prev, address indexed next);
    modifier onlyOwner(){ require(msg.sender==owner,"ONLY_OWNER"); _; }
    constructor(){ owner=msg.sender; emit OwnershipTransferred(address(0), msg.sender); }
    function transferOwnership(address n) external onlyOwner {
        require(n!=address(0),"ZERO_ADDR");
        emit OwnershipTransferred(owner,n);
        owner=n;
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

contract KGEN_MarsSeats_V2_2_1 is OwnableLite, ReentrancyGuardLite {
    using SafeERC20Lite for IERC20;

    // ===== Config Lock =====
    bool public configLocked;
    event ConfigLocked();
    modifier whenUnlocked(){ require(!configLocked,"CONFIG_LOCKED"); _; }

    // ===== Core =====
    IERC20 public kgen;
    address public brain;    // 11520 Brain 合約（唯一允許 notifyReward）
    address public treasury; // 入住款流向

    uint256 public constant MAX_SEATS = 500;
    uint256 public seatPriceWhole = 5000;
    uint256 public maxMintPerTx = 10;
    uint256 public totalMinted;

    // seatId starts from 1
    mapping(uint256 => address) public seatOwner; // seatId => owner
    mapping(address => uint256) public seatsOf;   // owner => count

    // ===== Rewards =====
    // accRewardPerSeat is scaled by 1e18 and represents "token-wei * 1e18 / seat"
    uint256 public accRewardPerSeat;
    mapping(uint256 => uint256) public seatRewardDebt;

    // Solvency accounting (prevents "paper rewards")
    uint256 public totalNotifiedWei;
    uint256 public totalClaimedWei;

    // ===== Events =====
    event BrainSet(address indexed brain);
    event TreasurySet(address indexed treasury);
    event SeatPriceSet(uint256 seatPriceWhole);
    event MaxMintPerTxSet(uint256 maxMintPerTx);

    event SeatMinted(address indexed user, uint256 indexed seatId, uint256 priceWei);
    event SeatTransferred(address indexed from, address indexed to, uint256 indexed seatId);

    event RewardNotified(uint256 amountWei, uint256 newAccRewardPerSeat, uint256 totalMinted);
    event SeatClaimed(address indexed user, uint256 indexed seatId, uint256 amountWei);
    event SeatsClaimed(address indexed user, uint256 amountWeiTotal);

    event Rescue(address indexed token, address indexed to, uint256 amount);

    constructor(address token) {
        require(token!=address(0), "ZERO_TOKEN");
        kgen = IERC20(token);
        treasury = address(this);
    }

    // ===== Admin =====
    function setBrain(address b) external onlyOwner whenUnlocked {
        require(b!=address(0),"ZERO_BRAIN");
        brain = b;
        emit BrainSet(b);
    }

    function setTreasury(address t) external onlyOwner whenUnlocked {
        require(t!=address(0),"ZERO_TREASURY");
        treasury = t;
        emit TreasurySet(t);
    }

    function setSeatPriceWhole(uint256 pWhole) external onlyOwner whenUnlocked {
        require(pWhole>0,"PRICE_ZERO");
        seatPriceWhole = pWhole;
        emit SeatPriceSet(pWhole);
    }

    function setMaxMintPerTx(uint256 m) external onlyOwner whenUnlocked {
        require(m>=1 && m<=50, "MAX_MINT_BAD");
        maxMintPerTx = m;
        emit MaxMintPerTxSet(m);
    }

    function lockConfig() external onlyOwner whenUnlocked {
        configLocked = true;
        emit ConfigLocked();
    }

    function rescueToken(address token, address to, uint256 amount) external onlyOwner nonReentrant {
        require(to!=address(0),"ZERO_TO");
        IERC20(token).transfer(to, amount);
        emit Rescue(token, to, amount);
    }

    // ===== Views =====
    function remainingSeats() public view returns (uint256) {
        return MAX_SEATS - totalMinted;
    }

    function seatPriceWei() public view returns (uint256) {
        uint8 d = kgen.decimals();
        return seatPriceWhole * (10 ** uint256(d));
    }

    function pendingSeat(uint256 seatId) public view returns (uint256) {
        require(seatId>0 && seatId<=totalMinted, "SEAT_BAD");
        uint256 debt = seatRewardDebt[seatId];
        if (accRewardPerSeat <= debt) return 0;
        return (accRewardPerSeat - debt) / 1e18;
    }

    function pendingSeats(uint256[] calldata seatIds) external view returns (uint256 sumWei) {
        for (uint256 i=0; i<seatIds.length; i++){
            sumWei += pendingSeat(seatIds[i]);
        }
    }

    // ===== Internal settle helper =====
    function _settleSeatTo(uint256 seatId, address to) internal returns (uint256 claimedWei) {
        uint256 debt = seatRewardDebt[seatId];
        uint256 acc  = accRewardPerSeat;
        if (acc <= debt) return 0;

        uint256 diff = acc - debt;
        seatRewardDebt[seatId] = acc;

        claimedWei = diff / 1e18;
        if (claimedWei > 0) {
            require(kgen.balanceOf(address(this)) >= claimedWei, "INSUFFICIENT_CONTRACT_BAL");
            totalClaimedWei += claimedWei;
            kgen.safeTransfer(to, claimedWei);
            emit SeatClaimed(to, seatId, claimedWei);
        }
    }

    // ===== Actions =====
    function mintSeat(uint256 count) external nonReentrant {
        require(count>0 && count<=maxMintPerTx, "COUNT_BAD");
        require(totalMinted + count <= MAX_SEATS, "SOLD_OUT");

        uint256 priceWeiOne = seatPriceWei();
        uint256 payWei = priceWeiOne * count;

        kgen.safeTransferFrom(msg.sender, treasury, payWei);

        for (uint256 i=0; i<count; i++){
            uint256 seatId = totalMinted + 1;
            totalMinted = seatId;

            seatOwner[seatId] = msg.sender;
            seatsOf[msg.sender] += 1;

            seatRewardDebt[seatId] = accRewardPerSeat;
            emit SeatMinted(msg.sender, seatId, priceWeiOne);
        }
    }

    /// @notice 席位轉讓：轉讓前先把未領收益結算給原主人（避免消失）
    function transferSeat(uint256 seatId, address to) external nonReentrant {
        require(to!=address(0), "ZERO_TO");
        require(seatOwner[seatId] == msg.sender, "NOT_OWNER");

        _settleSeatTo(seatId, msg.sender);

        seatOwner[seatId] = to;
        seatsOf[msg.sender] -= 1;
        seatsOf[to] += 1;

        emit SeatTransferred(msg.sender, to, seatId);
    }

    /// @notice Brain 撥款後通知：必須確保資金真的已轉入本合約
    function notifyReward(uint256 amountWei) external nonReentrant {
        require(msg.sender == brain, "ONLY_BRAIN");
        require(amountWei > 0, "AMOUNT_ZERO");
        require(totalMinted > 0, "NO_SEATS");

        // solvency: contract must hold enough to cover all notified-but-unclaimed + this new amount
        uint256 outstanding = totalNotifiedWei - totalClaimedWei;
        require(kgen.balanceOf(address(this)) >= outstanding + amountWei, "REWARD_NOT_FUNDED");

        uint256 add = (amountWei * 1e18) / totalMinted;
        accRewardPerSeat += add;

        totalNotifiedWei += amountWei;

        emit RewardNotified(amountWei, accRewardPerSeat, totalMinted);
    }

    function claimSeat(uint256 seatId) public nonReentrant returns (uint256 claimedWei) {
        require(seatOwner[seatId] == msg.sender, "NOT_OWNER");
        claimedWei = _settleSeatTo(seatId, msg.sender);
        require(claimedWei > 0, "NOTHING");
    }

    function claimSeats(uint256[] calldata seatIds) external nonReentrant returns (uint256 totalWei) {
        for (uint256 i=0; i<seatIds.length; i++){
            uint256 seatId = seatIds[i];
            if (seatOwner[seatId] != msg.sender) continue;

            uint256 got = _settleSeatTo(seatId, msg.sender);
            totalWei += got;
        }
        emit SeatsClaimed(msg.sender, totalWei);
    }
}