module.exports = {
    provider: "discord",
    password: process.env.Bell_Password,
    isSecure: process.env.isSecure === "true",
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    scope: process.env.bellAuth_scope,
    forceHttps: process.env.forceHttps === "true"
};
