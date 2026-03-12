const cachettl = 10 * 60 * 1000;
const cache = new Map();

export function getCache(key) {
  const data = cache.get(key);

  if (!data) return null;

  if (Date.now() > data.expire) {
    cache.delete(key);
    return null;
  }

  return data.value;
}

export function setCache(key, value) {
  cache.set(key, {
    value,
    expire: Date.now() + cachettl
  });
}