# 開発について

## ローカル環境での開発

### インフラのセットアップ

ローカル環境では以下のサードパーティのインフラを要します

- S3 (Wasabi)

#### S3 (Wasabi) のセットアップ

- ポリシーを作成
  - Server (付録参照)
  - User (付録参照)
- アカウントを作成
  - `streamist-dev/server-dev` (Server ポリシー)
  - `streamist-dev/transcoder-dev` (Server ポリシー)
  - `streamist-dev/user-dev` (User ポリシー)
- バケットを作成
  - `development-wasabi-ap-northeast-1.stst.page`
    バケットポリシーは付録を参照

#### 設定の反映

- `packages/server/.env` に `packages/server/.env.example` を元に設定を書き込み

## ステージング/プロダクション環境での開発

ステージング/プロダクション環境では以下のサードパーティのインフラを要します

- S3 (Wasabi)
- AWS Lambda
- VPS (SSH)

### インフラのセットアップ

#### S3 (Wasabi) のセットアップ

ローカル環境でのものと同じ

#### AWS Lambda のセットアップ

TODO

#### VPS のセットアップ

TODO

## 付録

### IAM ポリシー (Server)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/*"
    }
  ]
}
```

### IAM ポリシー (User)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/src/*"
    }
  ]
}
```

### バケットポリシー

```json
{
  "Id": "StreamistBucketPolicy",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CDNGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": ["arn:aws:s3:::*/tra/*", "arn:aws:s3:::*/tri/*"],
      "Condition": {
        "StringEquals": {
          "aws:Referer": "<SECRET_CDN_STORAGE_ACCESS_REFERER>"
        }
      }
    }
  ]
}
```
