"use strict";

/**
 * @param mailHeader {String} The content of a mail header
 * @return {Object} A correctly parsed mail with name and address keys
 */
module.exports.decomposeMails = function decomposeMails(mailHeader) {
  return mailHeader
    .match(/.*?\s<[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}>/gi)
    .map(function cleanPair(pair) {
    pair = pair.trim().replace(/\\t/, '');
    return {
      name: pair.split('<')[0].trim().replace(/"/g, ""),
      address: pair.split('<')[1].split('>')[0]
    };
  });
};

