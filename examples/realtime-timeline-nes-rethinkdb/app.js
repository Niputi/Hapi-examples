"use strict"

const Hapi = require("hapi")
const Faker = require("faker")

const launchServer = async function() {
  const server = new Hapi.Server({
    port: 3000
  })

  await server.register([
    {
      plugin: require("inert")
    },
    {
      plugin: require("nes")
    },
    {
      plugin: require("hapi-rethinkdb"),
      options: { db: "hapi_timeline" }
    }
  ])

  server.method("db.setupChangefeedPush", () => {
    server.rethink
      .table("entries")
      .changes()
      .run({ cursor: true })
      .then(function(result) {
        result.each((err, item) => {
          server.publish("/timeline/updates", item.new_val)
        })
      })
  })

  //Serve static files in 'public' directory
  server.route({
    method: "GET",
    path: "/{param*}",
    handler: {
      directory: {
        path: "public"
      }
    }
  })

  //Return the last 5 entries stored in db
  server.route({
    method: "GET",
    path: "/timeline",
    handler: request => {
      const r = request.rethink
      return r
        .table("entries")
        .orderBy(r.desc(r.row("createdAt")))
        .limit(5)
        .run()
        .then(result => {
          return result
        })
    }
  })

  //Create a new entry
  server.route({
    method: "GET",
    path: "/timeline/createEntry",
    handler: () => {
      const entry = {
        createdAt: new Date(),
        user: Faker.name.findName(),
        message: Faker.lorem.paragraph(),
        avatar: Faker.image.avatar()
      }

      return server.rethink
        .table("entries")
        .insert(entry)
        .run()
        .then(function(result) {
          return 204
        })
    }
  })

  //Declare the subscription to timeline updates the client can subscribe to
  server.subscription("/timeline/updates")

  await server.start()
  server.methods.db.setupChangefeedPush()

  console.log(`Server started at ${server.info.uri}`)
}

launchServer().catch(err => {
  console.error(err)
  process.exit(1)
})
