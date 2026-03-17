import { Metadata } from "next";
import InvitationsClient from "./invitations-client";

export const metadata: Metadata = {
  title: "Manage Invitations",
  description: "View and manage member invitations",
};

export default function InvitationsPage() {
  return (
    <div className="w-full py-6 px-4 md:px-6">
      <InvitationsClient />
    </div>
  );
}
