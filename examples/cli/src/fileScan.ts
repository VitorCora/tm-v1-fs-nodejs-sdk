import { AmaasGrpcClient, AmaasCredentials } from 'file-security-sdk';
import loggerConfig from './loggerConfig';
import axios from 'axios';
import fs from 'fs';

const amaasHostName = process.env?.TM_AM_SERVER_ADDR ?? '';
const key = process.env?.TM_AM_AUTH_KEY ?? '';
const credent: AmaasCredentials = {
  credentType: process.env?.TM_AM_AUTH_KEY_TYPE === 'token' ? 'token' : 'apikey',
  secret: key
};
const useKey = false;

const downloadFile = async (presignedUrl, filePath) => {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url: presignedUrl,
    method: 'GET',
    responseType: 'stream',
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

const runFileScan = async (file, tags, pml = true, smt = true) => {
  console.log(`\nScanning '${file}'`);
  const amaasGrpcClient = useKey
    ? new AmaasGrpcClient(amaasHostName, key)
    : new AmaasGrpcClient(amaasHostName, credent);

  loggerConfig(amaasGrpcClient);

  try {
    const result = await amaasGrpcClient.scanFile(file, tags, pml, smt);
    console.log(`${JSON.stringify(result)}`);
  } catch (err) {
    console.error(err);
  } finally {
    amaasGrpcClient.close();
  }
};

// Extract command line arguments
const args = process.argv.slice(2);
let fileName = '';
let presignedUrl = '';
let pml = true;
let smt = true;
const tags = [];

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '-f':
      fileName = args[i + 1];
      i++;
      break;
    case '-u':
      presignedUrl = args[i + 1];
      i++;
      break;
    case '-pml':
      pml = args[i + 1]?.toLowerCase() === 'true';
      i++;
      break;
    case '-smt':
      smt = args[i + 1]?.toLowerCase() === 'true';
      i++;
      break;
    case '-t':
      tags.push(args[i + 1]);
      i++;
      break;
    default:
      break;
  }
}

if (presignedUrl) {
  const filePath = 'downloaded_file'; // Adjust the file path and name as needed
  console.log(`Downloading file from presigned URL: ${presignedUrl}`);
  downloadFile(presignedUrl, filePath)
    .then(() => {
      console.log('File downloaded successfully.');
      runFileScan(filePath, tags, pml, smt)
        .then(() => console.log('File scan completed successfully'))
        .catch(error => console.error('Error occurred during file scan:', error));
    })
    .catch(error => console.error('Error occurred during file download:', error));
} else {
  if (!fileName) {
    console.error('Please provide either a fileName (-f) or a presignedUrl (-u).');
  } else {
    runFileScan(fileName, tags, pml, smt)
      .then(() => console.log('File scan completed successfully'))
      .catch(error => console.error('Error occurred during file scan:', error));
  }
}
