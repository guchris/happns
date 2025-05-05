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
import { useAuth } from "@/context/AuthContext"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

export default function AdminPage() {
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([])
  const { user, userData } = useAuth();

  const fetchPendingEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pending-events"))
      const events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PendingEvent[]
      setPendingEvents(events)
    } catch (error) {
      console.error("Error fetching pending events:", error)
    }
  }

  useEffect(() => {
    fetchPendingEvents()
  }, [])

  const hasPermission = user && userData?.role === "curator";
  if (!hasPermission) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar title="happns/admin" />
        <Separator />
        <div className="px-4">
          <Alert className="max-w-3xl my-6 mx-auto p-4">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertTitle>Not Authorized</AlertTitle>
            <AlertDescription>
              You do not have permission to view this page. Please <a href="/" className="text-blue-500">return to the homepage</a>.
            </AlertDescription>
          </Alert>
        </div>
        <Footer className="mt-auto" />
      </div>
    )
  }

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
            <DataTable 
              columns={columns} 
              data={pendingEvents} 
              onStatusChange={fetchPendingEvents}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}