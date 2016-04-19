'use strict';
/**
 * Created by Adrian on 18-Apr-16.
 * performs the LESS-compiler on the given input-output-options tuplet
 */
const sass = require('node-sass'),
  path = require('path'),
  fs = require('fs');

module.exports = function(thorin, opt) {
  const logger = thorin.logger(opt.logger);
  /*
   * Do the actual compiler.
   * */
  return function compile(item, done) {
    let compileOpt = thorin.util.extend({
      file: path.normalize(item.input),
      outputStyle: 'compressed',
      filename: path.basename(item.input)
    }, opt.options);
    if (item.options) {
      compileOpt = thorin.util.extend(compileOpt, item.options);
    }
    fs.readFile(item.input, {encoding: 'utf8'}, (e, content) => {
      if (e) {
        return done && done(thorin.error('LESS.NOT_FOUND', `Input file ${item.input} does not exist.`), e);
      }
      compileOpt.content = content;
      sass.render(compileOpt, (e, output) => {
        if (e) {
          console.log(e);
          //logger.warn(`Failed to compile file ${e.filename}, line ${e.line}, col ${e.column}, index ${e.index}: ${e.message}`);
          return done && done(thorin.error(e));
        }
        fs.writeFile(item.output, output.css, {encoding: 'utf8'}, (e) => {
          if (e) {
            logger.trace(`Failed to write output to ${item.output}`, e);
            return done && done(e);
          }
          let outputFile = path.normalize(item.output);
          outputFile = outputFile.replace(thorin.root, '').replace(/\\/g,'/');
          outputFile = outputFile.substr(1);
          logger.trace(`Compiled ${outputFile}`);
          done && done();
        });
      });
    });
  }
};