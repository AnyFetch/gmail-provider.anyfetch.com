var Imap = require('imap');
var inspect = require('util').inspect;
var MailParser = require("mailparser").MailParser;
var keys = require('./keys.js');

var imap = new Imap({
  user: keys.IMAP_USER,
  password: keys.IMAP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

function openInbox(cb) {
  imap.openBox('[Gmail]/All Mail', true, cb);
}

console.log("###############################################################################################################################################");

imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) throw err;
    var f = imap.seq.fetch('1:' + box.messages.total, { bodies: ['HEADER.FIELDS (FROM TO CC SUBJECT DATE)','TEXT'] });

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

imap.connect();
