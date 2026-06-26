// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AdminPanel
 * @dev Permission-tiered admin panel with three roles: Owner, Moderator, Regular User.
 *      The owner is granted all three roles so it can perform every gated action.
 */
contract AdminPanel is AccessControl {
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant REGULAR_USER_ROLE = keccak256("REGULAR_USER_ROLE");

    struct User {
        address userAddress;
        string username;
        bool isActive;
        uint256 joinDate;
    }

    struct SystemSetting {
        string key;
        string value;
        uint256 lastModified;
    }

    mapping(address => User) public users;
    mapping(string => SystemSetting) public settings;
    address[] public userList;

    event UserAdded(address indexed user, string username, uint256 timestamp);
    event UserRemoved(address indexed user, uint256 timestamp);
    event UserRoleChanged(address indexed user, bytes32 indexed role, uint256 timestamp);
    event SettingChanged(string indexed key, string newValue, uint256 timestamp);
    event UserStatusChanged(address indexed user, bool isActive, uint256 timestamp);
    event AuditLog(string action, address indexed actor, string details, uint256 timestamp);

    modifier userExists(address _user) {
        require(users[_user].userAddress != address(0), "User does not exist");
        _;
    }

    constructor(address initialOwner) {
        // Owner gets DEFAULT_ADMIN_ROLE (can manage roles) plus all three tiers
        // so the owner can perform every gated action in the app.
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(OWNER_ROLE, initialOwner);
        _grantRole(MODERATOR_ROLE, initialOwner);
        _grantRole(REGULAR_USER_ROLE, initialOwner);

        users[initialOwner] = User({
            userAddress: initialOwner,
            username: "Owner",
            isActive: true,
            joinDate: block.timestamp
        });
        userList.push(initialOwner);

        emit UserAdded(initialOwner, "Owner", block.timestamp);
    }

    // ============ OWNER FUNCTIONS ============

    function promoteModerator(address account, string memory username)
        external
        onlyRole(OWNER_ROLE)
    {
        require(account != address(0), "Invalid address");
        require(bytes(username).length > 0, "Username cannot be empty");

        _grantRole(MODERATOR_ROLE, account);

        if (users[account].userAddress == address(0)) {
            users[account] = User({
                userAddress: account,
                username: username,
                isActive: true,
                joinDate: block.timestamp
            });
            userList.push(account);
            emit UserAdded(account, username, block.timestamp);
        }

        emit UserRoleChanged(account, MODERATOR_ROLE, block.timestamp);
        emit AuditLog("PROMOTE_MODERATOR", msg.sender, username, block.timestamp);
    }

    function registerUser(address account, string memory username)
        external
        onlyRole(OWNER_ROLE)
    {
        require(account != address(0), "Invalid address");
        require(bytes(username).length > 0, "Username cannot be empty");

        _grantRole(REGULAR_USER_ROLE, account);

        if (users[account].userAddress == address(0)) {
            users[account] = User({
                userAddress: account,
                username: username,
                isActive: true,
                joinDate: block.timestamp
            });
            userList.push(account);
            emit UserAdded(account, username, block.timestamp);
        }

        emit UserRoleChanged(account, REGULAR_USER_ROLE, block.timestamp);
        emit AuditLog("REGISTER_USER", msg.sender, username, block.timestamp);
    }

    function removeUser(address account)
        external
        onlyRole(OWNER_ROLE)
        userExists(account)
    {
        require(account != msg.sender, "Cannot remove yourself");

        users[account].isActive = false;
        _revokeRole(MODERATOR_ROLE, account);
        _revokeRole(REGULAR_USER_ROLE, account);

        emit UserRemoved(account, block.timestamp);
        emit UserStatusChanged(account, false, block.timestamp);
        emit AuditLog("REMOVE_USER", msg.sender, users[account].username, block.timestamp);
    }

    function updateSystemSetting(string memory key, string memory value)
        external
        onlyRole(OWNER_ROLE)
    {
        require(bytes(key).length > 0, "Key cannot be empty");

        settings[key] = SystemSetting({
            key: key,
            value: value,
            lastModified: block.timestamp
        });

        emit SettingChanged(key, value, block.timestamp);
        emit AuditLog("UPDATE_SETTING", msg.sender, key, block.timestamp);
    }

    function getAllUsers()
        external
        view
        onlyRole(OWNER_ROLE)
        returns (User[] memory)
    {
        User[] memory allUsers = new User[](userList.length);
        for (uint256 i = 0; i < userList.length; i++) {
            allUsers[i] = users[userList[i]];
        }
        return allUsers;
    }

    // ============ MODERATOR FUNCTIONS ============

    function deactivateUser(address account)
        external
        onlyRole(MODERATOR_ROLE)
        userExists(account)
    {
        require(account != msg.sender, "Cannot deactivate yourself");
        require(hasRole(OWNER_ROLE, account) == false, "Cannot deactivate owner");

        users[account].isActive = false;

        emit UserStatusChanged(account, false, block.timestamp);
        emit AuditLog("DEACTIVATE_USER", msg.sender, users[account].username, block.timestamp);
    }

    function reactivateUser(address account)
        external
        onlyRole(MODERATOR_ROLE)
        userExists(account)
    {
        users[account].isActive = true;

        emit UserStatusChanged(account, true, block.timestamp);
        emit AuditLog("REACTIVATE_USER", msg.sender, users[account].username, block.timestamp);
    }

    function approveUserContent(address account, string memory contentId)
        external
        onlyRole(MODERATOR_ROLE)
    {
        emit AuditLog("APPROVE_CONTENT", msg.sender, contentId, block.timestamp);
    }

    function getUserCount()
        external
        view
        onlyRole(MODERATOR_ROLE)
        returns (uint256)
    {
        return userList.length;
    }

    // ============ REGULAR USER FUNCTIONS ============

    function submitFeedback(string memory feedback)
        external
        onlyRole(REGULAR_USER_ROLE)
    {
        require(bytes(feedback).length > 0, "Feedback cannot be empty");
        require(users[msg.sender].isActive, "Account is deactivated");

        emit AuditLog("SUBMIT_FEEDBACK", msg.sender, feedback, block.timestamp);
    }

    function updateProfile(string memory newUsername)
        external
        onlyRole(REGULAR_USER_ROLE)
        userExists(msg.sender)
    {
        require(bytes(newUsername).length > 0, "Username cannot be empty");
        require(users[msg.sender].isActive, "Account is deactivated");

        users[msg.sender].username = newUsername;

        emit AuditLog("UPDATE_PROFILE", msg.sender, newUsername, block.timestamp);
    }

    function getMyProfile()
        external
        view
        onlyRole(REGULAR_USER_ROLE)
        returns (User memory)
    {
        return users[msg.sender];
    }

    // ============ PUBLIC VIEW FUNCTIONS (anyone) ============

    function hasUserRole(address account, string memory roleName)
        external
        view
        returns (bool)
    {
        if (keccak256(abi.encodePacked(roleName)) == keccak256(abi.encodePacked("OWNER"))) {
            return hasRole(OWNER_ROLE, account);
        } else if (keccak256(abi.encodePacked(roleName)) == keccak256(abi.encodePacked("MODERATOR"))) {
            return hasRole(MODERATOR_ROLE, account);
        } else if (keccak256(abi.encodePacked(roleName)) == keccak256(abi.encodePacked("REGULAR_USER"))) {
            return hasRole(REGULAR_USER_ROLE, account);
        }
        return false;
    }

    function getUserRole(address account)
        external
        view
        returns (string memory)
    {
        if (hasRole(OWNER_ROLE, account)) {
            return "OWNER";
        } else if (hasRole(MODERATOR_ROLE, account)) {
            return "MODERATOR";
        } else if (hasRole(REGULAR_USER_ROLE, account)) {
            return "REGULAR_USER";
        }
        return "NONE";
    }

    function getSystemSetting(string memory key)
        external
        view
        returns (string memory)
    {
        return settings[key].value;
    }

    function isUserActive(address account)
        external
        view
        returns (bool)
    {
        return users[account].isActive;
    }
}
