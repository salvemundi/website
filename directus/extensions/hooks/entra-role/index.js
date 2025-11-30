export default ({ action }, { logger }) => {
  logger.info("[entra-role] hook loaded");
  action("auth.login", async (meta = {}) => {
    const groups =
      meta.payload?.groups ??
      meta.payload?.claims?.groups ??
      meta.user?.auth_data?.groups ??
      [];
    logger.info(`[entra-role] auth.login user=${meta.user?.id || "n/a"} groups=${JSON.stringify(groups)}`);
  });
};
