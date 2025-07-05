// Retrieve values from localStorage
var githubUsername = '';
var githubTokenEncoded = '';
var githubToken = '';
var repoOwner = '';
var repoName = '';
var repoPath = '';


// Base64 encode function (obfuscation)
function base64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function base64Decode(str) {
  if (!str) return '';  // Return empty string safely if value is null or empty
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.warn('Failed to decode base64:', e);
    return '';
  }
}


async function fetchDocumentIndexFromGitHub() {
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoPath}/index.json`, {
    headers: {
      'Authorization': `token ${githubToken}`
    }
  });

  if (!response.ok) {
    console.error("Failed to fetch index.json:", await response.text());
    throw new Error("Unable to fetch document index from GitHub.");
  }

  const result = await response.json(); // ✅ This works with metadata response
  const decodedContent = atob(result.content); // Base64 → string
  return JSON.parse(decodedContent);           // string → object[]
}


// Function to get the index file from GitHub repo (to update the document index)
async function fetchDocumentIndex() {
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${repoPath}/index.json`, {
    headers: {
      'Authorization': `token ${githubToken}`,
    }
  });
  const data = await response.json();
  if (data.content) {
    const decodedData = atob(data.content);  // Decoding from base64
    return JSON.parse(decodedData);
  }
  return [];
}

// Function to upload a file to GitHub and get the file URL
// Function to upload a file to GitHub and get the file URL
async function uploadFileToGitHub(file, title) {
  const base64Content = await getBase64(file); // Get the Base64 string of the file
  const filePath = `${repoPath}/${encodeURIComponent(title)}`;

  try {
    // Check if the file already exists to get the sha for updates
    const fileExists = await checkIfFileExists(filePath);

    let sha = null;
    if (fileExists) {
      // If the file exists, get the current file's sha
      sha = fileExists.sha;
    }

    // Make the request to GitHub API
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload document: ${title}`,
        content: base64Content, // Base64 encoded file content
        sha: sha, // Add sha for existing files
      })
    });

    // Check if the response is OK
    if (response.ok) {
      const data = await response.json();
      return data.content.download_url;
    } else {
      const errorData = await response.json();
      console.error("Error uploading file:", errorData); // Log the error for debugging
      throw new Error(`GitHub API Error: ${errorData.message}`);
    }
  } catch (error) {
    console.error("Error in uploadFileToGitHub:", error); // Log the full error
    throw error;
  }
}

// Function to check if the file already exists in the GitHub repository
async function checkIfFileExists(filePath) {
  const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
    method: 'GET',
    headers: {
      'Authorization': `token ${githubToken}`,
    }
  });

  if (response.ok) {
    const data = await response.json();
    return data; // File exists, return file data including sha
  } else if (response.status === 404) {
    return null; // File doesn't exist
  } else {
    const errorData = await response.json();
    console.error("Error checking file:", errorData);
    throw new Error("Error checking file existence");
  }
}


// Helper function to convert file to base64
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get Base64 without the prefix
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file); // Convert the file to Base64
  });
}


// Function to update the document index (index.json) on GitHub
async function updateDocumentIndex(newDoc) {
  const filePath = `${repoPath}/index.json`;
  let existingIndex = [];
  let sha = null;

  // Step 1: Try to fetch the current index and sha
  try {
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${githubToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      sha = data.sha; // Required for updating
      const decoded = atob(data.content);
      existingIndex = JSON.parse(decoded);
    }
  } catch (err) {
    console.warn("Could not fetch index.json, will create a new one.");
  }

  // Step 2: Merge or replace entry in index
  const index = existingIndex.findIndex(doc => doc.title === newDoc.title);
  if (index >= 0) {
    existingIndex[index] = newDoc;
  } else {
    existingIndex.push(newDoc);
  }

  // Step 3: Upload updated index
  const updatedContent = btoa(JSON.stringify(existingIndex, null, 2));

  const putResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${githubToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Update index.json with ${newDoc.title}`,
      content: updatedContent,
      ...(sha && { sha }), // Only include sha if updating existing file
    })
  });

  if (!putResponse.ok) {
    const error = await putResponse.json();
    console.error("Error updating index:", error);
    throw new Error("Failed to update index.json");
  }
}

