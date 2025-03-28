import os
import requests

def handler(event, context):
    query_params = event.get("queryStringParameters", {})

    # test if the IONOS_API_TOKEN is set
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
    
    # test if we can run a minimal request
    response = requests.get("https://example.com")
    if response.status_code != 200:
        return {
            "body": {
                "error": "Could not reach example.com"
            },
            "statusCode": 500,  # Internal Server Error
            "headers": {
                "Content-Type": ["application/json"]
            }
        }
    
    prompt = query_params.get("prompt")
    return {
        "body": {
            "message": prompt
        },
        "statusCode": 200,
        "headers": {
            "Content-Type": ["application/json"],
            "your-header": "your-value"
        }
    }







if __name__ == "__main__":
    # The import is conditional so that you do not need
    # to package the library when deploying on Scaleway Functions.
    from scaleway_functions_python import local
    local.serve_handler(handler, port=8080)