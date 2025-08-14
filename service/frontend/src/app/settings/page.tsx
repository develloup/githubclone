"use client";

import SettingsContent from "@/components/SettingsContent"
import SettingsSidebar from "@/components/SettingsSidebar"
import { useState } from "react"


export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("Account")

  return (
    <div className="flex max-w-[1500px] mx-auto p-6 mt-12 min-h-screen bg-muted/50">
      <SettingsSidebar className="w-[25%]" active={activeSection} onSelect={setActiveSection} />
      <SettingsContent className="w-[75%]" section={activeSection} />
    </div>
  )
}
