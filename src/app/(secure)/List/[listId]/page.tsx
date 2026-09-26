// app/(secure)/List/[listId]/page.tsx
// The canonical web URL for a list: /List/<id>.
//
// The screen itself lives in `@/components/List/ListDetailView`, because the
// native build reaches it through `/List?id=<id>` instead. A static export can
// only serve paths that existed at build time, and list ids are per-user, so this
// route is excluded from the native bundle entirely — see scripts/build-native.mjs.

"use client";

import { useParams } from "next/navigation";
import ListDetailView from "@/components/List/ListDetailView";

export default function ListRoutePage() {
  const params = useParams();
  return <ListDetailView listId={(params?.listId as string) ?? ""} />;
}
