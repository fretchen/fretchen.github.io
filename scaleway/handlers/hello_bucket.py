"""
A small module to test if we can upload a JSON object to S3
and if we can run a minimal request.
"""

import json
import logging
import os

import requests
import boto3


def upload_json(json_obj: dict, file_name: str) -> str:
    """
    Uploads a JSON object to S3 using boto3 directly.

    json_obj: The JSON object to upload.
    file_name: The name of the file to save the JSON object as.
    """
    logging.info("Uploading JSON to S3: %s", file_name)
    access_key = os.getenv("SCW_ACCESS_KEY")
    secret_key = os.getenv("SCW_SECRET_KEY")
    if not access_key or not secret_key:
        raise ValueError(
            "SCW_ACCESS_KEY and SCW_SECRET_KEY must be set."
        )
    # Convert the JSON object to a string
    json_str = json.dumps(json_obj)
    
    bucket_name = "my-imagestore"
    
    # Create boto3 client directly
    s3_client = boto3.client(
        's3',
        endpoint_url="https://s3.nl-ams.scw.cloud",
        use_ssl=True,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="nl-ams"  # Optional, Scaleway region
    )
    
    # Upload the object directly
    s3_client.put_object(
        Bucket=bucket_name,
        Key=file_name,
        Body=json_str,
        ContentType='application/json',
        ACL='public-read'
    )
    
    logging.info("Uploaded JSON to S3: %s", file_name)
    
    # Rückgabe der öffentlichen URL (optional)
    return f"https://{bucket_name}.s3.nl-ams.scw.cloud/{file_name}"


def handler(event, context):
    """
    A small module to test if we can upload a JSON object to S3
    and if we can run a minimal request.
    """
    query_params = event.get("queryStringParameters", {})

    # test if the IONOS_API_TOKEN is set
    ionos_api_token = os.getenv("IONOS_API_TOKEN")
    if not ionos_api_token:
        return {
            "body": {
                "error": ("API Token not found. Please configure" 
                         " IONOS_API_TOKEN environment variable.")
            },
            "statusCode": 401,  # Unauthorized
            "headers": {"Content-Type": ["application/json"]},
        }
    try:
        upload_json({"test": "data"}, "test.json")
    except ValueError as e:
        return {
            "body": {"error": str(e)},
            "statusCode": 500,  # Internal Server Error
            "headers": {"Content-Type": ["application/json"]},
        }

    # test if we can run a minimal request
    response = requests.get("https://example.com", timeout=5)
    if response.status_code != 200:
        return {
            "body": {"error": "Could not reach example.com"},
            "statusCode": 500,  # Internal Server Error
            "headers": {"Content-Type": ["application/json"]},
        }

    prompt = query_params.get("prompt")
    return {
        "body": {"message": prompt},
        "statusCode": 200,
        "headers": {"Content-Type": ["application/json"], "your-header": "your-value"},
    }


if __name__ == "__main__":
    # The import is conditional so that you do not need
    # to package the library when deploying on Scaleway Functions.
    from scaleway_functions_python import local

    local.serve_handler(handler, port=8080)
