"use client"

import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { columns, PendingEvent } from "./columns"
import { DataTable } from "@/components/data-table"

// App Imports
import { TopBar } from "@/components/top-bar"
import Footer from "@/components/footer"
import NotificationForm from "@/components/form-notification"

// Shadcn Imports
import { Separator } from "@/components/ui/separator"

export default function AdminPage() {
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPendingEvents() {
      try {
        const querySnapshot = await getDocs(collection(db, "pending-events"))
        const events = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as PendingEvent[]
        setPendingEvents(events)
      } catch (error) {
        console.error("Error fetching pending events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingEvents()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar title={`happns/admin`} />
      <Separator />
      <div className="flex-1 px-4 py-8 mx-auto space-y-8 max-w-[880px] w-full">
        <NotificationForm />
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Pending Events</h2>
          {loading ? (
            <p>Loading pending events...</p>
          ) : (
            <DataTable columns={columns} data={pendingEvents} />
          )}
        </div>
      </div>
      <Footer className="mt-auto" />
    </div>
  )
}