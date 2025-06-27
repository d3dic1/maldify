import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { BarChart2, Calendar, AlertTriangle, Loader2, Settings } from 'lucide-react';
import GA4PropertyManager from '../components/GA4PropertyManager';

const MetricCard = ({ title, value, change, icon: Icon }) => (
    <div className="bg-primary border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-secondary">{title}</span>
            <Icon size={20} className="text-accent" />
        </div>
        <p className="text-2xl font-bold text-text">{value}</p>
        {change && <p className="text-sm text-success">{change}</p>}
    </div>
);

const GoogleAnalytics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [dateRange, setDateRange] = useState('30daysAgo');
    const [status, setStatus] = useState(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [showPropertyManager, setShowPropertyManager] = useState(false);
    const prevShowPropertyManager = useRef(showPropertyManager);

    useEffect(() => {
        const checkAnalyticsStatus = async () => {
            try {
                const response = await api.get('/analytics/status');
                setStatus(response.data);
                
                // Set default property if available
                if (response.data.properties?.defaultProperty) {
                    setSelectedPropertyId(response.data.properties.defaultProperty.propertyId);
                }
                
                if (response.data.configured && response.data.properties?.count > 0) {
                    fetchAnalyticsData('30daysAgo');
                }
            } catch (error) {
                console.error('Error fetching analytics status:', error);
                setStatus({ configured: false });
            }
        };
        checkAnalyticsStatus();
    }, []);

    // Listen for property manager closing, then refresh status and selection
    useEffect(() => {
        if (prevShowPropertyManager.current && !showPropertyManager) {
            // Property manager just closed
            (async () => {
                try {
                    const response = await api.get('/analytics/status');
                    setStatus(response.data);
                    if (response.data.properties?.defaultProperty) {
                        setSelectedPropertyId(response.data.properties.defaultProperty.propertyId);
                        fetchAnalyticsData(dateRange, response.data.properties.defaultProperty.propertyId);
                    }
                } catch (error) {
                    // ignore
                }
            })();
        }
        prevShowPropertyManager.current = showPropertyManager;
    }, [showPropertyManager]);

    // Fetch analytics data whenever selectedPropertyId changes and is not null
    useEffect(() => {
        if (selectedPropertyId) {
            fetchAnalyticsData(dateRange, selectedPropertyId);
        }
        // eslint-disable-next-line
    }, [selectedPropertyId]);

    const fetchAnalyticsData = async (range, propertyId = selectedPropertyId) => {
        if (!propertyId) {
            setError('No GA4 property selected. Please add a property first.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/analytics/ortto-data', { 
                params: { 
                    startDate: range, 
                    endDate: 'today',
                    propertyId: propertyId
                } 
            });
            setAnalyticsData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch analytics data.');
            if (err.response?.data?.help) {
                setError(prev => prev + ' ' + err.response.data.help);
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePropertyChange = (propertyId) => {
        setSelectedPropertyId(propertyId);
        fetchAnalyticsData(dateRange, propertyId);
    };

    const handleDateRangeChange = (range) => {
        setDateRange(range);
        fetchAnalyticsData(range);
    };

    if (!status) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-accent" size={32}/></div>;
    }
    
    if (!status.configured) {
        return (
             <div className="bg-primary border border-border rounded-xl p-8">
                <div className="flex items-center mb-4">
                    <AlertTriangle size={24} className="text-danger mr-3" />
                    <h1 className="text-2xl font-bold text-danger">Configuration Required</h1>
                </div>
                <p className="text-text-secondary">Google Analytics integration is not configured. Please set the required environment variables.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-text">Google Analytics</h1>
                    <p className="text-text-secondary">Track conversions, installs, and page views from Ortto campaigns.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowPropertyManager(!showPropertyManager)}
                        className="flex items-center gap-2 bg-primary border border-border rounded-lg px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
                    >
                        <Settings size={16} />
                        {showPropertyManager ? 'Hide Properties' : 'Manage Properties'}
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-text-secondary" />
                        <select
                            value={dateRange}
                            onChange={(e) => handleDateRangeChange(e.target.value)}
                            className="bg-primary border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-accent"
                        >
                            <option value="7daysAgo">Last 7 Days</option>
                            <option value="30daysAgo">Last 30 Days</option>
                            <option value="90daysAgo">Last 90 Days</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Property Manager */}
            {showPropertyManager && (
                <GA4PropertyManager onPropertyChange={handlePropertyChange} />
            )}

            {/* Status Information */}
            {status.properties?.count === 0 && (
                <div className="bg-primary border border-border rounded-xl p-6">
                    <div className="flex items-center mb-4">
                        <AlertTriangle size={24} className="text-warning mr-3" />
                        <h2 className="text-xl font-semibold text-warning">No GA4 Properties Configured</h2>
                    </div>
                    <p className="text-text-secondary mb-4">
                        You need to add at least one Google Analytics 4 property to view analytics data.
                    </p>
                    <button
                        onClick={() => setShowPropertyManager(true)}
                        className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Add Your First Property
                    </button>
                </div>
            )}

            {/* Analytics Data */}
            {status.properties?.count > 0 && (
                <>
                    {loading && (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="animate-spin text-accent" size={24}/> 
                            <span className="ml-2 text-text-secondary">Loading data...</span>
                        </div>
                    )}
                    
                    {error && (
                        <div className="p-4 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">
                            {error}
                        </div>
                    )}

                    {analyticsData && !loading && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <MetricCard 
                                    title="Total Sessions" 
                                    value={analyticsData.summary?.totalSessions?.toLocaleString() || '0'} 
                                    icon={BarChart2} 
                                />
                                <MetricCard 
                                    title="Total Engaged Sessions" 
                                    value={analyticsData.data?.totals?.engagedSessions?.toLocaleString() || '0'} 
                                    icon={BarChart2} 
                                />
                                <MetricCard 
                                    title="Total Users" 
                                    value={analyticsData.summary?.totalUsers?.toLocaleString() || '0'} 
                                    icon={BarChart2} 
                                />
                                <MetricCard 
                                    title="Total Events" 
                                    value={analyticsData.summary?.totalEvents?.toLocaleString() || '0'} 
                                    icon={BarChart2} 
                                />
                                <MetricCard 
                                    title="Shopify App Installs" 
                                    value={analyticsData.data?.totals?.installs?.toLocaleString() || '0'} 
                                    icon={BarChart2} 
                                />
                                <MetricCard 
                                    title="Unique App Installs" 
                                    value={analyticsData.data?.totals?.uniqueInstalls?.toLocaleString() || '0'} 
                                    icon={BarChart2} 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MetricCard 
                                    title="Conversion Rate" 
                                    value={`${analyticsData.summary?.conversionRate || 0}%`} 
                                    icon={BarChart2} 
                                />
                                <MetricCard 
                                    title="Page Views per Session" 
                                    value={analyticsData.summary?.pageViewsPerSession || 0} 
                                    icon={BarChart2} 
                                />
                            </div>

                            {/* Key Events Section */}
                            {analyticsData.data?.keyEvents && (
                                <div className="bg-primary border border-border rounded-xl p-6">
                                    <h3 className="text-lg font-semibold text-text mb-4">Key Events from Ortto Campaigns</h3>
                                    
                                    {analyticsData.data.keyEvents.shopifyAppInstalls && (
                                        <div className="mb-6">
                                            <h4 className="text-md font-medium text-text-secondary mb-3">Shopify App Installs</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                                                    <p className="text-sm text-text-secondary">Total Installs</p>
                                                    <p className="text-xl font-bold text-accent">{analyticsData.data.keyEvents.shopifyAppInstalls.total.toLocaleString()}</p>
                                                </div>
                                                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3">
                                                    <p className="text-sm text-text-secondary">Unique Installs</p>
                                                    <p className="text-xl font-bold text-accent">{analyticsData.data.keyEvents.shopifyAppInstalls.unique.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Install Events Table */}
                                            {analyticsData.data.keyEvents.shopifyAppInstalls.dailyData && analyticsData.data.keyEvents.shopifyAppInstalls.dailyData.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full bg-primary border border-border rounded-lg">
                                                        <thead>
                                                            <tr>
                                                                <th className="px-4 py-2 text-left">Date</th>
                                                                <th className="px-4 py-2 text-left">Source/Medium</th>
                                                                <th className="px-4 py-2 text-left">Event Name</th>
                                                                <th className="px-4 py-2 text-left">Install Count</th>
                                                                <th className="px-4 py-2 text-left">Unique Installs</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {analyticsData.data.keyEvents.shopifyAppInstalls.dailyData.map((row, idx) => (
                                                                <tr key={idx} className="border-t border-border">
                                                                    <td className="px-4 py-2">{row.date}</td>
                                                                    <td className="px-4 py-2">{row.sourceMedium}</td>
                                                                    <td className="px-4 py-2">{row.eventName}</td>
                                                                    <td className="px-4 py-2">{row.installCount}</td>
                                                                    <td className="px-4 py-2">{row.uniqueInstalls}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Daily Ortto Data Table */}
                            {analyticsData.data?.dailyData && analyticsData.data.dailyData.length > 0 && (
                                <div className="overflow-x-auto mt-6">
                                    <table className="min-w-full bg-primary border border-border rounded-xl">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2 text-left">Date</th>
                                                <th className="px-4 py-2 text-left">Source/Medium</th>
                                                <th className="px-4 py-2 text-left">Sessions</th>
                                                <th className="px-4 py-2 text-left">Engaged Sessions</th>
                                                <th className="px-4 py-2 text-left">Users</th>
                                                <th className="px-4 py-2 text-left">Events</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsData.data.dailyData.map((row, idx) => (
                                                <tr key={idx} className="border-t border-border">
                                                    <td className="px-4 py-2">{row.date}</td>
                                                    <td className="px-4 py-2">{row.sourceMedium || row.source || '-'}</td>
                                                    <td className="px-4 py-2">{row.sessions}</td>
                                                    <td className="px-4 py-2">{row.engagedSessions}</td>
                                                    <td className="px-4 py-2">{row.users}</td>
                                                    <td className="px-4 py-2">{row.events}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Property Info */}
                            <div className="bg-primary border border-border rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-text mb-2">Current Property</h3>
                                <p className="text-text-secondary">
                                    Property ID: {analyticsData.propertyId}
                                </p>
                                <p className="text-text-secondary">
                                    Date Range: {analyticsData.dateRange?.startDate} to {analyticsData.dateRange?.endDate}
                                </p>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default GoogleAnalytics; 