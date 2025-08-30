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
    const headers = { Authorization: `token ${token}` };
    try {
      const [pullRes, commitRes, eventRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all`, {
          headers,
        }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/commits`, {
          headers,
        }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/events`, {
          headers,
        }),
      ]);

      const [pulls, commits, events] = await Promise.all([
        pullRes.json(),
        commitRes.json(),
        eventRes.json(),
      ]);

      const activities = [
        ...pulls.map((pr) => ({
          type: 'pull',
          id: pr.id,
          title: pr.title,
          url: pr.html_url,
          date: pr.created_at,
        })),
        ...commits.map((c) => ({
          type: 'commit',
          id: c.sha,
          title: c.commit.message.split('\n')[0],
          url: c.html_url,
          date: c.commit.author?.date || c.commit.committer?.date,
        })),
        ...events
          .filter(
            (e) =>
              e.type === 'PullRequestEvent' &&
              e.payload?.pull_request?.merged
          )
          .map((e) => ({
            type: 'merge',
            id: e.id,
            title: e.payload.pull_request.title,
            url: e.payload.pull_request.html_url,
            date: e.created_at,
          })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log('Activity loaded', activities);
      return activities;
    } catch (err) {
      console.error('Failed to load activity', err);
      return [];
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
