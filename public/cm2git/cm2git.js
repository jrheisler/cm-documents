document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');

  function createInput(key, placeholder, type = 'text') {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.value = localStorage.getItem(key) || '';
    input.addEventListener('input', () => {
      localStorage.setItem(key, input.value);
    });
    return input;
  }

  async function loadActivity(owner, repo, token) {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('Activity loaded', data);
    } catch (err) {
      console.error('Failed to load activity', err);
    }
  }

  function bootstrap() {
    const ownerInput = createInput('cm2git-owner', 'Owner');
    const repoInput = createInput('cm2git-repo', 'Repo');
    const tokenInput = createInput('cm2git-token', 'Personal Access Token', 'password');

    const button = document.createElement('button');
    button.textContent = 'Load Activity';
    button.addEventListener('click', () => {
      const owner = ownerInput.value.trim();
      const repo = repoInput.value.trim();
      const token = tokenInput.value.trim();
      if (!owner || !repo || !token) {
        console.warn('Owner, repo, and token are required');
        return;
      }
      loadActivity(owner, repo, token);
    });

    app.appendChild(ownerInput);
    app.appendChild(repoInput);
    app.appendChild(tokenInput);
    app.appendChild(button);
  }

  if (app) {
    bootstrap();
  }
});
