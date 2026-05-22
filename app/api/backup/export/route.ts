import { NextResponse } from "next/server";
import { exportHouseholdBackup } from "@/lib/actions/backup";
import { checkRateLimit } from "@/lib/rate-limit";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, "backup");
  if (limited) return limited;

  try {
    const data = await exportHouseholdBackup();
    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="gharkhata-backup-${data.exportedAt.slice(0, 10)}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
