const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');

// Show register form
function showRegister() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

// Register user
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  alert(data.message);
  if (response.ok) {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  }
});

// Login user
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (response.ok) {
    token = data.token;
    localStorage.setItem('token', token);
    window.location.href = 'profile.html';
  } else {
    alert(data.message);
  }
});

// Create post
document.getElementById('post-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const post = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    price: document.getElementById('price').value,
    location: document.getElementById('location').value
  };
  const response = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(post)
  });
  const data = await response.json();
  alert(data.message);
  if (response.ok) {
    window.location.href = 'buy.html';
  }
});

// Load posts on buy page
async function loadPosts() {
  const response = await fetch(`${API_URL}/posts`);
  const posts = await response.json();
  const container = document.getElementById('posts-container');
  if (container) {
    container.innerHTML = posts.map(post => `
      <div class="post">
        <h3>${post.title}</h3>
        <p>${post.description}</p>
        <p>Price: $${post.price}</p>
        <p>Location: ${post.location}</p>
        <p>Posted by: ${post.username}</p>
      </div>
    `).join('');
  }
}

// Load user profile
async function loadProfile() {
  const response = await fetch(`${API_URL}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (response.ok) {
    const data = await response.json();
    document.getElementById('username').textContent = data.username;
    const postsContainer = document.getElementById('user-posts');
    postsContainer.innerHTML = data.posts.map(post => `
      <div class="post">
        <h3>${post.title}</h3>
        <p>${post.description}</p>
        <p>Price: $${post.price}</p>
        <p>Location: ${post.location}</p>
      </div>
    `).join('');
  } else {
    window.location.href = 'login.html';
  }
}

// Initialize pages
if (window.location.pathname.includes('buy.html')) {
  loadPosts();
}
if (window.location.pathname.includes('profile.html')) {
  loadProfile();
}