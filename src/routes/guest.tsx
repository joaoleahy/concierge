import { createFileRoute } from "@tanstack/react-router";
import GuestHome from "@/pages/GuestHome";

export const Route = createFileRoute("/guest")({
  component: GuestHome,
});
