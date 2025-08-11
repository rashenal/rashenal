import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Activity,
  DollarSign,
  Zap,
  TrendingDown,
  TrendingUp,
  Database,
  Cpu,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Settings,
  RefreshCw,
  Download,
  Server,
  Brain,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { tokenAnalytics } from '../analytics/TokenAnalytics';
import { localLLM } from '../lib/LocalLLMService';
import { aiRouter } from '../lib/AIRouter';
import { promptOptimizer } from '../lib/PromptOptimizer';
import { responseCache } from '../lib/ResponseCache';

interface OptimizationMetrics {
  current_daily_cost: number;
  daily_cost_target: number;
  cost_savings_percentage: number;
  total_requests_today: number;
  cache_hit_rate: number;
  local_processing_rate: number;
  avg_response_time_ms: number;
  optimization_efficiency: number;
}

export default function OptimizationDashboard() {
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    current_daily_cost: 0,
    daily_cost_target: 3.26,
    cost_savings_percentage: 0,
    total_requests_today: 0,
    cache_hit_rate: 0,
    local_processing_rate: 0,
    avg_response_time_ms: 0,
    optimization_efficiency: 0
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'routing' | 'cache' | 'models'>('overview');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [routingStats, setRoutingStats] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load real-time metrics
      const realTimeMetrics = tokenAnalytics.getRealTimeMetrics();
      const routingStatsData = aiRouter.getRoutingStats();
      const cacheStatsData = responseCache.getStats();
      const modelStatusData = localLLM.getStatus();
      const optimizationStats = promptOptimizer.getOptimizationStats();

      // Calculate derived metrics
      const costSavingsPercentage = realTimeMetrics.daily_cost > 0 
        ? ((32.58 - realTimeMetrics.daily_cost) / 32.58) * 100 
        : 0;

      setMetrics({
        current_daily_cost: realTimeMetrics.daily_cost,
        daily_cost_target: 3.26,
        cost_savings_percentage: Math.round(costSavingsPercentage * 100) / 100,
        total_requests_today: realTimeMetrics.operations_count,
        cache_hit_rate: realTimeMetrics.cache_hit_rate,
        local_processing_rate: realTimeMetrics.local_processing_rate,
        avg_response_time_ms: Math.round(realTimeMetrics.avg_cost_per_operation * 1000),
        optimization_efficiency: Math.min(100, costSavingsPercentage)
      });

      // Load detailed analytics
      setAnalytics(tokenAnalytics.generateAnalytics(timeRange));
      setRoutingStats(routingStatsData);
      setCacheStats(cacheStatsData);
      setModelStatus(modelStatusData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setIsLoading(false);
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color, 
    format = 'number' 
  }: { 
    title: string; 
    value: number | string; 
    change?: number; 
    icon: any; 
    color: string; 
    format?: 'number' | 'currency' | 'percentage' | 'time';
  }) => {
    const formatValue = (val: number | string, fmt: string) => {
      if (typeof val === 'string') return val;
      switch (fmt) {
        case 'currency': return `$${val.toFixed(2)}`;
        case 'percentage': return `${val.toFixed(1)}%`;
        case 'time': return `${val}ms`;
        default: return val.toLocaleString();
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold text-${color}-600`}>
              {formatValue(value, format)}
            </p>
            {change !== undefined && (
              <div className={`flex items-center mt-1 text-sm ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 text-${color}-500`} />
        </div>
      </div>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Daily Cost"
          value={metrics.current_daily_cost}
          change={-((32.58 - metrics.current_daily_cost) / 32.58 * 100)}
          icon={DollarSign}
          color="blue"
          format="currency"
        />
        <MetricCard
          title="Cost Savings"
          value={metrics.cost_savings_percentage}
          change={metrics.cost_savings_percentage}
          icon={TrendingDown}
          color="green"
          format="percentage"
        />
        <MetricCard
          title="Cache Hit Rate"
          value={metrics.cache_hit_rate}
          icon={Database}
          color="purple"
          format="percentage"
        />
        <MetricCard
          title="Local Processing"
          value={metrics.local_processing_rate}
          icon={Cpu}
          color="orange"
          format="percentage"
        />
      </div>

      {/* Cost Savings Progress */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 text-blue-600 mr-2" />
          Daily Cost Target Progress
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current: ${metrics.current_daily_cost.toFixed(2)}</span>
            <span className="text-sm text-gray-600">Target: ${metrics.daily_cost_target}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-300 ${
                metrics.current_daily_cost <= metrics.daily_cost_target 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.min(100, (metrics.current_daily_cost / metrics.daily_cost_target) * 100)}%` 
              }}
            />
          </div>
          <div className={`text-sm font-medium ${
            metrics.current_daily_cost <= metrics.daily_cost_target 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {metrics.current_daily_cost <= metrics.daily_cost_target 
              ? '✅ Within budget!' 
              : `⚠️ Over budget by $${(metrics.current_daily_cost - metrics.daily_cost_target).toFixed(2)}`
            }
          </div>
        </div>
      </div>

      {/* Optimization Efficiency Chart */}
      {analytics && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            Token Usage Optimization
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.daily_usage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="total_cost" 
                stackId="1" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.6}
                name="Cost ($)"
              />
              <Area 
                type="monotone" 
                dataKey="total_tokens" 
                stackId="2" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.6}
                name="Tokens (k)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      {analytics && (
        <>
          {/* Pipeline Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Token Usage by Operation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(analytics.pipeline_breakdown).map(([key, data]: [string, any]) => ({
                operation: key.replace('_', ' ').toUpperCase(),
                tokens: data.tokens,
                cost: data.cost,
                percentage: data.percentage
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="operation" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tokens" fill="#3b82f6" name="Tokens" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Model Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Model Usage Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.model_distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ model, percentage }: any) => `${model}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="tokens"
                  >
                    {analytics.model_distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {analytics.model_distribution.map((model: any, index: number) => (
                  <div key={model.model} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                      />
                      <span className="font-medium">{model.model}</span>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <div>{model.tokens.toLocaleString()} tokens</div>
                      <div>${model.cost.toFixed(3)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Optimization Impact */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Optimization Impact</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.optimization_impact.total_savings_tokens.toLocaleString()}
                </div>
                <div className="text-sm text-green-700">Tokens Saved</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  ${analytics.optimization_impact.total_savings_cost.toFixed(2)}
                </div>
                <div className="text-sm text-blue-700">Cost Saved</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.optimization_impact.cache_hit_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-700">Cache Hit Rate</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.optimization_impact.local_processing_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-orange-700">Local Processing</div>
              </div>
            </div>
          </div>

          {/* Waste Identification */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              Waste Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-lg font-semibold text-red-600">
                  {analytics.waste_identification.repeated_queries}
                </div>
                <div className="text-sm text-red-700">Repeated Queries</div>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-lg font-semibold text-yellow-600">
                  {analytics.waste_identification.unnecessary_context_tokens.toLocaleString()}
                </div>
                <div className="text-sm text-yellow-700">Unnecessary Context</div>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-lg font-semibold text-orange-600">
                  {analytics.waste_identification.verbose_prompt_waste.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700">Verbose Prompts</div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-lg font-semibold text-gray-600">
                  {analytics.waste_identification.redundant_processing_instances}
                </div>
                <div className="text-sm text-gray-700">Redundant Processing</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const RoutingTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Request Routing Statistics</h3>
        {routingStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(routingStats).map(([strategy, count]) => (
              <div key={strategy} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-800">{count as number}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {strategy.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Routing Efficiency</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Cache Utilization</span>
            <span className="font-semibold">{metrics.cache_hit_rate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-purple-500 rounded-full"
              style={{ width: `${metrics.cache_hit_rate}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span>Local Processing</span>
            <span className="font-semibold">{metrics.local_processing_rate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-orange-500 rounded-full"
              style={{ width: `${metrics.local_processing_rate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const CacheTab = () => (
    <div className="space-y-6">
      {cacheStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Cache Size"
              value={cacheStats.size || 0}
              icon={Database}
              color="purple"
            />
            <MetricCard
              title="Hit Rate"
              value={cacheStats.hit_rate || 0}
              icon={Target}
              color="green"
              format="percentage"
            />
            <MetricCard
              title="Memory Usage"
              value={cacheStats.memory_usage || '0KB'}
              icon={Server}
              color="blue"
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Cache Management</h3>
              <div className="space-x-2">
                <button
                  onClick={() => responseCache.clear()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Cache
                </button>
                <button
                  onClick={loadDashboardData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Cache Health</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`ml-2 font-medium ${
                    (cacheStats.hit_rate || 0) > 30 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {(cacheStats.hit_rate || 0) > 30 ? 'Healthy' : 'Needs Optimization'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Efficiency:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {Math.round((cacheStats.hit_rate || 0) * 2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const ModelsTab = () => (
    <div className="space-y-6">
      {modelStatus && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 text-blue-600 mr-2" />
              Local Models Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                modelStatus.healthy 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ollama Service</span>
                  {modelStatus.healthy ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className={`text-sm ${
                  modelStatus.healthy ? 'text-green-700' : 'text-red-700'
                }`}>
                  {modelStatus.healthy ? 'Online' : 'Offline'}
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="font-medium text-blue-800">Models Available</div>
                <div className="text-2xl font-bold text-blue-600">
                  {modelStatus.models_available}
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                <div className="font-medium text-purple-800">Memory Usage</div>
                <div className="text-lg font-bold text-purple-600">
                  {modelStatus.memory_usage_estimate}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <div className="font-medium text-gray-800">Last Check</div>
                <div className="text-sm text-gray-600">
                  {new Date(modelStatus.last_health_check).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Model Recommendations</h3>
            <div className="space-y-3">
              {localLLM.getModelRecommendations().map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium capitalize">
                      {rec.operation.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-600">
                      Recommended: {rec.recommended_model}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-600">Speed: {rec.expected_speed}</div>
                    <div className="text-gray-600">Memory: {rec.memory_usage}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Token Optimization Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of AI cost optimization (Target: 90% reduction)
          </p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'routing', label: 'Routing', icon: Zap },
            { id: 'cache', label: 'Cache', icon: Database },
            { id: 'models', label: 'Models', icon: Brain }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'routing' && <RoutingTab />}
        {activeTab === 'cache' && <CacheTab />}
        {activeTab === 'models' && <ModelsTab />}
      </div>
    </div>
  );
}