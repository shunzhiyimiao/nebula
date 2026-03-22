import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

export function generateStaticParams() { return [{ nextauth: ["_"] }]; }
