import { supabase } from './supabase';

export interface ChatQuery {
  id: string;
  user_id: string;
  session_id: string | null;
  prompt: string;
  generated_sql: string;
  visualization_type: 'table' | 'bar' | 'line' | 'pie' | 'metric';
  created_at: string;
  executed_at: string | null;
  execution_successful: boolean;
  result_sample: Record<string, any>[] | null;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

export class ChatQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatQueryError';
  }
}

export class ChatQueryService {
  /**
   * Create a new chat query record
   */
  static async createQuery(query: Omit<ChatQuery, 'id' | 'created_at' | 'user_id'>): Promise<ChatQuery> {
    const { data, error } = await supabase
      .from('chat_queries')
      .insert({
        ...query,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw new ChatQueryError(error.message);
    return data;
  }

  /**
   * Create a new chat session
   */
  static async createSession(title: string): Promise<ChatSession> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        title,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw new ChatQueryError(error.message);
    return data;
  }

  /**
   * Get chat sessions for the current user
   */
  static async getSessions(): Promise<ChatSession[]> {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new ChatQueryError(error.message);
    return data;
  }

  /**
   * Get chat query history for the current user
   */
  static async getHistory(sessionId?: string): Promise<ChatQuery[]> {
    const { data, error } = await supabase
      .from('chat_queries')
      .select('*')
      .eq(sessionId ? 'session_id' : 'user_id', sessionId || (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw new ChatQueryError(error.message);
    return data;
  }

  /**
   * Update execution status and results
   */
  static async updateExecution(
    id: string,
    successful: boolean,
    resultSample?: Record<string, any>[],
    visualizationType?: 'line' | 'bar' | 'pie' | 'metric' | 'table'
  ): Promise<void> {
    const { error } = await supabase
      .from('chat_queries')
      .update({
        executed_at: new Date().toISOString(),
        execution_successful: successful,
        result_sample: resultSample || null,
        visualization_type: visualizationType || 'table'
      })
      .eq('id', id);

    if (error) throw new ChatQueryError(error.message);
  }
}