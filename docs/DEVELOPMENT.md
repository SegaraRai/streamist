# 開発について

## ローカル環境での開発

### インフラのセットアップ

ローカル環境では以下のサードパーティのインフラを要します

- S3 (Wasabi)

#### S3 (Wasabi) のセットアップ

予め AWS CLI をインストールし wasabi プロファイルを作成してください

- operation パッケージで initS3 を実行する
  - IAM ポリシーやバケットポリシーやバケット作成スクリプトが作成されます
- IAM ポリシーを作成する
- IAM ユーザーを作成する
  - `streamist-dev/server-dev` (Server ポリシー)
  - `streamist-dev/transcoder-dev` (Server ポリシー)
  - `streamist-dev/user-dev` (User ポリシー)
- バケットの作成
  - `bucketCommands.sh`を実行するとバケットの作成とポリシーの設定が自動で行われます

#### 設定の反映

- `packages/shared-server/env/.env.example`を元に`packages/shared-server/env/development.env`に設定を書き込む

## ステージング/プロダクション環境での開発

ステージング/プロダクション環境では以下のサードパーティのインフラを要します

- S3 (Wasabi)
- AWS Lambda
- Google Cloud Run
- VPS (SSH)

### インフラのセットアップ

#### S3 (Wasabi) のセットアップ

ローカル環境でのものと同じです

#### トランスコーダのセットアップ

以下は `packages/transcoder` を作業ディレクトリとします
トランスコーダの準備のため最初に以下を実行します

- operation パッケージで initTranscoder を実行する
- `TARGET_NODE_ENV`を適切に設定（`staging`または`production`）し`pnpm run build:transcoder`を実行してビルドする

##### AWS Lambda のセットアップ

AWS CLI をインストールし、aws プロファイルを作成してください

- IAM ポリシーを作成する（Deploy と Invoke の 2 種類）
- IAM ユーザーを作成する（Deploy と Invoke の 2 種類）
- Lambda レイヤーの作成（トランスコード用の実行ファイルを格納するレイヤー）
  - `createLayer.sh`を実行する
  - AWS コンソールでレイヤーを作成し、作成された`layer.zip`をアップロードする
- Lambda 関数の作成
  - AWS コンソールで Lambda 関数を作成する
    - 関数の名前は `packages/shared-server/src/objectStorage/config/*.ts` を参照
    - 関数の中身はとりあえず初期値で良い（デプロイ時に更新される）
    - VPC は設定しない
    - レイヤーに先程作成したものを追加する
    - メモリと実行時間制限を適当に設定する（現状は 1024MB\*15 分）
    - 以下の環境変数を設定する（暗号化はしない）
      TODO: 本当は Secret Manager か暗号化して管理したほうが良いが未対応
      - API_ORIGIN_FOR_TRANSCODER
      - MAGICK_CONFIGURE_PATH `/var/task/imconfig`
      - SECRET_API_CLIENT_REFERRER
      - SECRET_TRANSCODER_CALLBACK_SECRET
      - SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID
      - SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY
- `deploy.transcoder.sh`の`aws`の行を実行する

##### Google Cloud Run のセットアップ

Cloud SDK コマンドライン ツール（gcloud）をインストールしてください

- プロジェクトを作成する
- サービス アカウントを作成する
  - Transcoder Deploy
    - Cloud Build サービス アカウント
    - Cloud Run デベロッパー
    - サービス アカウント ユーザー
  - Transcoder Tasks
    - Cloud Run 起動元
    - クラウドタスクへのデータ追加
    - サービス アカウント ユーザー
- Workload Identity 連携を設定する
  - ID プールを作成する
    - OpenID Connect (OIDC)
    - GitHub
    - `https://token.actions.githubusercontent.com`
    - Default audience
    - 属性のマッピング
      - `google.subject`: `assertion.sub`
      - `attribute.aud`: `assertion.aud`
      - `attribute.actor`: `assertion.actor`
      - `attribute.repository`: `assertion.repository`
  - アクセスを許可から Transcoder Deploy を追加する
    - フィルタに一致する ID のみにし、`repository`を GitHub のリポジトリ名にする（`<ユーザー名>/<リポジトリ名>`の形式）
- Secret Manager に以下のシークレットを登録する
  それぞれのシークレットの権限にて Default compute service account プリンシパルにシークレット アクセサーのロールを付与する
  - API_ORIGIN_FOR_TRANSCODER
  - SECRET_API_CLIENT_REFERRER
  - SECRET_TRANSCODER_CALLBACK_SECRET
  - SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID
  - SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY
- Cloud Tasks で Push キューを作成する
  - 名前は config/production.ts または config/staging.ts を参照
  - 最大試行回数 4 回
  - 最小バックオフ 4 秒
