type Props = {
    section: string
    className?: string
}

export default function SettingsContent({ section, className }: Props) {
    return (
        <main className={`flex-1 p-6 ${className ?? ""}`}>
            <h1 className="text-2xl font-bold mb-4">{section}</h1>

            {section === "Account" && (
                <div>
                    <p>👤 Username: admin</p>
                    <p>📧 Email: admin@example.com</p>
                </div>
            )}

            {section === "Permissions" && (
                <div>
                    <p>🔐 Role: Admin</p>
                    <p>✅ Access: Full</p>
                </div>
            )}

            {section === "Applications" && (
                <div>
                    <p>📦 Connected Apps: GitHub, Slack</p>
                </div>
            )}

            {section === "Connections" && (
                <div>
                    <p>🔗 Active Connections: PostgreSQL, Redis</p>
                </div>
            )}
        </main>
    )
}
