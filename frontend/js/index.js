const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

let current_account;
let web3;
let contract;
let current_filter_author = null; 

document.addEventListener('DOMContentLoaded', ()=>{
    const connection_btn = document.getElementById('connection_btn');
    if(connection_btn) connection_btn.addEventListener('click', connectWallet);

    const make_post_btn = document.getElementById('make_post_btn');
    if(make_post_btn) make_post_btn.addEventListener('click', make_post);

    const delete_all_btn = document.getElementById('delete_all_btn');
    if(delete_all_btn) delete_all_btn.addEventListener('click', delete_all_posts);

    const filter_btn = document.getElementById('filter_btn');
    if(filter_btn) filter_btn.addEventListener('click', apply_filter);

    const show_all_btn = document.getElementById('show_all_btn');
    if(show_all_btn) show_all_btn.addEventListener('click', clear_filter);

    if(window.ethereum){
        web3 = new Web3(window.ethereum);
        contract = new web3.eth.Contract(abi, contractAddress);

        window.ethereum.on("accountsChanged", (accounts)=>{
            if(accounts.length === 0){
                alert("Нет доступных аккаунтов");
                current_account = undefined;
                return; 
            }
            current_account = accounts[0];
            enterToDapp();
        }); 


        contract.events.PostCreated({fromBlock: 'latest'}).on('data', async () => await get_posts());
        contract.events.AllPostsDeleted({fromBlock: 'latest'}).on('data', async () => await get_posts());
        contract.events.PostDeleted({fromBlock: 'latest'}).on('data', async () => await get_posts());
        contract.events.PostLiked({fromBlock: 'latest'}).on('data', async () => await get_posts());
    }
});

const connectWallet = async(e)=>{
    if(!window.ethereum) return alert("Пожалуйста, установите Web3 провайдер");
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if(!accounts || accounts.length === 0 ) return;
        
        current_account = accounts[0];
        e.target.hidden = true;
        enterToDapp();
    } catch (error) {
        console.error("Ошибка подключения:", error);
    }
}

const enterToDapp = async () => {
    const account_lbl = document.getElementById('account_lbl');
    account_lbl.hidden = false;
    account_lbl.textContent = `Подключен: ${current_account}`;
    account_lbl.style.color = '#28a745';

    document.getElementById('dapp').hidden = false;
    
    await check_owner_status();
    
    get_posts();
}

const check_owner_status = async () => {
    try {
        const owner_address = await contract.methods.get_owner().call();
        const delete_all_btn = document.getElementById('delete_all_btn');
        
        if (current_account.toLowerCase() === owner_address.toLowerCase()) {
            delete_all_btn.style.display = 'inline-block'; 
        } else {
            delete_all_btn.style.display = 'none'; 
        }
    } catch (error) {
        console.error("Ошибка при проверке владельца контракта:", error);
    }
}

const apply_filter = () => {
    const input_val = document.getElementById('filter_author_input').value.trim().toLowerCase();
    if (input_val) {
        current_filter_author = input_val;
        get_posts();
    }
}

const clear_filter = () => {
    document.getElementById('filter_author_input').value = '';
    current_filter_author = null;
    get_posts();
}

const make_post = async()=>{
    try{
        const post_text = document.getElementById('post_text');
        if (!post_text.value) return;

        await contract.methods.create_post(post_text.value).send({ from: current_account });
        post_text.value = '';
    }
    catch (error){
        console.error("Ошибка при создании поста:", error);
    }
}

const get_posts = async()=>{
    try{
        let posts = await contract.methods.get_posts().call();
        render_posts(posts);
    }
    catch (error){
        console.error("Ошибка при получении постов:", error);
    }
}
const render_posts = async(posts)=>{
    const empty_author = "0x0000000000000000000000000000000000000000";
    
    let valid_posts = [];
    for (let i = 0; i < posts.length; i++) {
        let post = posts[i];
        if (post.author === empty_author) continue;

        if (current_filter_author && post.author.toLowerCase() !== current_filter_author) {
            continue;
        }
        
        valid_posts.push({ data: post, id: i });
    }

    const elements = [];
    for (let i = valid_posts.length - 1; i >= 0; i--) {
        const postElement = await create_post_element(valid_posts[i].data, valid_posts[i].id);
        elements.push(postElement);
    }

    const post_list = document.getElementById('post_list');
    post_list.innerHTML = ''; 

    if (elements.length === 0) {
        post_list.innerHTML = '<p>Здесь пока ничего нет.</p>';
        return;
    }

    elements.forEach(el => post_list.appendChild(el));
}

const create_post_element = async (post, id) => {
    const div = document.createElement('div');
    div.className = 'post-card';
    
    const date = new Date(Number(post.timestamp) * 1000);
    
    const header = document.createElement('div');
    header.className = 'post-header';
    header.textContent = `Автор: ${post.author} | Создано: ${date.toLocaleString()}`;

    const content = document.createElement('div');
    content.className = 'post-content';
    content.textContent = post.content;

    const actions = document.createElement('div');
    actions.className = 'post-actions';

    const hasLiked = await contract.methods.has_liked(id, current_account).call();

    const likeBtn = document.createElement('button');
    likeBtn.className = hasLiked ? 'like-btn liked' : 'like-btn';
    likeBtn.textContent = hasLiked ? '🤍' : '❤️';
    likeBtn.onclick = () => toggle_like(id);

    const likesCount = document.createElement('span');
    likesCount.className = 'likes-count';
    likesCount.textContent = `❤️: ${post.likesCount}`;

    actions.appendChild(likeBtn);
    actions.appendChild(likesCount);

    if (post.author.toLowerCase() === current_account.toLowerCase()) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'danger';
        deleteBtn.textContent = "Удалить";
        deleteBtn.style.marginLeft = 'auto';
        deleteBtn.onclick = () => delete_func(id);
        actions.appendChild(deleteBtn);
    }

    div.appendChild(header);
    div.appendChild(content);
    div.appendChild(actions);

    return div;
}

const toggle_like = async(id) => {
    try {
        await contract.methods.toggle_like(id).send({ from: current_account });
    } catch (error) {
        console.error("Ошибка при постановке лайка:", error);
    }
}

const delete_func = async(id) => {
    try {
        await contract.methods.delete_post(id).send({ from: current_account });
    } catch (error) {
        console.error("Ошибка при удалении поста:", error);
    }
}

const delete_all_posts = async() => {
    if(!confirm("Вы уверены, что хотите удалить ВСЕ посты?")) return;
    try {
        await contract.methods.delete_all_posts().send({ from: current_account });
    } catch (error) {
        console.error("Ошибка при удалении всех постов:", error);
    }
}