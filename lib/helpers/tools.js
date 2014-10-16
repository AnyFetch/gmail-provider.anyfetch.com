"use strict";

/**
 * @param mailHeader {String} The content of a mail header
 * @return {Object} A correctly parsed mail with name and address keys
 */
module.exports.decomposeMails = function decomposeMails(mailHeader) {
  var pairs = mailHeader.match(/[^,]*?\s<[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}>/gi) || [];
  var parsedMails = pairs.map(function cleanPair(pair) {
    pair = pair.trim().replace(/\\t/, '');
    var mail = {
      name: pair.split('<')[0].trim().replace(/"/g, ""),
      address: pair.split('<')[1].split('>')[0]
    };

    if(mail.name === mail.address) {
      delete mail.name;
    }

    return mail;
  });
  var singles = mailHeader.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\s*,?/gi) || [];
  parsedMails = parsedMails.concat(singles.map(function cleanMail(mail) {
    return {
      address: mail.replace(/,/, "").trim()
    };
  }));

  for(var i = 0; i < parsedMails.length; i += 1) {
    for(var j = i + 1; j < parsedMails.length; j += 1) {
      if((parsedMails[i].name && parsedMails[i].name === parsedMails[j].name) ||
        (parsedMails[i].address && parsedMails[i].address === parsedMails[j].address)) {

        ['name', 'address'].forEach(function(property) {
          parsedMails[i][property] = parsedMails[i][property] || parsedMails[j][property];

          if(!parsedMails[i][property]) {
            delete parsedMails[i][property];
          }
        });

        parsedMails.splice(j, 1);
        j -= 1;
      }
    }
  }

  return parsedMails;
};

