// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKUFOV4Mintable {
    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 lotId);
}

interface IKUFOV4Transferable is IKUFOV4Mintable {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function burnForCarrier(address owner, address beneficiary, uint256 amount, bytes32 proofId)
        external returns (uint256 expectedKship);
}

interface IKSHIPV4TestMinter {
    function mintFromCarrierProof(bytes32 proofId) external returns (address beneficiary, uint256 amount);
}

contract KUFOV4MockOrganRegistry {
    mapping(bytes32 => address) private _organs;

    function setOrgan(bytes32 organId, address organAddress) external {
        _organs[organId] = organAddress;
    }

    function organ(bytes32 organId) external view returns (address) {
        return _organs[organId];
    }
}

contract KUFOV4MockOutput {
    function mint(address kufo, bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 lotId) {
        return IKUFOV4Mintable(kufo).mintFromImmediateProof(proofId, beneficiary, amount);
    }

    // Local attack driver: unique proofs and unsolicited ordinary transfers.
    // This unrestricted harness must never be used as a production organ.
    function batchDust(address kufo, bytes32 salt, address victim, uint256 count, uint256 amount) external {
        for (uint256 i; i < count; ++i) {
            bytes32 proofId = keccak256(abi.encode(salt, i));
            IKUFOV4Transferable(kufo).mintFromImmediateProof(proofId, address(this), amount);
            require(IKUFOV4Transferable(kufo).transfer(victim, amount), "TRANSFER_FAILED");
        }
    }
}

// Deliberately unrestricted local harness for carrier validation/replay tests.
contract KUFOV4ReplayConverter {
    function burnAndMint(address kufo, address kship, address owner, address beneficiary, uint256 amount, bytes32 proofId)
        external
    {
        IKUFOV4Transferable(kufo).burnForCarrier(owner, beneficiary, amount, proofId);
        IKSHIPV4TestMinter(kship).mintFromCarrierProof(proofId);
    }

    function mintAgain(address kship, bytes32 proofId) external {
        IKSHIPV4TestMinter(kship).mintFromCarrierProof(proofId);
    }
}
