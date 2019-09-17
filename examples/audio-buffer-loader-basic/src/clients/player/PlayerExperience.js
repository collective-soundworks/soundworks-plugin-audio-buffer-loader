import { Experience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import {
  renderAudioBufferLoaderService,
  renderErroredAudioBufferLoaderService
} from './serviceViews';


class PlayerExperience extends Experience {
  constructor(client, options = {}, $container, errored) {
    super(client);

    this.options = options;
    this.$container = $container;
    this.errored = errored;

    this.audioBufferLoader = this.require('audio-buffer-loader');

    // render services
    this.client.serviceManager.observe(status => {
      if (status['audio-buffer-loader'] === 'started') {
        renderAudioBufferLoaderService(this.options, this.$container);
      } else if (status['audio-buffer-loader'] === 'errored') {
        renderErroredAudioBufferLoaderService(this.options, this.$container);
      }
    });
  }

  start() {
    super.start();

    // force errored view for debugging
    if (this.errored) {
      renderErroredAudioBufferLoaderService(this.options, this.$container);
      return;
    }

    this.audioBufferLoader.state.subscribe(updates => {
      const { data, definitions } = this.audioBufferLoader;

      if (updates.loading) {
        this.renderApp('loading...', data, definitions);
      } else {
        this.renderApp('loaded', data, definitions);
      }
    });

    setTimeout(() => {
      this.audioBufferLoader.load({ a: 'audio/c.mp3' });

      setTimeout(() => {
        this.audioBufferLoader.load({
          c: 'audio/c.mp3',
          arr: 'audio/c.mp3',
        });
      }, 2000);
    }, 2000);
  }

  renderApp(msg, data, definitions) {
    render(html`
      <div class="screen aligner">
        <div>
          <h1>${msg}</h1>
          <br />
          <pre style="text-align: left"><code>${definitions ? JSON.stringify(definitions, null, 2) : ''}</code></pre>
          <br />
          <pre style="text-align: left"><code>${data ? Object.keys(data).map(k => `${k}: ${data[k]}\n`) : ''}</code></pre>
        </div>
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
