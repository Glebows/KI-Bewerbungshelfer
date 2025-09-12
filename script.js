// === Elemente holen ===
const skillsInput = document.getElementById('user-skills');
const experienceInput = document.getElementById('user-experience');
const jobInput = document.getElementById('job-description');
const generateBtn = document.getElementById('generate-btn');
const resultTextDiv = document.getElementById('result-text');
const copyBtn = document.getElementById('copy-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');

const userName = document.getElementById('user-name');
const userAddress = document.getElementById('user-address');
const userCity = document.getElementById('user-city');
const userEmail = document.getElementById('user-email');
const userPhone = document.getElementById('user-phone');
const companyName = document.getElementById('company-name');
const companyAddress = document.getElementById('company-address');
const companyCity = document.getElementById('company-city');

const cvPhotoInput = document.getElementById('cv-photo');
const cvEducation = document.getElementById('cv-education');
const cvSkills = document.getElementById('cv-skills');
const cvHobbies = document.getElementById('cv-hobbies');


// === Event Listener für den Generate-Button ===
generateBtn.addEventListener('click', async () => {
  const allInputs = [
      skillsInput, experienceInput, jobInput, userName,
      userAddress, userCity, userEmail, companyName, companyAddress, companyCity,
      cvEducation, cvSkills, cvHobbies
  ];
  
  const isAnyFieldEmpty = allInputs.some(input => !input.value.trim() && input.id !== 'user-phone');
  if (isAnyFieldEmpty) {
    alert('Bitte fülle alle Pflichtfelder aus! (Telefon ist optional)');
    return;
  }
  
  const skills = skillsInput.value;
  const experience = experienceInput.value;
  const jobDescription = jobInput.value;

  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> KI denkt nach...';
  resultTextDiv.innerHTML = '';
  downloadPdfBtn.classList.add('hidden');

  try {
    const response = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({ skills, experience, jobDescription }),
    });
    if (!response.ok) { throw new Error('Server hat einen Fehler gemeldet.'); }
    const data = await response.json();
    resultTextDiv.innerText = data.anschreiben;
    downloadPdfBtn.classList.remove('hidden');
  } catch (error) {
    console.error('Fehler:', error);
    resultTextDiv.innerHTML = '<p class="placeholder">Ein Fehler ist aufgetreten. Bitte prüfe, ob dein Server läuft und versuche es erneut.</p>';
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fas fa-magic"></i> Unterlagen generieren';
  }
});


// === Event Listener für PDF-Generierung ===
downloadPdfBtn.addEventListener('click', () => {
    const sender = {
        name: userName.value,
        address: userAddress.value,
        city: userCity.value,
        email: userEmail.value,
        phone: userPhone.value
    };
    const recipient = {
        name: companyName.value,
        address: companyAddress.value,
        city: companyCity.value
    };
    const subject = `Bewerbung um ein Schülerpraktikum`;
    const bodyText = resultTextDiv.innerText;
    const cvData = {
        education: cvEducation.value,
        skills: cvSkills.value,
        hobbies: cvHobbies.value
    };

    const photoFile = cvPhotoInput.files[0];
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const photoDataUrl = event.target.result;
            generatePDF(sender, recipient, subject, bodyText, cvData, photoDataUrl);
        };
        reader.readAsDataURL(photoFile);
    } else {
        generatePDF(sender, recipient, subject, bodyText, cvData, null);
    }
});


// === Die 2-Seiten-PDF-Funktion ===
function generatePDF(sender, recipient, subject, bodyText, cvData, photoDataUrl) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    // --- SEITE 1: ANSCHREIBEN ---
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(sender.name, 20, 27);
    doc.text(sender.address, 20, 32);
    doc.text(sender.city, 20, 37);
    doc.text(recipient.name, 20, 51);
    doc.text(recipient.address, 20, 56);
    doc.text(recipient.city, 20, 61);
    const today = new Date().toLocaleDateString('de-DE');
    doc.text(today, 210 - 20, 80, { align: 'right' });
    doc.setFont('Helvetica', 'bold');
    doc.text(subject, 20, 95);
    doc.setFont('Helvetica', 'normal');
    const splitBodyText = doc.splitTextToSize(bodyText, 170);
    doc.text(splitBodyText, 20, 110);
    const signatureYPosition = 110 + (splitBodyText.length * 5) + 10;
    doc.text(sender.name, 20, signatureYPosition);

    // --- SEITE 2: LEBENSLAUF ---
    doc.addPage();
    let yPos = 25;

    function drawSection(title, content) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(title, 20, yPos);
        doc.setLineWidth(0.5);
        doc.line(20, yPos + 2, 210 - 20, yPos + 2);
        yPos += 12;
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        const contentLines = doc.splitTextToSize(content, 170);
        doc.text(contentLines, 20, yPos);
        yPos += (contentLines.length * 5) + 12;
    }

    const photoWidth = 40;
    const photoHeight = 50;
    const photoX = 210 - 20 - photoWidth;
    const photoY = yPos;

    if (photoDataUrl) {
        doc.addImage(photoDataUrl, 'JPEG', photoX, photoY, photoWidth, photoHeight);
    }
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Lebenslauf', 20, yPos);
    yPos += 15;

    const personalDataContent = `Name:\nAnschrift:\n\nE-Mail:\nTelefon:`;
    const personalDataValues = `${sender.name}\n${sender.address}\n${sender.city}\n${sender.email}\n${sender.phone}`;
    
    const titleYPos = yPos;
    yPos += 12;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(personalDataContent, 20, yPos);
    doc.setFont('Helvetica', 'normal');
    doc.text(personalDataValues, 50, yPos);

    const personalDataLines = doc.splitTextToSize(personalDataValues, 120);
    const textBlockHeight = (personalDataLines.length * 5);
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Zur Person', 20, titleYPos);
    doc.setLineWidth(0.5);
    doc.line(20, titleYPos + 2, 210 - 20, titleYPos + 2);
    
    yPos += textBlockHeight + 12;

    const photoBlockHeight = 50;
    if (photoDataUrl && yPos < (photoY + photoBlockHeight + 12)) {
        yPos = photoY + photoBlockHeight + 12;
    }

    drawSection('Schulbildung', cvData.education);
    drawSection('Interessen & Kenntnisse', cvData.skills);
    drawSection('Hobbys & Engagement', cvData.hobbies);

    doc.save('Bewerbungsunterlagen.pdf');
}


// === Event Listener für den Kopieren-Button ===
copyBtn.addEventListener('click', () => {
    const textToCopy = resultTextDiv.innerText;
    if (textToCopy && textToCopy !== 'Dein Anschreiben wird hier erscheinen...') {
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Text in die Zwischenablage kopiert!');
        }, (err) => { console.error('Konnte nicht kopieren: ', err); });
    }
});