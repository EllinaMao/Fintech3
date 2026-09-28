// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Forum {

    //ИЗМЕНЕННО
    error NotFound(uint idx);
    error NotAuthor(address caller);

    event PostCreated(address indexed author, uint256 timestamp);
    
    //ИЗМЕНЕННО
    event PostDeleted(uint256 indexed id, uint256 timestamp);
    //ИЗМЕНЕННО
    event AllPostsDeleted(address indexed initiator, uint256 timestamp);


    struct Post {
        string content;
        address author;
        uint256 timestamp;
        uint like;

    }

    Post[] posts;


    //ИЗМЕНЕННО
    modifier isAuthor(uint id) {
        if (msg.sender != posts[id].author) {
            revert NotAuthor(msg.sender);
        }
        _; 
    }
    //ИЗМЕНЕННО
    modifier postExists(uint id) {
        if (id >= posts.length) {
            revert NotFound(id);
        }
        _;
    }
    
    function create_post(string memory content) external {
        posts.push(Post({
            content: content,
            author: msg.sender,
            timestamp: block.timestamp,
            like: 0
        }));

        emit PostCreated(msg.sender, block.timestamp);
    }

    function get_posts() external view returns (Post[] memory) {
        return posts;
    }

    function get_post(uint id) postExists(id) external view returns (Post memory) {
        return posts[id];
    }

    //ИЗМЕНЕННО
    function delete_post(uint id) postExists(id) isAuthor(id) external {
        //звучит как что на js дешевле не отображать пустые посты, чем удалять их с контракта, если честно
        delete posts[id];
        emit PostDeleted(id, block.timestamp);
    }
    
    //ИЗМЕНЕННО
    function delete_all_posts() external {
        delete posts;
        emit AllPostsDeleted(msg.sender, block.timestamp);
    }
    

   /**
 * Додайте видалення постів:
 * окремих та всіх
 * На фронтенді додати відповідні кнопки, при видаленні має спрацювати подія щщо пост або пости видалені, необхідно оновити список постів на фронтенді.
 *
 */
    

}