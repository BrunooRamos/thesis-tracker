import { prisma } from "@/lib/prisma";
import { MeetingsPage } from "@/components/meetings/meetings-page";

export default async function MeetingsRoute() {
  const [meetingNotes, users] = await Promise.all([
    prisma.meetingNote.findMany({
      include: { author: true },
      orderBy: { date: "desc" },
    }),
    prisma.user.findMany(),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <MeetingsPage
        initialMeetings={JSON.parse(JSON.stringify(meetingNotes))}
        users={JSON.parse(JSON.stringify(users))}
      />
    </div>
  );
}
