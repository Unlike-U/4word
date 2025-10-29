// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MessageStorage
 * @dev Store permanent encrypted messages on Base blockchain
 * @notice Each message costs gas to store permanently
 */
contract MessageStorage {
    struct Message {
        address sender;
        string senderUsername;
        string receiver; // empty string = public message
        string encryptedContent; // RSA + manual encrypted
        uint256 timestamp;
        bytes32 messageHash; // for verification
        bool rsaEncrypted;
        bool manuallyEncrypted;
    }

    // Message storage
    Message[] public messages;
    
    // Mapping from user address to their message IDs
    mapping(address => uint256[]) public userMessages;
    
    // Mapping from username to address (for username lookup)
    mapping(string => address) public usernameToAddress;
    
    // Events
    event MessageStored(
        uint256 indexed messageId,
        address indexed sender,
        string senderUsername,
        string receiver,
        uint256 timestamp
    );
    
    event UsernameRegistered(
        address indexed userAddress,
        string username
    );

    /**
     * @dev Register username to wallet address
     * @param username The username to register
     */
    function registerUsername(string memory username) external {
        require(bytes(username).length > 0, "Username cannot be empty");
        require(usernameToAddress[username] == address(0), "Username already taken");
        
        usernameToAddress[username] = msg.sender;
        emit UsernameRegistered(msg.sender, username);
    }

    /**
     * @dev Store a permanent message on the blockchain
     * @param senderUsername Sender's username
     * @param receiver Receiver username (empty for public)
     * @param encryptedContent The encrypted message content
     * @param rsaEncrypted Whether RSA encryption was used
     * @param manuallyEncrypted Whether manual encryption was used
     * @return messageId The ID of the stored message
     */
    function storeMessage(
        string memory senderUsername,
        string memory receiver,
        string memory encryptedContent,
        bool rsaEncrypted,
        bool manuallyEncrypted
    ) external returns (uint256) {
        require(bytes(encryptedContent).length > 0, "Message cannot be empty");
        require(bytes(senderUsername).length > 0, "Sender username required");
        
        // Create message hash for verification
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, encryptedContent, block.timestamp)
        );
        
        // Create new message
        Message memory newMessage = Message({
            sender: msg.sender,
            senderUsername: senderUsername,
            receiver: receiver,
            encryptedContent: encryptedContent,
            timestamp: block.timestamp,
            messageHash: messageHash,
            rsaEncrypted: rsaEncrypted,
            manuallyEncrypted: manuallyEncrypted
        });
        
        // Store message
        messages.push(newMessage);
        uint256 messageId = messages.length - 1;
        
        // Track user's messages
        userMessages[msg.sender].push(messageId);
        
        emit MessageStored(
            messageId,
            msg.sender,
            senderUsername,
            receiver,
            block.timestamp
        );
        
        return messageId;
    }

    /**
     * @dev Get total number of messages
     */
    function getMessageCount() external view returns (uint256) {
        return messages.length;
    }

    /**
     * @dev Get message by ID
     */
    function getMessage(uint256 messageId) external view returns (
        address sender,
        string memory senderUsername,
        string memory receiver,
        string memory encryptedContent,
        uint256 timestamp,
        bool rsaEncrypted,
        bool manuallyEncrypted
    ) {
        require(messageId < messages.length, "Message does not exist");
        Message memory msg = messages[messageId];
        return (
            msg.sender,
            msg.senderUsername,
            msg.receiver,
            msg.encryptedContent,
            msg.timestamp,
            msg.rsaEncrypted,
            msg.manuallyEncrypted
        );
    }

    /**
     * @dev Get all messages for a specific receiver
     * @param receiverUsername The username to get messages for
     * @return Array of message IDs
     */
    function getMessagesForReceiver(string memory receiverUsername) 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 count = 0;
        
        // Count matching messages
        for (uint256 i = 0; i < messages.length; i++) {
            if (
                keccak256(bytes(messages[i].receiver)) == keccak256(bytes(receiverUsername)) ||
                bytes(messages[i].receiver).length == 0 // public messages
            ) {
                count++;
            }
        }
        
        // Create result array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < messages.length; i++) {
            if (
                keccak256(bytes(messages[i].receiver)) == keccak256(bytes(receiverUsername)) ||
                bytes(messages[i].receiver).length == 0
            ) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get all public messages
     */
    function getPublicMessages() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < messages.length; i++) {
            if (bytes(messages[i].receiver).length == 0) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < messages.length; i++) {
            if (bytes(messages[i].receiver).length == 0) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Get messages sent by a specific address
     */
    function getUserMessages(address user) external view returns (uint256[] memory) {
        return userMessages[user];
    }

    /**
     * @dev Get address for username
     */
    function getAddressForUsername(string memory username) external view returns (address) {
        return usernameToAddress[username];
    }
}
