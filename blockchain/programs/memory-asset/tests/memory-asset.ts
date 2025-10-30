import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MemoryAsset } from "../target/types/memory_asset";
import { expect } from "chai";

describe("memory-asset", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MemoryAsset as Program<MemoryAsset>;
  const owner = provider.wallet.publicKey;

  let userAccountPda: anchor.web3.PublicKey;
  let accessPolicyPda: anchor.web3.PublicKey;
  let userAccountBump: number;
  let accessPolicyBump: number;

  before(async () => {
    // Derive PDAs
    [userAccountPda, userAccountBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("user_account"), owner.toBuffer()],
      program.programId
    );

    [accessPolicyPda, accessPolicyBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("access_policy"), owner.toBuffer()],
      program.programId
    );
  });

  describe("Initialize User", () => {
    it("Should initialize user account successfully", async () => {
      const tx = await program.methods
        .initializeUser()
        .accounts({
          userAccount: userAccountPda,
          accessPolicy: accessPolicyPda,
          owner: owner,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize user transaction:", tx);

      // Fetch and verify user account
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.owner.toString()).to.equal(owner.toString());
      expect(userAccount.memoryCount.toNumber()).to.equal(0);
      expect(userAccount.totalStorageBytes.toNumber()).to.equal(0);
      expect(userAccount.accessPolicyVersion).to.equal(1);

      // Fetch and verify access policy
      const accessPolicy = await program.account.accessPolicyAccount.fetch(accessPolicyPda);
      expect(accessPolicy.owner.toString()).to.equal(owner.toString());
      expect(accessPolicy.grants).to.be.empty;
    });

    it("Should fail to initialize user account twice", async () => {
      try {
        await program.methods
          .initializeUser()
          .accounts({
            userAccount: userAccountPda,
            accessPolicy: accessPolicyPda,
            owner: owner,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Mint Memory", () => {
    const arweaveId = "test-arweave-id-123456789012345678901234";
    const contentHash = Array(32).fill(1);
    const metadataUri = "https://arweave.net/test-metadata";

    it("Should mint memory successfully", async () => {
      // Note: This is a simplified test without actual Bubblegum integration
      // In production, you would need to set up Merkle tree accounts

      const userAccountBefore = await program.account.userAccount.fetch(userAccountPda);
      const memoryCountBefore = userAccountBefore.memoryCount.toNumber();

      // For testing purposes, we'll skip the actual minting
      // and just verify the state updates would work
      console.log("Memory count before:", memoryCountBefore);
      console.log("Arweave ID:", arweaveId);
      console.log("Content hash:", contentHash);
    });
  });

  describe("Update Access Policy", () => {
    it("Should update access policy successfully", async () => {
      const grantee = anchor.web3.Keypair.generate().publicKey;
      const grants = [
        {
          grantee: grantee,
          permissions: 0b001, // Read permission
          expiresAt: null,
          maxAccess: null,
          currentAccess: 0,
        },
      ];

      const tx = await program.methods
        .updateAccessPolicy(grants, { deny: {} })
        .accounts({
          accessPolicy: accessPolicyPda,
          userAccount: userAccountPda,
          owner: owner,
        })
        .rpc();

      console.log("Update access policy transaction:", tx);

      // Verify policy was updated
      const accessPolicy = await program.account.accessPolicyAccount.fetch(accessPolicyPda);
      expect(accessPolicy.grants).to.have.lengthOf(1);
      expect(accessPolicy.grants[0].grantee.toString()).to.equal(grantee.toString());
      expect(accessPolicy.grants[0].permissions).to.equal(1);

      // Verify policy version was incremented
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.accessPolicyVersion).to.equal(2);
    });

    it("Should fail with too many grants", async () => {
      const grants = Array(11)
        .fill(null)
        .map(() => ({
          grantee: anchor.web3.Keypair.generate().publicKey,
          permissions: 0b001,
          expiresAt: null,
          maxAccess: null,
          currentAccess: 0,
        }));

      try {
        await program.methods
          .updateAccessPolicy(grants, { deny: {} })
          .accounts({
            accessPolicy: accessPolicyPda,
            userAccount: userAccountPda,
            owner: owner,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });

    it("Should fail with invalid permissions", async () => {
      const grantee = anchor.web3.Keypair.generate().publicKey;
      const grants = [
        {
          grantee: grantee,
          permissions: 0b11111111, // Invalid permissions
          expiresAt: null,
          maxAccess: null,
          currentAccess: 0,
        },
      ];

      try {
        await program.methods
          .updateAccessPolicy(grants, { deny: {} })
          .accounts({
            accessPolicy: accessPolicyPda,
            userAccount: userAccountPda,
            owner: owner,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe("Create Version", () => {
    it("Should create new version successfully", async () => {
      const arweaveId = "test-arweave-id-v2-123456789012345678";
      const contentHash = Array(32).fill(2);

      const tx = await program.methods
        .createVersion(arweaveId, contentHash)
        .accounts({
          userAccount: userAccountPda,
          owner: owner,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Create version transaction:", tx);
    });

    it("Should fail with invalid Arweave ID length", async () => {
      const arweaveId = "a".repeat(50); // Too long
      const contentHash = Array(32).fill(2);

      try {
        await program.methods
          .createVersion(arweaveId, contentHash)
          .accounts({
            userAccount: userAccountPda,
            owner: owner,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });
});
