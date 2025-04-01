"""
A module that allows us to generate and image and upload it to S3.
"""
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


def handler(event, context):
    """
    A small module to test if we can upload a JSON object to S3
    and if we can run a minimal request.
    """
    model_name = "black-forest-labs/FLUX.1-schnell"
    endpoint = "https://openai.inference.de-txl.ionos.com/v1/images/generations"
    json_base_path = "https://my-imagestore.s3.nl-ams.scw.cloud/"

    ionos_api_token = os.getenv("IONOS_API_TOKEN")

    if not ionos_api_token:
        return {
            "body": {
                "error":("API Token not found."
                         " Please configure IONOS_API_TOKEN environment variable.") 
            },
            "statusCode": 401,  # Unauthorized
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*",
                "Content-Type": ["application/json"],
            },
        }

    query_params = event.get("queryStringParameters", {})
    prompt = query_params.get("prompt")

    header = {
        "Authorization": f"Bearer {ionos_api_token}",
        "Content-Type": "application/json",
    }
    body = {"model": model_name, "prompt": prompt, "size": "1024x1024"}
    response = requests.post(endpoint, json=body, headers=header, timeout=60)
    if response.status_code != 200:
        return {
            "body": {"error": "Could not reach ionos"},
            "statusCode": 401,  # Internal Server Error
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "*",
                "Content-Type": ["application/json"],
            },
        }

    b64_json = {"b64_image": response.json()["data"][0]["b64_json"]}
    logging.info("Got the image")
    # create a uuid for the file
    file_name = f"image{uuid.uuid4().hex[:6]}.json"

    # upload the json to s3
    upload_json(b64_json, file_name)
    logging.info("Finished the upload")

    json_path = f"{json_base_path}{file_name}"
    return {
        "body": {"image_url": json_path},
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "Content-Type": ["application/json"],
        },
    }


if __name__ == "__main__":
    # The import is conditional so that you do not need
    # to package the library when deploying on Scaleway Functions.
    from dotenv import load_dotenv
    from scaleway_functions_python import local

    load_dotenv()

    # Set logging level to INFO
    logging.basicConfig(level=logging.INFO)

    local.serve_handler(handler, port=8080)
