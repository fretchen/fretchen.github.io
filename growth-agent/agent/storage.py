"""State storage: S3 for production, local JSON files for notebook development."""

import json
from pathlib import Path

import boto3
from pydantic import BaseModel


class LocalStorage:
    """Local filesystem storage for notebook development."""

    def __init__(self, base_dir: str = "state"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def read(self, key: str) -> dict | list | None:
        path = self.base_dir / key
        if not path.exists():
            return None
        return json.loads(path.read_text())

    def write(self, key: str, data: dict | list | BaseModel) -> None:
        path = self.base_dir / key
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(data, BaseModel):
            path.write_text(data.model_dump_json(indent=2))
        else:
            path.write_text(json.dumps(data, indent=2, default=str))

    def list_keys(self, prefix: str = "") -> list[str]:
        return [
            str(p.relative_to(self.base_dir))
            for p in self.base_dir.rglob("*")
            if p.is_file() and str(p.relative_to(self.base_dir)).startswith(prefix)
        ]


class S3Storage:
    """S3 storage for production use."""

    def __init__(
        self,
        bucket: str,
        prefix: str = "growth-agent/",
        access_key: str | None = None,
        secret_key: str | None = None,
        region: str = "nl-ams",
    ):
        self.bucket = bucket
        self.prefix = prefix
        self.s3 = boto3.client(
            "s3",
            region_name=region,
            endpoint_url=f"https://s3.{region}.scw.cloud",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

    def read(self, key: str) -> dict | list | None:
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=self.prefix + key)
            return json.loads(response["Body"].read())
        except self.s3.exceptions.NoSuchKey:
            return None

    def write(self, key: str, data: dict | list | BaseModel) -> None:
        if isinstance(data, BaseModel):
            body = data.model_dump_json(indent=2)
        else:
            body = json.dumps(data, indent=2, default=str)
        self.s3.put_object(
            Bucket=self.bucket,
            Key=self.prefix + key,
            Body=body,
            ContentType="application/json",
        )

    def list_keys(self, prefix: str = "") -> list[str]:
        response = self.s3.list_objects_v2(
            Bucket=self.bucket, Prefix=self.prefix + prefix
        )
        return [
            obj["Key"].removeprefix(self.prefix) for obj in response.get("Contents", [])
        ]
