// Ayrı, bağımsız logging script'i: renkli, seviyeli konsol logger'ı. Render gibi
// platformlarda uygulama stdout/stderr'i doğrudan terminale/log paneline aktığı
// için ekstra bir servise (Sentry, Datadog vb.) ihtiyaç olmadan buradan izlenebilir.
const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

const COLORS = {
  DEBUG: '\x1b[90m', // gri
  INFO: '\x1b[36m', // camgöbeği
  WARN: '\x1b[33m', // sarı
  ERROR: '\x1b[31m', // kırmızı
};
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';

// LOG_LEVEL ortam değişkeniyle ayarlanabilir (ör. production'da yalnızca WARN+
// görmek için LOG_LEVEL=WARN); tanımsızsa INFO ve üzeri gösterilir.
const MIN_LEVEL = LEVELS[(process.env.LOG_LEVEL || 'INFO').toUpperCase()] ?? LEVELS.INFO;

function timestamp() {
  return new Date().toISOString();
}

function formatMeta(meta) {
  if (meta == null) return '';
  if (meta instanceof Error) return `\n${meta.stack}`;
  if (typeof meta === 'string') return ` ${meta}`;
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ` ${String(meta)}`;
  }
}

function write(level, message, meta) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const color = COLORS[level];
  const stream = level === 'ERROR' ? process.stderr : process.stdout;
  stream.write(`${DIM}${timestamp()}${RESET} ${color}${level.padEnd(5)}${RESET} ${message}${formatMeta(meta)}\n`);
}

const logger = {
  debug: (message, meta) => write('DEBUG', message, meta),
  info: (message, meta) => write('INFO', message, meta),
  warn: (message, meta) => write('WARN', message, meta),
  error: (message, meta) => write('ERROR', message, meta),
};

module.exports = logger;
