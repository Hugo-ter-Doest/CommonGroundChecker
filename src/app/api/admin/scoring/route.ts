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
  const requestBody = await request.text();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
    },
    body: requestBody,
  });

  const body = await response.text();
  if (response.status === 200) {
    try {
      const json = JSON.parse(body) as Record<string, unknown>;
      if (
        requestBody &&
        typeof json === "object" &&
        json !== null &&
        (json.categoryWeights === undefined || json.categoryWeights === null || typeof json.categoryWeights !== "object")
      ) {
        const requestJson = JSON.parse(requestBody) as Record<string, unknown>;
        if (
          requestJson.categoryWeights &&
          typeof requestJson.categoryWeights === "object"
        ) {
          json.categoryWeights = requestJson.categoryWeights;
        }
      }
      return new Response(JSON.stringify(json), {
        status: response.status,
        headers: {
          "content-type": response.headers.get("content-type") ?? "application/json",
        },
      });
    } catch {
      // if parsing fails, fall back to raw body
    }
  }

  return new Response(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
