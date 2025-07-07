function text(str) {
  return document.createTextNode(str);
}

function reactiveElement(stream, renderFn = v => v) {
  const placeholder = document.createElement('div');

  function update(value) {
    placeholder.innerHTML = ''; // Clear existing content
    const rendered = renderFn(value);
    
    if (rendered instanceof Node) {
      placeholder.appendChild(rendered);
    } else if (Array.isArray(rendered)) {
      rendered.forEach(el => {
        if (el instanceof Node) placeholder.appendChild(el);
      });
    } else {
      placeholder.textContent = String(rendered);
    }
  }

  const unsub1 = update(stream.get());
  const unsub2 = stream.subscribe(update);
  
  // Fix: observe removal of the 'placeholder' element
  observeDOMRemoval(placeholder, unsub1, unsub2); // 🔥 Auto cleanup when node removed
  
  return placeholder;
}


function reactiveText(stream, options = {}, themeStream = currentTheme) {
  const el = document.createElement(options.tag || 'p');

  function applyStyles(theme) {
    const fonts = theme.fonts || {};
    const colors = theme.colors || {};

    applyTheme(el, options);

    el.style.fontSize = options.size || '1rem';
    el.style.fontWeight = options.weight || 'normal';
    el.style.textAlign = options.align || 'left';
    el.style.fontStyle = options.italic ? 'italic' : 'normal';
    el.style.textDecoration = options.underline ? 'underline' : 'none';
    el.style.textTransform =
      options.uppercase ? 'uppercase' :
      options.lowercase ? 'lowercase' :
      options.capitalize ? 'capitalize' :
      'none';
    el.style.fontFamily = options.monospace ? fonts.monospace : fonts.base || 'sans-serif';
    el.style.color = options.color || colors.foreground;
    el.style.backgroundColor = options.bg || 'transparent';
    if (options.margin) el.style.margin = options.margin;
  }

  const unsub1 = stream.subscribe(value => el.textContent = value);
  const unsub2 = themeStream.subscribe(theme => applyStyles(theme));
  applyStyles(themeStream.get());

  observeDOMRemoval(el, unsub1, unsub2); // 🔥 Auto cleanup when node removed

  return el;
}

function editText(stream, options = {}, themeStream = currentTheme) {
  const input = document.createElement('input');
  
  // Set input type based on options
  input.type = options.type || 'text'; // Default is 'text', but can be 'password' if specified

  input.value = stream.get();
  input.placeholder = options.placeholder || '';

  function applyStyles(theme) {
    const fonts = theme.fonts || {};
    const colors = theme.colors || {};

    // Apply theme styles
    applyTheme(input, options);

    input.style.fontSize = options.size || '1rem';
    input.style.width = options.width || '100%';
    input.style.fontFamily = options.monospace
      ? fonts.monospace
      : fonts.base || 'sans-serif';
    input.style.backgroundColor = options.bg || colors.primary || '#333';
    input.style.color = options.color || colors.foreground || '#eee';
    input.style.border = 'none';
    input.style.borderRadius = '4px';
    input.style.padding = options.padding || '0.5rem';
    input.style.transition = 'background-color 0.3s, color 0.3s';

    if (options.margin) input.style.margin = options.margin;
  }

  input.addEventListener('input', () => {
    stream.set(input.value);
  });

  const unsub1 = themeStream.subscribe(theme => applyStyles(theme));
  applyStyles(themeStream.get()); // Initial style

  const unsub2 = stream.subscribe(value => {
    if (input.value !== value) {
      input.value = value;
    }
  });
  
  observeDOMRemoval(input, unsub1, unsub2); // Auto cleanup when node removed

  return input;
}

function reactiveImage(stream, options = {}, themeStream = currentTheme) {
  const img = document.createElement('img');

  function applyStyles(theme) {
    const colors = theme.colors || {};

    applyTheme(img, options);

    img.style.width = options.width || '100%';
    img.style.height = options.height || 'auto';
    img.style.objectFit = options.fit || 'cover';
    img.style.borderRadius = options.rounded ? '8px' : '0';
    img.style.border = options.border || 'none';
    img.style.backgroundColor = options.bg || 'transparent';

    if (options.margin) img.style.margin = options.margin;
    if (options.display) img.style.display = options.display;
  }

  const unsub2 = stream.subscribe(src => {
    img.src = src;
  });

  const unsub1 = themeStream.subscribe(theme => applyStyles(theme));
  applyStyles(themeStream.get());
  
  observeDOMRemoval(el, unsub1, unsub2); // 🔥 Auto cleanup when node removed

  return img;
}

