# `@soundworks/service-checkin`

> `soundworks` service dedicated at loading audio files and related JSON data, retrieving `AudioBuffer`s

## Install

```sh
npm install --save @soundworks/service-audio-buffer-loader
```

## Usage

### client

#### registering the service

```js
// index.js
import { Client } from '@soundworks/core/client';
import serviceAudioBufferLoaderFactory from '@soundworks/service-audio-buffer-loader/client';

const client = new Client();
client.registerService('audio-buffer-loader', serviceAudioBufferLoaderFactory, {
  data: {
    audioFile: 'sounds/my-audio-file.mp3',
    relatedData: 'sounds/my-audio-file.json'
  }
}, []);
```

#### requiring the service 

```js
// MyExperience.js
import { Experience } from '@soundworks/core/client';

class MyExperience extends Experience {
  constructor() {
    super();
    this.audioBufferLoader = this.require('audio-buffer-loader');
  }

  async start() {
    const buffer = this.audioBufferLoader.data.audioFile;
    const relatedData = this.audioBufferLoader.data.relatedData;

    // ...
    const newData = await this.audioBufferLoader.load({
      otherFile: 'sounds/other-file.wav',
    });
  }
}
```

#### options

- `data`: description of the data to be loaded, can be any POJO, in each url pointing to a `.wav`, `.mp3` or `.json` file will be replaced by the corresponding `AudioBuffer` or data object.
- `assetsDomain`: prefix to be added to all urls

### server

#### registering the service

```js
// index.js
import { Server } from '@soundworks/core/server';
import serviceAudioBufferLoaderFactory from '@soundworks/service-audio-buffer-loader/server';

const server = new Server();
server.registerService('audio-buffer-loader', serviceAudioBufferLoaderFactory, {}, []);
```

#### requiring the service 

```js
// MyExperience.js
import { Experience } from '@soundworks/core/server';

class MyExperience extends Experience {
  constructor() {
    super();
    this.audioBufferLoader = this.require('audio-buffer-loader');
  }
}
```

#### options

## License

BSD-3-Clause

