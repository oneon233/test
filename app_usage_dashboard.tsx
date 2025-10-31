import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, Clock, Calendar } from 'lucide-react';

export default function AppUsageDashboard() {
  const [appData, setAppData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://leng-lab-wxbox-1255963066.cos.ap-beijing.myqcloud.com/miniapp/totalSessions/total_visits.json');
      const data = await response.json();
      
      // 按应用前缀归组
      const grouped = {};
      
      Object.entries(data).forEach(([name, stats]) => {
        let appName = name;
        let featureName = null;
        
        // 判断是否为功能项（包含-）
        if (name.includes('-')) {
          const parts = name.split('-');
          appName = parts[0];
          featureName = parts.slice(1).join('-');
        }
        
        if (!grouped[appName]) {
          grouped[appName] = {
            name: appName,
            totalCount: 0,
            firstVisit: new Date(stats.firstVisit),
            lastVisit: new Date(stats.lastVisit),
            features: []
          };
        }
        
        grouped[appName].totalCount += stats.count;
        
        // 更新首次和最后使用时间
        const firstVisit = new Date(stats.firstVisit);
        const lastVisit = new Date(stats.lastVisit);
        
        if (firstVisit < grouped[appName].firstVisit) {
          grouped[appName].firstVisit = firstVisit;
        }
        if (lastVisit > grouped[appName].lastVisit) {
          grouped[appName].lastVisit = lastVisit;
        }
        
        if (featureName) {
          grouped[appName].features.push({
            name: featureName,
            count: stats.count,
            firstVisit,
            lastVisit
          });
        }
      });
      
      // 排序并转换为数组
      const sortedApps = Object.values(grouped)
        .sort((a, b) => b.totalCount - a.totalCount);
      
      setAppData(sortedApps);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('数据加载失败，请检查网络连接');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAppIcon = (appName) => {
    const icons = {
      'bigdata': '📊',
      'wxEditorPro': '✏️'
    };
    return icons[appName] || '📱';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* 顶部标题区 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">📱 应用使用统计</h1>
            <p className="text-purple-200 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              最后更新：{lastUpdate.toLocaleTimeString('zh-CN')} | 
              自动刷新中（5秒一次）
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg transition flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '加载中...' : '立即刷新'}
          </button>
        </div>
        <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full"></div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-4xl font-bold">{appData.length}</div>
          <div className="text-blue-100 mt-2">应用总数</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-4xl font-bold">{appData.reduce((sum, app) => sum + app.totalCount, 0)}</div>
          <div className="text-purple-100 mt-2">总使用次数</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-4xl font-bold">{appData.length > 0 ? (appData.reduce((sum, app) => sum + app.features.length, 0)) : 0}</div>
          <div className="text-pink-100 mt-2">功能总数</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-2xl font-bold">{appData.length > 0 ? Math.round(appData.reduce((sum, app) => sum + app.totalCount, 0) / appData.length) : 0}</div>
          <div className="text-green-100 mt-2">平均使用次数</div>
        </div>
      </div>

      {/* 应用列表 */}
      <div className="space-y-4">
        {appData.map((app, idx) => (
          <div key={app.name} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden hover:border-purple-500 transition shadow-lg">
            {/* 主行 */}
            <div className="p-6 flex items-center justify-between hover:bg-slate-700/30 transition">
              <div className="flex items-center gap-4 flex-1">
                <div className="text-5xl">{getAppIcon(app.name)}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-1">{app.name}</h3>
                  {app.features.length > 0 && (
                    <p className="text-sm text-slate-400">{app.features.length} 个功能</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-8 mr-4">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span className="text-3xl font-bold text-purple-400">{app.totalCount}</span>
                  </div>
                  <p className="text-xs text-slate-400">使用次数</p>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-300 mb-1 truncate" title={formatTime(app.firstVisit)}>
                    {formatTime(app.firstVisit)}
                  </div>
                  <p className="text-xs text-slate-400">首次使用</p>
                </div>

                <div className="text-right">
                  <div className="text-sm text-slate-300 mb-1 truncate" title={formatTime(app.lastVisit)}>
                    {formatTime(app.lastVisit)}
                  </div>
                  <p className="text-xs text-slate-400">最近使用</p>
                </div>

                <div className="text-right">
                  <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{
                        width: `${Math.min((app.totalCount / Math.max(...appData.map(a => a.totalCount))) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">使用占比</p>
                </div>
              </div>
            </div>

            {/* 功能展开 */}
            {app.features.length > 0 && (
              <div className="border-t border-slate-700 bg-slate-900/30 px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {app.features.map((feature, idx) => (
                    <div key={idx} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-200">{feature.name}</span>
                        <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded">
                          {feature.count}次
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>首次: {formatTime(feature.firstVisit)}</div>
                        <div>最近: {formatTime(feature.lastVisit)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部说明 */}
      <div className="mt-8 text-center text-slate-400 text-sm">
        <p>💡 数据自动刷新中 • 共 {appData.length} 个应用 • 总计 {appData.reduce((sum, app) => sum + app.totalCount, 0)} 次使用记录</p>
      </div>
    </div>
  );
}