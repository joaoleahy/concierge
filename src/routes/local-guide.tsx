import { createFileRoute } from "@tanstack/react-router";
import LocalGuide from "@/pages/LocalGuide";

export const Route = createFileRoute("/local-guide")({
  component: LocalGuide,
});
