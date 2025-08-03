// signin.js

document.addEventListener('DOMContentLoaded', () => {
  const signInForm = document.getElementById('signinForm');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const googleBtn = document.getElementById('googleSignIn');

  // Handle user sign-in
  signInForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('signinUsername').value.trim();
    const password = document.getElementById('signinPassword').value;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(
      user => user.username === username && user.password === password
    );

    if (currentUser) {
      localStorage.setItem('activeUser', JSON.stringify(currentUser));
      alert(`Welcome back, @${currentUser.username}!`);
      window.location.href = 'profile.html';
    } else {
      alert('Invalid username or password. Please try again.');
    }
  });

  // Handle forgot password flow
  forgotPasswordLink?.addEventListener('click', (e) => {
    e.preventDefault();

    const email = prompt('Please enter the email address you used to register:');
    if (!email) return;

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (user) {
      alert(`Your password is: ${user.password}`); // In real-world use, never show passwords!
    } else {
      alert('No account found with that email address.');
    }
  });

  // Handle Google Sign In (simulation only)
  googleBtn?.addEventListener('click', () => {
    const googleUser = {
      username: 'googleuser',
      email: 'googleuser@example.com',
      password: 'oauth',
      isGoogle: true
    };

    localStorage.setItem('activeUser', JSON.stringify(googleUser));
    alert(`Signed in as ${googleUser.email} via Google.`);
    window.location.href = 'profile.html';
  });
});