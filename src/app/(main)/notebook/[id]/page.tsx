import dynamic from "next/dynamic";

const NotebookDetailPage = dynamic(() => import("./PageClient"), { ssr: false });

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <NotebookDetailPage params={params} />;
}
