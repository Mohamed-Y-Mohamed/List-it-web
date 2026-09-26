// app/(secure)/List/page.tsx
// Query-param form of the list screen: /List?id=<id>.
//
// This exists for the native build. Capacitor serves the exported bundle as
// static files, so a route segment that was never prerendered — /List/<someId> —
// simply is not on disk and 404s. A single prerendered /List page that reads the
// id from the query string works for any list. The web app keeps using
// /List/<id>; see `listHref`.

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ListDetailView from "@/components/List/ListDetailView";

function ListQueryPage() {
  const searchParams = useSearchParams();
  const listId = searchParams.get("id") ?? "";

  return <ListDetailView listId={listId} />;
}

export default function ListPage() {
  // useSearchParams needs a Suspense boundary to be prerenderable.
  return (
    <Suspense fallback={null}>
      <ListQueryPage />
    </Suspense>
  );
}
