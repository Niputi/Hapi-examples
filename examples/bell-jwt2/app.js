//@ts-nocheck
require("dotenv").config();
const Hapi = require("hapi");
const JWT = require("jsonwebtoken");
const uuid = require("uuid/v4");
const Boom = require("boom");

const _bellAuth = require("./_bellAuth.config");
const validate = require("./_jwt.validate");

const launchServer = async () => {
    const server = new Hapi.Server({port: 3000});

    await server.register([
        {
            plugin: require("hapi-dev-errors"),
            options: {
                showErrors: process.env.NODE_ENV !== "production"
            }
        }, {
            plugin: require("bell")
        }, {
            plugin: require("hapi-auth-jwt2")
        }, {
            plugin: require("hapi-redis2"),
            options: {
                decorate: true
            }
        }
    ]);

    server.state("token", {
        ttl: Number(process.env.login_ttl), // expires a day from today
        encoding: "none", // we already used JWT to encode
        isSecure: (process.env.isSecure) === "true", // warm & fuzzy feelings
        isHttpOnly: (process.env.forceHttps) === "true", // prevent client alteration
        clearInvalid: true, // remove invalid cookies
        strictHeader: true // don't allow violations of RFC 6265
    });

    await server.auth.strategy("discord", "bell", _bellAuth);
    console.log("info", "Registered auth strategy: discord auth");
    server.auth.strategy("jwt", "jwt", {
        key: [process.env.jwt_secret], // Never Share your secret key
        validate: validate, // validate function defined above
        verifyOptions: {
            algorithms: ["HS256"]
        }, // pick a strong algorithm
        errorFunc: ({message}) => {
            throw Boom.unauthorized(message || "Invalid or expired JWT");
        }
    });

    server.auth.default("jwt");

    // login route
    server.route({
        method: [
            "GET", "POST"
        ],
        path: "/login",
        options: {
            auth: "discord"
        },
        handler: async (request, h) => {
            const session = {
                valid: true, // this will be set to false when the person logs out
                data: request.auth.credentials, // discord user data
                id: uuid(), // a random session id
                exp: Number(new Date().getTime() + process.env.login_ttl) // expires in 24 hours
            };

            try {
                const client = request.redis.client;
                await client.set(session.id, JSON.stringify(session), "EX", Number(process.env.login_ttl) / 1000);

                const token = JWT.sign(session, process.env.jwt_secret);

                h.state("token", token);
                return h.redirect("/protected").header("Authorization", token);
            } catch (err) {
                throw Boom.internal(err);
            }
        }
    });

    // protected route
    server.route({
        method: [
            "GET", "POST"
        ],
        path: "/protected",
        config: {
            auth: "jwt"
        },
        handler: async (request, h) => {
            return h.response("protected");
        }
    });

    // public route
    server.route({
        method: ["GET"],
        path: "/",
        config: {
            auth: false
        },
        handler: async (request, h) => {
            return "public";
        }
    });

    // Logout route
    server.route({
        method: ["GET"],
        path: "/logout",
        config: {
            auth: "jwt"
        },
        handler: (request, h) => {
            const jwt = JWT.decode(request.state.token);
            const client = request.redis.client;
            client.del(jwt.id);

            h.unstate("token");
            return h.redirect("/");
        }
    });

    await server.start();
    console.log(`Server started at ${server.info.uri}`);
};

launchServer().catch(err => {
    console.error(err);
    process.exit(1);
});
