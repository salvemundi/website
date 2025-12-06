import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

const handler = NextAuth({
    providers: [
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile: _profile }) {
            // Persist the OAuth access_token to the token right after signin
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
            }
            return token;
        },
        async session({ session, token }) {
            // Send properties to the client, like an access_token from a provider.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (session as any).accessToken = token.accessToken;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (session as any).idToken = token.idToken;
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin', // Custom sign-in page if needed, or default
    },
});

export { handler as GET, handler as POST };
