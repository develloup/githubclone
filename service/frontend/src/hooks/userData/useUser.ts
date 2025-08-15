import { ConnectionType, UserConnection, UserType } from "@/types/typesUser"
import { useQuery } from "@tanstack/react-query"

export function useLoggedInUser() {
    return useQuery({
        queryKey: ["loggedinuser"],
        queryFn: async () => {
            const res = await fetch("/api/loggedinuser")
            if (!res.ok) throw new Error("Failed to fetch logged in user")
            return res.json()
        },
    })
}

const fetchJSON = async <T>(url: string): Promise<T> => {
    const res = await fetch(url)
    if (!res.ok) {
        throw new Error(`Fetch error: ${res.status} ${res.statusText}`)
    }
    return res.json()
}

export function useUserDetails(userId?: string) {
    return useQuery<UserType>({
        queryKey: ["user", userId],
        queryFn: () => fetchJSON<UserType>(`/api/users/${userId}`),
        enabled: !!userId, // only if userId is available
    })
}

export function useUserConnections(userId?: string) {
    return useQuery<UserConnection[]>({
        queryKey: ["user-connections", userId],
        queryFn: () => fetchJSON<UserConnection[]>(`/api/users/${userId}/connections`),
        enabled: !!userId, // only if userId is available
    })
}

export function useUnassignedConnections(userId?: string) {
    return useQuery<ConnectionType[]>({
        queryKey: ["unassigned-connections", userId],
        queryFn: () => fetchJSON<ConnectionType[]>(`/api/connections?exclude=${userId}`),
        enabled: !!userId, // only if userId is available
    })
}
