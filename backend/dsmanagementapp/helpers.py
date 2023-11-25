# from sendgrid import SendGridAPIClient
# from sendgrid.helpers.mail import Mail

# def send_email(to_email, subject, html_content):
#     message = Mail(
#         from_email='u2005373@siswa.um.edu.my',
#         to_emails=to_email,
#         subject=subject,
#         html_content=html_content)
#     try:
#         sg = SendGridAPIClient('YOUR_SENDGRID_API_KEY')
#         response = sg.send(message)
#         print(response.status_code)
#         print(response.body)
#         print(response.headers)
#     except Exception as e:
#         print(e.message)

# Call send_email where you were previously calling EmailMultiAlternatives and email.send()
