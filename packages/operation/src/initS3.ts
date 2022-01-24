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
            'aws:Referer':
              process.env.SECRET_CDN_STORAGE_ACCESS_REFERER ||
              '<SECRET_CDN_STORAGE_ACCESS_REFERER>',
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
          (bucketName) => `arn:aws:s3:::${bucketName}/*`
        ),
      },
    ],
  };
}

function createIAMPolicyTranscoder(
  sourceBucketNames: readonly string[],
  transcodedFileAndLogBucketNames: readonly string[]
) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:GetObject'],
        Resource: sourceBucketNames.map(
          (bucketName) => `arn:aws:s3:::${bucketName}/src/*`
        ),
      },
      {
        Effect: 'Allow',
        Action: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
        Resource: transcodedFileAndLogBucketNames.flatMap((bucketName) => [
          `arn:aws:s3:::${bucketName}/tra/*`,
          `arn:aws:s3:::${bucketName}/tri/*`,
          `arn:aws:s3:::${bucketName}/trx/*`,
        ]),
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
    isTranscoded: boolean;
    isTranscodeLog: boolean;
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
      const isTranscoded =
        key === 'transcodedAudioFile' || key === 'transcodedImageFile';
      const isTranscodeLog = key === 'transcodeLog';
      const prev = bucketMap.get(bucketDef.bucket);
      bucketMap.set(bucketDef.bucket, {
        bucket: bucketDef,
        isSource: prev?.isSource || isSource,
        isTranscoded: prev?.isTranscoded || isTranscoded,
        isTranscodeLog: prev?.isTranscodeLog || isTranscodeLog,
      });
    }
    for (const data of bucketMap.values()) {
      buckets.push(data);
    }
  }

  // IAM policies
  const allBucketNames = buckets.map((b) => b.bucket.bucket);
  const sourceBucketNames = buckets
    .filter((b) => b.isSource)
    .map((b) => b.bucket.bucket);
  const transcodedFileAndLogBucketNames = buckets
    .filter((b) => b.isTranscoded || b.isTranscodeLog)
    .map((b) => b.bucket.bucket);
  await writeResultFile(
    'iamPolicy.server.json',
    createIAMPolicyServer(allBucketNames)
  );
  await writeResultFile(
    'iamPolicy.transcoder.json',
    createIAMPolicyTranscoder(
      sourceBucketNames,
      transcodedFileAndLogBucketNames
    )
  );
  await writeResultFile(
    'iamPolicy.userDownload.json',
    createIAMPolicyUserDownload(sourceBucketNames)
  );
  await writeResultFile(
    'iamPolicy.userUpload.json',
    createIAMPolicyUserUpload(sourceBucketNames)
  );

  // Bucket policies and commands
  let commands = '';
  for (const bucket of buckets) {
    let bucketPolicyCreated = false;

    if (bucket.isTranscoded) {
      await writeResultFile(
        `bucketPolicy.${bucket.bucket.bucket}.json`,
        createBucketPolicyTranscoded(bucket.bucket.bucket)
      );
      bucketPolicyCreated = true;
    }

    const profileSpec = `--profile ${bucket.bucket.provider}`;
    const endpointSpec = `--endpoint-url ${getOSEndpoint(bucket.bucket)}`;
    const regionSpec = `--region ${bucket.bucket.region}`;
    const bucketSpec = `--bucket ${bucket.bucket.bucket}`;
    const allSpec = `${profileSpec} ${endpointSpec} ${regionSpec} ${bucketSpec}`;

    commands += `aws s3api create-bucket ${allSpec} --create-bucket-configuration LocationConstraint=${bucket.bucket.region}\n`;

    if (bucketPolicyCreated) {
      commands += `aws s3api put-bucket-policy ${allSpec} --policy file://bucketPolicy.${bucket.bucket.bucket}.json\n`;
    }
  }

  await writeResultFile('bucketCommands.sh', commands);
}
