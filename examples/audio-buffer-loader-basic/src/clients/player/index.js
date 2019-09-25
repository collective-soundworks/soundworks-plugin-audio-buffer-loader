import '@babel/polyfill';
import { Client } from '@soundworks/core/client';
import audioBufferLoaderServiceFactory from '@soundworks/service-audio-buffer-loader/client';
import PlayerExperience from './PlayerExperience';

async function init($container, index) {
  try {
    const config = window.soundworksConfig;
    const client = new Client();

    client.registerService('audio-buffer-loader', audioBufferLoaderServiceFactory, {
      assetsDomain: config.env.assetsDomain,
      data: {
        'a#': 'audio/a#.mp3', // in public folder
        aJson: 'audio/a.json',
        cApp: 'my-project/audio/c.mp3', // in an additionnal public projet folder
        arr: [
          'audio/b.mp3',
          'my-project/audio/d.mp3',
          'my-project/audio/d.json',
        ]
      },
    }, []);

    await client.init(config);

    const errored = (index === 1);
    const playerExperience = new PlayerExperience(client, config, $container, errored);

    $container.classList.remove('loading');

    await client.start()
    playerExperience.start();

    // Basic QoS
    client.socket.addListener('close', () => {
      setTimeout(() => window.location.reload(true), 2000);
    });

    // Basic QoS - (this one is boring in development)
    if (config.env.type === 'production') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          window.location.reload(true);
        }
      }, false);
    }
  } catch(err) {
    console.error(err);
  }
}

window.addEventListener('load', async () => {
  const $container = document.querySelector('#container');
  const numClients = 1;

  if (numClients > 1) {
    for (let i = 0; i < numClients; i++) {
      const $div = document.createElement('div');
      $div.classList.add('emulate', 'loading');
      $container.appendChild($div);
      $container.classList.remove('loading')

      init($div, i);
    }
  } else {
    init($container, 0);
  }
});
