export type User = {
    id: string,
    name: string,
    username: string,
    email: string,
    email_verified_at?: string | null,
    bio?: string | null,
    website?: string | null,
    created_at: string,
    updated_at: string,
    roles: string[],
}
