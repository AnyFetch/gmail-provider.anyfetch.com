'use strict';

require('should');

var decomposeMails = require('../lib/helpers/tools.js').decomposeMails;

describe("TOOLS decomposeMails", function () {
  it("should return good informations", function (done) {
    var mails = decomposeMails('Antoine Bolvy <antoine.bolvy@gmail.com>, Hugo Duroux <hugo@anyfetch.com>, antoine.bolvy@gmail.com');

    mails.should.have.lengthOf(2);

    mails[0].should.have.property('name', 'Antoine Bolvy');
    mails[0].should.have.property('address', 'antoine.bolvy@gmail.com');

    mails[1].should.have.property('name', 'Hugo Duroux');
    mails[1].should.have.property('address', 'hugo@anyfetch.com');

    done();
  });
});
