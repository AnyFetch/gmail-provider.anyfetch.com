"use strict";

module.exports.decomposeMails = function(mailHeader) {
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

