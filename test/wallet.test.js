const Wallet = artifacts.require("Wallet");
const { expectRevert } = require("@openzeppelin/test-helpers");

contract("Wallet", (accounts) => {
  let wallet;
  beforeEach(async function () {
    wallet = await Wallet.new([accounts[0], accounts[1], accounts[2]], 2);
    await web3.eth.sendTransaction({
      from: accounts[0],
      to: wallet.address,
      value: 1000000,
    });
  });

  it("should have instentiated correctley", async () => {
    const approversList = await wallet.getApprovers();
    const quorum = await wallet.quorum();
    assert(approversList[0] === accounts[0]);
    assert(approversList[1] === accounts[1]);
    assert(approversList[2] === accounts[2]);
    assert(quorum.toNumber() === 2);
  });

  it("should create transfers", async () => {
    const recipientAccount = accounts[4];
    const creatorAccount = accounts[1];
    await wallet.createTransfer(1000, recipientAccount, { from: creatorAccount });
    const transfers = await wallet.getTransfers();
    assert(transfers.length === 1);
    assert(transfers[0].id === "0");
    assert(transfers[0].recipient === recipientAccount);
    assert(transfers[0].amount === "1000");
    assert(transfers[0].sent === false);
    assert(transfers[0].approvelCount === "0");
  });

  it("should not allow to create transfers if sender is not approved", async () => {
    const recipientAccount = accounts[4];
    const creatorAccount = accounts[3];
    await expectRevert(
      wallet.createTransfer(1000, recipientAccount, { from: creatorAccount }),
      "only approver allowed"
    );
  });

  it("should increment approvals", async () => {
    await wallet.createTransfer(1000, accounts[5], {
      from: accounts[1],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    const transfers = await wallet.getTransfers();
    const balance = await web3.eth.getBalance(wallet.address);
    assert(transfers.length === 1);
    assert(transfers[0].approvelCount === "1");
    assert(transfers[0].sent === false);
    assert(balance === "1000000");
  });

  it("should send ethers if quorum is reached", async () => {
    const balanceBefore = web3.utils.toBN(await web3.eth.getBalance(accounts[5]));
    await wallet.createTransfer(1000, accounts[5], {
      from: accounts[1],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[1] });
    const balanceAfter = web3.utils.toBN(await web3.eth.getBalance(accounts[5]));
    assert(balanceAfter.sub(balanceBefore).toNumber() === 1000);
  });

  it("should not allow to approve if sender is not approved", async () => {
    await wallet.createTransfer(1000, accounts[5], {
      from: accounts[1],
    });
    await expectRevert(wallet.approveTransfer(0, { from: accounts[4] }), "only approver allowed");
  });

  it("should not allow if already approved", async () => {
    await wallet.createTransfer(1000, accounts[5], {
      from: accounts[1],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await expectRevert(wallet.approveTransfer(0, { from: accounts[0] }), "Already approved!");
  });

  it("should not allow if already transfered", async () => {
    await wallet.createTransfer(1000, accounts[5], {
      from: accounts[1],
    });
    await wallet.approveTransfer(0, { from: accounts[0] });
    await wallet.approveTransfer(0, { from: accounts[1] });
    await expectRevert(wallet.approveTransfer(0, { from: accounts[2] }), "already transfered");
  });
});
