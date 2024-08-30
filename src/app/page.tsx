import { cookies } from "next/headers"

// import { Mail } from "@/components/mail"
// import { accounts, mails } from "./data"

import { Separator } from "@/components/ui/separator"
import { Event } from "@/components/event"
import { events } from "./data"

export default function ExplorePage() {

  {/* Cookies Handling: retrieve layout and collapsed state from cookies */}
  const layout = cookies().get("react-resizable-panels:layout:mail")
  const collapsed = cookies().get("react-resizable-panels:collapsed")

  const defaultLayout = layout ? JSON.parse(layout.value) : undefined
  const defaultCollapsed = collapsed ? JSON.parse(collapsed.value) : undefined

  return (
    <>
      {/* Mobile View */}
      {/* <div className="md:hidden">
        <Image
          src="/examples/mail-dark.png"
          width={1280}
          height={727}
          alt="Mail"
          className="hidden dark:block"
        />
        <Image
          src="/examples/mail-light.png"
          width={1280}
          height={727}
          alt="Mail"
          className="block dark:hidden"
        />
      </div> */}

      {/* Desktop View */}
      {/* <div className="hidden flex-col md:flex">
        <Mail
          mails={mails}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </div> */}
      <div className="hidden h-full flex-col md:flex">
        <div className="container flex items-center py-4 px-4 md:h-14">
          <h2 className="text-lg font-semibold">happns/seattle</h2>
        </div>
        <Separator />
        <Event
          events={events}
          defaultLayout={defaultLayout}
          defaultCollapsed={defaultCollapsed}
          navCollapsedSize={4}
        />
      </div>
    </>
  );
}
