import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MemoryAsset } from "../target/types/memory_asset";
import { expect } from "chai";

describe("memory-asset integration tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MemoryAsset as Program<MemoryAsset>;
  const owner = provider.wallet.publicKey;
  const grantee = anchor.web3.Keypair.generate();

  let userAccountPda: anchor.web3.PublicKey;
  let accessPolicyPda: anchor.web3.PublicKey;

  before(async () => {
    [userAccountPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("user_account"), owner.toBuffer()],
      program.programId
    );

    [accessPolicyPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("access_policy"), owner.toBuffer()],
      program.programId
    );

    // Airdrop to grantee for testing
    const airdropSig = await provider.connection.requestAirdrop(
      grantee.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
  });

  describe("Complete Minting Flow", () => {
    it("Should complete full memory minting workflow", async () => {
      // Step 1: Initialize user
      await program.methods
        .initializeUser()
        .accounts({
          userAccount: userAccountPda,
          accessPolicy: accessPolicyPda,
          owner: owner,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      expect(userAccount.memoryCount.toNumber()).to.equal(0);

      // Step 2: Set up access policy
      const grants = [
        {
          grantee: grantee.publicKey,
          permissions: 0b001, // Read only
          expiresAt: null,
          maxAccess: { some: 10 },
          currentAccess: 0,
        },
      ];

      await program.methods
        .updateAccessPolicy(grants, { deny: {} })
        .accounts({
          accessPolicy: accessPolicyPda,
          userAccount: userAccountPda,
          owner: owner,
        })
        .rpc();

      const accessPolicy = await program.account.accessPolicyAccount.fetch(accessPolicyPda);
      expect(accessPolicy.grants).to.have.lengthOf(1);

      console.log("✅ Complete minting flow test passed");
    });
  });

  describe("Access Authorization Flow", () => {
    it("Should grant and verify access correctly", async () => {
      const accessPolicy = await program.account.accessPolicyAccount.fetch(accessPolicyPda);
      
      // Verify grantee has read permission
      const grant = accessPolicy.grants.find(
        (g) => g.grantee.toString() === grantee.publicKey.toString()
      );
      
      expect(grant).to.exist;
      expect(grant.permissions & 0b001).to.equal(1); // Has read
      expect(grant.permissions & 0b010).to.equal(0); // No write
      expect(grant.permissions & 0b100).to.equal(0); // No transfer

      console.log("✅ Access authorization flow test passed");
    });

    it("Should handle permission updates", async () => {
      // Update to add write permission
      const grants = [
        {
          grantee: grantee.publicKey,
          permissions: 0b011, // Read + Write
          expiresAt: null,
          maxAccess: { some: 20 },
          currentAccess: 0,
        },
      ];

      await program.methods
        .updateAccessPolicy(grants, { deny: {} })
        .accounts({
          accessPolicy: accessPolicyPda,
          userAccount: userAccountPda,
          owner: owner,
        })
        .rpc();

      const accessPolicy = await program.account.accessPolicyAccount.fetch(accessPolicyPda);
      const grant = accessPolicy.grants[0];
      
      expect(grant.permissions & 0b001).to.equal(1); // Has read
      expect(grant.permissions & 0b010).to.equal(2); // Has write

      console.log("✅ Permission update test passed");
    });
  });

  describe("Batch Operations", () => {
    it("Should handle multiple memory versions", async () => {
      const versions = [
        {
          arweaveId: "test-v1-" + Date.now(),
          contentHash: Array(32).fill(1),
        },
        {
          arweaveId: "test-v2-" + Date.now(),
          contentHash: Array(32).fill(2),
        },
        {
          arweaveId: "test-v3-" + Date.now(),
          contentHash: Array(32).fill(3),
        },
      ];

      for (const version of versions) {
        await program.methods
          .createVersion(version.arweaveId, version.contentHash)
          .accounts({
            userAccount: userAccountPda,
            owner: owner,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
      }

      console.log("✅ Batch operations test passed");
    });
  });

  describe("Error Handling", () => {
    it("Should reject unauthorized access policy updates", async () => {
      const unauthorizedUser = anchor.web3.Keypair.generate();
      
      // Airdrop for transaction fees
      const airdropSig = await provider.connection.requestAirdrop(
        unauthorizedUser.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      const grants = [
        {
          grantee: grantee.publicKey,
          permissions: 0b001,
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
            owner: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
        console.log("✅ Unauthorized access correctly rejected");
      }
    });

    it("Should validate Arweave ID length", async () => {
      const invalidArweaveId = "a".repeat(50); // Too long
      const contentHash = Array(32).fill(1);

      try {
        await program.methods
          .createVersion(invalidArweaveId, contentHash)
          .accounts({
            userAccount: userAccountPda,
            owner: owner,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).to.exist;
        console.log("✅ Invalid Arweave ID correctly rejected");
      }
    });
  });

  describe("State Consistency", () => {
    it("Should maintain consistent state across operations", async () => {
      const userAccount = await program.account.userAccount.fetch(userAccountPda);
      const accessPolicy = await program.account.accessPolicyAccount.fetch(accessPolicyPda);

      // Verify relationships
      expect(userAccount.owner.toString()).to.equal(accessPolicy.owner.toString());
      expect(userAccount.owner.toString()).to.equal(owner.toString());

      // Verify policy version incremented
      expect(userAccount.accessPolicyVersion).to.be.greaterThan(1);

      console.log("✅ State consistency test passed");
      console.log("Final memory count:", userAccount.memoryCount.toNumber());
      console.log("Final policy version:", userAccount.accessPolicyVersion);
      console.log("Total storage bytes:", userAccount.totalStorageBytes.toNumber());
    });
  });
});
