# Advanced Email Sender with Gemini

A sophisticated email automation tool that combines AI-powered email generation with bulk sending capabilities. This application allows users to upload recipient data via CSV, generate personalized email content using Google's Gemini AI, and schedule or send emails in bulk.

## Features

- 📊 CSV Upload: Import recipient data including company names, email addresses, locations, and products
- 🤖 AI-Powered Content: Generate professional email content using Google's Gemini AI
- 📝 Dynamic Personalization: Automatically personalizes emails with recipient-specific information
- ⏰ Scheduling Capabilities: Schedule emails for future delivery
- 📈 Real-time Preview: View and verify recipient data before sending
- ✉️ Bulk Sending: Send personalized emails to multiple recipients efficiently
- 📱 Responsive Design: Modern, mobile-friendly user interface

## Prerequisites

- Python 3.7 or higher
- Flask web framework
- Google Gemini API access
- SMTP-enabled email account (Gmail recommended)
- Modern web browser

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd advanced-email-sender
```

2. Install Python dependencies:
```bash
pip install flask flask-cors google-generativeai python-dotenv requests
```

3. Set up environment variables in a `.env` file:
```env
EMAIL_SENDER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
API_KEY=your-gemini-api-key
```

## Project Structure

```
advanced-email-sender/
├── static/
│   ├── style.css
│   └── script.js
├── templates/
│   └── index.html
├── app.py
└── README.md
```

## Usage

1. Start the Flask server:
```bash
python app.py
```

2. Open your web browser and navigate to `http://localhost:5000`

3. Upload your CSV file containing recipient information with the following headers:
   - Company Name
   - Email
   - Location
   - Products

4. Enter your email prompt in the text area and click "Generate with Gemini" to create AI-powered content

5. Review the generated email and recipient preview

6. Choose to either:
   - Send emails immediately using "Send Now"
   - Schedule emails for later using the datetime picker and "Schedule Emails"

## CSV Format

Your CSV file should follow this structure:
```csv
Company Name,Email,Location,Products
Acme Corp,contact@acme.com,New York,Widgets
```

## Placeholders

The system supports the following placeholders in email templates:
- `{Company Name}`: Replaced with the recipient's company name
- `{Location}`: Replaced with the recipient's location
- `{Products}`: Replaced with the recipient's products

## Security Notes

- Use app-specific passwords for Gmail
- Keep your `.env` file secure and never commit it to version control
- Regularly rotate API keys and credentials
- Implement rate limiting for production use

## Development

The application is built using:
- Frontend: HTML5, CSS3, JavaScript (with jQuery)
- Backend: Flask (Python)
- AI: Google Gemini API
- Email: SMTP via SSL

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini API for AI-powered content generation
- PapaParse for CSV parsing
- Lucide Icons for UI elements
