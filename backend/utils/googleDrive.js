const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load credentials from environment or a config file
const KEYFILEPATH = process.env.GOOGLE_DRIVE_KEYFILE || path.join(__dirname, '../config/google-service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

function getDriveService() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
  return google.drive({ version: 'v3', auth });
}

/**
 * Upload a file to Google Drive
 * @param {string} filePath - Local path to the file
 * @param {string} fileName - Name to use in Drive
 * @param {string} mimeType - File MIME type
 * @param {string} parentFolderId - (optional) Google Drive folder ID
 * @returns {Promise<object>} - Google Drive file resource
 */
async function uploadFileToDrive(filePath, fileName, mimeType, parentFolderId) {
  const drive = getDriveService();
  const fileMetadata = {
    name: fileName,
    parents: parentFolderId ? [parentFolderId] : [],
  };
  const media = {
    mimeType,
    body: fs.createReadStream(filePath),
  };
  const response = await drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id, name, webViewLink, webContentLink',
  });
  return response.data;
}

module.exports = { uploadFileToDrive }; 