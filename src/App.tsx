import { Cloud } from "lucide-react"
import { useState } from "react"

import { ApplicationsView } from "@/components/applications-view"
import { ResourceTable } from "@/components/resource-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resources } from "@/data/resources"

type Tab = "resources" | "applications"

export function App() {
  const [tab, setTab] = useState<Tab>("resources")

  return (
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
            <ResourceTable resources={resources} />
          </TabsContent>
          <TabsContent value="applications" className="pt-4">
            <ApplicationsView onBrowseResources={() => setTab("resources")} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
