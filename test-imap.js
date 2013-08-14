var Imap = require('imap');
var async = require('async');
var inspect = require('util').inspect;
var MailParser = require("mailparser").MailParser;
var keys = require('./keys.js');
var xoauth2 = require('xoauth2');
var token;

xoauth2gen = xoauth2.createXOAuth2Generator({
  user: keys.IMAP_USER,
  clientId: keys.GOOGLE_ID,
  clientSecret: keys.GOOGLE_SECRET,
  refreshToken: keys.GOOGLE_TOKENS.refresh_token
});

async.series([
  // Generate a XOAUTH token
  function(cb) {
    xoauth2gen.getToken(function(err, t){
      if(err){
          return console.log(err);
      }
      token = t;
      cb()
    })
  },
  // Retrieve 10 first messages from the account
  function(cb) {
    var imap = new Imap({
      xoauth2:token,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', function() {
      imap.openBox('[Gmail]/All Mail', true, function(err, box) {
        if (err) throw err;
        var f = imap.seq.fetch('1:10', { bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT DATE)','TEXT'] });

        f.on('message', function(msg, seqno) {
          var buffer = '';

          msg.on('body', function(stream, info) {
            stream.on('data', function(chunk) {
              if(info.which === 'TEXT') {
                buffer += chunk.toString();
              } else {
                buffer = chunk.toString() + buffer;
              }
            });
          });

          msg.on('end', function() {
            parser = new MailParser();
            parser.on("end", function(mail_object) {
              console.log("From:", mail_object.from);
              console.log("Subject:", mail_object.subject);
              //console.log("Text body:", mail_object.text);
            });

            parser.write(buffer);
            parser.end();
          })
        });

        f.once('error', function(err) {
          console.log('Fetch error: ' + err);
        });
        f.once('end', function() {
          console.log('Done fetching all messages!');
          imap.end();
        });
      });
    });

    imap.once('error', function(err) {
      console.log(err);
    });

    imap.once('end', function(err) {
      cb();
    });

    imap.connect();
  },
], process.exit);
