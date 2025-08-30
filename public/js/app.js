// === Reactive header title ===
const headerTitleStream = new Stream("Documents");
const expandedCategories = new Stream({});

// === Document grid container ===
function documentListContainer(documentsStream, expandedStream = expandedCategories, themeStream = currentTheme, keys = ['title', 'status', 'meta', 'filename', 'lastUpdated', 'download']) {
  return container([
    groupedDocumentGrid(documentsStream, expandedStream, themeStream, keys)
  ], { padding: '1rem' });
}

function settingsModal(showModalStream, themeStream = currentTheme) {
  // Retrieve the current values from localStorage or set default values
  const githubUsername = localStorage.getItem('githubUsername') || '';
  const githubTokenEncoded = localStorage.getItem('githubToken') || '';
  const repoOwner = localStorage.getItem('repoOwner') || '';
  const repoName = localStorage.getItem('repoName') || '';
  const repoPath = localStorage.getItem('repoPath') || '';

  // Streams for form data with initial values
  const githubUsernameStream = new Stream(githubUsername);
  const githubTokenStream = new Stream(base64Decode(githubTokenEncoded));  // Decode token to display in the form
  const repoOwnerStream = new Stream(repoOwner);
  const repoNameStream = new Stream(repoName);
  const repoPathStream = new Stream(repoPath);

  return conditional(showModalStream, () => {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';

    // Create modal container
    const modal = document.createElement('div');
    modal.style.padding = '1.5rem';
    modal.style.backgroundColor = '#fff';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    modal.style.width = '90%';
    modal.style.maxWidth = '500px';
    modal.style.position = 'relative';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '0.5rem';
    closeBtn.style.right = '0.5rem';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => showModalStream.set(false));
    modal.appendChild(closeBtn);

    // Create form inputs
    const content = column([container(
      [
      row([editText(githubUsernameStream, { placeholder: 'GitHub Username', margin: '0.5rem 0' }, themeStream), spacer()]),
      row([editText(githubTokenStream, {type: 'password', placeholder: 'GitHub Token', margin: '0.5rem 0' }, themeStream), spacer()]),
      row([editText(repoOwnerStream, { placeholder: 'Repository Owner', margin: '0.5rem 0' }, themeStream), spacer()]),
      row([editText(repoNameStream, { placeholder: 'Repository Name', margin: '0.5rem 0' }, themeStream), spacer()]),   
      (() => {
        const isSaving = new Stream(false);
        const saveLabel = derived(isSaving, val => val ? "Saving..." : "Save");

        return reactiveButton(saveLabel, async () => {
          if (isSaving.get()) return;
          isSaving.set(true);

          // Encode the GitHub token before saving
          const githubTokenEncoded = base64Encode(githubTokenStream.get());

          // Save to localStorage
          localStorage.setItem('githubUsername', githubUsernameStream.get());
          localStorage.setItem('githubToken', githubTokenEncoded);
          localStorage.setItem('repoOwner', repoOwnerStream.get());
          localStorage.setItem('repoName', repoNameStream.get());
          localStorage.setItem('repoPath', repoNameStream.get());

          // Close modal after saving
          showModalStream.set(false);
          isSaving.set(false);
        }, { margin: '0.5rem 0', rounded: true }, themeStream);
      }
    )()
    ], {})]);

    modal.appendChild(content);
    overlay.appendChild(modal);

    // Close modal when clicking outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) showModalStream.set(false);
    });

    // Close modal when pressing Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') showModalStream.set(false);
    };
    document.addEventListener('keydown', escHandler);

    // Cleanup event listeners when modal is removed
    const observer = new MutationObserver(() => {
      if (!document.body.contains(overlay)) {
        document.removeEventListener('keydown', escHandler);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return overlay;
  });
}



// === App entry ===
document.addEventListener('DOMContentLoaded', async () => {
  // Retrieve values from localStorage
  githubUsername = localStorage.getItem('githubUsername');
  githubTokenEncoded = localStorage.getItem('githubToken');
  repoOwner = localStorage.getItem('repoOwner');
  repoName = localStorage.getItem('repoName');
  repoPath = localStorage.getItem('repoPath');

  githubToken = base64Decode(githubTokenEncoded);


  // Apply theme
  currentTheme.subscribe(theme => applyThemeToPage(theme));

  // Streams
  const documentsStream = new Stream([]);
  const showFormStream = new Stream(false);
  const loadingStream = new Stream(false);
  const errorStream = new Stream('');
  const loadingMessageStream = derived(loadingStream, v => v ? 'Loading...' : '');
  const knownCategoriesStream = derived(documentsStream, docs => {
    const set = new Set(docs.map(doc => doc.category?.trim()).filter(Boolean));
    return Array.from(set).sort();
  });

  // 🟡 Fetch index.json and hydrate the stream
  loadingStream.set(true);
  try {
    const indexData = await fetchDocumentIndexFromGitHub();
    documentsStream.set(indexData); // Hydrate the grid with document metadata
  } catch (err) {
    console.warn('Using empty index as fallback.', err);
    errorStream.set(err.message || 'Failed to fetch documents. Please verify your token and repository.');
    documentsStream.set([]); // Fallback: start with empty list
  } finally {
    loadingStream.set(false);
  }

  const showModalStream = new Stream(false);
  const userAvatarStream = new Stream('doc.webp');
  const userAvatar = avatarDropdown(userAvatarStream, { width: '50px', height: '50px', rounded: true }, themeStream = currentTheme, [
    { label: 'Profile', onClick: () => showToast('Profile clicked') },
    { 
  label: 'Settings', 
      onClick: () => {
        showModalStream.set(true);        
      }
    },
    { label: 'Logout', onClick: () => showConfirmationDialog('Are you sure you want to log out?') },
  ]);

  // UI
  document.body.appendChild(settingsModal(showModalStream, currentTheme));
 

  document.body.appendChild(
    uploadFormContainer(documentsStream, showFormStream, knownCategoriesStream)
  );

  document.body.appendChild(
    column([
      container(
        row([
          userAvatar,          
          reactiveButton(new Stream("Upload Document"), () => {
            showFormStream.set(true);
          }, {
            rounded: true,
            margin: '1rem 0',
            size: '1.1rem'
          }),
          themedThemeSelector()
        ])
      ),
      reactiveText(loadingMessageStream, { align: 'center' }),
      reactiveText(errorStream, { color: 'red', margin: '0.5rem 0' }),
      documentListContainer(documentsStream, expandedCategories, currentTheme, ['title', 'status', 'meta', 'filename', 'lastUpdated', 'download'])
    ])
  );
});