- `deploy.transcoder.sh`の`gcloud`の行を実行する
  API を有効化するか等訊かれた場合は yes と答える

#### データベースバックアップ用 S3 バケットのセットアップ

バケット`staging-database-backup.stst.page`を`ap-northeast-1`に作成する（バケットポリシーはなし）

IAM ポリシー`StreamistStagingDBBackup`を以下の内容で作成する

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetObject", "s3:PutObject"],
      "Resource": [
        "arn:aws:s3:::staging-database-backup.stst.page",
        "arn:aws:s3:::staging-database-backup.stst.page/*"
      ]
    }
  ]
}
```

IAM ユーザー`StreamistStagingDBBackup`を作成し、IAM ロール`StreamistStagingDBBackup`を添付する

#### VPS のセットアップ

##### ローカル環境での準備（SSH 鍵の生成）

ローカルで以下を実行する
`streamist_staging_id_ed25519` と `streamist_staging_id_ed25519.pub` が作成される

```sh
ssh-keygen -t ed25519 -C "Streamist staging deploy SSH key" -f streamist_staging_id_ed25519
```

また、Cloudflare でゾーン DNS の編集とゾーンの読み取りができる API トークンを作成しておく
staging と production でゾーンが同じ場合は使い回せる（現状は使いまわしてる）

##### サーバー環境での準備

以下はすべて root ユーザーで実行する

予め `streamist_id_ed25519.pub` をサーバーに転送しておく
以下のように SSH で繋いでコピペして書き込めば良い

```sh
echo 'ssh-ed25519 AAAA....' > streamist_id_ed25519.pub
```

###### パッケージの更新、タイムゾーンの設定

```sh
apt update
apt upgrade -y

timedatectl set-timezone UTC
```

###### 管理用アカウントの作成

パスワードが訊かれるので入力する
`usermod`をちゃんと実行すること

```sh
adduser --gecos "" vps
usermod -aG sudo vps
```

###### SSH のポート変更、FW の設定

`/etc/ssh/sshd_config` を変更する
パスワードログインは本当は無効化したほうが良いがとりあえず有効なままにしておく

```plaintext
Port 43642
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication yes
PermitEmptyPasswords no
ClientAliveInterval 30
ClientAliveCountMax 3
```

以下を実行する
`ufw enable`でプロンプトされるので`y`を入力する

```sh
ufw allow 80
ufw allow 443
ufw allow 43642
ufw reload

/etc/init.d/ssh restart

ufw enable
```

一度 SSH 接続を切断し、`vps`ユーザーで改めてログインする
`sudo su -`を実行し、`sudo`が使用できることを確認した上で後続の手順を実行する

###### Docker のインストール

```sh
apt update
apt install -y ca-certificates curl gnupg lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl status docker

systemctl start docker
systemctl enable docker

adduser --gecos "" --disabled-password deploy
mkdir /home/deploy/.ssh
cat streamist_id_ed25519.pub >> /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

usermod -aG docker deploy
```

###### アプリディレクトリのセットアップ

```sh
mkdir -p /app/data/lego
chown -R deploy:deploy /app
```

###### lego のセットアップ

以下を実行する

```sh
mkdir -p /etc/lego
```

以下のスクリプトを`/etc/lego/update.sh`に配置する
`DOMAIN`と`CLOUDFLARE_DNS_API_TOKEN`は適宜変更する
注: `DOMAIN`にはプロキシの背後の API サーバのドメインを指定する

```sh
#!/bin/bash

COMMAND="$1"

if [ "$COMMAND" != "run" ] && [ "$COMMAND" != "renew" ]; then
  echo "Usage: $0 [run|renew]"
  exit 1
fi

LEGO_DIR=/etc/lego/data
KEY_TYPE=ec384
EMAIL=ssl-admin@streamist.app
DOMAIN=XXXXXXXXXX.streamist.app
CLOUDFLARE_DNS_API_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

CLOUDFLARE_DNS_API_TOKEN=$CLOUDFLARE_DNS_API_TOKEN lego --accept-tos --path $LEGO_DIR --key-type $KEY_TYPE --dns cloudflare --email $EMAIL --domains $DOMAIN $COMMAND --$COMMAND-hook "/etc/lego/hook.sh $DOMAIN $COMMAND"
```

以下のスクリプトを`/etc/lego/hook.sh`に配置する

```sh
#!/bin/bash

DOMAIN="$1"
COMMAND="$2"

if [ "$DOMAIN" = "" ]; then
  echo "Usage: $0 [domain] [command]"
  exit 1
fi

cat /etc/lego/data/certificates/$DOMAIN.crt /etc/lego/data/certificates/$DOMAIN.key > /app/data/lego/cert.pem
chmod 644 /app/data/lego/cert.pem

if [ "$COMMAND" == "renew" ]; then
  cd /app
  docker compose restart haproxy
