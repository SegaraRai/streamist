import { getOSRegion, getOSRegions } from '$shared-server/objectStorage';
import type { Environment } from './types';
import { writeResultFile } from './write';

const SECRETS = [
  'API_ORIGIN_FOR_TRANSCODER',
  'SECRET_API_CLIENT_REFERRER',
  'SECRET_TRANSCODER_CALLBACK_SECRET',
  'SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID',
  'SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY',
];

function getLambdaResources(): readonly string[] {
  return getOSRegions()
    .map((region) => getOSRegion(region)!)
    .map(
      (item): string =>
        `arn:aws:lambda:${item.transcoderLambdaRegion}:*:function:${item.transcoderLambdaName}`
    );
}

function getLambdaDeployCommand(): string {
  const GCR_SET_SECRETS =
    '--set-secrets=' +
    SECRETS.map((secret) => `${secret}=${secret}:latest`).join();
  return getOSRegions()
    .map((region) => getOSRegion(region)!)
    .map(
      (item): string =>
        `aws lambda update-function-code --function-name ${item.transcoderLambdaName} --zip-file fileb://dist.zip --region ${item.transcoderLambdaRegion}\n` +
        `gcloud run deploy ${item.transcoderGCRName} --quiet --source gcr --no-allow-unauthenticated ${GCR_SET_SECRETS} --region ${item.transcoderGCRRegion}\n`
    )
    .join('');
}

function createIAMPolicyDeployTranscoder() {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'StreamistTranscoderDeploy',
        Effect: 'Allow',
        Action: [
          'lambda:UpdateFunctionCode',
          'lambda:UpdateFunctionConfiguration',
        ],
        Resource: getLambdaResources(),
      },
    ],
  };
}

function createIAMPolicyInvokeTranscoder() {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'StreamistTranscoderInvoke',
        Effect: 'Allow',
        Action: ['lambda:InvokeFunction'],
        Resource: getLambdaResources(),
      },
    ],
  };
}

export async function initTranscoder(_env: Environment): Promise<void> {
  // IAM policies
  await writeResultFile(
    'aws.iamPolicy.transcoderDeploy.json',
    createIAMPolicyDeployTranscoder()
  );
  await writeResultFile(
    'aws.iamPolicy.transcoderInvoke.json',
    createIAMPolicyInvokeTranscoder()
  );
  await writeResultFile(`deploy.sh`, getLambdaDeployCommand());
}
