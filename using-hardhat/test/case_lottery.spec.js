const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Testing Lottery contract", function () {
  let owner;
  let participant1;
  let participant2;

  let lottery;

  beforeEach(async () => {
    [owner, participant1, participant2] = await ethers.getSigners();
    const Lottery = await ethers.getContractFactory("Lottery", owner);
    lottery = await Lottery.deploy();
    await lottery.deployed();
  });

  it("Enter the Lottery", async () => {
    const value = ethers.utils.parseEther("1");

    const tx = await lottery.connect(participant1).enter({ value });
    expect(() => tx).to.changeEtherBalance(lottery, value);
  });

  it("Change enter price by owner", async () => {
    const oldPrice = await lottery.connect(owner).getEnterPrice();
    expect(oldPrice).to.eq(ethers.utils.parseEther("1"));

    const newPrice = ethers.utils.parseEther("2");
    const tx = await lottery.connect(owner).setEnterPrice(newPrice);

    const changedPrice = await lottery.connect(owner).getEnterPrice();
    expect(changedPrice).to.eq(newPrice);
  });

  it("Change enter price by participant", async () => {
    const oldPrice = await lottery.connect(participant1).getEnterPrice();
    expect(oldPrice).to.eq(ethers.utils.parseEther("1"));

    const newPrice = ethers.utils.parseEther("2");
    const tx = lottery.connect(participant1).setEnterPrice(newPrice);
    await expect(tx).to.be.revertedWith("This can only be done by the owner.");
  });

  it("Pick winner by owner", async () => {
    const value = ethers.utils.parseEther("1");

    const tx1 = await lottery.connect(participant1).enter({ value });
    expect(() => tx1).to.changeEtherBalance(lottery, value);

    const tx2 = await lottery.connect(participant2).enter({ value });
    expect(() => tx2).to.changeEtherBalance(lottery, value);

    const pickedWinner = lottery.connect(owner).pickWinner();

    expect(pickedWinner).to.be.ok;

    await expect(pickedWinner).to.emit(lottery, "Winner");

    const prizePool = await lottery.connect(participant1).getPrizePool();
    expect(prizePool).to.eq(ethers.utils.parseEther("0"));
  });

  it("Pick winner by participant", async () => {
    const value = ethers.utils.parseEther("1");

    const tx1 = await lottery.connect(participant1).enter({ value });
    expect(() => tx1).to.changeEtherBalance(lottery, value);

    const tx2 = await lottery.connect(participant2).enter({ value });
    expect(() => tx2).to.changeEtherBalance(lottery, value);

    const pickedWinner = lottery.connect(participant2).pickWinner();

    await expect(pickedWinner).to.be.revertedWith(
      "This can only be done by the owner."
    );

    const prizePool = await lottery.connect(participant1).getPrizePool();
    expect(prizePool).to.eq(ethers.utils.parseEther("2"));
  });
});
