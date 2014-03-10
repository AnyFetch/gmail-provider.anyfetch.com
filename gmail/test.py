import gmail
import json

g = gmail.authenticate("test.cluestr@gmail.com", "ya29.1.AADtN_W1FextCLPrI8aZx2kS-jAL-SSZ5nnlAskJnlZFdbVpo3sdVcMY8T5SH0WB6mw")

mails = g.inbox().mail(custom_query=['UID', '11:*'])

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
