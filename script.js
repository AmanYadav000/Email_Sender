let csvData = [];

// Function to handle CSV file upload
$("#csv-upload").click(function() {
    let file = document.getElementById('csv-file').files[0];
    if (!file) {
        $('#status').text('Please select a CSV file first.');
        return;
    }

    Papa.parse(file, {
        complete: function(results) {
            if (results.data && results.data.length > 0) {
                // Filter out rows with empty emails
                csvData = results.data.filter(row => {
                    const email = row['Email'] || row['email'];
                    return email && email.trim() !== '';
                });

                if (csvData.length === 0) {
                    $('#status').text('No valid email addresses found in CSV file.');
                    return;
                }

                $('#status').text(`CSV file uploaded successfully. Found ${csvData.length} valid recipients.`);
                renderCsvData(csvData);
            } else {
                $('#status').text('No data found in CSV file.');
            }
        },
        header: true,
        skipEmptyLines: true
    });
});

// Function to render CSV data into the table
function renderCsvData(data) {
    const tableBody = $("#csv-table tbody");
    tableBody.empty();

    // Normalize expected column names to lowercase for comparison
    const expectedColumns = ['Company Name', 'Location', 'Email', 'Products'];
    const headers = Object.keys(data[0]);

    // Check if all expected columns are present
    const hasExpectedColumns = expectedColumns.every(col => 
        headers.some(header => header.toLowerCase() === col.toLowerCase())
    );

    if (hasExpectedColumns) {
        data.forEach(function(row) {
            let tableRow = `<tr>
                <td>${row['Company Name'] || row['company name'] || ''}</td>
                <td>${row['Email'] || row['email'] || ''}</td>
                <td>${row['Location'] || row['location'] || ''}</td>
                <td>${row['Products'] || row['products'] || ''}</td>
            </tr>`;
            tableBody.append(tableRow);
        });
        $('#status').text('CSV data loaded successfully.');
    } else {
        $('#status').text('CSV file does not have the expected columns.');
    }
}

// Function to generate email content using Gemini API
function generateEmail() {
    let emailPrompt = $('#email-prompt').val();
    
    if (!emailPrompt) {
        $('#status').text('Please enter an email prompt.');
        return;
    }

    $('#status').text('Generating email content...');

    $.ajax({
        url: 'http://127.0.0.1:5000/generate-email',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ prompt: emailPrompt }),
        success: function(response) {
            $('#email-body').val(response.email_body);
            $('#status').text('Email body generated successfully.');
        },
        error: function(xhr, status, error) {
            $('#status').text(`Error generating email: ${error}`);
        }
    });
}

// Function to personalize email body by replacing placeholders with CSV data
function personalizeEmailBody(emailBody, recipient) {
    let personalizedBody = emailBody;
    personalizedBody = personalizedBody.replace(/\{Company Name\}/g, recipient.companyName || 'Valued Customer');
    personalizedBody = personalizedBody.replace(/\{Products\}/g, recipient.products || '');
    personalizedBody = personalizedBody.replace(/\{Location\}/g, recipient.location || '');
    return personalizedBody;
}

// Function to validate email address format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to schedule emails at a specific time
function scheduleEmails() {
    const scheduleTime = $('#schedule-time').val();
    if (!scheduleTime) {
        $('#status').text('Please select a schedule time.');
        return;
    }

    const targetTime = new Date(scheduleTime).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = targetTime - currentTime;

    if (timeDifference < 0) {
        $('#status').text('Please select a future time.');
        return;
    }

    $('#status').text(`Emails scheduled to be sent at ${new Date(targetTime).toLocaleString()}`);

    setTimeout(function() {
        sendEmails();  // Call the function to send emails after the scheduled time
    }, timeDifference);
}

// Function to send emails
function sendEmails() {
    let emailBody = $('#email-body').val();
    
    if (!emailBody) {
        $('#status').text('Please generate the email body first.');
        return;
    }

    if (!csvData || csvData.length === 0) {
        $('#status').text('Please upload CSV file with recipient data first.');
        return;
    }

    // Validate recipients data
    const validRecipients = csvData.filter(row => {
        const email = row['Email'] || row['email'];
        return email && isValidEmail(email.trim());
    });

    if (validRecipients.length === 0) {
        $('#status').text('No valid email addresses found in CSV data.');
        return;
    }

    $('#status').text(`Preparing to send emails to ${validRecipients.length} recipients...`);

    // Prepare recipients data with proper case matching and validation
    const preparedRecipients = validRecipients.map(row => ({
        email: (row['Email'] || row['email']).trim(),
        companyName: row['Company Name'] || row['company name'] || 'Valued Customer',
        products: row['Products'] || row['products'] || '',
        location: row['Location'] || row['location'] || ''
    }));

    // Add rate limiting to avoid overwhelming the server
    const batchSize = 50; // Send 50 emails at a time
    const delay = 1000; // 1 second delay between batches
    
    const sendBatch = (startIndex) => {
        const batch = preparedRecipients.slice(startIndex, startIndex + batchSize);
        if (batch.length === 0) {
            $('#status').text('All emails have been sent successfully.');
            return;
        }

        $.ajax({
            url: 'http://127.0.0.1:5000/send-email',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                emailBody: emailBody,
                recipients: batch
            }),
            success: function(response) {
                const successCount = response.success_count || 0;
                const failedCount = response.failed_count || 0;
                const totalSent = startIndex + batchSize;
                const remainingCount = preparedRecipients.length - totalSent;
                
                $('#status').text(
                    `Progress: ${totalSent}/${preparedRecipients.length} emails processed. ` +
                    `Success: ${successCount}, Failed: ${failedCount}`
                );

                if (remainingCount > 0) {
                    setTimeout(() => sendBatch(startIndex + batchSize), delay);
                } else {
                    $('#status').text('Email sending completed.');
                }
            },
            error: function(xhr, status, error) {
                let errorMessage = 'Error sending emails';
                try {
                    errorMessage = xhr.responseJSON?.error || errorMessage;
                } catch(e) {}
                $('#status').text(errorMessage);
            }
        });
    };

    // Start sending the first batch
    sendBatch(0);
}

// Event handler for file drag and drop
const fileUpload = document.querySelector('.file-upload');

fileUpload.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = 'var(--primary-color)';
    fileUpload.style.backgroundColor = '#f8fafc';
});

fileUpload.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = 'var(--border-color)';
    fileUpload.style.backgroundColor = 'transparent';
});

fileUpload.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUpload.style.borderColor = 'var(--border-color)';
    fileUpload.style.backgroundColor = 'transparent';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
        document.getElementById('csv-file').files = e.dataTransfer.files;
        $('#csv-upload').click();
    } else {
        $('#status').text('Please upload a valid CSV file.');
    }
});

// Add input event listener for email prompt to enable/disable generate button
$('#email-prompt').on('input', function() {
    const generateButton = $('#generate-email');
    generateButton.prop('disabled', !this.value.trim());
});

// Initialize the UI
$(document).ready(function() {
    // Disable generate button initially
    $('#generate-email').prop('disabled', true);
    
    // Set minimum datetime for scheduler to current time
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
    $('#schedule-time').attr('min', localISOTime);
});