import cloneDeep from 'lodash.clonedeep';
import { SuperLoader } from 'waves-loaders';

/**
 * only match wav, mp3 and json files
 */
function isFilePath(str, supportedExtensionRegExp) {
  return (typeof str === 'string' && supportedExtensionRegExp.test(str));
}


function decomposePathObj(obj, pathList, refList, supportedExtensionRegExp, dirs = false) {
  for (let key in obj) {
    key = Array.isArray(obj) ? parseInt(key) : key;
    const value = obj[key];

    if (isFilePath(value, supportedExtensionRegExp)) {
      const ref = { obj, key };
      let index = pathList.indexOf(value);

      if (index === -1) {
        const length = pathList.push(value);

        index = length - 1;
        refList[index] = [];
      }

      refList[index].push(ref);

      obj[key] = null;
    } else if (typeof value === 'object') {
      decomposePathObj(value, pathList, refList, supportedExtensionRegExp, dirs);
    }
  }
}

function populateRefList(refList, loadedObjList) {
  const length = refList.length;

  if (length !== loadedObjList.length) {
    throw new Error(`[${SERVICE_ID}] Loaded Buffers do not match file definion`);
  }

  for (let i = 0; i < length; i++) {
    const refs = refList[i];

    for (let j = 0, l = refs.length; j < l; j++) {
      const ref = refs[j];
      const obj = ref.obj;
      const key = ref.key;

      obj[key] = loadedObjList[i];
    }
  }
}

function prefixPaths(pathList, prefix) {
  // test absolute urls (or protocol relative)
  const isAbsolute = /^https?:\/\/|^\/\//i;

  pathList = pathList.map((path) => {
    if (isAbsolute.test(path) || prefix === '/') {
      return path;
    } else {
      return prefix + path;
    }
  });

  return pathList;
}

const pluginFactory = function(AbstractPlugin) {

  /**
   * Interface for the client `'audio-buffer-loader'` service.
   * @todo - review
   *
   * This service allows to preload files and store them into buffers
   * before the beginning of the experience. Audio files will be converted and
   * stored into AudioBuffer objects.
   *
   * @param {Object} options
   * @param {Array<String>} options.assetsDomain - Prefix concatenated to all
   *  given paths.
   * @param {Object} options.data - Initial data structure to containing paths
   *  to the files to load.
   *
   * @memberof module:soundworks/client
   * @example
   * // require and configure the `audio-buffer-loader` inside the experience
   * // constructor
   * // Defining a single array of audio files results in a single
   * // array of audio buffers associated to the identifier `default`.
   *
   * // There are two different ways to specify the files to be loaded and the
   * // data structure in which the loaded data objects are arranged:
   * //
   * // (1.) With the 'files' option, the files and structure are defined by an
   * // object of any depth that contains file paths. All specified files are
   * // loaded and the loaded data objects are stored into an object of the same
   * // structure as the definition object.
   *
   * this.audioBufferManager = this.require('audio-buffer-loader', { data: [
   *   'sounds/drums/kick.mp3',
   *   'sounds/drums/snare.mp3'
   * ]});
   *
   * this.audioBufferManager = this.require('audio-buffer-loader', { data: {
   *   kick: 'sounds/kick_44kHz.mp3',
   *   snare: 'sounds/808snare.mp3'
   * }});
   *
   * this.audioBufferManager = this.require('audio-buffer-loader', { data: {
   *   latin: {
   *     audio: 'loops/sheila-e-raspberry.mp3',
   *     markers: 'loops/sheila-e-raspberry-markers.json',
   *   },
   *   jazz: {
   *     audio: 'loops/nussbaum-shuffle.mp3',
   *     markers: 'loops/nussbaum-shuffle-markers.json',
   *   },
   * }});
   *
   * this.audioBufferManager = this.require('audio-buffer-loader', { data: {
   *   instruments: [
   *     'sounds/instruments/kick_44kHz.mp3',
   *     'sounds/instruments/808snare.mp3'],
   *   loops: [
   *     'sounds/loops/sheila-e-raspberry.mp3',
   *     'sounds/loops/nussbaum-shuffle.mp3'],
   * }});
   */
  return class PluginAudioBufferLoader extends AbstractPlugin {
    constructor(client, name, options) {
      super(client, name);

      const defaults = {
        assetsDomain: '',
        data: null,
        // supported media formats + json
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Supported_media_formats
        supportedExtensionRegExp: /\.(wav|mp3|json)$/i,
      };

      this.definitions = {};
      this.data = {};
      this.options = this.configure(defaults, options);

      this._loader = new SuperLoader();
    }

    async start() {
      this.state = await this.client.stateManager.create(`s:${this.name}`);
      this.started();

      if (this.options.data) {
        try {
          await this.load(this.options.data);
        } catch(err) {
          return this.error('file not found');
        }
      }

      this.ready();
    }

    /**
     * Load files inplace of the given data structure. Each path to a `.mp3`, `.wav`
     * or `.json` file is replaced with its corresponding AudioBuffer or JSON object
     * and mixed (using `Object.assign`) into `this.data`, if `override`` is set to
     * `true` the internal `this.data` is replaced with the new object.
     * This behavior give a simple and predictible way to handle the caching
     * of AudioBuffer`s.
     *
     * @param {Object} defObj - Definition of files to load
     * @returns {Promise} - Promise resolved with the resulting data structure
     */
    async load(defObj, override = false) {
      this.state.set({ loading: true });

      const pathList = [];
      const refList = [];

      if (typeof defObj === 'string') {
        defObj = [defObj];
      }

      const dataObj = cloneDeep(defObj);
      // decompose def given object
      decomposePathObj(dataObj, pathList, refList, this.options.supportedExtensionRegExp, false);
      const prefixedPathList = prefixPaths(pathList, this.options.assetsDomain);
      // allow special caracters in filename (ex: sound-A#.mp3)
      // @note - if we apply on the whole path, it can conflict with
      // the way polka router works, so we only encode the basename.
      // @note - probably this should be done in waves-loaders
      const prefixedURI = prefixedPathList.map(p => {
        const parts = p.split(/\//);
        const basename = parts.pop();
        const uri = encodeURIComponent(basename);
        parts.push(uri);
        return parts.join('/');
      });

      if (prefixedURI.length) {
        try {
          const loadedObjList = await this._loader.load(prefixedURI);

          // repopulate dataObj with loaded buffer and json
          populateRefList(refList, loadedObjList);
          // mix into this data
          if (override === false) {
            Object.assign(this.definitions, defObj);
            Object.assign(this.data, dataObj);
          } else {
            this.definitions = defObj;
            this.data = dataObj;
          }
        } catch(err) {
          return Promise.reject(err);
        }
      }

      this.state.set({ loading: false });

      return Promise.resolve(dataObj);
    }

    subscribe(callback) {
      const unsubscribe = this.state.subscribe(callback);
    }

    getValues() {
      return this.state.getValues();
    }

    get(name) {
      return this.state.get(name);
    }
  }
}

export default pluginFactory;
