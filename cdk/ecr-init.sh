#!/bin/bash

if [ ! -f .env ]; then
    echo ".envファイルが見つかりません。" >&2
    exit 1
fi

set -a
. ./.env
set +a

ECR_REPOSITORY_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY_NAME"

aws ecr create-repository --repository-name docmost --profile ${AWS_PROFILE}
aws ecr get-login-password --region ${REGION} --profile ${AWS_PROFILE} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
docker build -f ./src/Dockerfile -t ${ECR_REPOSITORY_NAME} --progress=plain --no-cache ./src
docker tag ${ECR_REPOSITORY_NAME}:latest ${ECR_REPOSITORY_URI}:latest
docker push ${ECR_REPOSITORY_URI}:latest
