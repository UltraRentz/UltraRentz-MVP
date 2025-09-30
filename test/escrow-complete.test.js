const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract - Complete Tests", function () {
  let URZ, Escrow, Malicious;
  let urz, escrow, malicious;
  let deployer, raj, arun, s1, s2, s3, s4, dao;

  beforeEach(async function () {
    [deployer, raj, arun, s1, s2, s3, s4, dao] = await ethers.getSigners();

    // Deploy URZ token
    URZ = await ethers.getContractFactory("UltraRentzToken");
    urz = await URZ.deploy(ethers.parseUnits("1000000", 18));
    await urz.waitForDeployment();

    // Deploy Escrow contract
    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(deployer.address); // Pass owner address
    await escrow.waitForDeployment();

    // Set DAO
    await escrow.setDAO(dao.address);

    // Set 6 signatories
    await escrow.setSignatories([raj.address, arun.address, s1.address, s2.address, s3.address, s4.address]);

    // Approve escrow to spend tenant's URZ
    await urz.connect(raj).approve(escrow.target, ethers.parseUnits("100", 18));

    // Deploy Malicious contract
    Malicious = await ethers.getContractFactory("MaliciousEscrowAttack");
    malicious = await Malicious.deploy(escrow.target, urz.target);
    await malicious.waitForDeployment();
  });

  // ---------- STANDARD ESCROW TESTS ----------

  it("Tenant can deposit URZ into escrow", async function () {
    await expect(escrow.connect(raj).deposit(ethers.parseUnits("100", 18)))
      .to.emit(escrow, "DepositReceived")
      .withArgs(raj.address, ethers.parseUnits("100", 18));

    const balance = await urz.balanceOf(escrow.target);
    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Landlord cannot withdraw without approval", async function () {
    await escrow.connect(raj).deposit(ethers.parseUnits("100", 18));
    await expect(escrow.connect(arun).releaseDeposit())
      .to.be.revertedWith("Not enough approvals to release");
  });

  it("4-of-6 multisig can release deposit", async function () {
    await escrow.connect(raj).deposit(ethers.parseUnits("100", 18));

    await escrow.connect(raj).approveRelease();
    await escrow.connect(arun).approveRelease();
    await escrow.connect(s1).approveRelease();
    await escrow.connect(s2).approveRelease();

    await expect(escrow.connect(deployer).releaseDeposit())
      .to.emit(escrow, "DepositReleased")
      .withArgs(ethers.parseUnits("100", 18));

    const landlordBalance = await urz.balanceOf(arun.address);
    expect(landlordBalance).to.equal(ethers.parseUnits("100", 18));
  });

  it("DAO can release deposit in case of dispute", async function () {
    await escrow.connect(raj).deposit(ethers.parseUnits("100", 18));
    await escrow.connect(raj).triggerDispute();

    await expect(escrow.connect(dao).daoReleaseDeposit())
      .to.emit(escrow, "DepositReleased")
      .withArgs(ethers.parseUnits("100", 18));

    const landlordBalance = await urz.balanceOf(arun.address);
    expect(landlordBalance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Deposit is locked if dispute is active", async function () {
    await escrow.connect(raj).deposit(ethers.parseUnits("100", 18));
    await escrow.connect(raj).triggerDispute();

    await expect(escrow.connect(arun).approveRelease())
      .to.be.revertedWith("Deposit is locked due to dispute");

    const balance = await urz.balanceOf(escrow.target);
    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  // ---------- REENTRANCY PROTECTION TEST ----------

  it("should prevent reentrancy on approveRelease", async function () {
    // Create a deposit
    const signatories = [raj.address, arun.address, s1.address, s2.address, s3.address, s4.address];
    await urz.connect(raj).transfer(malicious.target, ethers.parseUnits("50", 18)); // fund malicious contract
    await urz.connect(malicious.signer).approve(escrow.target, ethers.parseUnits("50", 18));

    // Attempt attack
    await expect(
      malicious.startAttack(arun.address, signatories, ethers.parseUnits("50", 18))
    ).to.not.be.reverted; // attack is called, but nested calls blocked

    // Ensure normal approvals still work
    await escrow.connect(raj).approveRelease(1);
    const deposit = await escrow.getDepositBasic(1);
    expect(deposit.simpleApprovedCount).to.equal(1);
  });
});
