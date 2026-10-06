// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Forum {

    error NotFound(uint idx);
    error NotAuthor(address caller);

    event PostCreated(address indexed author, uint256 timestamp);
    event PostDeleted(uint256 indexed id, uint256 timestamp);
    event AllPostsDeleted(address indexed initiator, uint256 timestamp);
    event PostLiked(uint256 indexed id, address indexed user, bool liked);

    struct Post {
        string content;
        address author;
        uint256 timestamp;
        uint256 likesCount; 
    }


    address private owner;


    Post[] public posts;
    
    mapping(uint256 => mapping(address => bool)) public postLikes;

        constructor() {
        owner = msg.sender;
    }

    modifier isAuthor(uint id) {
        if (msg.sender != posts[id].author) {
            revert NotAuthor(msg.sender);
        }
        _; 
    }
    
    modifier onlyOwner() {
    require(msg.sender == owner, "Not the creator");
    _;
}   
    modifier postExists(uint id) {
        if (id >= posts.length || posts[id].author == address(0)) {
            revert NotFound(id);
        }
        _;
    }
    function get_owner() external view returns (address) {
    return owner;
}
    function create_post(string memory content) external {
        posts.push(Post({
            content: content,
            author: msg.sender,
            timestamp: block.timestamp,
            likesCount: 0
        }));

        emit PostCreated(msg.sender, block.timestamp);
    }

    function get_posts() external view returns (Post[] memory) {
        return posts;
    }

    function delete_post(uint id) postExists(id) isAuthor(id) external {
        delete posts[id];
        emit PostDeleted(id, block.timestamp);
    }
    
    function delete_all_posts() external onlyOwner {
    delete posts;
    emit AllPostsDeleted(msg.sender, block.timestamp);
}
    
    function toggle_like(uint id) postExists(id) external {
        bool isLiked = postLikes[id][msg.sender];
        if (isLiked) {
            postLikes[id][msg.sender] = false;
            posts[id].likesCount -= 1;
        } else {
            postLikes[id][msg.sender] = true;
            posts[id].likesCount += 1;
        }
        emit PostLiked(id, msg.sender, !isLiked);
    }

    function has_liked(uint id, address user) external view returns (bool) {
        return postLikes[id][user];
    }
}


