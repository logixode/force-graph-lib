export interface Params {
  keywords: string;
  platforms: string;
  dateStart: string | Date;
  dateStop: string | Date;
  sentiment: string;
  prokontra: string;
  sentiment_selected: "linguistik" | "prokontra";
  cluster: "keyword" | "engagement";
  size: number;
  from?: number;
  page: number;
  forget?: number;
}

export interface FullResponse<T = undefined> {
  data: {
    topic: string[];
    nodes: Nodes;
    data: Edges;
    total_posts: TotalByTopicPlatform<number>;
    total_accounts: TotalByTopicPlatform<number>;
    top_keywords: TotalByTopicPlatform<Record<string, number>>;
    pagination: T
  };
  status_code: number;
  status: boolean;
  message: null | string;
  time: Time;
}
export type Platform =
  | "twitter"
  | "x"
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "telegram"
  | "darkweb"
  | "news"
  | "whatsapp"
  | "github"
  | string;

export type Nodes = Record<Platform, TopicItems<NodesItem>>;
export type Edges = Record<Platform, TopicItems<EdgesItem>>;

export type TopicItems<T> = Record<string, T>;
// export type NodesItem = [topic: Topic, ...indexes: NodeItem[]];
export interface NodesItem {
  // node items are mostly objects but some are arrays
  "0": TopicNode;
  [key: string]: Node;
}
export type EdgesItem = Record<string, Edge>;

export interface Edge {
  from: string;
  to: string;
  color: string;
}
export interface TopicNode {
  id: string;
  marker: Marker;
  totalHits?: number;
  color: string;
  label: string;
}
export interface Node extends TopicNode {
  original_id?: string;
  raw_cities?: any[];
  title?: string;
  type?: string;
  time?: number;
  date_time?: string;
  is_first?: boolean;
  is_popular?: boolean;
  location?: LocationData[];
  account_url?: string | null;
  url?: string;
  sentiment?: number;
  prokontra?: number;
  group?: string;
  value?: number;
  lang?: "en" | "id" | null;
  keywords?: string[] | null;
  post?: string | null;
}
export interface Marker {
  radius: number;
}
export interface LocationData {
  id: string;
  lat: string | number;
  lng: string | number;
  address: string;
  region: string;
  raw: string;
}

export type TotalByTopicPlatform<T> = Record<Platform, Record<string, T>>;
export interface Pagination {
  dataTotal: number;
  perPage: number;
  pageCurrent: number;
  pageLast: number;
  navigation: Navigation;
}

export interface Navigation {
  prevUrl: any;
  nextUrl: string;
  firstUrl: string;
  lastUrl: string;
}

export interface Time {
  value: string;
  setTimeBeforeActions: boolean;
}
