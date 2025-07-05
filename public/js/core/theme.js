// theme.js

const themes = {
  dark: {
    name: 'Dark',
    colors: {
      background: '#121212',
      foreground: '#f0f0f0',
      primary: '#1e1e1e',
      accent: '#bb86fc',
      surface: '#1e1e1e',
      border: '#333'
    },
    fonts: {
      base: 'system-ui, sans-serif',
      monospace: 'monospace'
    }
  },
  light: {
    name: 'Light',
    colors: {
      background: '#ffffff',
      foreground: '#222222',
      primary: '#f5f5f5',
      accent: '#6200ee',
      surface: '#f7f7f7',
      border: '#ccc'
    },
    fonts: {
      base: 'system-ui, sans-serif',
      monospace: 'monospace'
    }
  },
  ocean: {
    name: 'Ocean',
    colors: {
      background: '#0a192f',
      foreground: '#ccd6f6',
      primary: '#112240',
      accent: '#64ffda',
      surface: '#0e2438',
      border: '#1c3a5f'
    },
    fonts: {
      base: 'Roboto, sans-serif',
      monospace: 'Courier New'
    }
  },
  solarizedDark: {
    name: 'Solarized Dark',
    colors: {
      background: '#002b36',
      foreground: '#93a1a1',
      primary: '#073642',
      accent: '#b58900',
      surface: '#003847',
      border: '#586e75'
    },
    fonts: {
      base: 'Arial, sans-serif',
      monospace: 'Courier New'
    }
  },
  solarizedLight: {
    name: 'Solarized Light',
    colors: {
      background: '#fdf6e3',
      foreground: '#657b83',
      primary: '#eee8d5',
      accent: '#268bd2',
      surface: '#faf3dc',
      border: '#93a1a1'
    },
    fonts: {
      base: 'Georgia, serif',
      monospace: 'Courier'
    }
  },
  forest: {
    name: 'Forest',
    colors: {
      background: '#2e3d29',
      foreground: '#e1f4e5',
      primary: '#3a4d37',
      accent: '#a8e6cf',
      surface: '#2d4f3a',
      border: '#4caf50'
    },
    fonts: {
      base: 'Verdana, sans-serif',
      monospace: 'Menlo'
    }
  },
  candy: {
    name: 'Candy',
    colors: {
      background: '#ffeefc',
      foreground: '#6b006b',
      primary: '#ffd6f3',
      accent: '#ff69b4',
      surface: '#fff0f9',
      border: '#ff99cc'
    },
    fonts: {
      base: 'Comic Sans MS, cursive',
      monospace: 'Courier'
    }
  },
  midnight: {
    name: 'Midnight',
    colors: {
      background: '#1a1a2e',
      foreground: '#eaeaea',
      primary: '#16213e',
      accent: '#0f3460',
      surface: '#202040',
      border: '#2a2a5c'
    },
    fonts: {
      base: 'Helvetica Neue, sans-serif',
      monospace: 'Courier New'
    }
  },
  retro: {
    name: 'Retro',
    colors: {
      background: '#f4f1bb',
      foreground: '#2d2d2a',
      primary: '#e6beae',
      accent: '#9bc1bc',
      surface: '#fcecc9',
      border: '#c5a880'
    },
    fonts: {
      base: '"Courier Prime", monospace',
      monospace: '"Courier Prime", monospace'
    }
  },
  matrix: {
    name: 'Matrix',
    colors: {
      background: '#000000',
      foreground: '#00ff00',
      primary: '#001100',
      accent: '#00ff00',
      surface: '#002200',
      border: '#00aa00'
    },
    fonts: {
      base: '"Share Tech Mono", monospace',
      monospace: '"Share Tech Mono", monospace'
    }
  }
};




const currentTheme = new Stream(themes.dark); // Start with dark mode

function applyTheme(el, options = {}) {
  const {
    size = '1rem',
    weight = 'normal',
    color = null,
    background = null,
    padding = '0.5rem',
    margin = '0.5rem',
    borderRadius = '4px'
  } = options;

  currentTheme.subscribe(theme => {
    // Apply to specific element
    el.style.fontSize = size;
    el.style.fontWeight = weight;
    el.style.color = color || theme.foreground;
    el.style.backgroundColor = background || theme.background;
    el.style.padding = padding;
    el.style.margin = margin;
    el.style.borderRadius = borderRadius;
    el.style.fontFamily = theme.font;
    el.style.border = 'none';

    // 🔁 Also update body styles (global background/text)
    document.body.style.backgroundColor = theme.background;
    document.body.style.color = theme.foreground;
    document.body.style.fontFamily = theme.font;
    document.body.style.transition = 'background-color 0.3s, color 0.3s';
  });
}
function themeToggleButton() {
  const button = document.createElement('button');
  button.textContent = '🌗 Toggle Theme';

  button.onclick = () => {
    const current = currentTheme.get();
    const next = current === themes.dark ? themes.light : themes.dark;
    currentTheme.set(next);
  };

  applyTheme(button, { size: '1rem', weight: 'bold' }); // Optional
  return button;
}

function themedThemeSelector(themeStream = currentTheme) {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.gap = '0.5rem';

  const label = document.createElement('span');
  label.textContent = '🎨 Theme:';

  const select = document.createElement('select');

  Object.entries(themes).forEach(([key, theme]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = theme.name;
    select.appendChild(option);
  });

  // Apply saved or default theme
  const savedKey = localStorage.getItem('theme') || 'dark';
  const selectedTheme = themes[savedKey] || themes.dark;
  currentTheme.set(selectedTheme);
  applyThemeToPage(selectedTheme);
  select.value = savedKey;

  // Apply reactive styles
  function applyStyles(theme) {
    const { colors, fonts } = theme;

    container.style.color = colors.foreground;
    container.style.fontFamily = fonts.base;
    label.style.fontSize = '1rem';
    select.style.fontSize = '1rem';
    select.style.padding = '0.25rem 0.5rem';
    select.style.borderRadius = '4px';
    select.style.backgroundColor = colors.primary;
    select.style.color = colors.foreground;
    select.style.border = `1px solid ${colors.foreground}`;
  }

  themeStream.subscribe(theme => applyStyles(theme));

  select.onchange = () => {
    const newKey = select.value;
    const newTheme = themes[newKey];
    localStorage.setItem('theme', newKey);
    currentTheme.set(newTheme);
    applyThemeToPage(newTheme);
  };

  container.appendChild(label);
  container.appendChild(select);
  return container;
}


function applyThemeToPage(theme, container = document.body) {
  const colors = theme.colors || {};
  const fonts = theme.fonts || {};

  container.style.backgroundColor = colors.background || '#ffffff';
  container.style.color = colors.foreground || '#000000';
  container.style.fontFamily = fonts.base || 'sans-serif';
  container.style.transition = 'background-color 0.3s ease, color 0.3s ease';

  // Optional: smooth font weight rendering
  container.style.webkitFontSmoothing = 'antialiased';
  container.style.mozOsxFontSmoothing = 'grayscale';
}
