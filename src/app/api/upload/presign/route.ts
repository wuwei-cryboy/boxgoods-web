// app/api/upload/presign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPresignedUploadUrl, generateObjectKey } from "@/lib/storage";
import { z } from "zod";

const presignSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().startsWith("image/"),
  bucket: z.enum(["product-images", "avatars", "documents"]).default("product-images"),
  maxSize: z.number().max(10_000_000).default(5_000_000),
});

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { filename, contentType, bucket, maxSize } = presignSchema.parse(body);

  const key = generateObjectKey(`users/${user.id}`, filename);

  const { url } = await getPresignedUploadUrl({
    bucket,
    key,
    contentType,
    expiresIn: 3600,
    conditions: [
      { "content-length-range": 0, maxSize },
      ["starts-with", "$Content-Type", "image/"],
    ],
  });

  return NextResponse.json({ url, key, bucket });
}