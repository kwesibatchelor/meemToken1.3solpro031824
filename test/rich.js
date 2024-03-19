const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Rich contract", function() {
    // global variables 
    let Token;
    let Rich;
    let owner;
    let addr1;
    let addr2;
    let tokenCap = 100000000;
    let tokenBlockReward = 50;

    beforeEach(async function () {
        // get the ContractFactory and Signers 
        Token = await ethers.getContractFactory("Rich");
        [owner, addr1, addr2] = await ethers.getSigners();

        Rich = await Token.deploy(tokenCap, tokenBlockReward);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await Rich.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function() {
            const ownerBalance = await Rich.balanceOf(owner.address);
            expect(await Rich.totalSupply()).to.equal(ownerBalance);
        });

        it("Should set the max capped supply to the argument provided during deployed", async function () {
            const cap = await Rich.cap();
            expect(Number(ethers.utils.formatUnits(cap, "ether"))).to.equal(tokenCap);
        });

        it("Should set the blockReward to the argument provided during deployment", async function () {
            const blockReward = await Rich.blockReward();
            expect(Number(ethers.utils.formatUnits(blockReward, "ether"))).to.equal(tokenBlockReward);
        });
    }); 

    describe("Transaction", function () {
        it("Should transfer tokens between accounts", async function () {
            // transfer 50 tokens from owner to addr1
            await Rich.transfer(addr1.address, 50);
            const addr1Balance = await Rich.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(50);

            // transfer 50 tokens from addr1 to addr2
            // we use .connect(signer) to send a transaction from another account
            await Rich.connect(addr1).transfer(addr2.address, 50);
            const addr2Balance = await Rich.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(50);
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            // Get initial balances
            const initialOwnerBalance = await Rich.balanceOf(owner.address);
            const initialAddr1Balance = await Rich.balanceOf(addr1.address); // Initialize initialAddr1Balance here
        
            // Ensure addr1 is properly connected before performing the transfer
            await expect(
                Rich.connect(addr1).transfer(owner.address, 1)
            ).to.be.reverted;
        
            // Balances should remain unchanged
            expect(await Rich.balanceOf(owner.address)).to.equal(initialOwnerBalance);
            expect(await Rich.balanceOf(addr1.address)).to.equal(initialAddr1Balance);
        });        
        
        it("Should update balances after transfer", async function () {
            // Get initial balances
            const initialOwnerBalance = BigInt(await Rich.balanceOf(owner.address));
            const initialAddr1BalanceBigInt = BigInt(await Rich.balanceOf(addr1.address)); // Convert to BigInt
            const initialAddr2Balance = BigInt(await Rich.balanceOf(addr2.address));
        
            // Transfer tokens
            await Rich.transfer(addr1.address, 100);
            await Rich.transfer(addr2.address, 50);
        
            // Check balances after transfers
            const finalOwnerBalance = BigInt(await Rich.balanceOf(owner.address));
            const finalAddr1Balance = BigInt(await Rich.balanceOf(addr1.address));
            const finalAddr2Balance = BigInt(await Rich.balanceOf(addr2.address));
        
            // Calculate expected final balances
            const expectedFinalOwnerBalance = initialOwnerBalance - BigInt(150);
            const expectedFinalAddr1Balance = initialAddr1BalanceBigInt + BigInt(100);
            const expectedFinalAddr2Balance = initialAddr2Balance + BigInt(50);
        
            // Check if balances are updated correctlys
            expect(finalOwnerBalance.toString()).to.equal(expectedFinalOwnerBalance.toString());
            expect(finalAddr1Balance.toString()).to.equal(expectedFinalAddr1Balance.toString());
            expect(finalAddr2Balance.toString()).to.equal(expectedFinalAddr2Balance.toString());
        });        
    });
});
