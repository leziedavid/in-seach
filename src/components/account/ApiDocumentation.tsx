'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { getApiKeyAuth } from '@/lib/auth';
import { getBaseUrl } from '@/api/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, } from 'recharts';

const ENDPOINTS = [
  {
    category: 'Services',
    endpoints: [
      { method: 'GET', url: '/open-api/services', description: 'Récupérer la liste de vos services.' },
    ],
  },
  {
    category: 'Produits',
    endpoints: [
      { method: 'GET', url: '/open-api/products', description: 'Récupérer la liste de vos produits.' },
    ],
  },
  {
    category: 'Commandes',
    endpoints: [
      { method: 'GET', url: '/open-api/orders', description: 'Récupérer vos commandes (reçues et passées).' },
    ],
  },
  {
    category: 'Réservations',
    endpoints: [
      { method: 'GET', url: '/open-api/service-bookings', description: 'Récupérer vos réservations liées aux Services.' },
      { method: 'GET', url: '/open-api/annonce-bookings', description: 'Récupérer vos réservations liées aux Annonces.' },
    ],
  },
  {
    category: 'Annonces',
    endpoints: [
      { method: 'GET', url: '/open-api/annonces', description: 'Récupérer vos annonces.' },
      { method: 'GET', url: '/open-api/type-annonces', description: 'Récupérer les types d\'annonces disponibles.' },
    ],
  },
  {
    category: 'Logistique',
    endpoints: [
      { method: 'GET', url: '/open-api/logistic-services', description: 'Récupérer vos services logistiques.' },
      { method: 'GET', url: '/open-api/quotes', description: 'Récupérer vos devis (envoyés et reçus).' },
      { method: 'GET', url: '/open-api/deliveries', description: 'Récupérer vos livraisons.' },
      { method: 'GET', url: '/open-api/delivery-tracking?trackingCode=XXX', description: 'Suivre une livraison spécifique.', noPagination: true },
    ],
  },
];

