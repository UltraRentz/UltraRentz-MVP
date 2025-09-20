const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
  let URZ, Escrow;
  let urz, escrow;
  let deployer, raj, arun, s1, s2, s3, s4, dao;

  beforeEach(async function () {
    [deployer, raj, arun, s1, s2, s3, s4, dao] = await ethers.getSigners();

    // Deploy URZ token
    URZ = await ethers.getContractFactory("UltraRentzToken");
    urz = await URZ.deploy(ethers.parseUnits("1000000", 18));
    await urz.waitForDeployment();

    // Deploy Escrow contract
    Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(urz.target);
    await escrow.waitForDeployment();

    // Set DAO
    await escrow.setDAO(dao.address);

    // Set 6 signatories for multisig (raj, arun, s1-s4)
    await escrow.setSignatories([raj.address, arun.address, s1.address, s2.address, s3.address, s4.address]);

    // Approve escrow to spend tenant's URZ
    await urz.connect(raj).approve(escrow.target, ethers.parseUnits("100", 18));
  });

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

    // Approvals from 4 signatories
    await escrow.connect(raj).approveRelease();
    await escrow.connect(arun).approveRelease();
    await escrow.connect(s1).approveRelease();
    await escrow.connect(s2).approveRelease();

    // Release deposit
    await expect(escrow.connect(deployer).releaseDeposit())
      .to.emit(escrow, "DepositReleased")
      .withArgs(ethers.parseUnits("100", 18));

    const landlordBalance = await urz.balanceOf(arun.address);
    expect(landlordBalance).to.equal(ethers.parseUnits("100", 18));
  });

  it("DAO can release deposit in case of dispute", async function () {
    await escrow.connect(raj).deposit(ethers.parseUnits("100", 18));
    await escrow.connect(raj).triggerDispute();

    // DAO forces release
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
});
