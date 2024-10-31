import { redirect } from "next/navigation";
import { clerkClient } from "@clerk/nextjs/server";

import { SearchUsers } from "./SearchUsers";

import { checkRole } from "@/lib/clerkRoles";
import { removeRole, setRole } from "@/app/actions/createClerkAction";

export default async function AdminDashboard(params: { searchParams: { search?: string } }) {
  if (!checkRole("admin")) {
    redirect("/");
  }

  const query = params.searchParams.search;

  const users = query ? (await clerkClient().users.getUserList({ query })).data : [];

  return (
    <>
      <p>This is the protected admin dashboard restricted to users with the `admin` role.</p>

      <SearchUsers />

      {users.map((user) => {
        return (
          <div key={user.id}>
            <div>
              {user.firstName} {user.lastName}
            </div>

            <div>{user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress}</div>

            <div>{user.publicMetadata.role as string}</div>

            <form action={setRole}>
              <input name="id" type="hidden" value={user.id} />
              <input name="role" type="hidden" value="admin" />
              <button type="submit">Make Admin</button>
            </form>

            <form action={setRole}>
              <input name="id" type="hidden" value={user.id} />
              <input name="role" type="hidden" value="moderator" />
              <button type="submit">Make Moderator</button>
            </form>

            <form action={removeRole}>
              <input name="id" type="hidden" value={user.id} />
              <button type="submit">Remove Role</button>
            </form>
          </div>
        );
      })}
    </>
  );
}