function toggleSwitch(stream, options = {}, themeStream = currentTheme) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = options.gap || '0.5rem';
  if (options.margin) wrapper.style.margin = options.margin;

  // Use reactiveText for the label if provided
  if (options.label) {
    const labelStream = new Stream(options.label);
    const labelEl = reactiveText(labelStream, {
      size: options.labelSize || '1rem',
      color: options.labelColor,
      monospace: options.monospace,
      italic: options.italic,
      margin: 0
    }, themeStream);
    wrapper.appendChild(labelEl);
  }

  const labelEl = document.createElement('label');
  labelEl.style.position = 'relative';
  labelEl.style.display = 'inline-block';
  labelEl.style.width = options.width || '50px';
  labelEl.style.height = options.height || '24px';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!stream.get();
  input.style.opacity = '0';
  input.style.width = '0';
  input.style.height = '0';

  const slider = document.createElement('span');
  slider.style.position = 'absolute';
  slider.style.cursor = 'pointer';
  slider.style.top = '0';
  slider.style.left = '0';
  slider.style.right = '0';
  slider.style.bottom = '0';
  slider.style.transition = '0.4s';
  slider.style.borderRadius = '24px';

  const circle = document.createElement('span');
  circle.style.position = 'absolute';
  circle.style.height = '18px';
  circle.style.width = '18px';
  circle.style.left = '3px';
  circle.style.top = '3px';
  circle.style.borderRadius = '50%';
  circle.style.transition = '0.4s';

  slider.appendChild(circle);
  labelEl.appendChild(input);
  labelEl.appendChild(slider);
  wrapper.appendChild(labelEl);

  function applyStyles(theme) {
    const colors = theme.colors || {};

    applyTheme(wrapper, options);

    const onColor = options.onColor || colors.primary || '#4CAF50';
    const offColor = options.offColor || colors.background || '#888';
    const knobColor = options.knobColor || '#fff';

    slider.style.backgroundColor = input.checked ? onColor : offColor;
    slider.style.border = '1px solid ' + (colors.border || 'transparent');
    circle.style.backgroundColor = knobColor;

    circle.style.transform = input.checked
      ? `translateX(${(parseInt(options.width || 50) - 26)}px)`
      : 'translateX(0)';
  }

  input.addEventListener('change', () => {
    stream.set(input.checked);
  });

  const unsub1 = stream.subscribe(val => {
    input.checked = !!val;
    applyStyles(themeStream.get());
  });

  const unsub2 = themeStream.subscribe(applyStyles);
  applyStyles(themeStream.get());

  observeDOMRemoval(el, unsub1, unsub2); // 🔥 Auto cleanup when node removed

  return wrapper;
}


function reactiveButton(labelStream, onClick, options = {}, themeStream = currentTheme) {
  const button = document.createElement('button');
  button.type = 'button';

  // wire up tooltip if provided
  if (options.title) {
    button.title = options.title;
    button.setAttribute('aria-label', options.title);
  }

  // apply all styling based on theme + options + disabled state
  function applyStyles(theme) {
    const colors = theme.colors || {};
    const fonts  = theme.fonts  || {};

    applyTheme(button, options);

    const isOutlined = options.outline;
    const isAccent   = options.accent;
    const isDisabled = button.disabled;

    // base background/text
    let bg = options.bg
      ?? (isOutlined
          ? 'transparent'
          : isAccent
            ? colors.accent
            : colors.primary
        );
    let fg = options.color
      ?? (isOutlined
          ? (colors.accent || colors.primary)
          : colors.foreground
        );

    // fade when disabled
    if (isDisabled) {
      bg = colors.surface;
      fg = colors.border;
    }

    const borderColor = options.borderColor || colors.border || fg;

    button.style.fontSize      = options.size    || '1rem';
    button.style.padding       = options.padding || '0.5rem 1rem';
    button.style.border        = `2px solid ${borderColor}`;
    button.style.borderRadius  = options.rounded ? '8px' : '4px';
    button.style.fontFamily    = fonts.base      || 'sans-serif';
    button.style.fontWeight    = options.bold    ? 'bold' : 'normal';
    button.style.textTransform = options.uppercase
      ? 'uppercase'
      : options.lowercase
      ? 'lowercase'
      : options.capitalize
      ? 'capitalize'
      : 'none';

    button.style.backgroundColor = bg;
    button.style.color           = fg;
    button.style.cursor          = isDisabled ? 'not-allowed' : 'pointer';
    button.style.transition      = 'all 0.3s ease';

    if (options.margin) button.style.margin = options.margin;
    if (options.width)  button.style.width  = options.width;
  }

  function setDisabled(flag) {
    button.disabled = Boolean(flag);
    applyStyles(themeStream.get());
  }

  function setVisible(flag) {
    button.style.display = flag ? '' : 'none';
  }

  // Handle visibility: static or stream
  if (options.visible instanceof Stream) {
    setVisible(options.visible.get());
    options.visible.subscribe(setVisible);
  } else {
    setVisible(options.visible !== false); // default: visible
  }

  // Handle disabled: static or stream
  if (options.disabled instanceof Stream) {
    setDisabled(options.disabled.get());
    options.disabled.subscribe(setDisabled);
  } else {
    setDisabled(options.disabled);
  }

  button.addEventListener('click', () => {
    if (!button.disabled) {
      onClick();
    }
  });

  const unsubLabel = labelStream.subscribe(value => {
    button.textContent = value;
  });

  const unsubTheme = themeStream.subscribe(theme => {
    applyStyles(theme);
  });

  applyStyles(themeStream.get());

  observeDOMRemoval(button, unsubLabel, unsubTheme);

  return button;
}


