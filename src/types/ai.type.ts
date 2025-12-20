export type ChatSessionResponse = {
  data: ChatSession;
}

export type ChatSession = {
  id: number;
  title: string | null;
  project_id: string | null;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: number;
  user_id: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  parts?: any[];
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type Paginated<T> = {
  data: T[];
  meta?: PaginationMeta;
};