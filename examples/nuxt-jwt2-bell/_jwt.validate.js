const Boom = require("boom");

module.exports = async function (decoded, request, h) {

    const client = request.redis.client;

    try {
        const session_check = await client.get(decoded.id);

        const session = JSON.parse(session_check);

        if (session.valid === true) {
            return {isValid: true, credentials: session};
        } else {
            return {isValid: false, Boom: Boom.unauthorized()};
        }
    } catch (err) {
        return {isValid: false, Boom: Boom.unauthorized(err)};
    }
};
