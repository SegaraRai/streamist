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
  - `bucketCommands.sh` を実行するとバケットの作成とポリシーの設定が自動で行われます

#### 設定の反映

- `packages/shared-server/env/.env.example` を元に `packages/shared-server/env/development.env` に設定を書き込む

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
- TARGET_NODE_ENV を適切に設定（staging または production）し`pnpm run build:transcoder`を実行してビルドする

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
      - SECRET_TRANSCODER_CALLBACK_SECRET
      - SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID
      - SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY
- `deploy.transcoder.sh`の `aws` の行を実行する

##### Google Cloud Run のセットアップ

Cloud SDK コマンドライン ツール（gcloud）をインストールしてください

- プロジェクトを作成する
- Secret Manager にシークレットを登録する
  それぞれのシークレットの権限にて Default compute service account プリンシパルにシークレット アクセサーのロールを付与する
  - API_ORIGIN_FOR_TRANSCODER
  - SECRET_TRANSCODER_CALLBACK_SECRET
  - SECRET_TRANSCODER_WASABI_ACCESS_KEY_ID
  - SECRET_TRANSCODER_WASABI_SECRET_ACCESS_KEY
- `deploy.transcoder.sh`の `gcloud` の行を実行する
  API を有効化するか等訊かれた場合は yes と答える

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

パスワードは適当に生成しておく
ここでは対話的な作業が必要

```sh
adduser vps
usermod -aG sudo vps
```

###### SSH のポート変更、FW の設定

/etc/ssh/sshd_config を変更する
パスワードログインは本当は無効化したほうが良いがとりあえず有効なままにしておく

```diff
- #Port 22
+ Port 43642

- PermitRootLogin yes
+ PermitRootLogin no

- #PubkeyAuthentication yes
+ PubkeyAuthentication yes
```

以下を実行する

```sh
ufw allow 80
ufw allow 443
ufw allow 43642
ufw reload

/etc/init.d/ssh restart

ufw enable
```

###### Docker のインストール

```sh
apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
apt update
apt-cache policy docker-ce

apt install -y docker-ce
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

###### Docker Compose のインストール

```sh
curl -L -o /usr/local/bin/docker-compose https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64
chmod +x /usr/local/bin/docker-compose
```

###### アプリディレクトリのセットアップ

```sh
mkdir -p /app/data/lego
chown -R deploy:deploy /app
```

###### lego のセットアップ

以下のスクリプトを /etc/lego/update.sh に配置する
`DOMAIN`と`CLOUDFLARE_DNS_API_TOKEN`は適宜変更する

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

CLOUDFLARE_DNS_API_TOKEN=$CLOUDFLARE_DNS_API_TOKEN lego --accept-tos --path $LEGO_DIR --key-type $KEY_TYPE --run-hook="/etc/lego/hook.sh $DOMAIN" --dns cloudflare --email $EMAIL --domains $DOMAIN $COMMAND
```

以下のスクリプトを /etc/lego/hook.sh に配置する

```sh
#!/bin/bash

DOMAIN="$1"

if [ "$DOMAIN" = "" ]; then
  echo "Usage: $0 [domain]"
  exit 1
fi

cat /etc/lego/data/certificates/$DOMAIN.crt /etc/lego/data/certificates/$DOMAIN.key > /app/data/lego/cert.pem
chmod 644 /app/data/lego/cert.pem

cd /app
docker-compose restart haproxy
```

以下を実行する
lego のバージョンは適宜更新する

```sh
curl -L -o lego_binary.tar.gz https://github.com/go-acme/lego/releases/download/v4.6.0/lego_v4.6.0_linux_amd64.tar.gz
tar xf lego_binary.tar.gz
chown root:root lego
chmod 0755 lego
sudo cp lego /usr/local/bin/lego

adduser --gecos "" --disabled-password lego
usermod -aG docker lego

chown -R lego:lego /etc/lego
chmod 0700 /etc/lego/*.sh

chown lego:lego /app/data/lego
```

DNS を設定する

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

###### 最終確認

- `docker`コマンドは存在するか
- `docker-compose`コマンドは存在するか
- `lego`コマンドは存在するか
- `vps`ユーザーは
  - 存在するか
  - 設定したパスワードで SSH でログインできるか
  - `sudo`できるか
- `deploy`ユーザーは
  - 存在するか
  - `docker`コマンドが使えるか
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

##### GitHub での設定

`streamist-build`リポジトリを作成する

秘密鍵を `SECRET_GH_STAGING_SSH_KEY` として登録する（以下のような形式）

```plaintext
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

known_hosts を `SECRET_GH_STAGING_SSH_KNOWN_HOSTS` として登録する（以下のような形式）

```plaintext
xxx.xxx.xxx.xxx ecdsa-sha2-nistp256 AAAA...
```

`SECRET_GH_STAGING_SSH_PORT` に 43642 を登録する

`SECRET_GH_STAGING_SSH_IP_ADDRESS` に接続先の IP アドレスを登録する

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
- デプロイされないもの
  - フロントエンドの API プロキシ（Functions）の環境変数
  - トランスコーダ（AWS Lambda）の設定（メモリや実行時間制限等）と環境変数またはシークレット
  - トランスコーダ（Google Cloud Run）の設定（メモリや実行時間制限等）と環境変数またはシークレット
