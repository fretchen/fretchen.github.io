import requests
import os


def handler(event, context):
    MODEL_NAME = "black-forest-labs/FLUX.1-schnell"
    IONOS_API_TOKEN = os.getenv('IONOS_API_TOKEN')
    
    if not IONOS_API_TOKEN:
        return {
            "body": {
                "error": "API Token not found. Please configure IONOS_API_TOKEN environment variable."
            },
            "statusCode": 401,  # Unauthorized
            "headers": {
                "Content-Type": ["application/json"]
            }
        }


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
    if response.status_code != 200:
        return {
            "body": {
                "error": "Could not reach ionos"
            },
            "statusCode": 401,  # Internal Server Error
            "headers": {
                "Content-Type": ["application/json"]
            }
        }
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
    from dotenv import load_dotenv
    load_dotenv()

    local.serve_handler(handler, port=8080)