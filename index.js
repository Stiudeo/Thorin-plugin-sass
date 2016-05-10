'use strict';
const path = require('path');
/**
 * Created by Adrian on 19-Apr-16.
 *
 * The sass plugin is a utility plugin that will watch the given sass input for changes and compile it into css.
 */
const initCompile = require('./lib/compile'),
  initWatcher = require('./lib/watcher');

module.exports = function(thorin, opt, pluginName) {
  opt = thorin.util.extend({
    logger: pluginName || 'sass',
    watch: true,                     // should we watch the file system for any changes.
    debug: false,
    files: [//{
      //input: 'app/scss/main.scss',  // input file entry
      //output: 'public/main.css'     // output entry
    //}
    ],
    options: {}   // the less specific options
  }, opt);
  if(typeof opt.path === 'string') opt.path = [opt.path];
  if(!(opt.files instanceof Array)) opt.files = [opt.files];

  // init our stuff
  opt.compile = initCompile(thorin, opt);
  const watchItem = initWatcher(thorin, opt);

  // step one, for each file, figure out the full path.
  let fileList = [],  // curated file list.
    isStarted = false;
  const sassObj = {};
  const logger = thorin.logger(opt.logger);

  /* Manually add a new input/output file to process */
  sassObj.add = function AddFiles(item, _opt, _done) {
    if(typeof item !== 'object' || !item || !item.input || !item.output) {
      logger.warn('add() requires an object with {input, output}', item);
      return this;
    }
    if(!path.isAbsolute(item.input)) {
      item.input = path.normalize(thorin.root + '/' + item.input);
    }
    if(!path.isAbsolute(item.output)) {
      item.output = path.normalize(thorin.root + '/' + item.output);
    }
    if(typeof _opt === 'object' && _opt) {
      item.options = _opt;
    }
    try {
      thorin.util.fs.ensureDirSync(path.dirname(item.output));
    } catch(e) {
      logger.warn(`Failed to ensure that dir ${item.output} exists`, e);
    }
    if(isStarted) {
      opt.compile(item, (typeof _opt === 'function' ? _opt : _done));
      if(opt.watch) {
        watchItem(item);
      }
    } else {
      fileList.push(item);
    }
    return sassObj;
  }


  for(let i=0; i < opt.files.length; i++) {
    let item = opt.files[i];
    sassObj.add(item);
  }

  sassObj.run = function DoRun(done) {
    let calls = [];
    fileList.forEach((item) => {
      calls.push((done) => {
        opt.compile(item, (e) => {
          done(e);
          if(opt.watch) {
            watchItem(item);
          }
        });
      });
    });
    thorin.util.async.series(calls, (e) => {
      if(e) {
        logger.error('Failed to compile less files.');
      }
      done(e);
    });
  };
  /*
   * Ensure that we have app/styles folder.
   * */
  sassObj.setup = function DoSetup(done) {
    const SETUP_DIRECTORIES = ['app/styles'];
    for(let i=0; i < SETUP_DIRECTORIES.length; i++) {
      try {
        thorin.util.fs.ensureDirSync(path.normalize(thorin.root + '/' + SETUP_DIRECTORIES[i]));
      } catch(e) {}
    }
    done();
  }
  

  return sassObj;
};
module.exports.publicName = 'sass';