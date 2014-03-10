import sys
import gmail
import json

account = sys.argv[1]
token = sys.argv[2]
from_uid = sys.argv[3]

g = gmail.authenticate(account, token)

mails = g.all_mail().mail(custom_query=['UID', '%s:*' % from_uid])

# Start our JSON array
print "["

for mail in mails:
    mail.fetch()

    hex_id = str(hex(int(mail.thread_id)))[2:]

    json_mail = {
        "id": mail.message_id,
        "uid": mail.uid,
        "thread_id": mail.thread_id,
        "url": "https://mail.google.com/mail/b/%s/?cm#all/%s" % (account, hex_id),
        "from": mail.fr,
        "to": mail.to,
        "subject": mail.subject,
        "text": mail.body,
        "html": mail.html,
    }

    print json.dumps(json_mail)

    if mail != mails[-1]:
        print ","

# End of JSON
print "]"