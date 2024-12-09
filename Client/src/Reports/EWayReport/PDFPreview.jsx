import React, { useEffect, useState } from 'react';

const apiKey = process.env.REACT_APP_API;

const PdfPreview = ({ pdfData,apiData }) => {
  const [loading, setLoading] = useState(false); 
  const [emailError, setEmailError] = useState("");


  useEffect(() => {
    const pdfWindow = window.open('', '_blank');
    if (!pdfWindow) {
      alert("Popup blocked! Please allow popups for this website.");
      return;
    }

    pdfWindow.document.write(`
      <html>
        <head>
          <title>PDF Preview</title>
          <style>
            .top-row {
              display: flex;
              gap: 10px;
              margin: 10px;
            }
            .top-row input {
              padding: 5px;
              font-size: 14px;
            }
            .top-row button {
              padding: 6px 12px;
              font-size: 14px;
              position: relative;
              cursor: pointer;
            }
            .top-row button[disabled] {
              cursor: not-allowed;
            }
            .spinner {
              border: 4px solid #f3f3f3; /* Light gray */
              border-top: 4px solid #3498db; /* Blue */
              border-radius: 50%;
              width: 20px;
              height: 20px;
              animation: spin 2s linear infinite;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              display: none;
            }
            .top-row button.loading .spinner {
              display: block;
            }
            .embed-container {
              margin-top: 20px;
            }
            .overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              z-index: 999;
              display: none;
            }
            .overlay.show {
              display: block;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .message {
              text-align: center;
              margin-top: 20px;
              font-size: 16px;
              color: green;
            }
            .message.error {
              color: red;
            }
          </style>
        </head>
        <body>
          <div class="overlay"></div>
          <div class="top-row">
            <input type="email" placeholder="Enter email address" id="emailInput" />
            <button id="emailButton" class="send-button">
              Email PDF
              <div class="spinner"></div>
            </button>
            <input type="tel" placeholder="Enter WhatsApp number" id="whatsappInput" />
            <button id="whatsappButton">WhatsApp PDF</button>
          </div>
          <div class="embed-container">
            <embed src="${pdfData}" width="100%" height="100%" />
          </div>
          <div class="message"></div>
        </body>
      </html>
    `);
    pdfWindow.document.close();

    pdfWindow.onload = () => {
  
      const emailButton = pdfWindow.document.getElementById('emailButton');
      const emailInput = pdfWindow.document.getElementById('emailInput');
      const whatsappButton = pdfWindow.document.getElementById('whatsappButton');
      const whatsappInput = pdfWindow.document.getElementById('whatsappInput');
      const overlay = pdfWindow.document.querySelector('.overlay');
      const messageDiv = pdfWindow.document.querySelector('.message');

      if (apiData && apiData.Buyer_Email_Id) {
        emailInput.value = apiData.Buyer_Email_Id.trim(); 
      }

      // Email validation regex
      const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      emailButton.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if ( pdfWindow && !email) {
          alert('Please enter a valid email address.');
          return;
        }

        if (!email) {
          setEmailError('Email address is required.');
          return;
        } else if (!validateEmail(email)) {
          setEmailError('Please enter a valid email address.');
          return;
        } else {
          setEmailError('');
        }

        overlay.classList.add('show');
        emailButton.disabled = true;
        whatsappButton.disabled = true;
        emailButton.classList.add('loading');
        setLoading(true);

        fetch(pdfData)
          .then(res => res.blob())
          .then(pdfBlob => {
            const formData = new FormData();
            formData.append('pdf', pdfBlob, 'Print.pdf');
            formData.append('email', email);

            fetch(`${apiKey}/send-pdf-email`, {
              method: 'POST',
              body: formData,
            })
              .then(response => response.json())
              .then(data => {
                if (pdfWindow) {
                  pdfWindow.alert(data.message || 'Email sent successfully!');
                } else {
                  alert(data.message || 'Email sent successfully!'); 
                }
            
              })
              .catch(error => {
                alert('Error sending email.');
      
              })
              .finally(() => {
                setLoading(false);
                emailButton.classList.remove('loading');
                emailButton.disabled = false;
                whatsappButton.disabled = false;
                overlay.classList.remove('show');
              });
          })
          .catch(error => {
            console.error('Failed to fetch PDF blob:', error);
            alert('Error fetching PDF.');
            messageDiv.textContent = 'Error fetching PDF.';
            messageDiv.classList.remove('success');
            messageDiv.classList.add('error');
            emailButton.classList.remove('loading');
            emailButton.disabled = false;
            whatsappButton.disabled = false;
            overlay.classList.remove('show');
          });
      });

      whatsappButton.addEventListener('click', () => {
        const whatsappNumber = whatsappInput.value.trim();
        if (!whatsappNumber) {
          alert('Please enter a WhatsApp number.');
          return;
        }
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=Please find the attached PDF: ${pdfData}`;
        pdfWindow.open(whatsappLink, '_blank');
      });
    };
  }, [pdfData]);

  return null;
};

export default PdfPreview;
