"""
Return all mail and attachment from the user in JSON,
Separating them by "\n\n".
Returning a real JSON structure would explode any memory.

Usage:
python wrapper.py <account-email> <xoauth-token> <first-uid>
"""

import uuid
import sys
from gmail import gmail
import json
import re
import base64


def integrate_cid_in_html(mail):
    def insert_cid(image_tag):
        cid = image_tag.group(1)
        for attachment in mail.attachments:
            if attachment.name.startswith(cid):
                extension = attachment.name[attachment.name.rfind('.') + 1:]
                if extension == 'jpeg':
                    extension = 'jpg'
                image = base64.b64encode(attachment.payload)
                mail.attachments.remove(attachment)

                return re.sub('src="[^"]+"', 'src="data:image/' + extension + ';base64,' + image + '"', image_tag.group(0))

        return image_tag.group(0)

    mail.html = re.sub(r'<img[^>]*\"cid:([^"]+)\"[^>]*>', insert_cid, mail.html or "")


account = sys.argv[1]
token = sys.argv[2]
from_uid = sys.argv[3]
reverse = len(sys.argv) > 4 and sys.argv[4] == "reverse"

g = gmail.authenticate(account, token)

# Find the mailbox with the "\All" attribute
all_mail_name = [name for name, m in g.mailboxes.items() if "\\All" in m.attrs][0]
all_mail = g.mailbox(all_mail_name)

if reverse:
    span = "1:%s" % from_uid
else:
    span = "%s:*" % from_uid

mails = all_mail.mail(custom_query=['UID', span])

if reverse:
    mails.reverse()

# By default, mailbox keep a cache of their messages.
# However this get really heavy pretty quick and leads to huge memory consumption.
# So we manually clean the cache.
all_mail.messages = {}


while len(mails) > 0:
    mail = mails.pop(0)
    mail.fetch()

    integrate_cid_in_html(mail)

    hex_id = str(hex(int(mail.thread_id)))[2:]

    json_mail = {
        "_type": "mail",
        "id": mail.message_id,
        "uid": mail.uid,
        "thread_id": mail.thread_id,
        "date": mail.sent_at.isoformat(),
        "url": "https://mail.google.com/mail/b/%s/?cm#all/%s" % (account, hex_id),
        "from": mail.fr,
        "to": mail.to,
        "subject": mail.subject,
        "text": mail.body,
        "html": mail.html,
        "attachments": [a.name for a in mail.attachments if a.size is not None]
    }

    print json.dumps(json_mail)

    for attachment in mail.attachments:
        if attachment.size is not None and attachment.name is not None:
            path = "/tmp/attachment-" + str(uuid.uuid4())
            attachment.save(path)

            json_attachment = {
                "_type": "attachment",
                "mail_id": json_mail['id'],
                "mail_url": json_mail['url'],
                "date": json_mail['date'],
                "name": attachment.name,
                "path": path
            }

            print "\n\n"
            print json.dumps(json_attachment)

    if len(mails) > 0:
        print "\n\n"

    del mail
