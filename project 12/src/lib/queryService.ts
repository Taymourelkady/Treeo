import { supabase } from './supabase';
import { mockdata } from './mockdata';

export interface QueryResult<T = any> {
  data: T[] | null;
  error: Error | null;
  sql: string;
  executionTime: number;
}

export interface QueryMetadata {
  prompt?: string;
  source: 'chat' | 'scientist';
  name?: string;
}

export class QueryService {
  /**
   * Executes a SQL query and tracks execution metadata
   */
  static async executeQuery<T = any>(
    sql: string,
    metadata: QueryMetadata
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    let queryResult: QueryResult<T>;
    
    // Sanitize SQL query by removing trailing semicolon
    sql = sql.trim().replace(/;$/, '');

    try {
      const { data, error } = await mockdata.query<T>(sql);
      
      queryResult = {
        data,
        error,
        sql,
        executionTime: Date.now() - startTime
      };

      if (error) {
        throw error;
      }

      const { error: insertError } = await supabase
        .from('queries')
        .insert({
          name: metadata.name || `${metadata.source} query ${new Date().toISOString()}`,
          sql_text: sql,
          natural_language_description: metadata.prompt,
          last_run_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to save query:', insertError);
      }

      return queryResult;
    } catch (error) {
      throw error;
    }
  }
}