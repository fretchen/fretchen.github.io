def handler(event, context):
    query_params = event.get("queryStringParameters", {})
    prompt = query_params.get("prompt")
    prompt = prompt if prompt else "No message"
    print(f"Prompt: {prompt}")
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
