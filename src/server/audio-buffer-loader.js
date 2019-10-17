const schema = {
  loading: {
    type: 'boolean',
    default: false,
  }
}

const serviceFactory = function(Service) {

  return class AudioBufferLoader extends Service {
    constructor(server, name, options) {
      super(server, name);

      const defaults = {
        // default config options
      }

      this.options = this.configure(defaults, options);
      this.states = new Map();

      this.server.stateManager.registerSchema(`s:${this.name}`, schema);
    }

    start() {
      this.server.stateManager.observe(async (schemaName, clientId) => {
        if (schemaName === `s:${this.name}`) {
          const state = await this.server.stateManager.attach(schemaName, clientId);

          this.states.set(clientId, state);

          state.onDetach(() => {
            this.states.delete(clientId);
          });
        }
      });

      this.started();
      this.ready()
    }
  }
}

// not mandatory
serviceFactory.defaultName = 'audio-buffer-loader';

export default serviceFactory;
