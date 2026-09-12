// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IKUFOV4Mintable {
    function mintFromImmediateProof(bytes32 proofId, address beneficiary, uint256 amount) external returns (uint256 lotId);
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
}
