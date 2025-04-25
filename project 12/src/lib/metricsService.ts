import { supabase } from './supabase';

export interface Metric {
  id: string;
  user_id: string;
  name: string;
  description: string;
  calculation_method: string;
  abbreviation: string;
  created_at: string;
  is_public: boolean;
  group_id: string;
  visualization_type: 'line' | 'bar' | 'pie' | 'metric';
  time_granularity: 'daily' | 'weekly' | 'monthly';
  formatting: {
    currency?: string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
}

export interface MetricGroupInput {
  name: string;
  description?: string;
  user_id: string;
  is_public: boolean;
}

export interface MetricGroup {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  is_public: boolean;
  metrics: Metric[];
}

export class MetricsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetricsError';
  }
}

export class MetricsService {
  static async getMetricGroups() {
    const { data, error } = await supabase
      .from('metric_groups')
      .select(`
        id,
        name,
        description,
        user_id,
        created_at,
        is_public
      `)
      .is('deleted_at', null)
      .order('name');

    if (error) throw new MetricsError(error.message);
    return data;
  }

  static async getMetricsByGroup() {
    const { data, error } = await supabase
      .from('metric_groups')
      .select(`
        id,
        name,
        description,
        user_id,
        created_at,
        is_public,
        metrics!metrics_group_id_fkey(
          id,
          name,
          description,
          abbreviation,
          calculation_method,
          deleted_at
        )
      `)
      .is('deleted_at', null)
      .order('name');

    if (error) throw new MetricsError(error.message);

    return (data || []).map(group => {
      const { metrics, ...groupData } = group;
      return {
        ...groupData,
        metrics: metrics?.filter(m => !m.deleted_at) || []
      } as MetricGroup;
    });
  }

  static async getMetricsByGroupId(groupId: string) {
    const { data, error } = await supabase
      .from('metric_groups')
      .select(`*,
        metrics!metrics_group_id_fkey (
          id, name, description, abbreviation, calculation_method, deleted_at
        )`)
      .eq('id', groupId)
      .is('deleted_at', null)
      .single();

    if (error) throw new MetricsError(error.message);
    
    return data ? [{
      ...data,
      metrics: (data.metrics || []).filter(m => !m.deleted_at)
    }] as MetricGroup[] : [];
  }

  static async createMetric(metric: Omit<Metric, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('metrics')
      .insert({
        ...metric,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw new MetricsError(error.message);
    return data;
  }

  static async createMetricGroup(group: MetricGroupInput) {
    const { data, error } = await supabase
      .from('metric_groups')
      .insert({
        ...group,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw new MetricsError(error.message);
    return data;
  }

  static async deleteMetric(id: string) {
    const { error } = await supabase
      .from('metrics')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteMetricGroup(id: string) {
    const { error } = await supabase
      .from('metric_groups')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async updateMetric(id: string, updates: Partial<Omit<Metric, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('metrics')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new MetricsError(error.message);
    return data;
  }
}