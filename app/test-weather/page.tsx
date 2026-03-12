'use client';

import { useState } from 'react';

interface WeatherResult {
  success: boolean;
  data?: {
    city: string;
    temperature: number;
    feelsLike: number;
    tempMax: number;
    tempMin: number;
    weather: string;
    weatherIcon: string;
    windDirection: string;
    windScale: string;
    humidity: number;
    pressure: number;
    visibility: number;
    obsTime: string;
    fxDate: string;
    updateTime: string;
    dataSource: string;
  };
  formatted?: string;
  raw?: {
    now: any;
    forecast: any;
  };
  error?: string;
}

export default function WeatherTestPage() {
  const [city, setCity] = useState('苏州');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [useCache, setUseCache] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(city)}&cache=${useCache}`
      );
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '请求失败',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🌤️ 天气API测试工具</h1>
        
        {/* 输入区域 */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="输入城市名称"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={fetchWeather}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              {loading ? '查询中...' : '查询天气'}
            </button>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="useCache"
              checked={useCache}
              onChange={(e) => setUseCache(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="useCache" className="text-sm text-gray-400">
              使用缓存（5分钟）
            </label>
          </div>
        </div>

        {/* 结果展示 */}
        {result && (
          <div className="space-y-6">
            {/* 格式化后的天气信息 */}
            {result.formatted && (
              <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-2xl p-6 border border-blue-700/30">
                <h2 className="text-xl font-semibold mb-4 text-blue-300">格式化输出</h2>
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-200 leading-relaxed">
                  {result.formatted}
                </pre>
              </div>
            )}

            {/* 详细数据 */}
            {result.data && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-green-300">详细数据</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <DataCard label="城市" value={result.data.city} />
                  <DataCard label="当前温度" value={`${result.data.temperature}°C`} highlight />
                  <DataCard label="体感温度" value={`${result.data.feelsLike}°C`} />
                  <DataCard label="今日最高" value={`${result.data.tempMax}°C`} highlight />
                  <DataCard label="今日最低" value={`${result.data.tempMin}°C`} highlight />
                  <DataCard label="天气状况" value={`${result.data.weatherIcon} ${result.data.weather}`} />
                  <DataCard label="风力风向" value={`${result.data.windDirection} ${result.data.windScale}`} />
                  <DataCard label="湿度" value={`${result.data.humidity}%`} />
                  <DataCard label="气压" value={`${result.data.pressure} hPa`} />
                  <DataCard label="能见度" value={`${result.data.visibility} km`} />
                  <DataCard label="观测时间" value={result.data.obsTime} />
                  <DataCard label="数据来源" value={result.data.dataSource} />
                </div>
              </div>
            )}

            {/* 原始API响应 */}
            {result.raw && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-yellow-300">原始API响应</h2>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">实时天气 (weather/now)</h3>
                  <pre className="bg-gray-900 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(result.raw.now, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">3日预报 (weather/3d) - 今日数据</h3>
                  <pre className="bg-gray-900 rounded-xl p-4 text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(result.raw.forecast, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 错误信息 */}
            {result.error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-2 text-red-300">错误</h2>
                <p className="text-red-200">{result.error}</p>
              </div>
            )}
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-12 bg-gray-800/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">📋 数据说明</h2>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>• <strong>当前温度</strong>：实时观测温度（来自 weather/now API）</li>
            <li>• <strong>今日最高/最低</strong>：当日预报温度范围（来自 weather/3d API）</li>
            <li>• <strong>观测时间</strong>：气象站实际观测时间</li>
            <li>• <strong>数据来源</strong>：和风天气 (QWeather)</li>
            <li>• 数据缓存5分钟，可通过取消勾选"使用缓存"获取最新数据</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function DataCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-blue-900/30 border border-blue-700/30' : 'bg-gray-700/50'}`}>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-blue-300' : 'text-gray-200'}`}>
        {value}
      </div>
    </div>
  );
}
