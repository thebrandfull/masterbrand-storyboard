import { NextResponse } from "next/server"
import { getBrands } from "@/lib/actions/brands"

export const dynamic = "force-dynamic"

export async function GET() {
  const result = await getBrands()

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error || "Failed to load brands",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    brands: result.brands ?? [],
  })
}
