import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy EscrowFactory
  const Factory = await ethers.getContractFactory("EscrowFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("EscrowFactory deployed to:", factoryAddress);

  // Save deployment info
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    escrowFactory: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(outDir, `${deployment.network}.json`),
    JSON.stringify(deployment, null, 2)
  );

  console.log("Deployment saved to:", path.join(outDir, `${deployment.network}.json`));

  // Copy ABI to frontend
  const abiDir = path.join(__dirname, "..", "..", "frontend", "lib", "contracts", "abi");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const factoryArtifact = await ethers.getContractFactory("EscrowFactory");
  const escrowArtifact = await ethers.getContractFactory("ShipmentEscrow");

  fs.writeFileSync(
    path.join(abiDir, "EscrowFactory.json"),
    JSON.stringify(factoryArtifact.interface.formatJson(), null, 2)
  );
  fs.writeFileSync(
    path.join(abiDir, "ShipmentEscrow.json"),
    JSON.stringify(escrowArtifact.interface.formatJson(), null, 2)
  );

  console.log("ABIs copied to frontend/lib/contracts/abi/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
