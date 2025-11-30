// extensions/hooks/entra-role/index.js
export default ({ action }, { services, getSchema, logger }) => {
  const { UsersService } = services;

  // Map your Entra groups (by name or OID) to Directus role IDs
  const roleMapByName = {
    "91d77972-2695-4b7b-a0a0-df7d6523a087": "fc3b226a-62f8-437a-a7fa-7c631e48aaff",
    "b16d93c7-42ef-412e-afb3-f6cbe487d0e0": "a0e51e23-15ef-4e04-a188-5c483484b0be",
  };
  const defaultRoleId = "82fe4735-4724-48af-9d37-ee85e1c5441e";

  // Fires on every successful login (including SSO)
  action("auth.login", async (meta, ctx) => {
    try {
      const userId = meta.user?.id;
      if (!userId) return;

      // Where to get groups:
      // 1) For OpenID/OAuth2 providers, provider payload is exposed on create/update events.
      //    But on auth.login, Directus still includes the last known auth data on the user record.
      //    Try both.
      const idTokenGroups =
        meta.payload?.groups ||
        meta.payload?.claims?.groups || // some providers structure it like this
        meta.user?.auth_data?.groups || // last stored auth_data on the user
        [];

      // Normalize to strings
      const groups = Array.isArray(idTokenGroups)
        ? idTokenGroups.map(String)
        : [];

      // Choose role
      let newRole = defaultRoleId;
      if (groups.includes("Commissieleiders")) {
        newRole = roleMapByName["Commissieleiders"];
      } else if (groups.includes("Bestuur") || groups.includes("Salve Mundi")) {
        newRole = roleMapByName["Bestuur"];
      }

      // Update user role if needed
      const usersService = new UsersService({
        schema: await getSchema(),
        // omit accountability to act as admin, or pass { admin: true }
      });

      // Only update when it actually changes
      if (meta.user.role !== newRole) {
        await usersService.updateOne(userId, { role: newRole });
        logger?.info(`Updated role for ${userId} based on Entra groups`);
      }
    } catch (e) {
      logger?.error(`entra-role hook failed: ${e.message}`);
    }
  });

  // Optional: when the SSO provider refreshes auth data, capture fresh claims
  // Available for openid/oauth2 and includes providerPayload (ID token claims).
  // Use this to stash the latest groups into user.auth_data so the login hook above can read them.
  action("auth.update", async (meta, { services, getSchema }) => {
    try {
      // meta: { identifier, provider, providerPayload }
      const claims = meta?.providerPayload || {};
      const groups =
        claims.groups || claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/groups"] || [];
      if (!meta?.identifier || !Array.isArray(groups)) return;

      // Update auth_data on the user (identifier is the user email for SSO providers)
      const { UsersService } = services;
      const usersService = new UsersService({ schema: await getSchema() });

      const [user] = await usersService.readByQuery({
        filter: { email: { _eq: meta.identifier } },
        limit: 1,
        fields: ["id", "auth_data"],
      });

      if (user?.id) {
        const auth_data = { ...(user.auth_data || {}), groups };
        await usersService.updateOne(user.id, { auth_data });
      }
    } catch {}
  });
};
