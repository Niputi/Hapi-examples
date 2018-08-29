const Path = require("path");
const Hapi = require("hapi");
const Inert = require("inert");

const server = new Hapi.Server({
    port: 3000,
    routes: {
        files: {
            relativeTo: Path.join(__dirname, "public")
        }
    }
});

const provision = async () => {
    await server.register(Inert);

    server.route([
        {
            method: "GET",
            path: "/",
            handler: {
                file: "./index.html"
            }
        }, {
            method: "PUT",
            path: "/upload/server",
            options: {
                payload: {
                    maxBytes: 209715200
                }
            },
            handler: (request, h) => {
                const payload = request.payload;

                console.log(payload);

                return "Received your data";
            }
        }
    ]);

    await server.start();

    console.log("Server running at:", server.info.uri);
};

provision();
