/**
 * Shared component type definitions
 * Organised by component groups and inheritance relationships
 */

import { BlogPost } from "./BlogPost";

// ===== BASE INTERFACES =====

/**
 * Base props for all components with optional CSS class name
 */
export interface BaseComponentProps {
  className?: string;
}

/**
 * Base props for components that handle click events
 */
export interface ClickableComponentProps extends BaseComponentProps {
  onClick?: () => void;
}

/**
 * Base props for components with children
 */
export interface ComponentWithChildren extends BaseComponentProps {
  children: React.ReactNode;
}

// ===== NAVIGATION AND LINK INTERFACES =====

/**
 * Props for navigation link components
 */
export interface LinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Post navigation item interface
 */
export interface PostNavigationItem {
  title: string;
  id: number;
}

// ===== CARD AND LIST INTERFACES =====

/**
 * Props for the Card component
 */
export interface CardProps extends BaseComponentProps {
  title: string;
  description: string;
  link: string;
}

/**
 * Represents a blog entry with optional metadata
 */
export interface BlogEntry {
  title: string;
  publishing_date?: string;
  description?: string;
  slug?: string;
  order?: number;
}

/**
 * Props for the EntryList component
 */
export interface EntryListProps extends BaseComponentProps {
  /** Array of blog entries to display */
  blogs: BlogEntry[];
  /** Base path for entry links */
  basePath: string;
  /** Optional CSS class name for title elements */
  titleClassName?: string;
  /** Whether to display the publishing date */
  showDate?: boolean;
  /** Whether to reverse the order of entries */
  reverseOrder?: boolean;
  /** Maximum number of entries to display */
  limit?: number;
  /** Whether to show a "View all" link when entries are limited */
  showViewAllLink?: boolean;
}

// ===== CONTENT AND MEDIA INTERFACES =====

/**
 * Props for the MyFigure component
 */
export interface MyFigureProps {
  href: string;
  caption: string;
}

/**
 * Enhanced Post props extending BlogPost
 */
export interface PostProps extends BlogPost {
  /** Previous post navigation */
  prevPost?: PostNavigationItem | null;
  /** Next post navigation */
  nextPost?: PostNavigationItem | null;
  /** Base path for navigation (e.g., "/amo", "/quantum/basics") */
  basePath?: string;
}

/**
 * Props for the TitleBar component
 */
export interface TitleBarProps extends BaseComponentProps {
  title: string;
}

// ===== IMAGE AND MODAL INTERFACES =====

/**
 * NFT Metadata structure
 */
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

/**
 * NFT object with token information
 */
export interface NFT {
  tokenId: bigint;
  tokenURI: string;
  metadata?: NFTMetadata;
  imageUrl?: string;
  isLoading?: boolean;
  error?: string;
}

/**
 * Props for the NFTCard component
 */
export interface NFTCardProps extends BaseComponentProps {
  nft: NFT;
  onImageClick: (image: { src: string; alt: string; title?: string; description?: string }) => void;
  onNftBurned: () => void;
  isHighlighted?: boolean;
}

/**
 * Props for the NFTList component
 */
export interface NFTListProps extends BaseComponentProps {
  newlyCreatedNFT?: { tokenId: bigint; imageUrl: string };
  onNewNFTDisplayed?: () => void;
}

/**
 * Props for the ImageGenerator component
 */
export interface ImageGeneratorProps extends BaseComponentProps {
  apiUrl?: string;
  onSuccess?: (tokenId: bigint, imageUrl: string) => void;
  onError?: (error: string) => void;
}

/**
 * Image data for modal display
 */
export interface ModalImageData {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

/**
 * Props for image modal components
 */
export interface ImageModalProps {
  image: ModalImageData;
  onClose: () => void;
}
