import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Package, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { Card, Badge } from './Shared';
import { VOLUME_DATA, SPEND_DATA, RECENT_SHIPMENTS } from '../constants/data';

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 mt-1">Real-time overview of your supply chain performance.</p>
        </div>
        <div className="text-sm text-slate-500">Last updated: Just now</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Shipments', value: '1,248', trend: '+12.5%', isUp: true, icon: <Package className="text-blue-600" /> },
          { label: 'Freight Spend', value: '$84,392', trend: '+4.2%', isUp: false, icon: <DollarSign className="text-emerald-600" /> }, // Spend up is usually "bad" but here we show activity
          { label: 'Avg. Transit Time', value: '24 Days', trend: '-2 Days', isUp: true, icon: <Activity className="text-purple-600" /> }, // Down is good for time
          { label: 'Exceptions', value: '3', trend: 'Requires Action', isUp: false, icon: <AlertCircle className="text-red-600" /> },
        ].map((kpi, idx) => (
          <Card key={idx} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">{kpi.icon}</div>
              <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${kpi.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {kpi.isUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                {kpi.trend}
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900">{kpi.value}</h3>
              <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Shipment Volume (TEU)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_DATA}>
                <defs>
                  <linearGradient id="colorFcl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="fcl" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorFcl)" />
                <Area type="monotone" dataKey="lcl" stroke="#0ea5e9" strokeWidth={2} fillOpacity={0} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Weekly Spend Analysis</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPEND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Shipments Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">Recent Shipments</h3>
          <button className="text-blue-600 text-sm font-medium hover:text-blue-700" aria-label="View all shipments">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Shipment ID</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">ETA</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {RECENT_SHIPMENTS.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{shipment.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-900">{shipment.origin}</span>
                      <span className="text-slate-400 text-xs">to</span>
                      <span className="text-slate-900">{shipment.destination}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{shipment.type}</td>
                  <td className="px-6 py-4 text-slate-600">{shipment.eta}</td>
                  <td className="px-6 py-4">
                    <Badge status={shipment.status} />
                  </td>
                  <td className="px-6 py-4 w-48">
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ width: `${shipment.progress}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
