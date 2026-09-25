import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadCSV = (data: any, patientId: string) => {
  // Extract relevant flat data from the FHIR JSON structure
  const rows = [
    ["Patient ID", "Date", "Code", "Domain", "Score"],
    [patientId, new Date().toLocaleDateString(), "72172-0", "Cognitive Status", data.valueQuantity?.value || "N/A"]
  ];

  if (data.code && data.code.coding) {
    data.code.coding.forEach((c: any) => {
      if (c.code !== "72172-0") {
        rows.push([patientId, new Date().toLocaleDateString(), c.code, c.display, "Assessed"]);
      }
    });
  }

  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const a = document.createElement("a");
  a.href = encodedUri;
  a.download = `clinical_report_${patientId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const downloadPDF = (data: any, patientId: string) => {
  const doc = new jsPDF();
  doc.text(`SmritiSetu Clinical Report`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Patient ID: ${patientId}`, 14, 22);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 28);
  
  const bodyData: any[] = [];
  if (data.code && data.code.coding) {
    data.code.coding.forEach((c: any) => {
      if (c.code !== "72172-0") {
        bodyData.push([c.display, c.code, 'Assessed']);
      }
    });
  }
  
  autoTable(doc, {
    startY: 35,
    head: [['ICF Domain', 'Code', 'Observation Score']],
    body: bodyData,
  });
  
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 100;
  doc.text(`Overall Cognitive Score: ${data.valueQuantity?.value || "N/A"}`, 14, finalY);
  
  doc.save(`clinical_report_${patientId}.pdf`);
};
