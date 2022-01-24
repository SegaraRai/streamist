import {
  ObjectStorage,
  getOSRegion,
  getOSRegions,
} from '$shared-server/objectStorage';
import type { Environment } from './types';
import { writeResultFile } from './write';

function getOSEndpoint(os: ObjectStorage): string {
  switch (os.provider) {
    case 'r2':
      throw new Error('getOSRawURL: Cloudflare R2 is not GA yet');

    case 'wasabi':
      return `https://s3.${os.region}.wasabisys.com`;
  }
}

function createBucketPolicyTranscoded(bucketName: string) {
  return {
    Id: 'DataPolicy',
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'CDNGetFile',
        Effect: 'Allow',
        Principal: {
          AWS: '*',
        },
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${bucketName}/*`,
        Condition: {
          StringEquals: {
            'aws:Referer': '',
          },
        },
      },
    ],
  };
}

function createIAMPolicyServer(allBucketNames: readonly string[]) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
        Resource: allBucketNames.map(
          (bucketName) => `arn:aws:s3:::${bucketName}/src/*`
        ),
      },
    ],
  };
}

function createIAMPolicyUserDownload(sourceBucketNames: readonly string[]) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:GetObject',
        Resource: sourceBucketNames.map(
          (bucketName) => `arn:aws:s3:::${bucketName}/src/*`
        ),
      },
    ],
  };
}

function createIAMPolicyUserUpload(sourceBucketNames: readonly string[]) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 's3:PutObject',
        Resource: sourceBucketNames.map(
          (bucketName) => `arn:aws:s3:::${bucketName}/src/*`
        ),
      },
    ],
  };
}

export async function initS3(_env: Environment): Promise<void> {
  interface Bucket {
    bucket: ObjectStorage;
    isSource: boolean;
    isTranscoder: boolean;
  }

  const buckets: Bucket[] = [];

  for (const region of getOSRegions()) {
    const def = getOSRegion(region);
    const bucketMap = new Map<string, Bucket>();
    for (const [_key, _bucketDef] of Object.entries(def.buckets)) {
      const key = _key as keyof typeof def.buckets;
      const bucketDef =
        _bucketDef as typeof def.buckets[keyof typeof def.buckets];
      const isSource = key === 'sourceFile';
      const isTranscoder =
        key === 'transcodedAudioFile' || key === 'transcodedImageFile';
      bucketMap.set(bucketDef.bucket, {
        bucket: bucketDef,
        isSource: bucketMap.get(bucketDef.bucket)?.isSource || isSource,
        isTranscoder:
          bucketMap.get(bucketDef.bucket)?.isTranscoder || isTranscoder,
      });
    }
    for (const data of bucketMap.values()) {
      buckets.push(data);
    }
  }

  // IAM policies
  await writeResultFile(
    'iamPolicy.server.json',
    createIAMPolicyServer(buckets.map((b) => b.bucket.bucket))
  );
  await writeResultFile(
    'iamPolicy.userDownload.json',
    createIAMPolicyUserDownload(
      buckets.filter((b) => b.isSource).map((b) => b.bucket.bucket)
    )
  );
  await writeResultFile(
    'iamPolicy.userUpload.json',
    createIAMPolicyUserUpload(
      buckets.filter((b) => b.isSource).map((b) => b.bucket.bucket)
    )
  );

  // Bucket policies and commands
  let commands = '';
  for (const bucket of buckets) {
    if (bucket.isTranscoder) {
      await writeResultFile(
        `bucketPolicy.${bucket.bucket.bucket}.json`,
        createBucketPolicyTranscoded(bucket.bucket.bucket)
      );
    }

    const profileSpec = `--profile ${bucket.bucket.provider}`;
    const endpointSpec = `--endpoint-url ${getOSEndpoint(bucket.bucket)}`;
    const regionSpec = `--region ${bucket.bucket.region}`;
    const bucketSpec = `--bucket ${bucket.bucket.bucket}`;
    const allSpec = `${profileSpec} ${endpointSpec} ${regionSpec} ${bucketSpec}`;

    commands += `aws s3api create-bucket ${allSpec} --create-bucket-configuration LocationConstraint=${bucket.bucket.region}\n`;
    commands += `aws s3api put-bucket-policy ${allSpec} --policy file://bucketPolicy.${bucket.bucket}.json\n`;
  }

  await writeResultFile('bucketCommands.sh', commands);
}
