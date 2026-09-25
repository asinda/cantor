"use client";
import dynamic from "next/dynamic";
import spec from "@/openapi/spec.json";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div style={{ background: "#fff", minHeight: "100vh" }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
