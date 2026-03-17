declare module "better-auth" {
    interface User {
        first_name: string;
        last_name?: string;
        membership_status?: string;
        membership_expiry?: string;
        phone_number?: string;
        date_of_birth?: string;
        avatar?: string;
        minecraft_username?: string;
        committees?: any[];
    }
}

export {};
