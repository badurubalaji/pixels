import { Plugin, PluginRegistry } from './plugin-api';

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ===== Weather Widget =====
const weatherPlugin: Plugin = {
  id: 'weather-card',
  name: 'Weather Card',
  description: 'Add a styled weather forecast card',
  icon: 'cloud',
  category: 'widget',
  configFields: [
    { key: 'city', label: 'City name', type: 'text', default: 'San Francisco' },
    { key: 'temp', label: 'Temperature (°)', type: 'number', default: 72 },
    { key: 'condition', label: 'Condition', type: 'select', default: 'Sunny',
      options: [
        { value: 'Sunny', label: 'Sunny' },
        { value: 'Cloudy', label: 'Cloudy' },
        { value: 'Rainy', label: 'Rainy' },
        { value: 'Snow', label: 'Snow' },
      ],
    },
    { key: 'color', label: 'Theme color', type: 'color', default: '#3b82f6' },
  ],
  render: async (config, ctx) => {
    const city = escapeXml(config['city'] || 'City');
    const temp = config['temp'] ?? 72;
    const cond = escapeXml(config['condition'] || 'Sunny');
    const color = config['color'] || '#3b82f6';

    const icons: Record<string, string> = {
      Sunny: '<circle cx="100" cy="100" r="40" fill="#fbbf24"/>',
      Cloudy: '<ellipse cx="100" cy="110" rx="60" ry="30" fill="white"/>',
      Rainy: '<ellipse cx="100" cy="80" rx="50" ry="25" fill="white"/><line x1="80" y1="110" x2="80" y2="140" stroke="#60a5fa" stroke-width="3"/><line x1="100" y1="115" x2="100" y2="145" stroke="#60a5fa" stroke-width="3"/><line x1="120" y1="110" x2="120" y2="140" stroke="#60a5fa" stroke-width="3"/>',
      Snow: '<ellipse cx="100" cy="80" rx="50" ry="25" fill="white"/><circle cx="80" cy="120" r="4" fill="white"/><circle cx="100" cy="130" r="4" fill="white"/><circle cx="120" cy="120" r="4" fill="white"/>',
    };

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 280" width="360" height="280">
      <rect width="360" height="280" rx="24" fill="${color}"/>
      <g opacity="0.95">${icons[cond] ?? icons['Sunny']}</g>
      <text x="180" y="200" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="white" text-anchor="middle">${temp}°</text>
      <text x="180" y="240" font-family="Arial, sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.85">${city}</text>
      <text x="180" y="265" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.7">${cond}</text>
    </svg>`;

    await ctx.addSvg(svg);
  },
};

// ===== Code Snippet Block =====
const codeSnippetPlugin: Plugin = {
  id: 'code-snippet',
  name: 'Code Snippet',
  description: 'Add a styled code block with syntax-like coloring',
  icon: 'code',
  category: 'widget',
  configFields: [
    { key: 'code', label: 'Code', type: 'text', default: 'function hello() {\n  return "Hello, world!";\n}' },
    { key: 'language', label: 'Language', type: 'text', default: 'JavaScript' },
    { key: 'theme', label: 'Theme', type: 'select', default: 'dark',
      options: [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
      ],
    },
  ],
  render: async (config, ctx) => {
    const code = config['code'] || '// your code';
    const language = escapeXml(config['language'] || 'Code');
    const theme = config['theme'] || 'dark';
    const isDark = theme === 'dark';

    const bg = isDark ? '#1e293b' : '#f8fafc';
    const fg = isDark ? '#e2e8f0' : '#1e293b';
    const accent = isDark ? '#7c3aed' : '#7c3aed';

    const lines = code.split('\n').slice(0, 12); // cap at 12 lines
    const lineHeight = 20;
    const padding = 16;
    const headerHeight = 36;
    const width = 480;
    const height = headerHeight + padding * 2 + lines.length * lineHeight;

    const lineSvg = lines.map((line: string, i: number) => {
      const y = headerHeight + padding + i * lineHeight + 14;
      // Simple keyword highlighting
      const colored = escapeXml(line)
        .replace(/\b(function|const|let|var|if|else|return|class|new|import|export|from|async|await)\b/g, `<tspan fill="#c084fc">$1</tspan>`)
        .replace(/("[^"]*")/g, `<tspan fill="#fbbf24">$1</tspan>`)
        .replace(/(\/\/.*$)/g, `<tspan fill="#94a3b8" font-style="italic">$1</tspan>`);
      return `<text x="${padding + 4}" y="${y}" font-family="Menlo, Monaco, Consolas, monospace" font-size="14" fill="${fg}">${colored}</text>`;
    }).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" rx="10" fill="${bg}"/>
      <rect width="${width}" height="${headerHeight}" rx="10" fill="${isDark ? '#0f172a' : '#e2e8f0'}"/>
      <circle cx="18" cy="18" r="6" fill="#ef4444"/>
      <circle cx="38" cy="18" r="6" fill="#f59e0b"/>
      <circle cx="58" cy="18" r="6" fill="#10b981"/>
      <text x="${width - padding}" y="22" font-family="Arial, sans-serif" font-size="11" fill="${accent}" text-anchor="end">${language}</text>
      ${lineSvg}
    </svg>`;

    await ctx.addSvg(svg);
  },
};

