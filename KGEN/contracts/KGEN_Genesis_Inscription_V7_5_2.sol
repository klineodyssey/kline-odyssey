// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract KGEN_Genesis_Inscription_V7_5_2 {
    string public constant VERSION = "V7.5.2-GENESIS";
    uint256 public constant BIGBANG_UTC8 = 1767196800; // 2026-01-01 00:00:00 UTC+8

    string public inscription;
    address public immutable father; // 乐天帝（文字象徵，不是權限）
    address public immutable mother; // PrimeForge Autopilot

    event GenesisInscribed(
        string version,
        uint256 bigbangUtc8,
        address indexed mother,
        address indexed deployedBy,
        string inscription
    );

    constructor(address _mother, address _father, string memory _inscription) {
        mother = _mother;
        father = _father;
        inscription = _inscription;

        emit GenesisInscribed(VERSION, BIGBANG_UTC8, _mother, msg.sender, _inscription);
    }
}
