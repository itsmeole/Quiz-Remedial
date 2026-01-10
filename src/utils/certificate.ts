import { jsPDF } from 'jspdf';

export const generateCertificate = async (userName: string, subject: string) => {
    // We don't create doc here because we need to create it after loading image dimensions if we want to be precise, 
    // or just use standard A4. logic below creates a new instance.

    const imgPath = subject === 'calculus' ? '/sertifikat_kalkulus.png' : '/Sertifikat.png';

    try {
        const response = await fetch(imgPath);
        const blob = await response.blob();
        const reader = new FileReader();

        return new Promise<void>((resolve) => {
            reader.onloadend = () => {
                const base64data = reader.result as string;

                // Re-init doc with standard A4 Landscape
                const pdf = new jsPDF('l', 'mm', 'a4');
                const width = pdf.internal.pageSize.getWidth();
                const height = pdf.internal.pageSize.getHeight();

                pdf.addImage(base64data, 'PNG', 0, 0, width, height);

                // Add Text
                pdf.setFontSize(40);
                pdf.setTextColor(0, 0, 0);
                pdf.setFont('helvetica', 'bold');

                // Left align text to match "DIBERIKAN KEPADA"
                // x = ~18.5% of width seems close to the visual start of text
                const x = width * 0.140;

                // y moved up to 48% to avoid clipping descenders (g, j, y, p) on the line
                const y = height * 0.5;

                pdf.text(userName, x, y, { align: 'left' });

                pdf.save(`${userName}_Certificate.pdf`);
                resolve();
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error generating certificate", error);
        alert("Failed to generate certificate. Please ensure Sertifikat.png is in the public folder.");
    }
};
