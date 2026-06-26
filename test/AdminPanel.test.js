const { expect } = require("chai");
const { ethers } = require("hardhat");

// Full coverage of BUILD_SPEC section 4. Every gated path — allowed and reverting —
// is exercised so a third party can trust the on-chain permission matrix.
describe("AdminPanel", function () {
  let adminPanel;
  let owner, moderator, user, noRole, other;

  // OpenZeppelin v5 reverts onlyRole failures with a custom error:
  //   AccessControlUnauthorizedAccount(address account, bytes32 neededRole)
  async function expectAccessRevert(promise) {
    await expect(promise).to.be.revertedWithCustomError(
      adminPanel,
      "AccessControlUnauthorizedAccount"
    );
  }

  beforeEach(async function () {
    [owner, moderator, user, noRole, other] = await ethers.getSigners();
    const AdminPanel = await ethers.getContractFactory("AdminPanel");
    adminPanel = await AdminPanel.deploy(owner.address);
    await adminPanel.waitForDeployment();
  });

  // ---------------------------------------------------------------------------
  // Deployer / owner is a superset of all three roles
  // ---------------------------------------------------------------------------
  describe("Deployment & owner roles", function () {
    it("grants the deployer OWNER, MODERATOR and REGULAR_USER roles", async function () {
      const OWNER_ROLE = await adminPanel.OWNER_ROLE();
      const MODERATOR_ROLE = await adminPanel.MODERATOR_ROLE();
      const REGULAR_USER_ROLE = await adminPanel.REGULAR_USER_ROLE();
      const DEFAULT_ADMIN_ROLE = await adminPanel.DEFAULT_ADMIN_ROLE();

      expect(await adminPanel.hasRole(OWNER_ROLE, owner.address)).to.equal(true);
      expect(await adminPanel.hasRole(MODERATOR_ROLE, owner.address)).to.equal(true);
      expect(await adminPanel.hasRole(REGULAR_USER_ROLE, owner.address)).to.equal(true);
      expect(await adminPanel.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("reports getUserRole(owner) == 'OWNER'", async function () {
      expect(await adminPanel.getUserRole(owner.address)).to.equal("OWNER");
    });

    it("registers the owner in the user list as active", async function () {
      const ownerUser = await adminPanel.users(owner.address);
      expect(ownerUser.userAddress).to.equal(owner.address);
      expect(ownerUser.username).to.equal("Owner");
      expect(ownerUser.isActive).to.equal(true);
      expect(await adminPanel.isUserActive(owner.address)).to.equal(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Owner-only functions
  // ---------------------------------------------------------------------------
  describe("Owner functions", function () {
    it("owner can promoteModerator (grants role + creates user + emits events)", async function () {
      await expect(adminPanel.promoteModerator(moderator.address, "Mod1"))
        .to.emit(adminPanel, "UserAdded")
        .and.to.emit(adminPanel, "UserRoleChanged")
        .and.to.emit(adminPanel, "AuditLog");

      expect(await adminPanel.getUserRole(moderator.address)).to.equal("MODERATOR");
      const u = await adminPanel.users(moderator.address);
      expect(u.username).to.equal("Mod1");
      expect(u.isActive).to.equal(true);
    });

    it("owner can registerUser", async function () {
      await expect(adminPanel.registerUser(user.address, "User1"))
        .to.emit(adminPanel, "UserAdded")
        .and.to.emit(adminPanel, "AuditLog");

      expect(await adminPanel.getUserRole(user.address)).to.equal("REGULAR_USER");
      expect((await adminPanel.users(user.address)).username).to.equal("User1");
    });

    it("owner can updateSystemSetting and it is readable", async function () {
      await expect(adminPanel.updateSystemSetting("siteName", "MyDApp"))
        .to.emit(adminPanel, "SettingChanged")
        .and.to.emit(adminPanel, "AuditLog");

      expect(await adminPanel.getSystemSetting("siteName")).to.equal("MyDApp");
    });

    it("owner can removeUser (deactivates + revokes roles)", async function () {
      await adminPanel.registerUser(user.address, "User1");
      expect(await adminPanel.getUserRole(user.address)).to.equal("REGULAR_USER");

      await expect(adminPanel.removeUser(user.address))
        .to.emit(adminPanel, "UserRemoved")
        .and.to.emit(adminPanel, "UserStatusChanged")
        .and.to.emit(adminPanel, "AuditLog");

      expect(await adminPanel.getUserRole(user.address)).to.equal("NONE");
      expect(await adminPanel.isUserActive(user.address)).to.equal(false);
    });

    it("owner can getAllUsers", async function () {
      await adminPanel.promoteModerator(moderator.address, "Mod1");
      await adminPanel.registerUser(user.address, "User1");

      const all = await adminPanel.getAllUsers();
      expect(all.length).to.equal(3); // owner + moderator + user
      const usernames = all.map((u) => u.username);
      expect(usernames).to.include.members(["Owner", "Mod1", "User1"]);
    });

    it("owner cannot remove themselves", async function () {
      await expect(adminPanel.removeUser(owner.address)).to.be.revertedWith(
        "Cannot remove yourself"
      );
    });

    it("rejects invalid input on owner functions", async function () {
      await expect(
        adminPanel.promoteModerator(ethers.ZeroAddress, "X")
      ).to.be.revertedWith("Invalid address");
      await expect(
        adminPanel.registerUser(user.address, "")
      ).to.be.revertedWith("Username cannot be empty");
      await expect(
        adminPanel.updateSystemSetting("", "v")
      ).to.be.revertedWith("Key cannot be empty");
      await expect(
        adminPanel.removeUser(other.address)
      ).to.be.revertedWith("User does not exist");
    });
  });

  // ---------------------------------------------------------------------------
  // Moderator: can do moderator actions, reverts on owner-only
  // ---------------------------------------------------------------------------
  describe("Moderator functions", function () {
    beforeEach(async function () {
      await adminPanel.promoteModerator(moderator.address, "Mod1");
      await adminPanel.registerUser(user.address, "User1");
    });

    it("moderator can deactivateUser and reactivateUser", async function () {
      await expect(adminPanel.connect(moderator).deactivateUser(user.address))
        .to.emit(adminPanel, "UserStatusChanged")
        .withArgs(user.address, false, anyUint());
      expect(await adminPanel.isUserActive(user.address)).to.equal(false);

      await expect(adminPanel.connect(moderator).reactivateUser(user.address))
        .to.emit(adminPanel, "UserStatusChanged")
        .withArgs(user.address, true, anyUint());
      expect(await adminPanel.isUserActive(user.address)).to.equal(true);
    });

    it("moderator can approveUserContent and read getUserCount", async function () {
      await expect(
        adminPanel.connect(moderator).approveUserContent(user.address, "content-42")
      ).to.emit(adminPanel, "AuditLog");

      expect(await adminPanel.connect(moderator).getUserCount()).to.equal(3n);
    });

    it("moderator REVERTS on every owner-only function", async function () {
      await expectAccessRevert(
        adminPanel.connect(moderator).promoteModerator(other.address, "X")
      );
      await expectAccessRevert(
        adminPanel.connect(moderator).registerUser(other.address, "X")
      );
      await expectAccessRevert(
        adminPanel.connect(moderator).removeUser(user.address)
      );
      await expectAccessRevert(
        adminPanel.connect(moderator).updateSystemSetting("k", "v")
      );
      await expectAccessRevert(adminPanel.connect(moderator).getAllUsers());
    });

    it("moderator cannot deactivate themselves or the owner", async function () {
      await expect(
        adminPanel.connect(moderator).deactivateUser(moderator.address)
      ).to.be.revertedWith("Cannot deactivate yourself");
      await expect(
        adminPanel.connect(moderator).deactivateUser(owner.address)
      ).to.be.revertedWith("Cannot deactivate owner");
    });
  });

  // ---------------------------------------------------------------------------
  // Regular user: can do user actions, reverts on moderator- and owner-only
  // ---------------------------------------------------------------------------
  describe("Regular user functions", function () {
    beforeEach(async function () {
      await adminPanel.registerUser(user.address, "User1");
    });

    it("regular user can updateProfile", async function () {
      await expect(adminPanel.connect(user).updateProfile("NewName"))
        .to.emit(adminPanel, "AuditLog");
      expect((await adminPanel.users(user.address)).username).to.equal("NewName");
    });

    it("regular user can submitFeedback", async function () {
      await expect(
        adminPanel.connect(user).submitFeedback("Great app!")
      ).to.emit(adminPanel, "AuditLog");
    });

    it("regular user can getMyProfile", async function () {
      const profile = await adminPanel.connect(user).getMyProfile();
      expect(profile.username).to.equal("User1");
      expect(profile.userAddress).to.equal(user.address);
    });

    it("regular user REVERTS on moderator-only functions", async function () {
      await expectAccessRevert(
        adminPanel.connect(user).deactivateUser(owner.address)
      );
      await expectAccessRevert(
        adminPanel.connect(user).reactivateUser(owner.address)
      );
      await expectAccessRevert(
        adminPanel.connect(user).approveUserContent(owner.address, "c")
      );
      await expectAccessRevert(adminPanel.connect(user).getUserCount());
    });

    it("regular user REVERTS on owner-only functions", async function () {
      await expectAccessRevert(
        adminPanel.connect(user).promoteModerator(other.address, "X")
      );
      await expectAccessRevert(
        adminPanel.connect(user).registerUser(other.address, "X")
      );
      await expectAccessRevert(adminPanel.connect(user).removeUser(owner.address));
      await expectAccessRevert(
        adminPanel.connect(user).updateSystemSetting("k", "v")
      );
      await expectAccessRevert(adminPanel.connect(user).getAllUsers());
    });
  });

  // ---------------------------------------------------------------------------
  // No-role address reverts on every gated function
  // ---------------------------------------------------------------------------
  describe("No-role address", function () {
    it("getUserRole reports 'NONE'", async function () {
      expect(await adminPanel.getUserRole(noRole.address)).to.equal("NONE");
    });

    it("REVERTS on every gated function (owner, moderator, user tiers)", async function () {
      // owner tier
      await expectAccessRevert(
        adminPanel.connect(noRole).promoteModerator(other.address, "X")
      );
      await expectAccessRevert(
        adminPanel.connect(noRole).registerUser(other.address, "X")
      );
      await expectAccessRevert(adminPanel.connect(noRole).removeUser(owner.address));
      await expectAccessRevert(
        adminPanel.connect(noRole).updateSystemSetting("k", "v")
      );
      await expectAccessRevert(adminPanel.connect(noRole).getAllUsers());
      // moderator tier
      await expectAccessRevert(
        adminPanel.connect(noRole).deactivateUser(owner.address)
      );
      await expectAccessRevert(
        adminPanel.connect(noRole).reactivateUser(owner.address)
      );
      await expectAccessRevert(
        adminPanel.connect(noRole).approveUserContent(owner.address, "c")
      );
      await expectAccessRevert(adminPanel.connect(noRole).getUserCount());
      // user tier
      await expectAccessRevert(
        adminPanel.connect(noRole).updateProfile("X")
      );
      await expectAccessRevert(
        adminPanel.connect(noRole).submitFeedback("X")
      );
      await expectAccessRevert(adminPanel.connect(noRole).getMyProfile());
    });

    it("can still read public view functions", async function () {
      expect(await adminPanel.connect(noRole).isUserActive(owner.address)).to.equal(true);
      expect(await adminPanel.connect(noRole).getSystemSetting("missing")).to.equal("");
      expect(await adminPanel.connect(noRole).hasUserRole(owner.address, "OWNER")).to.equal(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Deactivated user reverts on submitFeedback / updateProfile
  // ---------------------------------------------------------------------------
  describe("Deactivated regular user", function () {
    beforeEach(async function () {
      await adminPanel.registerUser(user.address, "User1");
      // Owner deactivates via moderator-tier function (owner holds MODERATOR_ROLE).
      await adminPanel.deactivateUser(user.address);
      expect(await adminPanel.isUserActive(user.address)).to.equal(false);
    });

    it("REVERTS on submitFeedback when deactivated", async function () {
      await expect(
        adminPanel.connect(user).submitFeedback("hi")
      ).to.be.revertedWith("Account is deactivated");
    });

    it("REVERTS on updateProfile when deactivated", async function () {
      await expect(
        adminPanel.connect(user).updateProfile("NewName")
      ).to.be.revertedWith("Account is deactivated");
    });
  });

  // ---------------------------------------------------------------------------
  // Public helper views
  // ---------------------------------------------------------------------------
  describe("Public view helpers", function () {
    it("hasUserRole resolves named roles correctly", async function () {
      await adminPanel.promoteModerator(moderator.address, "Mod1");
      expect(await adminPanel.hasUserRole(moderator.address, "MODERATOR")).to.equal(true);
      expect(await adminPanel.hasUserRole(moderator.address, "OWNER")).to.equal(false);
      expect(await adminPanel.hasUserRole(owner.address, "REGULAR_USER")).to.equal(true);
      expect(await adminPanel.hasUserRole(owner.address, "BOGUS")).to.equal(false);
    });
  });
});

// Helper: match any uint timestamp arg in withArgs.
function anyUint() {
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  return anyValue;
}
