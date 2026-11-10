import { Cloud } from "lucide-react"
import { useState } from "react"

import { ApplicationsView } from "@/components/applications-view"
import { ResourceTable } from "@/components/resource-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster, toast } from "@/components/ui/toast"
import { resources } from "@/data/resources"
import type { Application, ApplicationDraft } from "@/domain"

type Tab = "resources" | "applications"

export function App() {
  const [tab, setTab] = useState<Tab>("resources")
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>()

  const createApplication = (draft: ApplicationDraft) => {
    const application = { id: crypto.randomUUID(), ...draft }
    setApplications((current) => [...current, application])
    setSelectedApplicationId(application.id)
    setTab("applications")
    toast.add({
      type: "success",
      title: `Created Application "${application.name}"`,
    })
  }

  return (
    <Toaster>
      <div className="bg-background min-h-svh">
        <header className="border-b">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <Cloud className="text-primary size-5" aria-hidden />
              <h1 className="font-semibold">Cloud Inventory</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">
          <Tabs value={tab} onValueChange={(value: Tab) => setTab(value)}>
            <TabsList>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
            </TabsList>
            <TabsContent value="resources" keepMounted className="pt-4">
              <ResourceTable
                resources={resources}
                applications={applications}
                onCreateApplication={createApplication}
              />
            </TabsContent>
            <TabsContent value="applications" className="pt-4">
              <ApplicationsView
                applications={applications}
                resources={resources}
                selectedApplicationId={selectedApplicationId}
                onSelectApplication={setSelectedApplicationId}
                onBrowseResources={() => setTab("resources")}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </Toaster>
  )
}
