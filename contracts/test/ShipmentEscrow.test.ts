import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("ShipmentEscrow", function () {
  const AMOUNT = ethers.parseUnits("5000", 6); // 5000 USDC (6 decimals)
  const SHIPMENT_ID = ethers.encodeBytes32String("SH-2026-001");

  async function deployFixture() {
    const [deployer, buyer, seller, other] = await ethers.getSigners();

    // Deploy mock USDC
    const MockERC20 = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockERC20.deploy();
    await usdc.waitForDeployment();

    // Mint USDC to buyer
    await usdc.mint(buyer.address, ethers.parseUnits("100000", 6));

    // Deploy factory
    const Factory = await ethers.getContractFactory("EscrowFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();

    return { factory, usdc, deployer, buyer, seller, other };
  }

  async function createEscrowFixture() {
    const base = await loadFixture(deployFixture);
    const { factory, usdc, buyer, seller } = base;

    const tx = await factory.createEscrow(
      SHIPMENT_ID,
      buyer.address,
      seller.address,
      await usdc.getAddress(),
      AMOUNT
    );
    const receipt = await tx.wait();

    const escrowAddr = await factory.getEscrow(SHIPMENT_ID);
    const escrow = await ethers.getContractAt("ShipmentEscrow", escrowAddr);

    return { ...base, escrow, escrowAddr };
  }

  async function fundedEscrowFixture() {
    const base = await loadFixture(createEscrowFixture);
    const { escrow, usdc, buyer } = base;

    // Approve and fund
    await usdc.connect(buyer).approve(await escrow.getAddress(), AMOUNT);
    await escrow.connect(buyer).fund();

    return base;
  }

  describe("EscrowFactory", function () {
    it("should create escrow with correct parameters", async function () {
      const { factory, usdc, buyer, seller } = await loadFixture(deployFixture);

      const tx = await factory.createEscrow(
        SHIPMENT_ID,
        buyer.address,
        seller.address,
        await usdc.getAddress(),
        AMOUNT
      );

      const escrowAddr = await factory.getEscrow(SHIPMENT_ID);
      expect(escrowAddr).to.not.equal(ethers.ZeroAddress);

      await expect(tx)
        .to.emit(factory, "EscrowCreated")
        .withArgs(escrowAddr, SHIPMENT_ID, buyer.address, seller.address, AMOUNT);
    });

    it("should revert on duplicate shipment ID", async function () {
      const { factory, usdc, buyer, seller } = await loadFixture(createEscrowFixture);

      await expect(
        factory.createEscrow(
          SHIPMENT_ID,
          buyer.address,
          seller.address,
          await usdc.getAddress(),
          AMOUNT
        )
      ).to.be.revertedWithCustomError(factory, "EscrowAlreadyExists");
    });

    it("should revert on zero address", async function () {
      const { factory, usdc, buyer } = await loadFixture(deployFixture);

      await expect(
        factory.createEscrow(
          SHIPMENT_ID,
          ethers.ZeroAddress,
          buyer.address,
          await usdc.getAddress(),
          AMOUNT
        )
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });

    it("should revert on zero amount", async function () {
      const { factory, usdc, buyer, seller } = await loadFixture(deployFixture);

      await expect(
        factory.createEscrow(
          SHIPMENT_ID,
          buyer.address,
          seller.address,
          await usdc.getAddress(),
          0
        )
      ).to.be.revertedWithCustomError(factory, "InvalidAmount");
    });
  });

  describe("Fund", function () {
    it("should allow buyer to fund after approval", async function () {
      const { escrow, usdc, buyer } = await loadFixture(createEscrowFixture);

      await usdc.connect(buyer).approve(await escrow.getAddress(), AMOUNT);
      await expect(escrow.connect(buyer).fund())
        .to.emit(escrow, "Funded")
        .withArgs(buyer.address, AMOUNT);

      expect(await escrow.status()).to.equal(1); // Funded
      expect(await usdc.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);
    });

    it("should revert if not buyer", async function () {
      const { escrow, other } = await loadFixture(createEscrowFixture);

      await expect(escrow.connect(other).fund())
        .to.be.revertedWithCustomError(escrow, "OnlyBuyer");
    });

    it("should revert without approval", async function () {
      const { escrow, buyer } = await loadFixture(createEscrowFixture);

      await expect(escrow.connect(buyer).fund())
        .to.be.revertedWithCustomError(escrow, "InsufficientAllowance");
    });

    it("should revert on double fund", async function () {
      const { escrow, buyer } = await loadFixture(fundedEscrowFixture);

      await expect(escrow.connect(buyer).fund())
        .to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  describe("Release", function () {
    it("should release funds to seller via factory", async function () {
      const { factory, escrow, usdc, seller } = await loadFixture(fundedEscrowFixture);

      const sellerBefore = await usdc.balanceOf(seller.address);

      await expect(factory.releaseEscrow(SHIPMENT_ID))
        .to.emit(escrow, "Released")
        .withArgs(seller.address, AMOUNT);

      expect(await escrow.status()).to.equal(2); // Released
      expect(await usdc.balanceOf(seller.address)).to.equal(sellerBefore + AMOUNT);
    });

    it("should revert if not funded", async function () {
      const { factory } = await loadFixture(createEscrowFixture);

      await expect(factory.releaseEscrow(SHIPMENT_ID))
        .to.be.revertedWithCustomError(
          await ethers.getContractAt("ShipmentEscrow", await factory.getEscrow(SHIPMENT_ID)),
          "InvalidStatus"
        );
    });
  });

  describe("Dispute + Resolve", function () {
    it("should allow buyer to dispute", async function () {
      const { escrow, buyer } = await loadFixture(fundedEscrowFixture);

      await expect(escrow.connect(buyer).dispute())
        .to.emit(escrow, "Disputed")
        .withArgs(buyer.address);

      expect(await escrow.status()).to.equal(3); // Disputed
    });

    it("should refund buyer on resolve(true)", async function () {
      const { factory, escrow, usdc, buyer } = await loadFixture(fundedEscrowFixture);

      await escrow.connect(buyer).dispute();

      const buyerBefore = await usdc.balanceOf(buyer.address);
      await expect(factory.resolveDispute(SHIPMENT_ID, true))
        .to.emit(escrow, "Refunded")
        .withArgs(buyer.address, AMOUNT);

      expect(await escrow.status()).to.equal(4); // Refunded
      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBefore + AMOUNT);
    });

    it("should release to seller on resolve(false)", async function () {
      const { factory, escrow, usdc, buyer, seller } = await loadFixture(fundedEscrowFixture);

      await escrow.connect(buyer).dispute();

      const sellerBefore = await usdc.balanceOf(seller.address);
      await expect(factory.resolveDispute(SHIPMENT_ID, false))
        .to.emit(escrow, "Released")
        .withArgs(seller.address, AMOUNT);

      expect(await escrow.status()).to.equal(2); // Released
      expect(await usdc.balanceOf(seller.address)).to.equal(sellerBefore + AMOUNT);
    });

    it("should revert dispute when already released", async function () {
      const { factory, escrow, buyer } = await loadFixture(fundedEscrowFixture);

      await factory.releaseEscrow(SHIPMENT_ID);

      await expect(escrow.connect(buyer).dispute())
        .to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  describe("getState", function () {
    it("should return correct state after funding", async function () {
      const { escrow, buyer, seller } = await loadFixture(fundedEscrowFixture);

      const state = await escrow.getState();
      expect(state._buyer).to.equal(buyer.address);
      expect(state._seller).to.equal(seller.address);
      expect(state._amount).to.equal(AMOUNT);
      expect(state._status).to.equal(1); // Funded
    });
  });
});
