const remoteApiBaseUrl =
  process.env.URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

function createRemoteUrl(path: string) {
  return `${remoteApiBaseUrl}${path}`;
}

export const runtime = "nodejs";

export async function GET() {
  const url = createRemoteUrl("/api/admin/scoring");
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
  const url = createRemoteUrl("/api/admin/scoring");
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