const getCodeExamples = (baseUrl: string, apiKey: string) => ({
  javascript: `
fetch('${baseUrl}/open-api/services?page=1&limit=10', {
  headers: {
    'x-api-key': '${apiKey}'
  }
})
.then(response => response.json())
.then(data => console.log(data));
  `,
  php: `
<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "${baseUrl}/open-api/services?page=1&limit=10",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "x-api-key: ${apiKey}"
  ],
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;
?>
  `,
  python: `
import requests

url = "${baseUrl}/open-api/services"
params = {"page": 1, "limit": 10}
headers = {"x-api-key": "${apiKey}"}

response = requests.get(url, headers=headers, params=params)
print(response.json())
  `,
});

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function ApiDocumentation() {
  const [activeTab, setActiveTab] = useState<'docs' | 'stats'>('docs');
  const [activeLang, setActiveLang] = useState<keyof ReturnType<typeof getCodeExamples>>('javascript');
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [executedUrls, setExecutedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [tryItOut, setTryItOut] = useState<Record<string, boolean>>({});

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Pagination State
  const [pagination, setPagination] = useState<Record<string, { page: number; limit: number }>>({});

  useEffect(() => {
    if (activeTab === 'stats' && !analytics) {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    const apiKey = getApiKeyAuth();
    if (!apiKey) return;

    setLoadingAnalytics(true);
    try {
      const baseUrl = getBaseUrl();
      const fullUrl = `${baseUrl}/open-api/analytics`;
      const res = await fetch(fullUrl, {
        headers: { 'x-api-key': apiKey },
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Erreur analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleExecute = async (url: string, noPagination?: boolean) => {
    const apiKey = getApiKeyAuth();
    if (!apiKey) return;

    setLoading(prev => ({ ...prev, [url]: true }));
    try {
      const baseUrl = getBaseUrl();
      let fullUrl = `${baseUrl}${url}`;

      if (!noPagination) {
        const p = pagination[url] || { page: 1, limit: 10 };
        const separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl += `${separator}page=${p.page}&limit=${p.limit}`;
      }

      setExecutedUrls(prev => ({ ...prev, [url]: fullUrl }));

      const res = await fetch(fullUrl, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      const data = await res.json();
      setResponses(prev => ({ ...prev, [url]: data }));
    } catch (error) {
      setResponses(prev => ({ ...prev, [url]: { error: 'Erreur lors de l’exécution' } }));
    } finally {
      setLoading(prev => ({ ...prev, [url]: false }));
    }
  };

  const updatePagination = (url: string, field: 'page' | 'limit', value: number) => {
    setPagination(prev => ({
      ...prev,
      [url]: {
        ...(prev[url] || { page: 1, limit: 10 }),
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Documentation API</h2>
          <p className="text-muted-foreground">
            Intégrez vos données dans vos propres systèmes grâce à notre API publique sécurisée.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'docs' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
              }`}
          >
            Documentation
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
              }`}
          >
            Statistiques
          </button>
        </div>
      </div>

      {activeTab === 'docs' ? (
        <>
          {/* API Key Section */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary p-2 rounded-lg text-white">
                <Icon icon="solar:key-bold" width={24} />
              </div>
              <h3 className="text-xl font-bold">Authentification</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Toutes les requêtes API doivent inclure votre clé API dans le header <code className="bg-muted px-2 py-1 rounded">x-api-key</code>.
              Cette fonctionnalité est réservée aux membres Premium.
            </p>
            <div className="flex items-center gap-2 bg-background border border-border p-3 rounded-xl overflow-hidden">
              <code className="text-xs flex-1 truncate">{getApiKeyAuth() || 'votre_cle_api_ici'}</code>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  const key = getApiKeyAuth();
                  if (key) navigator.clipboard.writeText(key);
                }}
              >
                <Icon icon="solar:copy-bold" width={16} />
              </Button>
            </div>
          </div>

          {/* Code Examples */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Icon icon="solar:code-bold" className="text-primary" />
              Exemples d'intégration
            </h3>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex bg-muted/50 p-2 gap-2 border-b border-border">
                {(['javascript', 'php', 'python'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeLang === lang ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-950">
                <pre className="text-xs text-blue-400 overflow-x-auto font-mono">
                  <code>{getCodeExamples(getBaseUrl(), getApiKeyAuth() || 'VOTRE_CLE_API')[activeLang].trim()}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Endpoints List */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Icon icon="solar:list-bold" className="text-primary" />
              Endpoints disponibles
            </h3>
            {ENDPOINTS.map((cat) => (
              <div key={cat.category} className="space-y-3">
                <h4 className="text-sm font-black text-primary uppercase tracking-wider">{cat.category}</h4>
                <div className="space-y-2">
                  {cat.endpoints.map((ep) => (
                    <div key={ep.url} className="group bg-card hover:bg-muted/30 border border-border rounded-xl p-4 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-1 rounded-md border border-green-500/20">
                            {ep.method}
                          </span>
                          <code className="text-sm font-bold group-hover:text-primary transition-colors">{ep.url}</code>
                        </div>
                        <p className="text-xs text-muted-foreground md:ml-auto">{ep.description}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-[10px] font-bold"
                          onClick={() => setTryItOut(prev => ({ ...prev, [ep.url]: !prev[ep.url] }))}
                        >
                          {tryItOut[ep.url] ? 'Fermer' : 'Try it out'}
                        </Button>
                      </div>

                      {tryItOut[ep.url] && (
                        <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-300">
                          <div className="flex flex-wrap items-end gap-4 mb-4">
                            {!ep.noPagination && (
                              <>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-muted-foreground">Page</label>
                                  <input
                                    type="number"
                                    value={pagination[ep.url]?.page || 1}
                                    onChange={(e) => updatePagination(ep.url, 'page', parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 bg-background border border-border rounded-lg px-2 text-xs font-bold"
                                    min="1"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase text-muted-foreground">Limit</label>
                                  <input
                                    type="number"
                                    value={pagination[ep.url]?.limit || 10}
                                    onChange={(e) => updatePagination(ep.url, 'limit', parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 bg-background border border-border rounded-lg px-2 text-xs font-bold"
                                    min="1"
                                    max="100"
                                  />
                                </div>
                              </>
                            )}
                            <Button
                              size="sm"
                              className="h-8 font-black uppercase tracking-widest text-[10px] ml-auto"
                              onClick={() => handleExecute(ep.url, ep.noPagination)}
                              disabled={loading[ep.url]}
                            >
                              {loading[ep.url] ? 'Exécution...' : 'Execute'}
                            </Button>
                          </div>

                          {responses[ep.url] && (
                            <div className="space-y-4">
                              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Requested URL</span>
                                </div>
                                <code className="text-[10px] text-blue-400 font-mono break-all italic">
                                  {executedUrls[ep.url]}
                                </code>
                              </div>

                              <div className="bg-slate-950 rounded-lg p-4 overflow-hidden shadow-inner">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black uppercase text-blue-400">Response Body</span>
                                  <span className="text-[10px] font-mono text-slate-500">application/json</span>
                                </div>
                                <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-[300px]">
                                  {JSON.stringify(responses[ep.url], null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {loadingAnalytics ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Icon icon="svg-spinners:90-ring-with-bg" className="text-primary text-4xl" />
              <p className="text-sm text-muted-foreground animate-pulse">Chargement des données analytiques...</p>
            </div>
          ) : analytics ? (
            <>
              {/* Endpoint for External Integration */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm transition-all hover:bg-muted/30">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-1 rounded-md border border-green-500/20">
                      GET
                    </span>
                    <code className="text-sm font-bold text-primary">/open-api/analytics</code>
                  </div>
                  <p className="text-xs text-muted-foreground md:ml-auto">
                    Utilisez cet endpoint pour récupérer ces statistiques dans vos propres applications.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-[10px] font-bold"
                    onClick={fetchAnalytics}
                    disabled={loadingAnalytics}
                  >
                    {loadingAnalytics ? 'Chargement...' : 'Try it out'}
                  </Button>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Requested URL</span>
                  </div>
                  <code className="text-[10px] text-blue-400 font-mono break-all italic">
                    {getBaseUrl()}/open-api/analytics
                  </code>
                </div>
              </div>

              {/* Global Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card
                  title="Revenu Total"
                  value={`${(analytics.services.revenue + analytics.orders.revenue).toLocaleString()} F`}
                  icon="solar:wad-of-money-bold"
                  color="text-green-500"
                />
                <Card
                  title="Réservations"
                  value={analytics.services.bookings + analytics.annonces.bookings}
                  icon="solar:calendar-date-bold"
                  color="text-blue-500"
                />
                <Card
                  title="Commandes"
                  value={analytics.orders.total}
                  icon="solar:bag-bold"
                  color="text-orange-500"
                />
                <Card
                  title="Logistique"
                  value={analytics.logistics.deliveries}
                  icon="solar:delivery-bold"
                  color="text-purple-500"
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Bookings Chart */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Icon icon="solar:chart-line-bold-duotone" className="text-primary" />
                    Évolution des Réservations
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.services.chart}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                        <Line type="monotone" name="Services" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" name="Annonces" data={analytics.annonces.chart} dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Icon icon="solar:chart-pie-bold-duotone" className="text-primary" />
                    Statut des Commandes
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.orders.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {analytics.orders.statusDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Entity Detail Stats */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="solar:database-bold-duotone" className="text-primary" />
                  Détails par Entité
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EntityBox label="Services" items={[
                    { label: 'Total Créés', value: analytics.services.total },
                    { label: 'Bookings', value: analytics.services.bookings },
                    { label: 'Revenu Total', value: `${(analytics.services.revenue || 0).toLocaleString()} F`, color: 'text-green-500' },
                  ]} />
                  <EntityBox label="Annonces" items={[
                    { label: 'Total Créées', value: analytics.annonces.total },
                    { label: 'Bookings', value: analytics.annonces.bookings },
                    { label: 'Revenu Total', value: `${(analytics.annonces.revenue || 0).toLocaleString()} F`, color: 'text-green-500' },
                  ]} />
                  <EntityBox label="Produits" items={[
                    { label: 'Total Créés', value: analytics.products.total },
                    { label: 'Stock Faible', value: analytics.products.lowStock, color: 'text-red-500' },
                    { label: 'Revenu (Orders)', value: `${(analytics.products.revenue || 0).toLocaleString()} F`, color: 'text-green-500' },
                  ]} />
                  <EntityBox label="Logistique" items={[
                    { label: 'Services', value: analytics.logistics.services },
                    { label: 'Devis (Quotes)', value: analytics.logistics.quotes },
                    { label: 'Revenu (Quotes)', value: `${(analytics.logistics.revenue || 0).toLocaleString()} F`, color: 'text-green-500' },
                  ]} />
                </div>
              </div>

              {/* Raw JSON Preview */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Icon icon="solar:code-bold-duotone" className="text-primary" />
                  JSON Analytics (Response API)
                </h3>
                <div className="bg-slate-950 rounded-2xl p-6 overflow-hidden relative group">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(analytics, null, 2))}
                    >
                      <Icon icon="solar:copy-bold" />
                    </Button>
                  </div>
                  <pre className="text-[10px] text-green-400 font-mono overflow-auto max-h-[400px]">
                    {JSON.stringify(analytics, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Icon icon="solar:shield-warning-bold" className="text-amber-500 text-5xl" />
              <p className="text-sm text-muted-foreground">Impossible de charger les statistiques.<br />Vérifiez votre connexion ou votre clé API.</p>
              <Button onClick={fetchAnalytics} variant="outline" size="sm">Réessayer</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ title, value, icon, color }: any) {
  return (
    <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-muted group-hover:scale-110 transition-transform ${color.replace('text', 'bg')}/10 ${color}`}>
          <Icon icon={icon} width={24} />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
          <p className="text-xl font-black text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EntityBox({ label, items }: any) {
  return (
    <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
      <h4 className="text-[10px] font-black uppercase text-primary mb-3">{label}</h4>
      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className={`text-xs font-bold ${item.color || 'text-foreground'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