function fileInput(stream, options = {}, themeStream = currentTheme) {
  const input = document.createElement('input');
  input.type = 'file';

  function applyStyles(theme) {
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};

    applyTheme(input, options);

    input.style.fontSize = options.size || '1rem';
    input.style.fontFamily = fonts.base || 'sans-serif';
    input.style.backgroundColor = options.bg || colors.surface || '#f9f9f9';
    input.style.color = options.color || colors.foreground;
    input.style.border = options.border || `1px solid ${colors.border || '#ccc'}`;
    input.style.borderRadius = '4px';
    input.style.padding = options.padding || '0.4rem';
    input.style.width = options.width || '100%';
    input.style.margin = options.margin || '0.5rem 0';
  }
  
  let unsub1; 
  input.addEventListener('change', () => {
    unsub1 = stream.set(input.files[0] || null);
  });

  const unsub2 = themeStream.subscribe(applyStyles);
  applyStyles(themeStream.get());

//  observeDOMRemoval(el, unsub1, unsub2); // 🔥 Auto cleanup when node removed

  return input;
}

function conditional(showStream, childElementFn) {
  const wrapper = document.createElement('div');
  let child = null;

  function update(show) {
    wrapper.innerHTML = '';
    if (show) {
      child = childElementFn();
      wrapper.appendChild(child);
    }
  }

  const unsub1 = showStream.subscribe(update);
  update(showStream.get());
  
  observeDOMRemoval(wrapper, unsub1); // 🔥 Auto cleanup when node removed
  return wrapper;
}

function headerContainer(titleStream) {
  return container([
    reactiveText(titleStream, {
      size: '2rem',
      weight: 'bold',
      margin: '1rem 0',
      align: 'center'
    })
  ], {
    padding: '1rem',
    align: 'center'
  });
}


function groupedDocumentGrid(documentsStream, expandedStream, themeStream = currentTheme, keys = ['title', 'status', 'meta', 'filename']) {
  const wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';
  wrapper.style.width = '100%';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search...';
  searchInput.style.margin = '1rem auto';
  searchInput.style.padding = '0.5rem';
  searchInput.style.width = '100%';
  searchInput.style.maxWidth = '400px';
  searchInput.style.display = 'block';

  function styleSearchInput(theme) {
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};

    searchInput.style.backgroundColor = colors.surface || '#fff';
    searchInput.style.color = colors.foreground || '#000';
    searchInput.style.border = `1px solid ${colors.border || '#ccc'}`;
    searchInput.style.fontFamily = fonts.base || 'sans-serif';
  }
  styleSearchInput(themeStream.get());
  themeStream.subscribe(styleSearchInput);

  const contentWrapper = document.createElement('div');

  const searchStream = new Stream('');
  searchInput.addEventListener('input', () => {
    searchStream.set(searchInput.value);
  });

  

    // Restore expanded state from localStorage if available
const savedExpanded = localStorage.getItem('docGroupsExpanded');
if (savedExpanded) {
  try {
    const parsedExpanded = JSON.parse(savedExpanded);
    expandedStream.set(parsedExpanded);

    // Then update it
    localStorage.setItem('docGroupsExpanded', JSON.stringify({ 
      ...parsedExpanded, 
      [category]: !userExpanded 
    }));
  } catch (e) {
    console.warn('Failed to parse saved expanded state:', e);
  }
}


// Control bar with icon buttons
const controlBar = document.createElement('div');
controlBar.style.textAlign = 'right';
controlBar.style.margin = '0.5rem 0';
controlBar.style.display = 'flex';
controlBar.style.justifyContent = 'flex-end';
controlBar.style.gap = '0.5rem';

// Helper function to get all unique categories
const getAllCategories = () => {
  const docs = documentsStream.get();
  return [...new Set(docs.map(doc => doc.category?.trim() || 'Uncategorized'))];
};

