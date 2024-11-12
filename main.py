from flask import Flask, request, jsonify
import smtplib
import ssl
import google.generativeai as genai
from email.message import EmailMessage
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Define the email sender credentials
email_sender = os.getenv('EMAIL_SENDER')
email_password = os.getenv('EMAIL_PASSWORD')
api_key = os.getenv('API_KEY') 

genai.configure(api_key=api_key)

@app.route('/send-email', methods=['POST'])
def send_email():
    try:
        data = request.json
        email_body = data.get("emailBody")
        recipients = data.get("recipients", [])
        
        if not recipients or not email_body:
            return jsonify({"error": "Missing required data"}), 400

        success_count = 0
        failed_count = 0
        failed_emails = []
        
        for recipient in recipients:
            try:
                # Get recipient email and validate
                recipient_email = recipient.get('email', '').strip()
                if not recipient_email:
                    failed_count += 1
                    continue

                # Personalize email body for this recipient
                personalized_body = email_body
                personalized_body = personalized_body.replace(
                    "{Company Name}", 
                    recipient.get('companyName', 'Valued Customer').strip()
                )
                personalized_body = personalized_body.replace(
                    "{Products}", 
                    recipient.get('products', '').strip()
                )
                personalized_body = personalized_body.replace(
                    "{Location}", 
                    recipient.get('location', '').strip()
                )

                # Create the email message
                em = EmailMessage()
                em['From'] = email_sender
                em['To'] = recipient_email
                em['Subject'] = f"Important Information for {recipient.get('companyName', 'Your Company')}"
                em.set_content(personalized_body)

                # Send the email using SSL
                context = ssl.create_default_context()
                with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
                    smtp.login(email_sender, email_password)
                    smtp.sendmail(email_sender, recipient_email, em.as_string())
                success_count += 1
                
            except Exception as e:
                failed_count += 1
                failed_emails.append(recipient_email)
                print(f"Error sending to {recipient_email}: {str(e)}")

        return jsonify({
            "message": f"Emails sent successfully to {success_count} recipients. Failed: {failed_count}",
            "success_count": success_count,
            "failed_count": failed_count,
            "failed_emails": failed_emails
        }), 200

    except Exception as e:
        return jsonify({
            "error": f"Error processing request: {str(e)}",
            "success_count": 0,
            "failed_count": len(recipients) if recipients else 0
        }), 500
@app.route('/generate-email', methods=['POST'])
def generate_email():
    try:
        data = request.json
        prompt = data.get("prompt", "")
        
        # Enhanced prompt to ensure proper placeholder usage
        enhanced_prompt = f"""
        Generate a professional email based on the following prompt:
        {prompt}
        
        Important: Use only these exact placeholders:
        - {{Company Name}} for company name
        - {{Products}} for products
        - {{Location}} for location
        
        The email should be formal and incorporate these placeholders naturally.
        """

        request_data = {
            "contents": [{
                "parts": [{
                    "text": enhanced_prompt
                }]
            }]
        }

        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key={api_key}",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            generated_email = response.json().get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', "")
            return jsonify({"email_body": generated_email})
        else:
            return jsonify({"error": "Failed to generate email"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)