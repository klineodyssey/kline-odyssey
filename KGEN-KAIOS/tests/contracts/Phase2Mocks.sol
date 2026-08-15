// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockPhase2Token is ERC20 {
    constructor(string memory tokenName, string memory tokenSymbol)
        ERC20(tokenName, tokenSymbol)
    {}

    function mint(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }
}

contract MockFailingKGEN is MockPhase2Token {
    constructor() MockPhase2Token("Failing KGEN", "fKGEN") {}

    function transfer(address, uint256) public pure override returns (bool) {
        return false;
    }
}

contract MockFeeKAIOS is MockPhase2Token {
    constructor() MockPhase2Token("Fee KAIOS", "fKAIOS") {}

    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0) && value != 0) {
            uint256 fee = value / 100;
            super._update(from, address(0xdead), fee);
            super._update(from, to, value - fee);
        } else {
            super._update(from, to, value);
        }
    }
}

contract MockReentrantKAIOS is MockPhase2Token {
    address public attackTarget;
    bytes public attackData;
    bool public reentryBlocked;
    bool private _attackArmed;

    constructor() MockPhase2Token("Reentrant KAIOS", "rKAIOS") {}

    function armAttack(address target, bytes calldata data) external {
        attackTarget = target;
        attackData = data;
        _attackArmed = true;
        reentryBlocked = false;
    }

    function transferFrom(address from, address to, uint256 value)
        public
        override
        returns (bool)
    {
        if (_attackArmed) {
            _attackArmed = false;
            (bool success, bytes memory reason) = attackTarget.call(attackData);
            bytes4 expected = bytes4(keccak256("ReentrancyGuardReentrantCall()"));
            bytes4 actual;
            if (reason.length >= 4) {
                assembly {
                    actual := mload(add(reason, 32))
                }
            }
            reentryBlocked = !success && actual == expected;
        }
        return super.transferFrom(from, to, value);
    }
}

contract MockPhase2Bank {
    address public kgen;
    address public kaios;
    bool public paused;
    uint256 public syncCount;

    constructor(address canonicalKgen, address canonicalKaios) {
        kgen = canonicalKgen;
        kaios = canonicalKaios;
    }

    function synchronizeAccounting() external returns (uint256) {
        ++syncCount;
        return 0;
    }

    function setPaused(bool value) external {
        paused = value;
    }

    function executeModulePayment(bytes32, address, uint256) external pure {
        revert("NOT_SUPPORTED");
    }

    function setReserveRequirement(uint256) external pure {
        revert("NOT_SUPPORTED");
    }

    function kaiosBalance() external pure returns (uint256) {
        return 0;
    }

    function availableKaios() external pure returns (uint256) {
        return 0;
    }
}

contract MockEligibilitySource {
    mapping(bytes32 => address) public beneficiaries;
    mapping(bytes32 => bool) public reserveEligibility;
    mapping(bytes32 => bool) public civilizationEligibility;

    function configure(bytes32 lifeId, address beneficiary, bool reserve, bool civilization)
        external
    {
        beneficiaries[lifeId] = beneficiary;
        reserveEligibility[lifeId] = reserve;
        civilizationEligibility[lifeId] = civilization;
    }

    function canonicalBeneficiary(bytes32 lifeId) external view returns (address) {
        return beneficiaries[lifeId];
    }

    function redemptionEligible(bytes32 lifeId) external view returns (bool) {
        return reserveEligibility[lifeId];
    }

    function civilizationQualified(bytes32 lifeId) external view returns (bool) {
        return civilizationEligibility[lifeId];
    }
}