const iconButton = (label, onClick, tooltip) => {
  const btn = document.createElement('button');
  btn.innerHTML = label; // icon SVG or symbol
  btn.title = tooltip;
  btn.style.fontSize = '1.1rem';
  btn.style.padding = '0.25rem 0.5rem';
  btn.style.cursor = 'pointer';
  btn.addEventListener('click', onClick);
  return btn;
};

// ▼ Expand All
const expandAllBtn = iconButton('▼', () => {
  const expanded = Object.fromEntries(getAllCategories().map(cat => [cat, true]));
  expandedStream.set(expanded);
  localStorage.setItem('docGroupsExpanded', JSON.stringify(expanded));
}, 'Expand All');

// ▶ Collapse All
const collapseAllBtn = iconButton('▶', () => {
  const collapsed = Object.fromEntries(getAllCategories().map(cat => [cat, false]));
  expandedStream.set(collapsed);
  localStorage.setItem('docGroupsExpanded', JSON.stringify(collapsed));
}, 'Collapse All');

// ⇄ Toggle All
const toggleAllBtn = iconButton('⇄', () => {
  const current = expandedStream.get();
  const toggled = Object.fromEntries(getAllCategories().map(cat => [cat, !current[cat]]));
  expandedStream.set(toggled);
  localStorage.setItem('docGroupsExpanded', JSON.stringify(toggled));
}, 'Toggle All');


controlBar.appendChild(expandAllBtn);
controlBar.appendChild(collapseAllBtn);
controlBar.appendChild(toggleAllBtn);

const searchRow = row([searchInput, controlBar]);
wrapper.appendChild(searchRow);
wrapper.appendChild(contentWrapper);

  const colWidthsStream = derived([documentsStream], (docs) => {
    const maxCharWidths = {};
    for (const doc of docs) {
      for (const key of keys) {
        const len = (doc[key]?.toString().length || 0);
        maxCharWidths[key] = Math.max(maxCharWidths[key] || 0, len);
      }
    }
    return keys.map(key => {
      const ch = Math.min(40, Math.max(10, maxCharWidths[key] || 10));
      return `${ch}ch`;
    });
  });


 const gridStream = derived(
    [documentsStream, expandedStream, themeStream, searchStream, colWidthsStream],
    (docs, expanded, theme, search, colWidths) => {
      contentWrapper.innerHTML = '';

      const lowerSearch = search.trim().toLowerCase();
      const isSearching = lowerSearch.length > 0;

      const filteredDocs = docs.filter(doc =>
        keys.some(key =>
          (doc[key]?.toString().toLowerCase().includes(lowerSearch))
        )
      );

      const grouped = {};
      for (const doc of filteredDocs) {
        const cat = doc.category?.trim() || 'Uncategorized';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(doc);
      }

      const colors = theme.colors || {};
      const fonts = theme.fonts || {};

      const table = document.createElement('table');
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '1.5rem';
      table.style.width = '100%'; // will use colWidths

      // Create shared colgroup
      const colgroup = document.createElement('colgroup');
      colWidths.forEach(width => {
        const col = document.createElement('col');
        col.style.width = width;
        colgroup.appendChild(col);
      });
      table.appendChild(colgroup);

      // Shared header
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      keys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key.toUpperCase();
        th.style.padding = '0.5rem 1rem';
        th.style.fontFamily = fonts.base;
        th.style.fontWeight = 'bold';
        th.style.backgroundColor = colors.surface;
        th.style.color = colors.foreground;
        th.style.border = `1px solid ${colors.border}`;
        th.style.textAlign = 'left';
        th.style.whiteSpace = 'nowrap';
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      table.appendChild(thead);

      // Create shared tbody
      const tbody = document.createElement('tbody');

      for (const [category, groupDocs] of Object.entries(grouped)) {
        const userExpanded = expanded[category] ?? true;
        const isExpanded = isSearching ? groupDocs.length > 0 : userExpanded;

        // Group header row
        const groupRow = document.createElement('tr');
        const groupCell = document.createElement('td');
        groupCell.colSpan = keys.length;
        groupCell.textContent = `${isExpanded ? '▼' : '▶'} ${category}`;
        groupCell.style.cursor = 'pointer';
        groupCell.style.fontWeight = 'bold';
        groupCell.style.padding = '0.5rem 1rem';
        groupCell.style.fontFamily = fonts.base;
        groupCell.style.backgroundColor = colors.surface;
        groupCell.style.color = colors.foreground;
        groupCell.addEventListener('click', () => {
          expandedStream.set({ ...expanded, [category]: !userExpanded });
          localStorage.setItem('docGroupsExpanded', JSON.stringify({ ...expanded, [category]: !userExpanded }));
        });
        groupRow.appendChild(groupCell);
        tbody.appendChild(groupRow);

        if (!isExpanded) continue;

        // Group's documents
        groupDocs.forEach(doc => {
          const row = document.createElement('tr');
          keys.forEach(key => {
            const td = document.createElement('td');
            if (key === 'download') {
              // Download icon
              const a = document.createElement('a');
              a.href = doc.url;
              a.target = '_blank';
              a.rel = 'noopener';
              a.title = `Open ${doc.filename}`;
              a.textContent = '⬇️';
              a.style.marginRight = '0.5rem';
              a.style.textDecoration = 'none';
              a.style.fontSize = '1.2rem';
              a.style.cursor = 'pointer';


              // History icon
              const historyBtn = document.createElement('button');
              historyBtn.textContent = '🕓';
              historyBtn.title = 'View File History';
              historyBtn.style.fontSize = '1.2rem';
              historyBtn.style.cursor = 'pointer';
              historyBtn.style.background = 'none';
              historyBtn.style.border = 'none';
              historyBtn.addEventListener('click', () => {
                showFileHistoryModal(doc.filename, themeStream);
              });

              td.appendChild(a);
              td.appendChild(historyBtn);
            } else td.textContent = doc[key] ?? '';


            td.style.padding = '0.5rem 1rem';
            td.style.border = `1px solid ${colors.border}`;
            td.style.fontFamily = fonts.base;
            td.style.color = colors.foreground;
            td.style.whiteSpace = 'nowrap';
            row.appendChild(td);
          });
          tbody.appendChild(row);
        });
      }

      table.appendChild(tbody);
      contentWrapper.appendChild(table);

    }
  );


  gridStream.subscribe(() => {}); // activate reactive behavior
  return wrapper;
}

