#!/bin/bash

project="url-redirect-bb"
region="asia-northeast1"

cd "$(dirname "$0")"

gcloud --project=$project functions deploy --region=$region --runtime nodejs6 --trigger-http --entry-point=get --timeout=10s --memory=1024 redirect-node
