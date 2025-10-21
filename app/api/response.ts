// app/api/response.ts
/**
 * Global response utilities used by API routes
 *
 * Usage:
 *   import { jsonResponse, errorResponse } from '@/app/api/response';
 *   return jsonResponse(resObj, 201);
 *
 * Notes:
 *   - Next.js app router supports the Response / NextResponse objects. We return NextResponse with JSON body.
 */

import { NextResponse } from "next/server";

export function jsonResponse(body: any, status = 200) {
  return NextResponse.json(body, { status });
}

export function errorResponse(
  {
    error,
    message,
    details,
    errorId,
  }: { error: string; message: string; details?: any; errorId?: string },
  status = 500
) {
  const payload: any = { error, message };
  if (details) payload.details = details;
  if (errorId) payload.errorId = errorId;
  return NextResponse.json(payload, { status });
}
