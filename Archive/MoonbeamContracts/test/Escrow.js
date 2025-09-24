const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow", function () {
  let Escrow, URZ, escrow, urz, owner, raj, arun;

  beforeEach(async function () {
    [owner, raj, arun] = await ethers.getSigners();

    // Deploy URZ token
    const URZToken = await ethers.getContractFactory("ERC20Mock"); 
    urz = await URZToken.deploy("UltraRentz", "URZ", raj.address, ethers.parseUnits("1000", 18));
    await urz.waitForDeployment();

    // Deploy Escrow
    const EscrowContract = await ethers.getContractFactory("Escrow");
    escrow = await EscrowContract.deploy(urz.target, raj.address, arun.address);
    await escrow.waitForDeployment();

    // Raj approves escrow to spend URZ
    await urz.connect(raj).approve(escrow.target, ethers.parseUnits("100", 18));
  });

  it("Raj should deposit URZ into escrow", async function () {
    await expect(escrow.connect(raj).deposit(ethers.parseUnits("100", 18)))
      .to.emit(escrow, "DepositReceived")
      .withArgs(raj.address, ethers.parseUnits("100", 18));

    const balance = await urz.balanceOf(escrow.target);
    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Raj and Arun should approve and release deposit", async function () {
    await escrow.connect(raj).deposit(ethers.parseUnits("100", 18));

    // Approvals
    await expect(escrow.connect(raj).approveRelease())
      .to.emit(escrow, "ReleaseApproved")
      .withArgs(raj.address);

    await expect(escrow.connect(arun).approveRelease())
      .to.emit(escrow, "ReleaseApproved")
      .withArgs(arun.address);

    // Release funds
    await expect(escrow.connect(owner).releaseDeposit())
      .to.emit(escrow, "DepositReleased")
      .withArgs(ethers.parseUnits("100", 18));

    const landlordBalance = await urz.balanceOf(arun.address);
    expect(landlordBalance).to.equal(ethers.parseUnits("100", 18));
  });

  it("Should lock funds if dispute triggered", async function () {
    await escrow.connect(raj).deposit(ethers.parseUnits("100", 18));

    await expect(escrow.connect(raj).triggerDispute())
      .to.emit(escrow, "DisputeTriggered")
      .withArgs(raj.address);

    // Ensure funds are still in escrow
    const balance = await urz.balanceOf(escrow.target);
    expect(balance).to.equal(ethers.parseUnits("100", 18));
  });
});
