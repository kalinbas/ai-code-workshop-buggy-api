import { resetState } from "../app/data.js";
import { createApp } from "../app/server.js";

export function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function withClient(fn) {
  resetState();
  const server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  async function request(method, path, { headers = {}, body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      body: await response.json(),
    };
  }

  try {
    return await fn({
      get: (path, options) => request("GET", path, options),
      post: (path, options) => request("POST", path, options),
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    resetState();
  }
}
