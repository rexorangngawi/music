const limit = 30;
const window = 60 * 1000;

const store = new Map();

export function ratelimit(ip) {

  const now = Date.now();

  if (!store.has(ip)) {
    store.set(ip,{count:1,start:now});
    return true;
  }

  const data = store.get(ip);

  if (now - data.start > window) {
    store.set(ip,{count:1,start:now});
    return true;
  }

  if (data.count >= limit) {
    return false;
  }

  data.count++;
  return true;
}