const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // 1. Deploy LogisticsNFT Contract
  const LogisticsNFT = await hre.ethers.getContractFactory("LogisticsNFT");
  const nft = await LogisticsNFT.deploy();
  await nft.waitForDeployment(); // Hardhat v2.14+ syntax
  // If using older ethers: await nft.deployed();
  
  console.log("e-B/L NFT Contract deployed to:", await nft.getAddress());

  // configuration - REPLACE THESE WITH ACTUAL ADDRESSES
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC example
  const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS || "0xYourOracleWalletAddress"; 

  if (ORACLE_ADDRESS === "0xYourOracleWalletAddress") {
      console.warn("WARNING: Using placeholder Oracle Address. Set ORACLE_ADDRESS env var.");
  }

  // 2. Deploy LogisticsEscrow Contract
  // Constructor: (address _usdcToken, address _oracle, address _nftContract)
  const LogisticsEscrow = await hre.ethers.getContractFactory("LogisticsEscrow");
  const escrow = await LogisticsEscrow.deploy(
    USDC_ADDRESS, 
    ORACLE_ADDRESS,
    await nft.getAddress()
  );
  await escrow.waitForDeployment();
  
  console.log("LogisticsEscrow Contract deployed to:", await escrow.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
