export interface NFTMetadata {
  imageUrl: string;
  prompt: string;
  name: string;
  description: string;
}

export interface BlogPost {
  title: string;
  content: string;
  publishing_date?: string;
  order?: number;
  tokenID?: number;
  nftMetadata?: NFTMetadata;
}
