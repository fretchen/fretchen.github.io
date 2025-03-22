import requests

from dotenv import load_dotenv
import os

load_dotenv()

def handler(event, context):
    MODEL_NAME = "black-forest-labs/FLUX.1-schnell"
    IONOS_API_TOKEN = os.getenv('IONOS_API_TOKEN')
    query_params = event.get("queryStringParameters", {})
    prompt = query_params.get("prompt")
    endpoint = "https://openai.inference.de-txl.ionos.com/v1/images/generations"

    header = {
        "Authorization": f"Bearer {IONOS_API_TOKEN}", 
        "Content-Type": "application/json"
    }
    body = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "size": "1024x1024"
    }
    response = requests.post(endpoint, json=body, headers=header)
    # print(response.json())
    return {
        "body": {
            "b64_image": response.json()['data'][0]['b64_json']
        },
        "statusCode": 200,
        "headers": {
            "Content-Type": ["application/json"]
        }
    }






if __name__ == "__main__":
    # The import is conditional so that you do not need
    # to package the library when deploying on Scaleway Functions.
    from scaleway_functions_python import local
    local.serve_handler(handler, port=8080)