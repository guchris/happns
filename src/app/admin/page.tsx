"use client"

import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { TopBar } from "@/components/top-bar"
import NotificationForm from "@/components/form-notification"
import { DataTable } from "@/components/data-table"
import { columns, PendingEvent } from "./columns"
import Footer from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

export default function AdminPage() {
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPendingEvents = async () => {
      const querySnapshot = await getDocs(collection(db, "pending-events"))
      const events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PendingEvent[]
      setPendingEvents(events)
      setLoading(false)
    }

    fetchPendingEvents()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="happns/admin" />
      <Separator />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList>
            <TabsTrigger value="notifications">send notifications</TabsTrigger>
            <TabsTrigger value="pending-events">scraped events</TabsTrigger>
          </TabsList>
          <TabsContent value="notifications" className="space-y-4">
            <NotificationForm />
          </TabsContent>
          <TabsContent value="pending-events" className="space-y-4">
            {loading ? (
              <div>Loading...</div>
            ) : (
              <DataTable columns={columns} data={pendingEvents} />
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}