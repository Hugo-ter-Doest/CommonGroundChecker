const remoteApiBaseUrl =
  process.env.URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

function createRemoteUrl(path: string, search: string) {
  return `${remoteApiBaseUrl}${path}${search}`;
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = createRemoteUrl("/api/repositories", request.url.includes("?") ? request.url.slice(request.url.indexOf("?")) : "");
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(request: Request) {
  const url = createRemoteUrl("/api/repositories", "");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
    },
    body: await request.text(),
  });

  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
