import { env } from "@/lib/env";

export default function HomePage() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>Template MVP - Front</h1>
      <p>API URL: {env.NEXT_PUBLIC_API_URL}</p>
    </main>
  );
}
