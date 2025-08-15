"use client";

import SettingsContent from "@/components/SettingsContent"
import SettingsSidebar from "@/components/SettingsSidebar"
import { useLoggedInUser, useUnassignedConnections, useUserConnections, useUserDetails } from "@/hooks/userData/useUser";
import { useState } from "react"


export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("Account")

  const { data: loggedInUser, isLoading: loadingUser } = useLoggedInUser()
  const userId = loggedInUser?.id

  const { data: userDetails, isLoading: loadingDetails } = useUserDetails(userId)
  const { data: userConnections } = useUserConnections(userId)
  const { data: unassignedConnections } = useUnassignedConnections(userId)

  if (loadingUser || loadingDetails) return <div>Loading user data...</div>

  return (
    <div className="flex max-w-[1500px] mx-auto p-6 mt-12 min-h-screen bg-muted/50">
      <SettingsSidebar className="w-[25%]" active={activeSection} onSelect={setActiveSection} />
      <SettingsContent
        className="w-[75%]"
        section={activeSection}
        user={userDetails}
        userConnections={userConnections}
        unassignedConnections={unassignedConnections} />
    </div>
  )
}
