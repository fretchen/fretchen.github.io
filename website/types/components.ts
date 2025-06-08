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
 * NFT Metadata structure following ERC721 metadata standard.
 * This interface represents the metadata returned by the ImageGenerator API
 * and stored for each NFT, containing descriptive information and attributes.
 */
export interface NFTMetadata {
  /** The name/title of the NFT (e.g., "AI Generated Artwork #123") */
  name?: string;
  /** Detailed description of the NFT, typically includes the generation prompt */
  description?: string;
  /** URL to the NFT's image asset */
  image?: string;
  /** Array of trait/attribute objects describing the NFT's characteristics */
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
  /** Whether this card is shown in the public gallery (disables burn functionality) */
  isPublicView?: boolean;
  /** Owner address for public NFTs */
  owner?: string;
}

/**
 * Props for the NFTList component
 */
export interface NFTListProps extends BaseComponentProps {
  /**
   * Newly created NFT data to be immediately displayed in the list.
   * When provided, the NFT will be highlighted and added to the top of the list.
   * The metadata field contains the complete NFT metadata from the ImageGenerator API response,
   * allowing immediate display of the description without waiting for blockchain events.
   */
  newlyCreatedNFT?: {
    /** The blockchain token ID of the newly created NFT */
    tokenId: bigint;
    /** The generated image URL from the API response */
    imageUrl: string;
    /** Optional metadata containing name, description, and attributes from the ImageGenerator */
    metadata?: NFTMetadata;
  };
  /** Callback fired when the newly created NFT has been displayed and highlighting is removed */
  onNewNFTDisplayed?: () => void;
}

/**
 * Props for Tab component
 */
export interface TabProps extends BaseComponentProps {
  /** Tab label */
  label: string;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Callback when tab is clicked */
  onClick: () => void;
}

/**
 * Public NFT with owner information
 */
export interface PublicNFT extends NFT {
  owner: string;
}

/**
 * Modal image data for image display
 */
export interface ModalImageData {
  src: string;
  alt: string;
  title?: string;
  description?: string;
}

/**
 * Props for the ImageModal component
 */
export interface ImageModalProps {
  image: ModalImageData;
  onClose: () => void;
}
