const remoteApiBaseUrl =
  process.env.URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

function createRemoteUrl(path: string) {
  return `${remoteApiBaseUrl}${path}`;
}

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ repoId: string }> }
) {
  const { params } = await context;
  const url = createRemoteUrl(`/api/repositories/${encodeURIComponent(params.repoId)}/analyses`);
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
