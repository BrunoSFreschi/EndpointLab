import { delay } from "./utils.js";

export async function executeRequest(config) {
  const start = performance.now();

  const response = await fetch(config.url, {
    method: config.method,
    headers: config.headers,
    body: config.method === "GET" ? undefined : JSON.stringify(config.body)
  });

  const end = performance.now();

  let body;
  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  return {
    status: response.status,
    ok: response.ok,
    time: end - start,
    body
  };
}

export async function runBatch(config) {
  const results = [];

  for (let i = 0; i < config.iterations; i += 1) {
    const result = await executeRequest(config);
    results.push({ index: i + 1, ...result });

    if (i < config.iterations - 1 && config.intervalMs > 0) {
      await delay(config.intervalMs);
    }
  }

  return results;
}
