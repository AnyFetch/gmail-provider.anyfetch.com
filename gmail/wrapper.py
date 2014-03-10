import sys
import gmail
import json

account = sys.argv[1]
token = sys.argv[2]
from_uid = sys.argv[3]

g = gmail.authenticate(account, token)

mails = g.inbox().mail(custom_query=['UID', '11:*'])

# Start our JSON array
print "["

for mail in mails:
    mail.fetch()

    json_mail = {
        "from": mail.fr,
        "to": mail.to,
        "subject": mail.subject,
        "text": mail.body,
        "html": mail.html,
        "thread_id": mail.thread_id,
        "message_id": mail.message_id,
        "uid": mail.uid,
    }

    print json.dumps(json_mail)

    if mail != mails[-1]:
        print ","

# End of JSON
print "]"
