import { readdirSync } from 'fs'
import { AmaasGrpcClient } from 'file-security-sdk'
import loggerConfig from './loggerConfig.js'

/**
 * Handle environment variables.
 */
const amaasHostName = process.env?.TM_AM_SERVER_ADDR ?? ''
const key = process.env?.TM_AM_AUTH_KEY ?? ''
const creds = {
  credsType: process.env?.TM_AM_AUTH_KEY_TYPE === 'token' ? 'token' : 'apikey',
  secret: key
}
const useKey = false

/**
 *
 * Create a scan client instance using AmaasGrpcClient class.
 * Run AmaasGrpcClient.scanFile() concurrently to scan files
 * under a directory.
 * @async
 * @function runConcurrentFileScan
 * @param {string} directoryName The directory to scan.
 * @returns {Promise<void>} Promise object represents the result of the scan.
 */
const runConcurrentFileScan = async (directoryName) => {
  console.log(`\nScanning '${directoryName}'`)
  const amaasGrpcClient = useKey
    ? new AmaasGrpcClient(amaasHostName, key)
    : new AmaasGrpcClient(amaasHostName, creds)

  loggerConfig(amaasGrpcClient)

  if (directoryName.charAt(directoryName.length - 1) !== '/') {
    directoryName += '/'
  }
  const filesToScan = readdirSync(directoryName, { withFileTypes: true })
    .filter(item => !item.isDirectory())
    .map(item => `${directoryName}${item.name}`)
  const actions = filesToScan.map(async fileName => {
    return await amaasGrpcClient.scanFile(fileName)
  })
  await Promise.all(actions)
    .then(results => {
      results.forEach(result => {
        console.log(JSON.stringify(result))
      })
    })
    .catch(reason => {
      throw reason
    })
    .finally(() => {
      amaasGrpcClient.close()
    })
}

export const handler = async () => {
  await runConcurrentFileScan('./')

  return {
    statusCode: 200,
    body: JSON.stringify('AMAAS Node Client SDK Scan Done!')
  }
}
