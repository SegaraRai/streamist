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

##### ローカル環境での準備（SSH 鍵の生成）

ローカルで以下を実行する
streamist_staging_id_ed25519 と streamist_staging_id_ed25519.pub が作成される

```sh
ssh-keygen -t ed25519 -C "Streamist staging deploy SSH key" -f streamist_staging_id_ed25519
```

また、Cloudflare でゾーン DNS の編集ができる API トークンを作成しておく

##### サーバー環境での準備

予め streamist_id_ed25519.pub を用意しておく

```sh
echo 'ssh-ed25519 AAAA....' > streamist_id_ed25519.pub
```

###### パッケージの更新

```sh
apt update
apt upgrade -y

timedatectl set-timezone UTC
```

###### 管理用アカウントの作成

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

DNS を設定してみる

```sh
runuser -l lego -c "/etc/lego/update.sh run"
```

##### GitHub での設定

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
