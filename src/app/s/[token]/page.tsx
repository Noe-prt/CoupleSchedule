import { CalendarApp } from "@/components/calendar-app";
export default async function SchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return <CalendarApp token={(await params).token} />;
}
