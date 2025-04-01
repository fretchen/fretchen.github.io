import json
import logging
import os

import requests


def upload_json(json_obj: dict, file_name: str) -> None:
    """
    Uploads a JSON object to S3.

    json_obj: The JSON object to upload.
    file_name: The name of the file to save the JSON object as.
    """
    logging.info(f"Uploading JSON to S3: {file_name}")
    access_key = os.getenv("SCW_ACCESS_KEY")
    secret_key = os.getenv("SCW_SECRET_KEY")
    if not access_key or not secret_key:
        raise ValueError(
            "SCW_ACCESS_KEY and SCW_SECRET_KEY must be set in environment variables."
        )
    # Convert the JSON object to a string
    json_str = json.dumps(json_obj)

    path_str = f"s3://my-imagestore/{file_name}"

    # create the s3 client
    s3_client = S3Client(
        endpoint_url="https://s3.nl-ams.scw.cloud",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        extra_args={"ACL": "public-read"},
    )
    # Write the JSON string to a file
    with CloudPath(path_str, client=s3_client).open("w") as f:
        f.write(json_str)
    logging.info(f"Uploaded JSON to S3: {file_name}")


def handler(event, context):
    query_params = event.get("queryStringParameters", {})

    # test if the IONOS_API_TOKEN is set
    IONOS_API_TOKEN = os.getenv("IONOS_API_TOKEN")
    if not IONOS_API_TOKEN:
        return {
            "body": {
                "error": "API Token not found. Please configure IONOS_API_TOKEN environment variable."
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
    response = requests.get("https://example.com")
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


def handler(event, context):
    query_params = event.get("queryStringParameters", {})

    # test if the IONOS_API_TOKEN is set
    IONOS_API_TOKEN = os.getenv("IONOS_API_TOKEN")
    if not IONOS_API_TOKEN:
        return {
            "body": {
                "error": "API Token not found. Please configure IONOS_API_TOKEN environment variable."
            },
            "statusCode": 401,  # Unauthorized
            "headers": {"Content-Type": ["application/json"]},
        }

    # test if we can run a minimal request
    response = requests.get("https://example.com")
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
