from twilio.rest import Client
import os

account_sid = os.getenv("TWILIO_ACCOUNT_SID")
auth_token = os.getenv("TWILIO_AUTH_TOKEN")
twilio_from = os.getenv("TWILIO_PHONE_NUMBER")
to_number = "+56973670990"

if not account_sid or not auth_token or not twilio_from:
    print("Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or TWILIO_PHONE_NUMBER in environment.")
    raise SystemExit(1)

client = Client(account_sid, auth_token)

message = client.messages.create(
    body="Hola Nicolás, este es un SMS de prueba 🚀",
    from_=twilio_from,
    to=to_number
)

print("Mensaje enviado, SID:", message.sid)
