import { auth } from "./auth";

type User = typeof auth.$Infer.Session.user & {
    first_name: string;
    last_name?: string;
    membership_status?: string;
    membership_expiry?: string;
    phone_number?: string;
    date_of_birth?: string;
};

type Session = typeof auth.$Infer.Session & {
    user: User;
};

declare module "./auth" {
    interface Auth {
        session: Session;
        user: User;
    }
}
