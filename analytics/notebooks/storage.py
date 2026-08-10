"""State storage for analytics notebooks: S3 for real reads, local JSON for fixtures."""

import json
from pathlib import Path

import boto3


class LocalStorage:
    """Local filesystem storage — for fixture-driven dev without live credentials."""

    def __init__(self, base_dir: str = "state"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def read(self, key: str) -> dict | None:
        path = self.base_dir / key
        return json.loads(path.read_text()) if path.exists() else None

    def write(self, key: str, data: dict) -> None:
        path = self.base_dir / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data, indent=2))

    def list_keys(self, prefix: str = "") -> list[str]:
        return sorted(
            str(p.relative_to(self.base_dir))
            for p in self.base_dir.rglob("*")
            if p.is_file() and str(p.relative_to(self.base_dir)).startswith(prefix)
        )


class S3Storage:
    """Real Scaleway Object Storage — same bucket/region defaults as @fretchen/s3-utils."""

    def __init__(
        self,
        bucket: str = "my-imagestore",
        region: str = "nl-ams",
        access_key: str | None = None,
        secret_key: str | None = None,
    ):
        self.bucket = bucket
        self.s3 = boto3.client(
            "s3",
            region_name=region,
            endpoint_url=f"https://s3.{region}.scw.cloud",
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
        )

    def read(self, key: str) -> dict | None:
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=key)
            return json.loads(response["Body"].read())
        except self.s3.exceptions.NoSuchKey:
            return None

    def list_keys(self, prefix: str = "") -> list[str]:
        response = self.s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        return [obj["Key"] for obj in response.get("Contents", [])]
