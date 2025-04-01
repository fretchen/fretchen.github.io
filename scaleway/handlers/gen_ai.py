import json
import logging
import os
import uuid

import requests
from cloudpathlib import CloudPath, S3Client


def upload_json(json_obj: dict, file_name: str) -> None:
    """
    Uploads a JSON object to S3.

    json_obj: The JSON object to upload.
    file_name: The name of the file to save the JSON object as.
    """
    logging.info(f"Uploading JSON to S3: {file_name}")
    access_key = os.getenv("SCW_ACCESS_KEY")
    secret_key = os.getenv("SCW_SECRET_KEY")

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
    MODEL_NAME = "black-forest-labs/FLUX.1-schnell"
    IONOS_API_TOKEN = os.getenv("IONOS_API_TOKEN")
    json_base_path = "https://my-imagestore.s3.nl-ams.scw.cloud/"

    if not IONOS_API_TOKEN:
        return {
            "body": {
                "error": "API Token not found. Please configure IONOS_API_TOKEN environment variable."
            },
            "statusCode": 401,  # Unauthorized
            "headers": {"Content-Type": ["application/json"]},
        }

    query_params = event.get("queryStringParameters", {})
    prompt = query_params.get("prompt")
    endpoint = "https://openai.inference.de-txl.ionos.com/v1/images/generations"

    header = {
        "Authorization": f"Bearer {IONOS_API_TOKEN}",
        "Content-Type": "application/json",
    }
    body = {"model": MODEL_NAME, "prompt": prompt, "size": "1024x1024"}
    response = requests.post(endpoint, json=body, headers=header)
    if response.status_code != 200:
        return {
            "body": {"error": "Could not reach ionos"},
            "statusCode": 401,  # Internal Server Error
            "headers": {"Content-Type": ["application/json"]},
        }
    # create a uuid for the file
    file_name = f"image{uuid.uuid4().hex[:6]}.json"
    json_path = f"{json_base_path}{file_name}"
    return {
        "body": {
            "b64_image": response.json()["data"][0]["b64_json"],
            "image_url": json_path,
        },
        "statusCode": 200,
        "headers": {"Content-Type": ["application/json"]},
    }


if __name__ == "__main__":
    # The import is conditional so that you do not need
    # to package the library when deploying on Scaleway Functions.
    from dotenv import load_dotenv
    from scaleway_functions_python import local

    load_dotenv()

    local.serve_handler(handler, port=8080)
