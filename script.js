// === Elemente holen ===
const skillsInput = document.getElementById('user-skills');
const experienceInput = document.getElementById('user-experience');
const jobInput = document.getElementById('job-description');
const generateBtn = document.getElementById('generate-btn');
const resultTextDiv = document.getElementById('result-text');
const copyBtn = document.getElementById('copy-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const templateSection = document.getElementById('template-section');
const templateBtns = document.querySelectorAll('.template-btn');

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

let selectedTemplate = 'modern'; // Standard-Vorlage

// === Event Listener ===

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
    templateSection.classList.add('hidden');

    try {
        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skills, experience, jobDescription }),
        });
        if (!response.ok) { throw new Error('Server hat einen Fehler gemeldet.'); }
        const data = await response.json();
        resultTextDiv.innerText = data.anschreiben;
        downloadPdfBtn.classList.remove('hidden');
        templateSection.classList.remove('hidden');
    } catch (error) {
        console.error('Fehler:', error);
        resultTextDiv.innerHTML = '<p class="placeholder">Ein Fehler ist aufgetreten. Bitte prüfe, ob dein Server läuft und versuche es erneut.</p>';
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Anschreiben generieren';
    }
});

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
        reader.onload = function (event) {
            const photoDataUrl = event.target.result;
            generatePDF(sender, recipient, subject, bodyText, cvData, photoDataUrl, selectedTemplate);
        };
        reader.readAsDataURL(photoFile);
    } else {
        generatePDF(sender, recipient, subject, bodyText, cvData, null, selectedTemplate);
    }
});

templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        templateBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTemplate = btn.dataset.template;
    });
});

copyBtn.addEventListener('click', () => {
    const textToCopy = resultTextDiv.innerText;
    if (textToCopy && textToCopy !== 'Dein Anschreiben wird hier erscheinen...') {
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Text in die Zwischenablage kopiert!');
        }, (err) => { console.error('Konnte nicht kopieren: ', err); });
    }
});

// === PDF-Hauptfunktion (jetzt ein Verteiler) ===
function generatePDF(sender, recipient, subject, bodyText, cvData, photoDataUrl, template) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    if (template === 'classic') {
        drawClassicLayout(doc, sender, recipient, subject, bodyText, cvData, photoDataUrl);
    } else {
        drawModernLayout(doc, sender, recipient, subject, bodyText, cvData, photoDataUrl);
    }

    doc.save(`Bewerbungsunterlagen-${template}.pdf`);
}

// === Layout-Funktion für das "Moderne" Design ===
function drawModernLayout(doc, sender, recipient, subject, bodyText, cvData, photoDataUrl) {
    // SEITE 1: ANSCHREIBEN
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

    // SEITE 2: LEBENSLAUF
    doc.addPage();
    let yPos = 25; // Startposition für den Lebenslauf

    // Hilfsfunktion zum Zeichnen einer Sektion mit Titel und Linie
    function drawSection(title, content, startY) {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(title, 20, startY);
        doc.setLineWidth(0.5);
        doc.line(20, startY + 2, 210 - 20, startY + 2); // Linie unter dem Titel
        startY += 12; // Abstand nach Titel und Linie
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(11);
        const contentLines = doc.splitTextToSize(content, 170);
        doc.text(contentLines, 20, startY);
        return startY + (contentLines.length * 5) + 12; // Neue y-Position
    }

    const photoWidth = 40;
    const photoHeight = 50;
    const photoX = 210 - 20 - photoWidth; // 20mm Rand rechts
    let personalDataStartX = 20; // Standard Startpunkt für persönliche Daten

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Lebenslauf', 20, yPos);
    yPos += 15; // Abstand nach "Lebenslauf" Titel

    // --- "Zur Person" Sektion ---
    let zurPersonTitleY = yPos;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Zur Person', 20, zurPersonTitleY);
    doc.setLineWidth(0.5);
    doc.line(20, zurPersonTitleY + 2, 210 - 20, zurPersonTitleY + 2); // Linie unter "Zur Person"
    yPos = zurPersonTitleY + 12; // Neue y-Position nach dem Titel "Zur Person"

    // Füge das Foto ein, wenn vorhanden
    if (photoDataUrl) {
        doc.addImage(photoDataUrl, 'JPEG', photoX, yPos, photoWidth, photoHeight);
        // Wenn ein Foto da ist, beginnen die persönlichen Daten weiter links, um Platz zu sparen
        personalDataStartX = 20; 
        // yPos für den nachfolgenden Text muss unter dem Foto liegen
        // oder auf der aktuellen yPos bleiben, je nachdem was tiefer ist
    }
    
    // Persönliche Daten
    const personalDataContent = `Name:\nAnschrift:\n\nE-Mail:\nTelefon:`;
    const personalDataValues = `${sender.name}\n${sender.address}\n${sender.city}\n${sender.email}\n${sender.phone}`;
    
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(personalDataContent, personalDataStartX, yPos);
    doc.setFont('Helvetica', 'normal');
    doc.text(personalDataValues, personalDataStartX + 30, yPos); // Werte 30mm weiter rechts vom Titel

    const personalDataLines = doc.splitTextToSize(personalDataValues, photoDataUrl ? (photoX - personalDataStartX - 35) : 170); // Textbreite anpassen
    let currentBlockEndY = yPos + (personalDataLines.length * 5); // Endposition des Textblocks

    // Stellen Sie sicher, dass der nächste Abschnitt nach dem Foto (falls vorhanden) beginnt
    const photoBlockEndY = photoDataUrl ? yPos + photoHeight : 0;
    yPos = Math.max(currentBlockEndY, photoBlockEndY) + 15; // Mindestens 15mm Abstand

    // Weitere Sektionen zeichnen
    yPos = drawSection('Schulbildung', cvData.education, yPos);
    yPos = drawSection('Interessen & Kenntnisse', cvData.skills, yPos);
    yPos = drawSection('Hobbys & Engagement', cvData.hobbies, yPos);
}


