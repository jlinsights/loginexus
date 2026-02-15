// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ShipmentEscrow {
    enum State { AWAITING_PAYMENT, AWAITING_DELIVERY, COMPLETE, REFUNDED }

    struct Escrow {
        address buyer;
        address carrier;
        uint256 amount;
        State state;
        bool isDispute;
    }

    mapping(string => Escrow) public escrows; // shipmentId => Escrow
    address public owner; // Platform admin or Oracle

    event Deposited(string shipmentId, address buyer, uint256 amount);
    event Released(string shipmentId, address carrier, uint256 amount);
    event Refunded(string shipmentId, address buyer, uint256 amount);

    modifier onlyBuyer(string memory shipmentId) {
        require(msg.sender == escrows[shipmentId].buyer, "Only buyer can call this");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == owner, "Only oracle can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // 1. Buyer deposits funds for a shipment
    function deposit(string memory shipmentId, address carrier) external payable {
        require(escrows[shipmentId].amount == 0, "Escrow already exists");
        require(msg.value > 0, "Amount must be greater than 0");

        escrows[shipmentId] = Escrow({
            buyer: msg.sender,
            carrier: carrier,
            amount: msg.value,
            state: State.AWAITING_DELIVERY,
            isDispute: false
        });

        emit Deposited(shipmentId, msg.sender, msg.value);
    }

    // 2. Oracle (Backend) confirms delivery and releases funds
    function releaseToCarrier(string memory shipmentId) external onlyOracle {
        Escrow storage escrow = escrows[shipmentId];
        require(escrow.state == State.AWAITING_DELIVERY, "Invalid state");
        require(!escrow.isDispute, "Shipment is in dispute");

        escrow.state = State.COMPLETE;
        payable(escrow.carrier).transfer(escrow.amount);

        emit Released(shipmentId, escrow.carrier, escrow.amount);
    }

    // 3. Refund to buyer (if cancelled or failed)
    function refundToBuyer(string memory shipmentId) external onlyOracle {
        Escrow storage escrow = escrows[shipmentId];
        require(escrow.state == State.AWAITING_DELIVERY, "Invalid state");

        escrow.state = State.REFUNDED;
        payable(escrow.buyer).transfer(escrow.amount);

        emit Refunded(shipmentId, escrow.buyer, escrow.amount);
    }
}
