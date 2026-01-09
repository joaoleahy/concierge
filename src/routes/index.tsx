import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import LandingPage from "@/pages/LandingPage";
import GuestHome from "@/pages/GuestHome";

const searchSchema = z.object({
  room: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  component: HomeRoute,
});

function HomeRoute() {
  const { room } = useSearch({ from: "/" });

  // If there's a room parameter, show the guest app
  if (room) {
    return <GuestHome />;
  }

  // Otherwise show the landing page
  return <LandingPage />;
}
