import dynamic from "next/dynamic";

const KnowledgeDetailPage = dynamic(() => import("./PageClient"), { ssr: false });

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <KnowledgeDetailPage params={params} />;
}
