"use strict";

/**
 * @param mailHeader {String} The content of a mail header
 * @return {Object} A correctly parsed mail with name and address keys
 */
module.exports.decomposeMails = function decomposeMails(mailHeader) {
  return mailHeader.split(',').map(function cleanPair(pair) {
    pair = pair.trim().replace(/\\t/, '');
    var obj = {};
    if(/<.*>/.test(pair)) {
      obj.name = pair.split('<')[0].trim();
      obj.address = pair.split('<')[1].split('>')[0];
    } else {
      obj.address = pair;
    }
    return obj;
  });
};
