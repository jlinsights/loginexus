// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ShipmentEscrow.sol";

contract EscrowFactory {
    event EscrowCreated(
        address indexed escrow,
        bytes32 indexed shipmentId,
        address buyer,
        address seller,
        uint256 amount
    );

    mapping(bytes32 => address) public escrows;

    error EscrowAlreadyExists(bytes32 shipmentId);
    error InvalidAddress();
    error InvalidAmount();

    /// @notice Create a new per-shipment escrow contract.
    function createEscrow(
        bytes32 shipmentId,
        address buyer,
        address seller,
        address usdcToken,
        uint256 amount
    ) external returns (address) {
        if (escrows[shipmentId] != address(0)) {
            revert EscrowAlreadyExists(shipmentId);
        }
        if (buyer == address(0) || seller == address(0) || usdcToken == address(0)) {
            revert InvalidAddress();
        }
        if (amount == 0) revert InvalidAmount();

        ShipmentEscrow escrow = new ShipmentEscrow(
            buyer,
            seller,
            usdcToken,
            amount,
            address(this)
        );

        escrows[shipmentId] = address(escrow);
        emit EscrowCreated(address(escrow), shipmentId, buyer, seller, amount);

        return address(escrow);
    }

    /// @notice Look up escrow address by shipment ID.
    function getEscrow(bytes32 shipmentId) external view returns (address) {
        return escrows[shipmentId];
    }

    /// @notice Release funds for a shipment (called by admin/backend).
    function releaseEscrow(bytes32 shipmentId) external {
        address escrowAddr = escrows[shipmentId];
        require(escrowAddr != address(0), "Escrow not found");
        ShipmentEscrow(escrowAddr).release();
    }

    /// @notice Resolve dispute for a shipment (called by admin/backend).
    function resolveDispute(bytes32 shipmentId, bool refundBuyer) external {
        address escrowAddr = escrows[shipmentId];
        require(escrowAddr != address(0), "Escrow not found");
        ShipmentEscrow(escrowAddr).resolve(refundBuyer);
    }
}