// === Layout-Funktion für das "Klassische" Design ===
function drawClassicLayout(doc, sender, recipient, subject, bodyText, cvData, photoDataUrl) {
    doc.setFont('Times', 'normal');

    // SEITE 1: ANSCHREIBEN
    doc.setFontSize(10);
    const senderLine = `${sender.name} | ${sender.address}, ${sender.city}`;
    doc.text(senderLine, 20, 20);
    doc.setLineWidth(0.5);
    doc.line(20, 22, 210 - 20, 22);

    doc.setFontSize(12);
    doc.text(recipient.name, 20, 40);
    doc.text(recipient.address, 20, 45);
    doc.text(recipient.city, 20, 50);
    
    const today = new Date().toLocaleDateString('de-DE');
    doc.text(today, 210 - 20, 55, { align: 'right' });
    
    doc.setFont('Times', 'bold');
    doc.text(subject, 20, 70);
    
    doc.setFont('Times', 'normal');
    const splitBodyText = doc.splitTextToSize(bodyText, 170);
    doc.text(splitBodyText, 20, 80);

    const signatureYPosition = 80 + (splitBodyText.length * 5) + 15;
    doc.text(sender.name, 20, signatureYPosition);
    
    // SEITE 2: LEBENSLAUF
    doc.addPage();
    let yPos = 25;
    
    doc.setFont('Times', 'bold');
    doc.setFontSize(20);
    doc.text('LEBENSLAUF', 105, yPos, { align: 'center' });
    yPos += 15;

    if (photoDataUrl) {
        doc.addImage(photoDataUrl, 'JPEG', 20, yPos, 40, 50);
    }
    
    doc.setFont('Times', 'normal');
    doc.setFontSize(12);
    const personalDataX = photoDataUrl ? 70 : 20;
    doc.text(`${sender.name}`, personalDataX, yPos);
    doc.text(`${sender.address}, ${sender.city}`, personalDataX, yPos + 6);
    doc.text(`E-Mail: ${sender.email}`, personalDataX, yPos + 12);
    doc.text(`Telefon: ${sender.phone}`, personalDataX, yPos + 18);
    
    yPos += photoDataUrl ? 60 : 30;

    function drawClassicSection(title, content) {
        doc.setFont('Times', 'bold');
        doc.setFontSize(14);
        doc.text(title, 20, yPos);
        yPos += 8;
        doc.setFont('Times', 'normal');
        doc.setFontSize(12);
        const contentLines = doc.splitTextToSize(content, 170);
        doc.text(contentLines, 25, yPos);
        yPos += (contentLines.length * 6) + 10;
    }
    
    drawClassicSection('Schulbildung', cvData.education);
    drawClassicSection('Kenntnisse', cvData.skills);
    drawClassicSection('Hobbys und Engagement', cvData.hobbies);
}