// === Upload toggle button ===
function uploadToggleContainer(showFormStream) {
  return container([
    reactiveButton(new Stream("Upload Document"), () => {
      showFormStream.set(!showFormStream.get());
    }, {
      rounded: true,
      margin: '1rem 0',
      size: '1.1rem'
    })
  ], { align: 'center' ,
    border: '0px'
  });
}

// === Upload form container ===
function uploadFormContainer(documentsStream, showFormStream, knownCategoriesStream, themeStream = currentTheme) {
  const titleStream = new Stream('');
  const statusStream = new Stream('');
  const fileStream = new Stream(null);
  const categoryStream = new Stream('');
  const metaStream = new Stream('');
  

  fileStream.subscribe(file => {
    if (file) titleStream.set(file.name);
  });

  return conditional(showFormStream, () => {
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

    const modal = document.createElement('div');
    modal.style.padding = '1.5rem';
    modal.style.backgroundColor = '#fff';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
    modal.style.width = '90%';
    modal.style.maxWidth = '500px';
    modal.style.position = 'relative';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '0.5rem';
    closeBtn.style.right = '0.5rem';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => showFormStream.set(false));
    modal.appendChild(closeBtn);

    const content = container([
      fileInput(fileStream, { margin: '0.5rem 0' }, themeStream),
      editText(titleStream, { placeholder: 'Title', margin: '0.5rem 0' }, themeStream),
      dropdownStream(statusStream, {
        choices: ['draft', 'under review', 'approved', 'final', 'archived'],
        margin: '0.5rem 0'
      }, themeStream),
      editableDropdown(categoryStream, knownCategoriesStream, themeStream),
      editText(metaStream, { placeholder: 'Meta data', margin: '0.5rem 0' }, themeStream),
      // === Save Button Handler ===
       // === Save Button Handler ===
    (() => {
    const isSaving = new Stream(false);
    const saveLabel = derived(isSaving, val => val ? "Saving..." : "Save");

    return reactiveButton(saveLabel, async () => {
        if (isSaving.get()) return;
        isSaving.set(true);

        const existing = documentsStream.get().find(doc => doc.title === titleStream.get());
        // Inside your async save handler...

        if (existing) {
          const confirmReplace = await showConfirmationDialog(
            "A document with this title already exists. Uploading a new version?",
            themeStream // Pass your themeStream
          );
          if (!confirmReplace) {
            isSaving.set(false);
            return;
          }
        }


        const file = fileStream.get();
        if (!file) {
        alert("No file selected");
        isSaving.set(false);
        return;
        }

        const title = titleStream.get().trim();
        const docs = documentsStream.get();
        const index = docs.findIndex(doc => doc.title === title);
        const now = new Date().toISOString();

        const newDoc = {
        meta: metaStream.get(),
        category: categoryStream.get(),
        title,
        status: statusStream.get(),
        filename: file.name,
        createdAt: index >= 0 ? docs[index].createdAt : now,
        lastUpdated: now,
        id: title,
        };

        try {
        const fileUrl = await uploadFileToGitHub(file, title);
        newDoc.url = fileUrl;

        await updateDocumentIndex(newDoc);

        if (index >= 0) {
            docs[index] = newDoc;
        } else {
            docs.push(newDoc);
        }

        documentsStream.set([...docs]);
        showFormStream.set(false);
        } catch (err) {
        alert("Error uploading document: " + err.message);
        } finally {
        isSaving.set(false);
        }
    }, { margin: '0.5rem 0', rounded: true }, themeStream);
    })()
    ], {});

    modal.appendChild(content);
    overlay.appendChild(modal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) showFormStream.set(false);
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') showFormStream.set(false);
    };
    document.addEventListener('keydown', escHandler);

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