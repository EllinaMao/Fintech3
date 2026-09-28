// import { abi } from './abi.js';

// const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const contractAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";


let current_account;
let web3;
let contract;



document.addEventListener('DOMContentLoaded', ()=>{
    const connection_btn = document.getElementById('connection_btn');
    if(connection_btn) connection_btn.addEventListener('click', connectWallet);

    const make_post_btn = document.getElementById('make_post_btn');
    if(make_post_btn) make_post_btn.addEventListener('click', make_post);

        //ИЗМЕНЕННО
    const delete_all_btn = document.getElementById('delete_all_btn');
    if(delete_all_btn) delete_all_btn.addEventListener('click', delete_all_posts);

    if(window.ethereum){
        console.log(`[INFO]: [${Date.now()}] Web3 provider detected`);

        web3 = new Web3(window.ethereum);//есои передать адресс хардхед - не будет действий с кошельком.
        //поэтому мы передали кошелек и он выступает как подписчик.

        //инициализация контракта с адресом и ABI
        contract = new web3.eth.Contract(abi, contractAddress);


        window.ethereum.on("accountsChanged", (accounts)=>{
            if(accounts.length === 0){
                alert(`[ERROR]: [${Date.now()}] No accounts available`);
                current_account = undefined;
                return; 
            }

            current_account = accounts[0] || undefined;
            console.log(`[INFO]: [${Date.now()}] Accounts changed: ${current_account}`);
            enterToDapp();
        }); 

        contract.events.PostCreated({fromBlock: 'latest'}).on('data', async (event) => {
            console.log("Post created. ", event.returnValues);
            await get_posts();
        });
        //ИЗМЕНЕННО
        contract.events.AllPostsDeleted({fromBlock: 'latest'}).on('data', async (event) => {
        console.log(`[LOG]: [${Date.now()}] All posts deleted.`);
        await get_posts();
        });
        //ИЗМЕНЕННО
        contract.events.PostDeleted({fromBlock: 'latest'}).on('data', async (event) => {
            console.log(`[LOG]: [${Date.now()}] Post deleted.`);
            await get_posts();
        });
    }
});




const connectWallet = async(e)=>{
    if(!window.ethereum){
        alert("Please install web3 provider");
        return;
    }
    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        if(!accounts || !Array.isArray(accounts)){
            alert(`[ERROR]: [${Date.now()}] Accounts not found`);
            return;
        }
        if(accounts.length === 0 ){
            alert(`[ERROR]: [${Date.now()}] Accounts not found`)
            return;
        }
        current_account = accounts[0];
        e.target.hidden = true;
        enterToDapp();
    } catch (error) {
        alert(`[ERROR]: [${Date.now()}] Connect to DApp error. See logs`);
        console.error(`[ERROR]: [${Date.now()}] Connect error: ${error}`);
    }
}

const enterToDapp = ()=>{
    const account_lbl = document.getElementById('account_lbl');
    account_lbl.hidden = false;
    account_lbl.textContent = current_account;
    account_lbl.style.color = 'darkgreen';

    d_app();
    
}

const d_app = () => {
    const dapp = document.getElementById('dapp');
    if (dapp){
    dapp.hidden = false;

    const post_text = document.getElementById('post_text');
    post_text.value = '';
    }
}

const make_post = async()=>{
    try{
        const post_text = document.getElementById('post_text');
        if (!post_text.value) {
            alert(`[ERROR]: [${Date.now()}] Post cannot be empty`);
            return;
        };

        const message = post_text.value;
        await contract.methods.create_post(message).send({ from: current_account });
        post_text.value = '';

        const posts = await contract.methods.get_posts().call();
        console.log(`[INFO]: [${Date.now()}] Posts: `, posts);
    }
    catch (error){
        // alert(`[ERROR]: [${Date.now()}] Make post error. See logs`);
        console.error(`[ERROR]: [${Date.now()}] Make post error: ${error}`);
    }
}

const get_posts = async()=>{
    try{
        const posts = await contract.methods.get_posts().call();
        render_posts(posts);
        if (posts.length === 0) {
            console.log(`[INFO]: [${Date.now()}] No posts found`);
            
        }
        else {
            console.log(`[INFO]: [${Date.now()}] Posts found: ${posts.length}`);
        }   
    }
    catch (error){
        console.error(`[ERROR]: [${Date.now()}] Get posts error: ${error}`);
    }
}

const render_posts = async(posts)=>{
    const post_list = document.getElementById('post_list');
    

    while (post_list.firstChild) {
        post_list.removeChild(post_list.firstChild);
    }

    //Измененно
    const empty_author = "0x0000000000000000000000000000000000000000";
    
    if (posts.length === 0 || posts.every(post => post.author === empty_author)) {
    const p = document.createElement('p');
    p.textContent = "Nothing here yet";
    post_list.appendChild(p);
    return;
    }

    posts.forEach((post, idx) => {
        if (post.author === empty_author) return;
        post_list.appendChild(create_post_element(post, idx));
    });

}
const create_post_element = (post, id) => {
    const div = document.createElement('div');
    
    const author = document.createElement('p');
    author.textContent = `Author: ${post.author}`;

    const content = document.createElement('p');
    content.textContent = `Content: ${post.content}`;

    const timestamp = document.createElement('p');

    const date = new Date(Number(post.timestamp) * 1000);
    timestamp.textContent = `Created at: ${date.toLocaleString()}`;

    const likes = document.createElement('p');
    likes.textContent = `💕: ${post.like}`;




    div.appendChild(author);
    div.appendChild(content);
    div.appendChild(timestamp);
    div.appendChild(likes);


    //ИЗМЕНЕННО
    div.appendChild(delete_button(id));

    div.appendChild(document.createElement('hr'));
    

    return div;
}

    //ИЗМЕНЕННО
const delete_button = (id) => {
    const button = document.createElement('button');
    button.textContent = "✖️";
    button.onclick = () => delete_func(id);
    return button;
}

    //ИЗМЕНЕННО
const delete_func = async(id) => {
    try{
        await contract.methods.delete_post(id).send({ from: current_account });

        console.log(`[INFO]: [${Date.now()}] Post deleted: ${id}`);
    }
    catch (error){
        console.error(`[ERROR]: [${Date.now()}] Delete post error: ${error}`);
    }
}
//ИЗМЕНЕННО
const delete_all_posts = async() => {
    try{
        await contract.methods.delete_all_posts().send({ from: current_account });
    }
    catch (error){
        console.error(`[ERROR]: [${Date.now()}] Delete all posts error: ${error}`);
    }
}