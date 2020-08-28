const schema = {
  loading: {
    type: 'boolean',
    default: false,
  }
}

const pluginFactory = function(AbstractService) {

  return class PluginAudioBufferLoader extends AbstractService {
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
      this.server.stateManager.observe(async (schemaName, stateId, clientId) => {
        if (schemaName === `s:${this.name}`) {
          const state = await this.server.stateManager.attach(schemaName, stateId);

          this.states.set(clientId, state);
          state.onDetach(() => this.states.delete(clientId));
        }
      });

      this.started();
      this.ready()
    }
  }
}

export default pluginFactory;
