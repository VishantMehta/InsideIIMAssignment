import fs from 'fs';
import path from 'path';

// Store in backend/data/cache.json
const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');

// Initialize cache directory and file if they don't exist
const initCache = () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  if (!fs.existsSync(CACHE_FILE)) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({}), 'utf8');
  }
};

const readCache = () => {
  try {
    initCache();
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading cache:', error);
    return {};
  }
};

const writeCache = (data) => {
  try {
    initCache();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing cache:', error);
  }
};

export const getCache = (key) => {
  const cache = readCache();
  const entry = cache[key];
  
  if (!entry) return null;
  
  // Check TTL if exists (optional, keeping it forever for demo purposes unless ttlMs is passed and expired)
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    delete cache[key];
    writeCache(cache);
    return null;
  }
  
  return entry.value;
};

export const setCache = (key, value, ttlMs = null) => {
  const cache = readCache();
  
  const entry = {
    value,
    timestamp: Date.now()
  };
  
  if (ttlMs) {
    entry.expiresAt = Date.now() + ttlMs;
  }
  
  cache[key] = entry;
  writeCache(cache);
};