function gridView(dataStream, options = {}, themeStream = currentTheme) {
  const wrapper = document.createElement('div');
  wrapper.style.overflowX = 'auto';
  wrapper.style.width = '100%';

  const table = document.createElement('table');
  table.style.borderCollapse = 'collapse';
  table.style.width = 'max-content';
  wrapper.appendChild(table);

  let selectedRowIndex = null;

  function renderGrid(data = [], theme = {}) {
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};
    const keys = data.length > 0 ? Object.keys(data[0]) : [];

    table.innerHTML = '';

    // Header row
    // Header row
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    keys.forEach(key => {
      const th = document.createElement('th');
      th.textContent = key === 'download' ? '' : key.toUpperCase();
      th.style.padding = '0.5rem 1rem';
      th.style.fontFamily = fonts.base;
      th.style.fontWeight = 'bold';
      th.style.backgroundColor = colors.surface;
      th.style.color = colors.foreground;
      th.style.borderRight = `1px solid ${colors.border}`;
      th.style.whiteSpace = 'nowrap';
      th.style.textAlign = 'left'; // ✅ Left-align header text
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    // Body rows
    const tbody = document.createElement('tbody');
    data.forEach((item, rowIndex) => {
      const row = document.createElement('tr');
      if (rowIndex === selectedRowIndex) {
        row.style.backgroundColor = colors.accent;
      }
      keys.forEach((key, colIndex) => {
        const td = document.createElement('td');
        td.textContent = item[key];
        td.style.padding = '0.5rem 1rem';
        td.style.borderRight = `1px solid ${colors.border}`;
        td.style.borderTop = `1px solid ${colors.border}`;
        td.style.fontFamily = fonts.base;
        td.style.color = colors.foreground;
        td.style.whiteSpace = 'nowrap'; // ✅ Prevent wrapping
        row.appendChild(td);
      });

      row.addEventListener('click', () => {
        selectedRowIndex = rowIndex;
        if (options.onSelect) options.onSelect(item);
        renderGrid(data, theme);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
  }

  dataStream.subscribe(data => renderGrid(data, themeStream.get()));
  themeStream.subscribe(theme => renderGrid(dataStream.get(), theme));
  renderGrid(dataStream.get(), themeStream.get());

  return wrapper;
}

function editableDropdown(valueStream, optionsStream, themeStream = currentTheme) {
  const wrapper = document.createElement('div');
  const select = document.createElement('select');
  const input = document.createElement('input');
  input.type = 'text';

  const baseStyles = (el, theme) => {
    const fonts = theme.fonts || {};
    const colors = theme.colors || {};

    el.style.width = '100%';
    el.style.padding = '0.5rem';
    el.style.fontSize = '1rem';
    el.style.fontFamily = fonts.base || 'sans-serif';
    el.style.backgroundColor = colors.background || '#fff';
    el.style.color = colors.foreground || '#000';
    el.style.border = `1px solid ${colors.border || '#ccc'}`;
    el.style.borderRadius = '4px';
    el.style.marginBottom = '0.5rem';
    el.style.boxSizing = 'border-box';
  };

  input.placeholder = 'Or enter new category...';

  // Update select options from options stream
  function updateOptions(options) {
    select.innerHTML = '';
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select a Category --';
    select.appendChild(emptyOption);

    for (const opt of options) {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    }
  }

  // Update value stream on selection or manual input
  select.addEventListener('change', () => {
    valueStream.set(select.value);
  });

  input.addEventListener('input', () => {
    valueStream.set(input.value);
  });

  // React to options stream
  optionsStream.subscribe(updateOptions);

  // Apply theme styles
  themeStream.subscribe(theme => {
    baseStyles(select, theme);
    baseStyles(input, theme);
  });

  // Initial theme application
  baseStyles(select, themeStream.get());
  baseStyles(input, themeStream.get());

  wrapper.appendChild(select);
  wrapper.appendChild(input);

  return wrapper;
}

async function showFileHistoryModal(filename, themeStream = currentTheme) {
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = 9999;

  const dialog = document.createElement('div');
  dialog.style.padding = '1rem';
  dialog.style.borderRadius = '8px';
  dialog.style.maxWidth = '600px';
  dialog.style.width = '90%';
  dialog.style.maxHeight = '80vh';
  dialog.style.overflowY = 'auto';

  const heading = document.createElement('h2');
  heading.textContent = `History: ${filename}`;
  heading.style.marginBottom = '1rem';

  const list = document.createElement('ul');
  list.style.listStyle = 'none';
  list.style.padding = 0;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.marginTop = '1rem';
  closeBtn.addEventListener('click', () => modal.remove());

  dialog.appendChild(heading);
  dialog.appendChild(list);
  dialog.appendChild(closeBtn);
  modal.appendChild(dialog);
  document.body.appendChild(modal);

  // Apply theme styles
  themeStream.subscribe(theme => {
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};

    // Modal background (overlay)
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // keep darkened overlay

    // Dialog styles
    dialog.style.backgroundColor = colors.surface;
    dialog.style.color = colors.foreground;
    dialog.style.border = `1px solid ${colors.border}`;
    dialog.style.fontFamily = fonts.base;

    // Heading styles
    heading.style.color = colors.accent;
    heading.style.fontFamily = fonts.base;

    // Button styles
    closeBtn.style.backgroundColor = colors.accent;
    closeBtn.style.color = colors.background;
    closeBtn.style.border = `1px solid ${colors.border}`;
    closeBtn.style.borderRadius = '4px';
    closeBtn.style.padding = '0.5rem 1rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontFamily = fonts.base;

    // List and link base styles
    list.style.color = colors.foreground;
    list.style.fontFamily = fonts.base;
    list.querySelectorAll('a').forEach(link => {
      link.style.color = colors.accent;
    });
  });

  try {
    const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?path=${repoPath}/${encodeURIComponent(filename)}`, {
      headers: {
        'Authorization': `token ${githubToken}`
      }
    });
    const commits = await response.json();

    if (!Array.isArray(commits)) throw new Error("Unexpected response");

    for (const commit of commits) {
      const item = document.createElement('li');
      item.style.marginBottom = '0.5rem';

      const link = document.createElement('a');
      link.textContent = `${commit.commit.author.date} — ${commit.commit.message}`;
      link.href = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${commit.sha}/${repoPath}/${filename}`;
      link.target = '_blank';
      link.download = filename;
      link.style.textDecoration = 'none';
      link.style.cursor = 'pointer';

      item.appendChild(link);
      list.appendChild(item);
    }

    if (commits.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No history available.';
      dialog.insertBefore(empty, list);
    }
  } catch (err) {
    const error = document.createElement('p');
    error.textContent = 'Error fetching history.';
    dialog.insertBefore(error, list);
    console.error(err);
  }
}

function dropdownStream(stream, selectOptions = [], themeStream = currentTheme) {
  const select = document.createElement('select');

  function applyStyles(theme) {
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};
    applyTheme(select, selectOptions);

    select.style.padding = '0.5rem';
    select.style.borderRadius = '4px';
    select.style.border = `1px solid ${colors.border || '#ccc'}`;
    select.style.fontFamily = fonts.base || 'sans-serif';
    select.style.backgroundColor = colors.surface || '#fff';
    select.style.color = colors.foreground || '#000';
    select.style.margin = selectOptions.margin || '0';
    select.style.width = selectOptions.width || '100%';
  }

  // Populate options
  selectOptions.choices?.forEach(opt => {
  const option = document.createElement('option');

  // Support both string and object format
  if (typeof opt === 'string') {
    option.value = opt;
    option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
  } else if (typeof opt === 'object' && opt !== null) {
    option.value = opt.value;
    option.textContent = opt.label ?? opt.value;
  }

  select.appendChild(option);
});


  // If the stream has no value yet, default to the first choice
  if (!stream.get() && selectOptions.choices?.length > 0) {
    const defaultChoice = selectOptions.choices[0];
    const defaultValue = typeof defaultChoice === 'string' ? defaultChoice : defaultChoice?.value;
    stream.set(defaultValue);
    select.value = defaultValue;
  }

  // Keep select synced with stream
  const unsub1 = stream.subscribe(value => {
    if (select.value !== value) select.value = value;
  });

    // Update stream on change
  select.addEventListener('change', () => {
    stream.set(select.value);
  });

  const unsub2 = themeStream.subscribe(theme => applyStyles(theme));
  applyStyles(themeStream.get());

  observeDOMRemoval(select, unsub1, unsub2); // 🔥 Auto cleanup when node removed  
  
  return select;
}

function avatarImage(stream, options = {}, themeStream = currentTheme) {
  // Create the img element
  const img = document.createElement('img');

  // Apply styles to the img element
  function applyStyles(theme) {
    const colors = theme.colors || {};

    // Apply general styling based on options
    img.style.width = options.width || '50px'; // Default width
    img.style.height = options.height || '50px'; // Default height
    img.style.objectFit = options.fit || 'cover'; // Default object fit
    img.style.borderRadius = options.rounded ? '50%' : options.borderRadius || '8px'; // Rounds the corners based on 'rounded' or 'borderRadius'
    img.style.border = options.border || 'none'; // Default border
    img.style.backgroundColor = options.bg || 'transparent'; // Default background

    if (options.margin) img.style.margin = options.margin; // Optional margin
    if (options.display) img.style.display = options.display; // Optional display style
  }

  // Subscribe to the stream to update the src whenever the stream changes
  const unsub1 = stream.subscribe(src => {
    img.src = src; // Update the img src with the stream's value
  });

  // Subscribe to the themeStream to apply styles based on the current theme
  const unsub2 = themeStream.subscribe(theme => applyStyles(theme));

  // Apply the initial theme styles
  applyStyles(themeStream.get());

  // Automatically clean up when the element is removed from the DOM
  observeDOMRemoval(img, unsub1, unsub2);

  return img; // Return the img element
}

function avatarDropdown(stream, options = {}, themeStream = currentTheme, menuItems = []) {
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.display = 'inline-block';

  const img = document.createElement('img');

  function applyStyles(theme) {
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};

    img.style.width = options.width || '50px';
    img.style.height = options.height || '50px';
    img.style.objectFit = options.fit || 'cover';
    img.style.borderRadius = options.rounded ? '50%' : options.borderRadius || '8px';
    img.style.border = options.border || `1px solid ${colors.border || '#ccc'}`;
    img.style.backgroundColor = options.bg || 'transparent';
    img.style.cursor = 'pointer';
    if (options.margin) img.style.margin = options.margin;
  }

  // Build custom menu container
  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.top = '100%';
  menu.style.left = '0';
  menu.style.zIndex = '1000';
  menu.style.display = 'none';
  menu.style.minWidth = '250px';
  menu.style.background = '#fff';
  menu.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
  menu.style.borderRadius = '4px';
  menu.style.padding = '0.5rem 0';
  menu.style.overflow = 'hidden';

  // Apply theme when available
  function applyMenuStyles(theme) {
    const colors = theme.colors || {};
    const fonts = theme.fonts || {};
    menu.style.background = colors.surface || '#fff';
    menu.style.color = colors.foreground || '#000';
    menu.style.fontFamily = fonts.base || 'sans-serif';
  }

  // Build menu items
    menuItems.forEach(item => {
      const div = document.createElement('div');

      // Handle static string, getter function, or Stream
      function updateLabel(value) {
        div.textContent = value;
      }

      if (typeof item.label === 'function') {
        updateLabel(item.label());
      } else if (item.label?.subscribe) {
        updateLabel(item.label.get());
        const unsub = item.label.subscribe(updateLabel);
        observeDOMRemoval(div, unsub);
      } else {
        updateLabel(item.label);
      }

      div.style.padding = '0.5rem 1rem';
      div.style.cursor = 'pointer';
      div.style.userSelect = 'none';

      div.addEventListener('click', e => {
        e.stopPropagation();
        item.onClick?.();
        menu.style.display = 'none';
      });

      div.addEventListener('mouseenter', () => div.style.background = '#eee');
      div.addEventListener('mouseleave', () => div.style.background = 'transparent');

      menu.appendChild(div);
    });

  // Show menu on avatar click
  img.addEventListener('click', e => {
    e.stopPropagation();
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  });

  // Hide menu on outside click
  window.addEventListener('click', () => {
    menu.style.display = 'none';
  });

  const unsub1 = stream.subscribe(src => {
    img.src = src;
  });

  const unsub2 = themeStream.subscribe(theme => {
    applyStyles(theme);
    applyMenuStyles(theme);
  });

  applyStyles(themeStream.get());
  applyMenuStyles(themeStream.get());

  observeDOMRemoval(container, unsub1, unsub2);
  container.appendChild(img);
  container.appendChild(menu);

  return container;
}


function showConfirmationDialog(message, themeStream = currentTheme) {
  return new Promise((resolve) => {
    // Create modal container
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: 0.3s;
    `;

    // Create modal content box (more compact)
    const content = document.createElement('div');
    content.style.cssText = `
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px; /* Set max-width to 400px to make it more compact */
      width: 90%;
      text-align: center;
      box-sizing: border-box;
    `;

    // Add confirmation message
    const text = document.createElement('p');
    text.textContent = message;
    content.appendChild(text);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      margin-top: 20px;
      display: flex;
      justify-content: space-evenly;
    `;

    // OK Button
    const okButton = reactiveButton(new Stream('OK'), () => {
      resolve(true); // User clicked OK
      document.body.removeChild(modal);
    }, {
      size: '1rem',
      padding: '0.5rem 1rem',
      bg: '#4CAF50', // Green
      color: '#fff',
      rounded: true,
      outline: true
    }, themeStream);

    // Cancel Button
    const cancelButton = reactiveButton(new Stream('Cancel'), () => {
      resolve(false); // User clicked Cancel
      document.body.removeChild(modal);
    }, {
      size: '1rem',
      padding: '0.5rem 1rem',
      bg: '#f44336', // Red
      color: '#fff',
      rounded: true,
      outline: true
    }, themeStream);

    // Append buttons
    buttonContainer.appendChild(okButton);
    buttonContainer.appendChild(cancelButton);
    content.appendChild(buttonContainer);

    // Append modal content
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Apply theme styles
    const applyModalStyles = (theme) => {
      const { colors, fonts } = theme;
      content.style.backgroundColor = colors.surface || '#fff';
      content.style.color = colors.foreground || '#000';
      content.style.fontFamily = fonts.base || 'sans-serif';

      // Update button styles
      okButton.style.backgroundColor = colors.primary || '#4CAF50';
      cancelButton.style.backgroundColor = colors.accent || '#f44336';
    };

    themeStream.subscribe(applyModalStyles);
    applyModalStyles(themeStream.get());

    // Close modal if clicked outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        resolve(false); // User clicked outside (Cancel)
        document.body.removeChild(modal);
      }
    });

    // Media queries to adjust modal size on smaller screens
    const applyResponsiveStyles = () => {
      if (window.innerWidth <= 600) {
        content.style.maxWidth = '90%'; // Make it more responsive on smaller screens
      } else {
        content.style.maxWidth = '400px'; // Keep it compact on larger screens
      }
    };

    window.addEventListener('resize', applyResponsiveStyles);
    applyResponsiveStyles();
  });
}


