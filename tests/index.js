const path = require('path');
const assert = require('chai').assert;

const Server = require('@soundworks/core/server/index.js').Server;
const ServerAbstractExperience = require('@soundworks/core/server').AbstractExperience;

const Client = require('@soundworks/core/client').Client;
const ClientAbstractExperience = require('@soundworks/core/client').AbstractExperience;

const serverPluginFactory = require('../server/index.js').default;
const clientPluginFactory = require('../client/index.js').default;


const config = require('./config');

class ServerTestExperience extends ServerAbstractExperience {
  constructor(server, clientTypes) {
    super(server, clientTypes);
  }

  start() {
    console.log('server-side experience started');
  }
}

class ClientTestExperience extends ClientAbstractExperience {
  constructor(client) {
    super(client);
  }

  start() {
    console.log('client-side experience started');
  }
}

let server;
let client;

(async function() {
  // ---------------------------------------------------
  // server
  // ---------------------------------------------------
  server = new Server();

  // this is boring... should not be mandatory
  server.templateEngine = { compile: () => {} };
  server.templateDirectory = _dirname;

  // server.pluginManager.register('logger', serverPluginFactory, {
  //   directory: path.join(process.cwd(), 'logs'),
  // });

  await server.init(config);
  const serverTestExperience = new ServerTestExperience(server, 'test');

  await server.start();
  serverTestExperience.start();

  // ---------------------------------------------------
  // client
  // ---------------------------------------------------
  client = new Client();

  // client.pluginManager.register('logger', serverPluginFactory, {
  //   directory: path.join(process.cwd(), 'logs'),
  // });

  await client.init({
    ...config,
    clientType: 'test',
  });
  const clientTestExperience = new ClientTestExperience(client);

  await client.start();
  clientTestExperience.start();
}());


































