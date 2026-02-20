// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LogisticsNFT.sol";

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

contract LogisticsEscrow {
    address public platformOracle; // Verification Oracle
    LogisticsNFT public eBLContract; // Linked NFT Contract

    enum EscrowStatus { PENDING, LOCKED, ARRIVED, RELEASED, REFUNDED }

    struct Escrow {
        address buyer;
        address seller;
        uint256 amount;
        string trackingNumber;
        EscrowStatus status;
        uint256 createdAt;
        uint256 eblTokenId; // Linked e-B/L NFT ID
        bool isArrived;     // Oracle confirmation
    }

    mapping(string => Escrow) public escrows;
    IERC20 public usdcToken;

    event Deposited(string trackingNumber, address buyer, uint256 amount, uint256 eblTokenId);
    event Arrived(string trackingNumber);
    event Released(string trackingNumber, address seller);
    event Refunded(string trackingNumber, address buyer);

    modifier onlyOracle() {
        require(msg.sender == platformOracle, "Only Oracle can call this");
        _;
    }

    constructor(address _usdcToken, address _oracle, address _nftContract) {
        usdcToken = IERC20(_usdcToken);
        platformOracle = _oracle;
        eBLContract = LogisticsNFT(_nftContract);
    }

    // 1. Buyer deposits funds and links e-B/L NFT
    function depositWithNFT(string memory _trackingNumber, address _seller, uint256 _amount, uint256 _tokenId) external {
        require(escrows[_trackingNumber].amount == 0, "Escrow already exists");
        
        usdcToken.transferFrom(msg.sender, address(this), _amount);
        
        escrows[_trackingNumber] = Escrow({
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            trackingNumber: _trackingNumber,
            status: EscrowStatus.LOCKED,
            createdAt: block.timestamp,
            eblTokenId: _tokenId,
            isArrived: false
        });

        emit Deposited(_trackingNumber, msg.sender, _amount, _tokenId);
    }

    // 2. Oracle confirms arrival (Step 1 of settlement)
    function confirmArrival(string memory _trackingNumber) external onlyOracle {
        Escrow storage escrow = escrows[_trackingNumber];
        require(escrow.status == EscrowStatus.LOCKED, "Invalid status");

        escrow.isArrived = true;
        escrow.status = EscrowStatus.ARRIVED;
        
        emit Arrived(_trackingNumber);
    }

    // 3. Final Settlement: Checks Arrival + NFT Ownership
    function finalSettlement(string memory _trackingNumber) external {
        Escrow storage escrow = escrows[_trackingNumber];
        require(escrow.status == EscrowStatus.ARRIVED, "Cargo not arrived or already settled");
        
        // Check NFT Ownership: Must be transferred to Buyer
        address currentOwner = eBLContract.ownerOf(escrow.eblTokenId);
        require(currentOwner == escrow.buyer, "NFT ownership not yet transferred to buyer");

        escrow.status = EscrowStatus.RELEASED;
        usdcToken.transfer(escrow.seller, escrow.amount);

        emit Released(_trackingNumber, escrow.seller);
    }

    // 4. Dispute/Refund
    function refundBuyer(string memory _trackingNumber) external onlyOracle {
        Escrow storage escrow = escrows[_trackingNumber];
        require(escrow.status == EscrowStatus.LOCKED || escrow.status == EscrowStatus.ARRIVED, "Invalid status");

        escrow.status = EscrowStatus.REFUNDED;
        usdcToken.transfer(escrow.buyer, escrow.amount);

        emit Refunded(_trackingNumber, escrow.buyer);
    }
}
