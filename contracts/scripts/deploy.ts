import { ethers } from "hardhat"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying with:", deployer.address)
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH")

  // Em produção, usar wallets dedicadas para rewards pool e treasury
  // Para testnet, usamos o próprio deployer como placeholder
  const rewardsPoolAddress = process.env.REWARDS_POOL_ADDRESS ?? deployer.address
  const treasuryAddress    = process.env.TREASURY_ADDRESS ?? deployer.address

  console.log("\nEndereços:")
  console.log("  Rewards Pool:", rewardsPoolAddress)
  console.log("  Treasury:    ", treasuryAddress)

  const Factory = await ethers.getContractFactory("ORBSToken")
  const token = await Factory.deploy(rewardsPoolAddress, treasuryAddress)
  await token.waitForDeployment()

  const address = await token.getAddress()
  console.log("\n✅ ORBSToken deployed:", address)
  console.log("\nPara verificar no BaseScan:")
  console.log(`  npx hardhat verify --network base-sepolia ${address} ${rewardsPoolAddress} ${treasuryAddress}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
