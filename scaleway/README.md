# Scaleway funtions

A subset to interact with the Scaleway API.

- The functions live in the `handlers`directory.
- I manage the dependencies with `poetry`.
- You can start the handlers with `poetry run python handlers/dec_ai.py` in a test environment and then see if things work out in th `request_tests.ipynb`.

## Deployment

- Export the dependencies with `poetry export -f requirements.txt --output requirements.txt --without-hashes`
- Export the functions to the package folder with `pip install -r requirements.txt --target ./package`
- Zip the content of the two folder folder with `zip -r functions.zip handlers/ package/`
- Upload the zip file to the Scaleway console.
- Set the handler to handlers.<gen_ai/hello_world>.handler