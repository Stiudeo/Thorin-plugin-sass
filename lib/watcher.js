'use strict';
const fs = require('fs'),
  path = require('path');
/**
 * Created by Adrian on 18-Apr-16.
 */
module.exports = function (thorin, opt) {
  const logger = thorin.logger(opt.logger);
  const watchHandles = {};  //hash of path:item

  return function doWatch(item, watchPath) {
    let basePath = path.dirname(item.input);
    if (typeof watchPath === 'string' && watchPath) {
      basePath = path.normalize(watchPath);
    }
    if (typeof watchHandles[basePath] !== 'undefined') {
      watchHandles[basePath].push(item);
      return;
    }
    watchHandles[basePath] = [item];
    let isPause = false;
    fs.watch(basePath, {
      recursive: true
    }, (event, file) => {
      if (file.indexOf('.scss') === -1 && file.indexOf('.sass') === -1) return;
      if (isPause) return;
      isPause = true;
      setTimeout(() => {
        isPause = false;
      }, 100);
      for (let i = 0; i < watchHandles[basePath].length; i++) {
        opt.compile(watchHandles[basePath][i]);
      }
    });
  }
}