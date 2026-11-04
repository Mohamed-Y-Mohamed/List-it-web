// app/(secure)/List/[listId]/page.tsx
// The canonical web URL for a list: /List/<id>.

"use client";

import { useParams } from "next/navigation";
import ListDetailView from "@/components/List/ListDetailView";

export default function ListRoutePage() {
  const params = useParams();
  return <ListDetailView listId={(params?.listId as string) ?? ""} />;
}
