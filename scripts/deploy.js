const hre = require("hardhat");

async function main() {
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    const nftMarketplace = await NFTMarketplace.deploy();

    await nftMarketplace.waitForDeployment(); // Updated line

    console.log(
        `Contract deployed to address: ${await nftMarketplace.getAddress()}` // Updated to get the contract address
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1; // Updated process exit code
});
