import { supabase } from './supabase';

export interface Dashboard {
  id: string;
  user_id: string;
  title: string;
  creation_method: 'chat' | 'query';
  created_at: string;
  is_public: boolean;
}

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'pie';
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
  }>;
  options?: Record<string, any>;
}

export interface DashboardComponent {
  id: string;
  dashboard_id: string;
  type: 'chart' | 'metric' | 'table';
  configuration: ChartConfiguration;
  query_text?: string;
  chat_prompt?: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export class DashboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DashboardError';
  }
}

export class DashboardService {
  /**
   * Fetch all dashboards for the current user
   */
  static async getDashboards() {
    const { data, error } = await supabase
      .from('dashboards')
      .select(`
        id,
        user_id,
        title,
        creation_method,
        created_at,
        is_public
      `)
      .order('created_at', { ascending: false });

    if (error) throw new DashboardError(error.message);
    return data as Dashboard[];
  }

  /**
   * Create a new dashboard
   */
  static async createDashboard(dashboard: Omit<Dashboard, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('dashboards')
      .insert(dashboard)
      .select()
      .single();

    if (error) throw new DashboardError(error.message);
    return data as Dashboard;
  }

  /**
   * Update a dashboard's properties
   */
  static async updateDashboard(id: string, updates: Partial<Omit<Dashboard, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('dashboards')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DashboardError(error.message);
    return data as Dashboard;
  }

  /**
   * Delete a dashboard and all its components
   */
  static async deleteDashboard(id: string) {
    const { error } = await supabase
      .from('dashboards')
      .delete()
      .eq('id', id);

    if (error) throw new DashboardError(error.message);
  }

  /**
   * Get all components for a dashboard
   */
  static async getComponents(dashboardId: string) {
    const { data, error } = await supabase
      .from('dashboard_components')
      .select(`
        id,
        dashboard_id,
        type,
        configuration,
        query_text,
        chat_prompt,
        position,
        created_at,
        updated_at
      `)
      .eq('dashboard_id', dashboardId)
      .order('position');

    if (error) throw new DashboardError(error.message);
    return data as DashboardComponent[];
  }

  /**
   * Add a new component to a dashboard
   */
  static async addComponent(component: Omit<DashboardComponent, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('dashboard_components')
      .insert(component)
      .select()
      .single();

    if (error) throw new DashboardError(error.message);
    return data as DashboardComponent;
  }

  /**
   * Update an existing dashboard component
   */
  static async updateComponent(
    id: string,
    updates: Partial<Omit<DashboardComponent, 'id' | 'created_at' | 'updated_at'>>
  ) {
    const { data, error } = await supabase
      .from('dashboard_components')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DashboardError(error.message);
    return data as DashboardComponent;
  }

  /**
   * Delete a dashboard component
   */
  static async deleteComponent(id: string) {
    const { error } = await supabase
      .from('dashboard_components')
      .delete()
      .eq('id', id);

    if (error) throw new DashboardError(error.message);
  }

  /**
   * Get the next available position for a new component
   */
  static async getNextPosition(dashboardId: string): Promise<number> {
    const { data, error } = await supabase
      .from('dashboard_components')
      .select('position')
      .eq('dashboard_id', dashboardId)
      .order('position', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
      throw new DashboardError(error.message);
    }

    return data ? data.position + 1 : 0;
  }

  /**
   * Creates a new dashboard from a metric group
   */
  static async createFromMetricGroup(groupId: string, userId: string): Promise<Dashboard> {
    try {
      // Get metric group details
      const { data: group, error: groupError } = await supabase
        .from('metric_groups')
        .select(`
          name,
          metrics (
            id,
            name,
            calculation_method,
            visualization_type,
            time_granularity,
            formatting
          )
        `)
        .eq('id', groupId)
        .single();

      if (groupError) throw new DashboardError(groupError.message);
      if (!group) throw new DashboardError('Metric group not found');

      // Create dashboard
      const { data: dashboard, error: dashError } = await supabase
        .from('dashboards')
        .insert({
          title: `${group.name} Dashboard`,
          user_id: userId,
          creation_method: 'chat',
          is_public: false
        })
        .select()
        .single();

      if (dashError) throw new DashboardError(dashError.message);

      // Add components for each metric
      const components = group.metrics.map((metric, index) => ({
        dashboard_id: dashboard.id,
        type: 'chart',
        configuration: {
          type: metric.visualization_type,
          title: metric.name,
          timeGranularity: metric.time_granularity,
          formatting: metric.formatting || {}
        },
        query_text: metric.calculation_method,
        position: index
      }));

      const { error: componentsError } = await supabase
        .from('dashboard_components')
        .insert(components);

      if (componentsError) throw new DashboardError(componentsError.message);

      return dashboard;
    } catch (error) {
      throw error instanceof DashboardError 
        ? error 
        : new DashboardError('Failed to create dashboard from metric group');
    }
  }
}