import { useState } from 'react'
import * as XLSX from 'xlsx'

export default function DemoFileDownload() {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateDemoFile = () => {
    setIsGenerating(true)
    
    // Sample data for the demo file
    const demoData = [
      {
        'State': 'Delhi',
        'Branch': 'NOIDA',
        'City': 'Noida',
        'File No': 'F001',
        'loan_agreement_no': 'LA001',
        'Name Of Client': 'Rajendra Singh',
        'Vehicle Type': 'Car',
        'Make': 'MAHINDRA',
        'Model': 'XUV500',
        'Year': '2020',
        'Reg No': 'DL1LAG0935',
        'Engine No': 'ENG001',
        'Chassis No': 'CHS001',
        'Month': 'January',
        'Bkt': '1',
        'EMI': '15000',
        'Pos': '500000',
        'Tos': '800000',
        'FC Amt': '300000',
        'loan_amount': '800000',
        'dpd': '0',
        'customer_address': 'Noida, Delhi',
        'Customer Mobile Number': '9876543210',
        'Group Account Count': '1',
        'Cont. Person1': 'Rajendra Singh',
        'Mobile number': '9876543210',
        'Cont. Person2': 'Priya Singh',
        'Mobile number2': '9876543211',
        'Company Name': 'Demo Company',
        'Company Branch': 'Noida Branch',
        'Company Contact': '011-12345678',
        'Company Contact Person': 'Manager',
        'Agency Name': 'Demo Agency',
        'Agency Contact': '011-87654321',
        'Group': 'Group A'
      },
      {
        'State': 'Gujarat',
        'Branch': 'RAJKOT',
        'City': 'Rajkot',
        'File No': 'F002',
        'loan_agreement_no': 'LA002',
        'Name Of Client': 'SAGAR VITTHALBHAI ROJASARA',
        'Vehicle Type': 'Car',
        'Make': 'MARUTI SUZUKI',
        'Model': 'Swift',
        'Year': '2021',
        'Reg No': 'GJ08AP3401',
        'Engine No': 'ENG002',
        'Chassis No': 'CHS002',
        'Month': 'February',
        'Bkt': '2',
        'EMI': '12000',
        'Pos': '400000',
        'Tos': '600000',
        'FC Amt': '200000',
        'loan_amount': '600000',
        'dpd': '0',
        'customer_address': 'Rajkot, Gujarat',
        'Customer Mobile Number': '9876543212',
        'Group Account Count': '1',
        'Cont. Person1': 'Sagar Rojasara',
        'Mobile number': '9876543212',
        'Cont. Person2': 'Meera Rojasara',
        'Mobile number2': '9876543213',
        'Company Name': 'Demo Company',
        'Company Branch': 'Rajkot Branch',
        'Company Contact': '0281-12345678',
        'Company Contact Person': 'Manager',
        'Agency Name': 'Demo Agency',
        'Agency Contact': '0281-87654321',
        'Group': 'Group B'
      },
      {
        'State': 'Maharashtra',
        'Branch': 'MUMBAI',
        'City': 'Mumbai',
        'File No': 'F003',
        'loan_agreement_no': 'LA003',
        'Name Of Client': 'Priya Sharma',
        'Vehicle Type': 'Car',
        'Make': 'HONDA',
        'Model': 'City',
        'Year': '2019',
        'Reg No': 'MH01AB1234',
        'Engine No': 'ENG003',
        'Chassis No': 'CHS003',
        'Month': 'March',
        'Bkt': '3',
        'EMI': '18000',
        'Pos': '600000',
        'Tos': '900000',
        'FC Amt': '300000',
        'loan_amount': '900000',
        'dpd': '0',
        'customer_address': 'Mumbai, Maharashtra',
        'Customer Mobile Number': '9876543214',
        'Group Account Count': '1',
        'Cont. Person1': 'Priya Sharma',
        'Mobile number': '9876543214',
        'Cont. Person2': 'Rahul Sharma',
        'Mobile number2': '9876543215',
        'Company Name': 'Demo Company',
        'Company Branch': 'Mumbai Branch',
        'Company Contact': '022-12345678',
        'Company Contact Person': 'Manager',
        'Agency Name': 'Demo Agency',
        'Agency Contact': '022-87654321',
        'Group': 'Group C'
      }
    ]

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(demoData)
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles')
      
      // Generate the file
      const fileName = `vehicle_upload_template_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      setIsGenerating(false)
    } catch (error) {
      console.error('Error generating demo file:', error)
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={generateDemoFile}
        disabled={isGenerating}
        className="btn-secondary flex items-center text-sm"
      >
        {isGenerating ? (
          <>
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Generating...
          </>
        ) : (
          <>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Template
          </>
        )}
      </button>
      <div className="text-xs text-gray-500">
        Excel template with sample data
      </div>
    </div>
  )
}
