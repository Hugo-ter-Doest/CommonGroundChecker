import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function createCorsResponse(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin");
  if (origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", CORS_HEADERS["Access-Control-Allow-Methods"]);
  response.headers.set("Access-Control-Allow-Headers", CORS_HEADERS["Access-Control-Allow-Headers"]);
  return response;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    const response = NextResponse.json(null, { status: 204 });
    return createCorsResponse(request, response);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
