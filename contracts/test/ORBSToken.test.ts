import { expect } from "chai"
import { ethers } from "hardhat"
import { ORBSToken } from "../typechain-types"

describe("ORBSToken", function () {
  let token: ORBSToken
  let owner: any, rewardsPool: any, treasury: any, alice: any, bob: any

  const TOTAL_SUPPLY = ethers.parseEther("1000000000") // 1 bilião

  beforeEach(async () => {
    ;[owner, rewardsPool, treasury, alice, bob] = await ethers.getSigners()

    const Factory = await ethers.getContractFactory("ORBSToken")
    token = await Factory.deploy(rewardsPool.address, treasury.address)
    await token.waitForDeployment()

    // Dar 10.000 ORBS à Alice para testar transferências
    await token.transfer(alice.address, ethers.parseEther("10000"))
  })

  // -------------------------------------------------------------------------
  // Básicos
  // -------------------------------------------------------------------------

  it("deve ter nome e símbolo corretos", async () => {
    expect(await token.name()).to.equal("ORBS")
    expect(await token.symbol()).to.equal("ORBS")
  })

  it("deve ter supply total de 1 bilião", async () => {
    expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY)
  })

  it("deve ter o deployer como owner", async () => {
    expect(await token.owner()).to.equal(owner.address)
  })

  // -------------------------------------------------------------------------
  // Taxa de transferência
  // -------------------------------------------------------------------------

  it("deve cobrar 2% de taxa em transferências normais", async () => {
    const amount = ethers.parseEther("1000")
    const fee = (amount * 200n) / 10_000n           // 2% = 20 ORBS
    const rewardShare = (fee * 60n) / 100n           // 12 ORBS
    const treasuryShare = (fee * 30n) / 100n         // 6 ORBS
    const burnShare = fee - rewardShare - treasuryShare // 2 ORBS
    const net = amount - fee                         // 980 ORBS

    const rewardsBefore = await token.balanceOf(rewardsPool.address)
    const treasuryBefore = await token.balanceOf(treasury.address)
    const supplyBefore = await token.totalSupply()

    await token.connect(alice).transfer(bob.address, amount)

    expect(await token.balanceOf(bob.address)).to.equal(net)
    expect(await token.balanceOf(rewardsPool.address)).to.equal(rewardsBefore + rewardShare)
    expect(await token.balanceOf(treasury.address)).to.equal(treasuryBefore + treasuryShare)
    expect(await token.totalSupply()).to.equal(supplyBefore - burnShare)
  })

  it("não deve cobrar taxa em transferências do owner (isento)", async () => {
    const amount = ethers.parseEther("1000")
    await token.transfer(bob.address, amount)
    expect(await token.balanceOf(bob.address)).to.equal(amount)
  })

  it("não deve cobrar taxa em transferências para o rewardsPool", async () => {
    const amount = ethers.parseEther("1000")
    await token.connect(alice).transfer(rewardsPool.address, amount)
    expect(await token.balanceOf(rewardsPool.address)).to.equal(amount)
  })

  it("não deve cobrar taxa em transferências para o treasury", async () => {
    const amount = ethers.parseEther("1000")
    await token.connect(alice).transfer(treasury.address, amount)
    expect(await token.balanceOf(treasury.address)).to.equal(amount)
  })

  // -------------------------------------------------------------------------
  // Isenções
  // -------------------------------------------------------------------------

  it("deve permitir ao owner isentar um endereço", async () => {
    await token.setFeeExempt(alice.address, true)
    const amount = ethers.parseEther("1000")
    await token.connect(alice).transfer(bob.address, amount)
    // Alice isenta — Bob recebe tudo
    expect(await token.balanceOf(bob.address)).to.equal(amount)
  })

  it("deve rejeitar setFeeExempt de não-owner", async () => {
    await expect(
      token.connect(alice).setFeeExempt(bob.address, true)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
  })

  // -------------------------------------------------------------------------
  // Admin — setTransferFee
  // -------------------------------------------------------------------------

  it("deve permitir ao owner alterar a taxa", async () => {
    await token.setTransferFee(100) // 1%
    expect(await token.transferFeeBps()).to.equal(100)
  })

  it("deve rejeitar taxa acima de 5%", async () => {
    await expect(token.setTransferFee(501)).to.be.revertedWith("Fee too high")
  })

  it("deve rejeitar setTransferFee de não-owner", async () => {
    await expect(
      token.connect(alice).setTransferFee(100)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
  })

  // -------------------------------------------------------------------------
  // Admin — setRewardsPool / setTreasury
  // -------------------------------------------------------------------------

  it("deve permitir ao owner alterar o rewardsPool", async () => {
    await token.setRewardsPool(bob.address)
    expect(await token.rewardsPool()).to.equal(bob.address)
    expect(await token.feeExempt(bob.address)).to.equal(true)
    expect(await token.feeExempt(rewardsPool.address)).to.equal(false)
  })

  it("deve rejeitar endereço zero em setRewardsPool", async () => {
    await expect(token.setRewardsPool(ethers.ZeroAddress)).to.be.revertedWith("Invalid address")
  })

  it("deve permitir ao owner alterar o treasury", async () => {
    await token.setTreasury(bob.address)
    expect(await token.treasury()).to.equal(bob.address)
  })
})
