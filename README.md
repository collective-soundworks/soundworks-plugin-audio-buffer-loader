# `@soundworks/plugin-audio-buffer-loader`

> [`soundworks`](https://github.com/collective-soundworks/soundworks) plugin for loading and managing audio buffers and related json data. Currently limited to `.mp3`, `.wav` or `.json` formats to enforce browser compatibility and support (meaning support for Safari...)

## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Example](#example)
- [Usage](#usage)
  * [Server installation](#server-installation)
    + [Registering the plugin](#registering-the-plugin)
    + [Requiring the plugin](#requiring-the-plugin)
  * [Client installation](#client-installation)
    + [Registering the plugin](#registering-the-plugin-1)
    + [Requiring the plugin](#requiring-the-plugin-1)
  * [Loading files](#loading-files)
  * [Tracking loading status](#tracking-loading-status)
- [Credits](#credits)
- [License](#license)

<!-- tocstop -->

## Installation

```sh
npm install @soundworks/plugin-audio-buffer-loader --save
```

## Example

A working example can be found in the [https://github.com/collective-soundworks/soundworks-examples](https://github.com/collective-soundworks/soundworks-examples) repository.

## Usage

### Server installation

#### Registering the plugin

```js
// index.js
import { Server } from '@soundworks/core/server';
import pluginAudioBufferLoaderFactory from '@soundworks/plugin-audio-buffer-loader/server';

const server = new Server();
server.pluginManager.register('audio-buffer-loader', pluginAudioBufferLoaderFactory, {}, []);
```

#### Requiring the plugin

```js
// MyExperience.js
import { AbstractExperience } from '@soundworks/core/server';

class MyExperience extends AbstractExperience {
  constructor(server, clientType) {
    super(server, clientType);
    // require plugin in the experience
    this.audioBufferLoader = this.require('audio-buffer-loader');
  }
}
```

### Client installation

#### Registering the plugin

```js
// index.js
import { Client } from '@soundworks/core/client';
import pluginAudioBufferLoaderFactory from '@soundworks/plugin-audio-buffer-loader/client';

const client = new Client();
client.pluginManager.register('audio-buffer-loader', pluginAudioBufferLoaderFactory, {
  // declare files that should be loading when Experience starts, if any
  data: {
    'file-1': 'sounds/88-fingers-short.mp3',
    'file-2': 'sounds/drops-short.mp3',
    'file-3': 'sounds/plane-short.mp3',
  }
}, []);
```

#### Requiring the plugin

```js
// MyExperience.js
import { Experience } from '@soundworks/core/client';

class MyExperience extends Experience {
  constructor(client) {
    super(client);
    // require plugin in the experience
    this.audioBufferLoader = this.require('audio-buffer-loader');
  }

  async start() {
    console.log(this.audioBufferLoader.data);
    // {
    //   'file-1': AudioBuffer,
    //   'file-2': AudioBuffer,
    //   'file-3': AudioBuffer,
    // }
  }
}
```

### Loading files

The following API is only available client-side.

This method use the given data structure to load files, the resulting object is a copy of the given object where each path to a `.mp3`, `.wav` or `.json` file is replaced with its corresponding AudioBuffer or JSON object. The resulting object is returned, and is by default  mixed into `this.audioBufferLoader.data` using `Object.assign`. If `override` is set to `true`, `this.audioBufferLoader.data` is completely replaced with the new object.
This behavior aims to give a simple and predictable way to deal with the caching of `AudioBuffers`, for example reusing a given key will drop the old `AudioBuffer` and replace it with the new one.

```js
/**
 * @async
 * @param {Object} defObj - The data structure containing the link to the
 *   audio and json files to load
 * @param {Boolean} [override=false] - if true replace the internal cache with
 *   the new object instead of mixing it using `Object.assign`
 * @return defObj mutated with link replaced by `AudioBuffers`
 */
const loadedData = await this.audioBufferLoader.load({
  'file-1': 'sounds/88-fingers-short.mp3',
  'file-2': 'sounds/drops-short.mp3',
  'file-3': 'sounds/plane-short.mp3',
}, true);
// loadedData = {
//   'file-1': AudioBuffer,
//   'file-2': AudioBuffer,
//   'file-3': AudioBuffer,
// }
```

### Getting and subscribing to loading status change

You may want to track loading status to display a waiting screen or whatever feedback.

```js
this.audioBufferLoader.subscribe(state => {
  console.log(state.loading); // > true || false
});

const loadingState = this.audioBufferLoader.get('loading');
// > true || false
```

### Keeping in sync with a directory using the [`@soundworks/plugin-filesystem`](https://github.com/collective-soundworks/soundworks-plugin-filesystem)

In working situation you might want to add and remove sound files from your application to make tests. The [`@soundworks/plugin-filesystem`](https://github.com/collective-soundworks/soundworks-plugin-filesystem) can be used in conjunction with the `@soundworks/plugin-audio-buffer-loader` to make sure your clients are always synced with the content of a given directory.

Assuming the [`@soundworks/plugin-filesystem`](https://github.com/collective-soundworks/soundworks-plugin-filesystem) is configured to track changes in a directory named `soundbank`, the client can simply observe these changes to keep `AudioBuffers` synced as follow:

```js
// MyExperience.js
import { Experience } from '@soundworks/core/client';

class MyExperience extends AbstractExperience {
  constructor(client) {
    super(client);

    this.filesystem = this.require('filesystem');
    this.audioBufferLoader = this.require('audio-buffer-loader');
  }

  async start() {
    super.start();
    // subscribe to directory updates
    this.filesystem.subscribe(() => this.loadSoundbank());
    // initialize with the current content of the directory
    this.loadSoundbank();
  }

  async loadSoundbank() {
    const soundbankTree = this.filesystem.get('soundbank');
    // format tree to create a simple data object
    const defObj = {};

    soundbankTree.children.forEach(leaf => {
      if (leaf.type === 'file') {
        defObj[leaf.name] = leaf.url;
      }
    });

    const loadedObject = await this.audioBufferLoader.load(defObj, true);
    // do something with your buffers
  }
}
```

## Credits

The code has been initiated in the framework of the WAVE and CoSiMa research projects, funded by the French National Research Agency (ANR).

## License

BSD-3-Clause
