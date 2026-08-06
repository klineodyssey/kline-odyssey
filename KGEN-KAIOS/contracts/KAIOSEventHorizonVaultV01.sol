// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title KAIOSEventHorizonVaultV01
 * @notice REVIEW-ONLY prototype. Not audited. Not authorized for deployment.
 *
 * Physics-mapping boundary:
 * - KAIOS can enter this contract.
 * - This contract intentionally contains no withdrawal, release, sweep,
 *   recover, rescue, bridge-out, approval, or upgrade function.
 * - Pre-horizon information is committed on-chain through events and hashes.
 * - The contract makes no claim about observable civilization inside a real
 *   astronomical event horizon.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract KAIOSEventHorizonVaultV01 is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable KAIOS;

    uint256 public totalHorizonMass;
    uint256 public entryCount;
    bytes32 public informationCommitmentRoot;

    mapping(bytes32 entryId => bool exists) public entryExists;

    error ZeroAddress();
    error ZeroAmount();
    error InvalidPayloadHash();
    error DuplicateEntry(bytes32 entryId);

    event EventHorizonCrossed(
        bytes32 indexed entryId,
        address indexed sender,
        uint256 amount,
        bytes32 indexed payloadHash,
        bytes32 preHorizonStateRoot,
        bytes32 previousInformationRoot,
        bytes32 newInformationRoot,
        uint256 blockNumber,
        uint256 timestamp
    );

    constructor(address kaiosToken) {
        if (kaiosToken == address(0)) revert ZeroAddress();
        KAIOS = IERC20(kaiosToken);
    }

    /**
     * @notice Permanently transfers KAIOS across the simulated event horizon.
     * @dev The sender must approve this contract before calling.
     * No function exists to return the transferred KAIOS.
     *
     * @param amount KAIOS amount entering the event horizon.
     * @param payloadHash Hash of optional pre-horizon metadata.
     * @param preHorizonStateRoot State commitment immediately before entry.
     * @param nonce Sender-chosen nonce used in the unique entry ID.
     */
    function crossEventHorizon(
        uint256 amount,
        bytes32 payloadHash,
        bytes32 preHorizonStateRoot,
        uint256 nonce
    ) external nonReentrant returns (bytes32 entryId) {
        if (amount == 0) revert ZeroAmount();
        if (payloadHash == bytes32(0)) revert InvalidPayloadHash();

        entryId = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                msg.sender,
                amount,
                payloadHash,
                preHorizonStateRoot,
                nonce
            )
        );

        if (entryExists[entryId]) revert DuplicateEntry(entryId);

        bytes32 previousRoot = informationCommitmentRoot;
        bytes32 newRoot = keccak256(
            abi.encode(previousRoot, entryId, payloadHash, preHorizonStateRoot)
        );

        entryExists[entryId] = true;
        entryCount += 1;
        totalHorizonMass += amount;
        informationCommitmentRoot = newRoot;

        KAIOS.safeTransferFrom(msg.sender, address(this), amount);

        emit EventHorizonCrossed(
            entryId,
            msg.sender,
            amount,
            payloadHash,
            preHorizonStateRoot,
            previousRoot,
            newRoot,
            block.number,
            block.timestamp
        );
    }

    /**
     * @notice Verifies the accounting invariant against the actual token balance.
     * @dev Assumes KAIOS itself has no transfer tax, rebasing, or burn-on-transfer.
     */
    function horizonMassInvariantHolds() external view returns (bool) {
        return KAIOS.balanceOf(address(this)) == totalHorizonMass;
    }

    /**
     * @notice Immutable declaration of the intended causal boundary.
     */
    function eventHorizonInscription() external pure returns (string memory) {
        return "ENTER ALLOWED. EXIT FORBIDDEN. PRE-HORIZON INFORMATION IS COMMITTED. INTERIOR PHYSICS REMAINS UNKNOWN.";
    }
}
