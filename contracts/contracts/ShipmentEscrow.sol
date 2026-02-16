// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ShipmentEscrow is ReentrancyGuard {
    enum Status { Created, Funded, Released, Disputed, Refunded }

    address public immutable buyer;
    address public immutable seller;
    IERC20  public immutable usdcToken;
    uint256 public immutable amount;
    address public immutable factory;
    Status  public status;
    uint256 public createdAt;
    uint256 public fundedAt;
    uint256 public resolvedAt;

    event Funded(address indexed buyer, uint256 amount);
    event Released(address indexed seller, uint256 amount);
    event Disputed(address indexed buyer);
    event Refunded(address indexed buyer, uint256 amount);

    error OnlyBuyer();
    error OnlyFactory();
    error InvalidStatus(Status expected, Status actual);
    error InsufficientAllowance();
    error TransferFailed();

    modifier onlyBuyer() {
        if (msg.sender != buyer) revert OnlyBuyer();
        _;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    modifier inStatus(Status expected) {
        if (status != expected) revert InvalidStatus(expected, status);
        _;
    }

    constructor(
        address _buyer,
        address _seller,
        address _usdcToken,
        uint256 _amount,
        address _factory
    ) {
        buyer = _buyer;
        seller = _seller;
        usdcToken = IERC20(_usdcToken);
        amount = _amount;
        factory = _factory;
        status = Status.Created;
        createdAt = block.timestamp;
    }

    /// @notice Buyer deposits USDC into escrow. Must approve this contract first.
    function fund() external onlyBuyer inStatus(Status.Created) nonReentrant {
        if (usdcToken.allowance(buyer, address(this)) < amount) {
            revert InsufficientAllowance();
        }
        bool success = usdcToken.transferFrom(buyer, address(this), amount);
        if (!success) revert TransferFailed();

        status = Status.Funded;
        fundedAt = block.timestamp;
        emit Funded(buyer, amount);
    }

    /// @notice Factory/admin releases funds to seller after delivery confirmation.
    function release() external onlyFactory inStatus(Status.Funded) nonReentrant {
        status = Status.Released;
        resolvedAt = block.timestamp;

        bool success = usdcToken.transfer(seller, amount);
        if (!success) revert TransferFailed();

        emit Released(seller, amount);
    }

    /// @notice Buyer raises a dispute.
    function dispute() external onlyBuyer inStatus(Status.Funded) nonReentrant {
        status = Status.Disputed;
        emit Disputed(buyer);
    }

    /// @notice Factory/admin resolves dispute. If refundBuyer is true, funds go back to buyer.
    function resolve(bool refundBuyer) external onlyFactory inStatus(Status.Disputed) nonReentrant {
        resolvedAt = block.timestamp;

        if (refundBuyer) {
            status = Status.Refunded;
            bool success = usdcToken.transfer(buyer, amount);
            if (!success) revert TransferFailed();
            emit Refunded(buyer, amount);
        } else {
            status = Status.Released;
            bool success = usdcToken.transfer(seller, amount);
            if (!success) revert TransferFailed();
            emit Released(seller, amount);
        }
    }

    /// @notice View helper for frontend.
    function getState() external view returns (
        address _buyer,
        address _seller,
        uint256 _amount,
        Status _status,
        uint256 _createdAt,
        uint256 _fundedAt,
        uint256 _resolvedAt
    ) {
        return (buyer, seller, amount, status, createdAt, fundedAt, resolvedAt);
    }
}