function showToast(message, {
  duration = 3000,
  themeStream = currentTheme,
  type = 'info' // 'info' | 'success' | 'warning' | 'error'
} = {}) {
  const theme = themeStream.get();
  const toast = document.createElement('div');

  // Colors based on type
  const typeColors = {
    info: theme.colors.accent,
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
  };

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    backgroundColor: theme.colors.surface,
    color: theme.colors.foreground,
    borderLeft: `6px solid ${typeColors[type] || theme.colors.accent}`,
    borderRadius: '6px',
    padding: '1rem 1.25rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    fontFamily: theme.fonts?.base || 'sans-serif',
    zIndex: '9999',
    minWidth: '240px',
    maxWidth: '360px',
    transition: 'opacity 0.3s ease',
    opacity: '1',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  });

  // Icon
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }[type] || 'ℹ️';

  const icon = document.createElement('span');
  icon.textContent = emoji;
  icon.style.fontSize = '1.2rem';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  document.body.appendChild(toast);

  // Auto fade and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300); // wait for fade
  }, duration);
}


function createDiagramOverlay(nameStream, versionStream, themeStream) {
  const overlay = document.createElement('div');
  overlay.className = 'diagram-overlay';

  Object.assign(overlay.style, {
    position: 'absolute',
    top: '0.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '10',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    pointerEvents: 'none',
    transition: 'all 0.2s ease-in-out'
  });


  function update() {
    const theme = themeStream.get();
    overlay.style.background = theme.colors.surface;
    overlay.style.color = theme.colors.foreground;
    overlay.style.border = `1px solid ${theme.colors.border}`;
    overlay.style.fontFamily = theme.fonts.base || 'system-ui, sans-serif';

    const name = nameStream.get() || 'Untitled';
    const version = versionStream.get() || 1;
    overlay.textContent = `🕸️ ${name} — v${version}`;
  }

  nameStream.subscribe(update);
  versionStream.subscribe(update);
  themeStream.subscribe(update);
  update();

  return overlay;
}


