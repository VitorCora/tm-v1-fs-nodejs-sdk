import { AmaasGrpcClient, AmaasCredentials } from 'file-security-sdk';
import loggerConfig from './loggerConfig';

const amaasHostName = process.env?.TM_AM_SERVER_ADDR ?? '';
const key = process.env?.TM_AM_AUTH_KEY ?? '';
const credent: AmaasCredentials = {
  credentType: process.env?.TM_AM_AUTH_KEY_TYPE === 'token' ? 'token' : 'apikey',
  secret: key
};
const useKey = false;

const runFileScan = async (fileName, tags, pml, feedback) => {
  console.log(`\nScanning '${fileName}'`);
  const amaasGrpcClient = useKey
    ? new AmaasGrpcClient(amaasHostName, key)
    : new AmaasGrpcClient(amaasHostName, credent);

  loggerConfig(amaasGrpcClient);

  try {
    const result = await amaasGrpcClient.scanFile(fileName, tags, pml, feedback);
    console.log(`${JSON.stringify(result)}`);
  } catch (err) {
    console.error(err);
  } finally {
    amaasGrpcClient.close();
  }
};

// Extract command line arguments
const [, , fileName, ...tags] = process.argv;

// Examples of other parameters
const predictive_machine_learning = true;
const smart_feedback = true;

runFileScan(fileName, tags, predictive_machine_learning, smart_feedback)
  .then(() => console.log('File scan completed successfully'))
  .catch(error => console.error('Error occurred during file scan:', error));
