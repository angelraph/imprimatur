import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sitter } from "@/components/Sitter";
import { sittingView } from "@/lib/http";
import { getSitting } from "@/lib/store";

export const metadata: Metadata = { title: "Examination in progress" };
export const dynamic = "force-dynamic";

export default async function SittingPage({ params }: PageProps<"/sit/[id]">) {
  const { id } = await params;
  const sitting = await getSitting(id);
  if (!sitting) notFound();
  return <Sitter initial={sittingView(sitting)} />;
}
