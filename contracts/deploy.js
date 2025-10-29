const hre = require("hardhat");

async function main() {
  console.log("Deploying MessageStorage to Base...");

  const MessageStorage = await hre.ethers.getContractFactory("MessageStorage");
  const messageStorage = await MessageStorage.deploy();

  await messageStorage.waitForDeployment();

  const address = await messageStorage.getAddress();
  console.log("MessageStorage deployed to:", address);
  
  console.log("\nSave this address to your frontend config!");
  console.log(`Contract Address: ${address}`);
  console.log(`Network: ${hre.network.name}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
