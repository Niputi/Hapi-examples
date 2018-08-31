import Cookie from "cookie";

export default(req, res) => {
    const initProps = {};

    if (req && req.headers && req.headers.cookie) {
        const cookies = req.headers.cookie;

        if (typeof cookies === "string") {
            const cookiesJSON = Cookie.parse(cookies);

            initProps.token = cookiesJSON.token;
        }
    }

    if (typeof initProps.token === "undefined") {
        res.writeHead(302, {Location: "/login"});
        res.end();
    }
    return initProps;
};
