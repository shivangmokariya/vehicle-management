import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function FileDataHandler({ onDataParsed, onError }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet);

          const parsedData = rows.map(row => ({
            state: row['State'] || '',
            branch: row['Branch'] || '',
            city: row['City'] || '',
            fileNo: row['File No'] || row['FileNo'] || '',
            loanAgreementNo: row['loan_agreement_no'] || row['Loan Agreement No'] || '',
            nameOfClient: row['Name Of Client'] || row['Name of Client'] || '',
            vehicleType: row['Vehicle Type'] || '',
            make: row['Make'] || '',
            model: row['Model'] || '',
            year: row['Year'] || '',
            regNo: row['Reg No'] || row['RegNo'] || '',
            engineNo: row['Engine No'] || row['EngineNo'] || '',
            chassisNo: row['Chasis No'] || row['Chassis No'] || row['ChassisNo'] || '',
            month: row['Month'] || '',
            bkt: row['Bkt'] || row['bkt'] || '',
            emi: row['EMI'] || '',
            pos: row['Pos'] || '',
            tos: row['Tos'] || '',
            fcAmt: row['FC Amt'] || '',
            loanAmount: row['loan_amount'] || row['Loan Amount'] || '',
            dpd: row['dpd'] || '',
            customerAddress: row['customer_address'] || '',
            customerMobileNumber: row['Customer Mobile Number'] || '',
            groupAccountCount: row['Group Account Count'] || '',
            contactPerson1: row['Cont. Person1'] || row['Contact Person1'] || '',
            mobileNumber1: row['Mobile number'] || row['Mobile Number'] || row['Mobile number1'] || '',
            contactPerson2: row['Cont. Person2'] || row['Contact Person2'] || '',
            mobileNumber2: row['Mobile number2'] || '',
            // legacy/required fields for compatibility
            vehicleNo: row['vehicleNo'] || row['Vehicle No'] || row['VehicleNo'] || row['Vehicle No.'] || row['Reg No'] || row['RegNo'] || '',
            customerName: row['customerName'] || row['Customer Name'] || row['Name Of Client'] || row['Name of Client'] || '',
            area: row['area'] || row['Area'] || row['City'] || '',
            vehicleMaker: row['vehicleMaker'] || row['Vehicle Maker'] || row['Make'] || '',
            companyName: row['companyName'] || row['Company Name'] || '',
            companyBranch: row['companyBranch'] || row['Company Branch'] || '',
            companyContact: row['companyContact'] || row['Company Contact'] || '',
            companyContactPerson: row['companyContactPerson'] || row['Company Contact Person'] || '',
            agencyName: row['agencyName'] || row['Agency Name'] || '',
            agencyContact: row['agencyContact'] || row['Agency Contact'] || '',
            group: row['group'] || row['Group'] ? String(row['group'] || row['Group']).split(',')[0].trim() : '',
          }));

          resolve(parsedData);
        } catch (error) {
          reject(new Error('Error parsing Excel file: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Custom CSV parser for browser compatibility
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    // Parse headers
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      records.push(row);
    }
    
    return records;
  };

  // Helper function to parse CSV line with proper handling of quoted values
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    // Remove quotes from the beginning and end of each field
    return result.map(field => field.replace(/^"|"$/g, ''));
  };

  const parseCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileContent = e.target.result;
          const records = parseCSV(fileContent);

          const parsedData = records.map(row => ({
            vehicleNo: row['Vehicle No'] || row['VehicleNo'] || row['Vehicle No.'] || '',
            chassisNo: row['Chassis No'] || row['ChassisNo'] || row['Chassis No.'] || '',
            engineNo: row['Engine No'] || row['EngineNo'] || row['Engine No.'] || '',
            agNo: row['AG No'] || row['AGNo'] || row['AG No.'] || '',
            branch: row['Branch'] || '',
            customerName: row['Customer Name'] || row['CustomerName'] || '',
            bkt: row['BKT'] || '',
            area: row['Area'] || '',
            vehicleMaker: row['Vehicle Maker'] || row['VehicleMaker'] || '',
            lpp: row['LPP'] || '',
            bcc: row['BCC'] || '',
            companyName: row['Company Name'] || row['CompanyName'] || '',
            companyBranch: row['Company Branch'] || row['CompanyBranch'] || '',
            companyContact: row['Company Contact'] || row['CompanyContact'] || '',
            companyContactPerson: row['Company Contact Person'] || row['CompanyContactPerson'] || '',
            agencyName: row['Agency Name'] || row['AgencyName'] || '',
            agencyContact: row['Agency Contact'] || row['AgencyContact'] || '',
            group: row['group'] || row['Group'] ? String(row['group'] || row['Group']).split(',')[0].trim() : '',
          }));

          resolve(parsedData);
        } catch (error) {
          reject(new Error('Error parsing CSV file: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = /xlsx|xls|csv/;
    const extname = allowedTypes.test(file.name.toLowerCase());
    const mimetype = allowedTypes.test(file.type) || 
                    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.type === 'application/vnd.ms-excel' ||
                    file.type === 'text/csv';
    
    if (!mimetype && !extname) {
      onError('Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed!');
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    try {
      let parsedData;
      const ext = file.name.toLowerCase().split('.').pop();
      
      if (ext === 'csv') {
        parsedData = await parseCSVFile(file);
      } else {
        parsedData = await parseExcelFile(file);
      }

      // Validate required fields
      const validVehicles = [];
      
      parsedData.forEach((vehicle, index) => {
        const requiredFields = ['vehicleNo', 'chassisNo', 'engineNo'];
        const missingFields = requiredFields.filter(field => !vehicle[field] || vehicle[field].toString().trim() === '');
        
        if (missingFields.length === 0) {
          validVehicles.push(vehicle);
        }
        // Skip invalid vehicles silently
      });

      if (validVehicles.length === 0) {
        onError('No valid vehicles found in the file. All vehicles are missing required fields.');
        return;
      }

      onDataParsed({
        fileName: file.name,
        validVehicles,
        totalProcessed: parsedData.length
      });

    } catch (error) {
      onError('Error processing file: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Excel or CSV File
        </label>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      {isProcessing && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600">Processing {fileName}...</p>
        </div>
      )}
    </div>
  );
} 