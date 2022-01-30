#!/bin/sh

FILE=database.env
rm -f $FILE
echo POSTGRES_USER=$SECRET_POSTGRES_USER >> $FILE
echo POSTGRES_PASSWORD=$SECRET_POSTGRES_PASSWORD >> $FILE
echo POSTGRES_DB=$SECRET_POSTGRES_DB >> $FILE

FILE=server.env
rm -f $FILE
echo SECRET_DATABASE_URL=$SECRET_DATABASE_URL >> $FILE
echo SECRET_API_JWT_SECRET=$SECRET_API_JWT_SECRET >> $FILE
echo SECRET_CDN_JWT_SECRET=$SECRET_CDN_JWT_SECRET >> $FILE
echo SECRET_REFRESH_TOKEN_JWT_SECRET=$SECRET_REFRESH_TOKEN_JWT_SECRET >> $FILE
echo SECRET_TRANSCODER_CALLBACK_SECRET=$SECRET_TRANSCODER_CALLBACK_SECRET >> $FILE
echo SECRET_API_PROXY_AUTH_TOKEN=$SECRET_API_PROXY_AUTH_TOKEN >> $FILE
echo SECRET_SERVER_WASABI_ACCESS_KEY_ID=$SECRET_SERVER_WASABI_ACCESS_KEY_ID >> $FILE
echo SECRET_SERVER_WASABI_SECRET_ACCESS_KEY=$SECRET_SERVER_WASABI_SECRET_ACCESS_KEY >> $FILE
echo SECRET_USER_DOWNLOAD_WASABI_ACCESS_KEY_ID=$SECRET_USER_DOWNLOAD_WASABI_ACCESS_KEY_ID >> $FILE
echo SECRET_USER_DOWNLOAD_WASABI_SECRET_ACCESS_KEY=$SECRET_USER_DOWNLOAD_WASABI_SECRET_ACCESS_KEY >> $FILE
echo SECRET_USER_UPLOAD_WASABI_ACCESS_KEY_ID=$SECRET_USER_UPLOAD_WASABI_ACCESS_KEY_ID >> $FILE
echo SECRET_USER_UPLOAD_WASABI_SECRET_ACCESS_KEY=$SECRET_USER_UPLOAD_WASABI_SECRET_ACCESS_KEY >> $FILE
echo SECRET_INVOKE_TRANSCODER_LAMBDA_ACCESS_KEY_ID=$SECRET_INVOKE_TRANSCODER_LAMBDA_ACCESS_KEY_ID >> $FILE
echo SECRET_INVOKE_TRANSCODER_LAMBDA_SECRET_ACCESS_KEY=$SECRET_INVOKE_TRANSCODER_LAMBDA_SECRET_ACCESS_KEY >> $FILE
echo HCAPTCHA_SITE_KEY_FOR_REGISTRATION=$HCAPTCHA_SITE_KEY_FOR_REGISTRATION >> $FILE
echo SECRET_HCAPTCHA_SECRET_KEY=$SECRET_HCAPTCHA_SECRET_KEY >> $FILE

FILE=database_backup.env
rm -f $FILE
echo POSTGRES_USER=$SECRET_POSTGRES_USER >> $FILE
echo POSTGRES_PASSWORD=$SECRET_POSTGRES_PASSWORD >> $FILE
echo POSTGRES_DATABASE=$SECRET_POSTGRES_DB >> $FILE
echo S3_BUCKET=$SECRET_DATABASE_BACKUP_S3_BUCKET >> $FILE
echo S3_ACCESS_KEY_ID=$SECRET_DATABASE_BACKUP_S3_ACCESS_KEY_ID >> $FILE
echo S3_SECRET_ACCESS_KEY=$SECRET_DATABASE_BACKUP_S3_SECRET_ACCESS_KEY >> $FILE
echo PASSPHRASE=$SECRET_DATABASE_BACKUP_PASSPHRASE >> $FILE