fi
```

以下を実行する
lego のバージョンは適宜更新する

```sh
curl -L -o lego_binary.tar.gz https://github.com/go-acme/lego/releases/download/v4.6.0/lego_v4.6.0_linux_amd64.tar.gz
tar xf lego_binary.tar.gz
chown root:root lego
chmod 0755 lego
cp lego /usr/local/bin/lego

adduser --gecos "" --disabled-password lego
usermod -aG docker lego

chown -R lego:lego /etc/lego
chmod 0700 /etc/lego/*.sh

chown lego:lego /app/data/lego
```

証明書を発行する

```sh
runuser -l lego -c "/etc/lego/update.sh run"
```

cron を設定する
production 環境では DNS の競合を避けるため一応`0 1`にすること

```sh
echo "0 0 * * * lego /etc/lego/update.sh renew" > /etc/cron.d/lego
chmod 644 /etc/cron.d/lego
systemctl restart cron.service
```

###### swap の設定

4GB の swap メモリを設定する
既にスワップファイルが作成されている場合は`/etc/fstab`の設定は不要

```sh
free -h
swapoff -a
dd if=/dev/zero of=/swapfile bs=1G count=4
mkswap /swapfile
swapon /swapfile
# echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
```

###### Netdata のセットアップ

Docker Compose を用いる

```sh
mkdir -p /netdata
cd /netdata
```

以下を`/netdata/docker-compose.yml`として作成する
`hostname`と`environment`は適宜修正すること

```yml
version: '3'
services:
  netdata:
    image: netdata/netdata
    container_name: netdata
    hostname: <...>
    restart: always
    cap_add:
      - SYS_PTRACE
    security_opt:
      - apparmor:unconfined
    volumes:
      - netdataconfig:/etc/netdata
      - netdatalib:/var/lib/netdata
      - netdatacache:/var/cache/netdata
      - /etc/passwd:/host/etc/passwd:ro
      - /etc/group:/host/etc/group:ro
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /etc/os-release:/host/etc/os-release:ro
    environment:
      - NETDATA_CLAIM_TOKEN=<...>
      - NETDATA_CLAIM_URL=https://app.netdata.cloud
      - NETDATA_CLAIM_ROOMS=<...>
  proxy:
    image: tecnativa/docker-socket-proxy
    restart: always
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - CONTAINERS=1

volumes:
  netdataconfig:
  netdatalib:
  netdatacache:
```

起動する

```sh
docker compose up -d
```

###### 最終確認

- `docker`コマンドは存在するか
- `lego`コマンドは存在するか
- `vps`ユーザーは
  - 存在するか
  - 設定したパスワードで SSH でログインできるか
  - `sudo`できるか
- `deploy`ユーザーは
  - 存在するか
  - `docker`コマンドが使えるか
  - `/home/deploy/.ssh/authorized_keys`に`streamist_id_ed25519.pub`が設定されているか
- `lego`ユーザーは
  - 存在するか
  - `docker`コマンドが使えるか
- `/app/data/lego`は
  - ディレクトリとして存在するか
  - オーナーとグループは`lego:lego`になっているか
  - パーミッションは`0755`になっているか
- `/app/data/lego/cert.pem`は
  - ファイルとして存在するか
  - オーナーとグループは`lego:lego`になっているか
  - パーミッションは`0644`になっているか

#### GitHub の設定

`streamist-build`リポジトリを作成する

以下のシークレットを登録する

- SECRET_GH_CF_API_TOKEN

- SECRET_GH_STAGING_BUILD_REPOSITORY_DEPLOY_KEY (`-----BEGIN OPENSSH PRIVATE KEY-----\n...`)
- SECRET_GH_STAGING_BUILD_REPOSITORY_NAME (`<username>/<repository>`)
- SECRET_GH_STAGING_DEPLOY_TRANSCODER_GCP_WIF_IDP (`projects/<123456789>/locations/global/workloadIdentityPools/<example-identity-pool>/providers/github`)
- SECRET_GH_STAGING_DEPLOY_TRANSCODER_GCP_WIF_SA (`<example-deploy-account>@<example>.iam.gserviceaccount.com`)
- SECRET_GH_STAGING_DEPLOY_TRANSCODER_LAMBDA_ACCESS_KEY_ID
- SECRET_GH_STAGING_DEPLOY_TRANSCODER_LAMBDA_SECRET_ACCESS_KEY
- SECRET_GH_STAGING_SSH_KEY (`-----BEGIN OPENSSH PRIVATE KEY-----\n...`)
- SECRET_GH_STAGING_SSH_KNOWN_HOSTS (`xxx.xxx.xxx.xxx ecdsa-sha2-nistp256 AAAA...`)
- SECRET_GH_STAGING_SSH_REMOTE (`<xxx.xxx.xxx.xxx>`)
- STAGING_HCAPTCHA_SITE_KEY_FOR_REGISTRATION
- STAGING_SECRET_CDN_CACHE_SECURITY_KEY_HMAC_SECRET
- STAGING_SECRET_CDN_JWT_SECRET
- STAGING_SECRET_CDN_STORAGE_ACCESS_REFERRER
- STAGING_SECRET_WS_JWT_SECRET
- STAGING_SECRET_WS_AUTH_TOKEN
- STAGING_SECRET_ENV_DATABASE
- STAGING_SECRET_ENV_DATABASE_BACKUP
- STAGING_SECRET_ENV_SERVER
- STAGING_SECRET_GOOGLE_APPLICATION_CREDENTIALS_JSON

##### `SECRET_GH_STAGING_SSH_KEY`

以下のような形式で`deploy`ユーザの秘密鍵を登録する
念の為最後に改行を入れておく

```plaintext
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

##### `SECRET_GH_STAGING_SSH_KNOWN_HOSTS`

以下のような形式で`known_hosts`の内容を登録する
念の為最後に改行を入れておく
ポート番号は指定しなくて良い

```plaintext
xxx.xxx.xxx.xxx ecdsa-sha2-nistp256 AAAA...
```

##### `STAGING_SECRET_ENV_DATABASE`

```env
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=
```

##### `STAGING_SECRET_ENV_DATABASE_BACKUP`

```env
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
PASSPHRASE=
```

##### `STAGING_SECRET_ENV_SERVER`

```env
WS_ORIGIN_FOR_SERVER=
SECRET_DATABASE_URL=postgresql://<username>:<password>@postgres:5432/<database>?connection_limit=1
SECRET_API_JWT_SECRET=
SECRET_CDN_JWT_SECRET=
SECRET_WS_JWT_SECRET=
SECRET_REFRESH_TOKEN_JWT_SECRET=
SECRET_TRANSCODER_CALLBACK_SECRET=
SECRET_API_PROXY_AUTH_TOKEN=
SECRET_WS_AUTH_TOKEN=
SECRET_SERVER_WASABI_ACCESS_KEY_ID=
SECRET_SERVER_WASABI_SECRET_ACCESS_KEY=
SECRET_USER_DOWNLOAD_WASABI_ACCESS_KEY_ID=
SECRET_USER_DOWNLOAD_WASABI_SECRET_ACCESS_KEY=
SECRET_USER_UPLOAD_WASABI_ACCESS_KEY_ID=
SECRET_USER_UPLOAD_WASABI_SECRET_ACCESS_KEY=
SECRET_INVOKE_TRANSCODER_GCR_SERVICE_ACCOUNT=
SECRET_INVOKE_TRANSCODER_LAMBDA_ACCESS_KEY_ID=
SECRET_INVOKE_TRANSCODER_LAMBDA_SECRET_ACCESS_KEY=
HCAPTCHA_SITE_KEY_FOR_REGISTRATION=
SECRET_HCAPTCHA_SECRET_KEY=
```

##### `STAGING_SECRET_GOOGLE_APPLICATION_CREDENTIALS_JSON`

`Transcoder Tasks`サービスアカウントの資格情報を登録する

#### Cloudflare Pages の設定

GitHub での設定を行い、一度デプロイが実行されている必要がある

`streamist-build`リポジトリでプロジェクトを作成する
ビルドコマンドはなし（空欄）、出力ディレクトリは`/dist`にする

設定の環境変数に以下を追加する

- API_BASE_PATH
- API_ORIGIN_FOR_API_PROXY
- APP_ORIGIN
- SECRET_API_PROXY_AUTH_TOKEN

現状はシークレットには未対応の模様

ステージング環境には更に Cloudflare Access を用いてアクセス制限を行う

### CI/CD でデプロイされるもの、されないもの

- デプロイされるもの
  - VPS で Docker Compose で動かしてるもの全般とその環境変数
    - API サーバのプログラム、構成、環境変数
    - バッチサーバのプログラム、構成、環境変数
    - HAProxy の構成
    - PostgreSQL の構成、環境変数
  - データベースのマイグレーション
  - `streamist-build`リポジトリ
    - フロントエンドのコードとアセット
    - API プロキシ（Functions）のコード
  - トランスコーダのコード
    - AWS Lambda のコード
    - Google Cloud Run のコード
  - CDN のコードとシークレット
  - WS のコードとシークレット
- デプロイされないもの
  - フロントエンドの API プロキシ（Functions）の環境変数
  - トランスコーダ（AWS Lambda）の設定（メモリや実行時間制限等）と環境変数またはシークレット
  - トランスコーダ（Google Cloud Run）の設定（メモリや実行時間制限等）と環境変数またはシークレット
