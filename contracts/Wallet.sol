// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Wallet {
    address[] public approvers;
    uint256 public quorum;
    struct Transfer {
        uint256 id;
        address payable recipient;
        uint256 amount;
        uint256 approvelCount;
        bool sent;
    }

    Transfer[] public transfers;
    mapping(address => mapping(uint256 => bool)) public approvals;
    uint256 public nextId;

    constructor(address[] memory _approvers, uint256 _quorum) {
        approvers = _approvers;
        quorum = _quorum;
    }

    modifier onlyApproved() {
        bool allowed = false;
        for (uint256 i = 0; i < approvers.length; i++) {
            if (approvers[i] == msg.sender) {
                allowed = true;
            }
        }
        require(allowed == true, "only approver allowed");
        _;
    }

    function getApprovers() external view returns (address[] memory) {
        return approvers;
    }

    function createTransfer(uint256 _amount, address payable _recipient)
        external
        onlyApproved
    {
        transfers[nextId] = Transfer(nextId, _recipient, _amount, 0, false);
        nextId++;
    }

    function getTransfers() external view returns (Transfer[] memory) {
        return transfers;
    }

    function approveTransfer(uint256 _id) external onlyApproved {
        require(transfers[_id].sent == false, "already transfered");
        require(approvals[msg.sender][_id] == false, "Already approved!");
        approvals[msg.sender][_id] = true;
        transfers[_id].approvelCount++;

        if (transfers[_id].approvelCount >= quorum) {
            transfers[_id].sent = true;
            address payable recipient = transfers[_id].recipient;
            uint256 amount = transfers[_id].amount;
            recipient.transfer(amount);
        }
    }

    receive() external payable {}
}
