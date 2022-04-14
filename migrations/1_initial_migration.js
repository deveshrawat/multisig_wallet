const Migrations = artifacts.require("Migrations");
const Wallet = artifacts.require("wallet");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(
    Wallet,
    [
      "0x14a3e7738a7EFE3CE3a889f90AAdc806Adae95a5",
      "0x91f786AAd0FE48A6035d274e316870514e7be1a9",
      "0xf6FCA69F2Ba85A252272B73ac1B58456Ab490bE6",
    ],
    2
  );
};
