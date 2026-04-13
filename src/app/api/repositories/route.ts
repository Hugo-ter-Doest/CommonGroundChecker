import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const limitParam = req.nextUrl.searchParams.get("limit");
    const parsedLimit = Number(limitParam ?? "12");
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(50, parsedLimit))
      : 12;

    const repositories = await prisma.repo.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        analyses: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: {
            checkedAt: true,
            score: true,
          },
        },
        _count: {
          select: { analyses: true },
        },
      },
    });

    return NextResponse.json({
      repositories: repositories.map((repository) => ({
        id: repository.id,
        owner: repository.owner,
        name: repository.name,
        repoUrl: repository.repoUrl,
        helmChartLocations: repository.helmChartLocations,
        dockerLocations: repository.dockerLocations,
        apiSpecificationLocations: repository.apiSpecificationLocations,
        documentationLocations: repository.documentationLocations,
        updatedAt: repository.updatedAt,
        analysisCount: repository._count.analyses,
        latestAnalysis: repository.analyses[0]
          ? {
              checkedAt: repository.analyses[0].checkedAt,
              score: repository.analyses[0].score,
            }
          : null,
      })),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
