function column(children = [], options = {}, themeStream = currentTheme) {
  const el = document.createElement('div');
  el.style.display = 'flex';
  el.style.flexDirection = 'column';
  el.style.gap = options.gap || '1rem';
  el.style.alignItems = options.align || 'stretch';
  el.style.justifyContent = options.justify || 'flex-start';

  if (options.width) el.style.width = options.width;
  if (options.height) el.style.height = options.height;

  children.forEach(child => el.appendChild(child));

  themeStream.subscribe(theme => {
    if (options.bg || options.border) {
      el.style.backgroundColor = options.bg || theme.colors.primary;
      el.style.border = options.border || 'none';
      el.style.padding = options.padding || '1rem';
      el.style.borderRadius = options.radius || '0.5rem';
    }
  });

  return el;
}

function row(children = [], options = {}, themeStream = currentTheme) {
  const el = column(children, { ...options, direction: 'row' }, themeStream);
  el.style.flexDirection = 'row';
  return el;
}

function container(child, options = {}, themeStream = currentTheme) {
  const div = document.createElement('div');

  if (Array.isArray(child)) {
    child.forEach(c => div.appendChild(c));
  } else if (child) {
    div.appendChild(child);
  }

  function applyStyles(theme) {
    const colors = theme.colors || {};

    div.style.padding = options.padding || '1rem';
    div.style.margin = options.margin || '0';
    div.style.borderRadius = options.borderRadius || '8px';
    div.style.border = options.border || `1px solid ${colors.border || '#999'}`;
    div.style.backgroundColor = options.bg || colors.surface || '#f0f0f0';
    div.style.color = options.color || colors.foreground || '#000';
  }

  themeStream.subscribe(applyStyles);
  applyStyles(themeStream.get());

  return div;
}




// 📐 Grid: CSS Grid Layout
function grid(children = [], options = {}, themeStream = currentTheme) {
  const el = document.createElement('div');
  el.style.display = 'grid';

  // Default: 2-column responsive grid
  el.style.gridTemplateColumns = options.columns || 'repeat(auto-fit, minmax(200px, 1fr))';
  el.style.gap = options.gap || '1rem';

  children.forEach(child => el.appendChild(child));

  themeStream.subscribe(theme => {
    if (options.bg || options.border) {
      el.style.backgroundColor = options.bg || theme.colors.primary;
      el.style.border = options.border || 'none';
      el.style.padding = options.padding || '1rem';
      el.style.borderRadius = options.radius || '0.5rem';
    }
  });

  return el;
}

// 🔲 Spacer: Flexible or fixed space
function spacer(options = {}) {
  const el = document.createElement('div');
  el.style.flexGrow = options.flexGrow || '1';
  el.style.width = options.width || 'auto';
  el.style.height = options.height || '1rem';
  return el;
}

// ➖ Divider: Horizontal or vertical line
function divider(options = {}, themeStream = currentTheme) {
  const el = document.createElement('div');

  const isVertical = options.vertical || false;
  el.style[isVertical ? 'width' : 'height'] = options.thickness || '1px';
  el.style[isVertical ? 'height' : 'width'] = options.length || '100%';

  themeStream.subscribe(theme => {
    el.style.backgroundColor = options.color || theme.colors.border || theme.colors.foreground;
  });

  el.style.margin = options.margin || '1rem 0';
  return el;
}