// ===== Quote Block =====
const quoteBlockPlugin: Plugin = {
  id: 'quote-block',
  name: 'Quote',
  description: 'Add a styled blockquote with author',
  icon: 'format_quote',
  category: 'widget',
  configFields: [
    { key: 'text', label: 'Quote', type: 'text', default: 'Design is intelligence made visible.' },
    { key: 'author', label: 'Author', type: 'text', default: 'Alina Wheeler' },
    { key: 'accent', label: 'Accent color', type: 'color', default: '#7c3aed' },
  ],
  render: async (config, ctx) => {
    const text = escapeXml(config['text'] || 'Quote');
    const author = escapeXml(config['author'] || '');
    const accent = config['accent'] || '#7c3aed';
    const width = 540;

    // Wrap text approximately
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    const maxChars = 38;
    for (const w of words) {
      if ((current + ' ' + w).length > maxChars) {
        lines.push(current);
        current = w;
      } else {
        current = current ? current + ' ' + w : w;
      }
    }
    if (current) lines.push(current);

    const lineH = 36;
    const padding = 32;
    const height = padding * 2 + lines.length * lineH + (author ? 40 : 0);

    const lineSvg = lines.map((l, i) =>
      `<text x="${padding + 30}" y="${padding + 28 + i * lineH}" font-family="Georgia, serif" font-size="22" fill="#1f2937">${l}</text>`
    ).join('');

    const authorSvg = author
      ? `<text x="${padding + 30}" y="${padding + lines.length * lineH + 32}" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">— ${author}</text>`
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="white" rx="8"/>
      <rect x="${padding}" y="${padding}" width="4" height="${height - padding * 2}" fill="${accent}" rx="2"/>
      <text x="${padding + 30}" y="${padding + 4}" font-family="Georgia, serif" font-size="48" fill="${accent}" opacity="0.4">"</text>
      ${lineSvg}
      ${authorSvg}
    </svg>`;

    await ctx.addSvg(svg);
  },
};

// ===== Stat Card =====
const statCardPlugin: Plugin = {
  id: 'stat-card',
  name: 'Stat Card',
  description: 'A bold metric with label',
  icon: 'insights',
  category: 'widget',
  configFields: [
    { key: 'value', label: 'Value', type: 'text', default: '128K' },
    { key: 'label', label: 'Label', type: 'text', default: 'Active Users' },
    { key: 'trend', label: 'Trend', type: 'text', default: '+12%' },
    { key: 'color', label: 'Background color', type: 'color', default: '#10b981' },
  ],
  render: async (config, ctx) => {
    const value = escapeXml(config['value'] || '0');
    const label = escapeXml(config['label'] || 'Metric');
    const trend = escapeXml(config['trend'] || '');
    const color = config['color'] || '#10b981';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
      <rect width="320" height="180" rx="16" fill="${color}"/>
      <text x="32" y="100" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="white">${value}</text>
      <text x="32" y="135" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.85">${label}</text>
      ${trend ? `<text x="288" y="40" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="white" text-anchor="end" opacity="0.9">${trend}</text>` : ''}
    </svg>`;

    await ctx.addSvg(svg);
  },
};

// Register all built-in plugins
PluginRegistry.register(weatherPlugin);
PluginRegistry.register(codeSnippetPlugin);
PluginRegistry.register(quoteBlockPlugin);
PluginRegistry.register(statCardPlugin);

export const BUILTIN_PLUGINS = [weatherPlugin, codeSnippetPlugin, quoteBlockPlugin, statCardPlugin];
