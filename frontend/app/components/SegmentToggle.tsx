'use client';

import React, { useState } from 'react';
import { Ship, Truck, Package, Warehouse, ChevronRight } from 'lucide-react';

export interface Segment {
    key: string;
    label: string;
    icon: React.ElementType;
    description: string;
    items: { title: string; subtitle: string }[];
}

const defaultSegments: Segment[] = [
    {
        key: 'ocean',
        label: '해상 운송',
        icon: Ship,
        description: 'Ocean Freight',
        items: [
            { title: 'FCL (Full Container)', subtitle: '20ft · 40ft · HC containers' },
            { title: 'LCL (Less Container)', subtitle: 'Consolidated cargo shipping' },
            { title: 'Bulk / Break-Bulk', subtitle: 'Oversized & heavy cargo' },
        ],
    },
    {
        key: 'air',
        label: '항공 운송',
        icon: Package,
        description: 'Air Freight',
        items: [
            { title: 'Express Air', subtitle: 'Time-critical shipments' },
            { title: 'Standard Air Cargo', subtitle: 'Scheduled airline services' },
            { title: 'Charter & Project', subtitle: 'Dedicated charter flights' },
        ],
    },
    {
        key: 'inland',
        label: '내륙 운송',
        icon: Truck,
        description: 'Inland Transport',
        items: [
            { title: 'FTL (Full Truck Load)', subtitle: 'Dedicated truck service' },
            { title: 'LTL (Less Truck Load)', subtitle: 'Shared transport optimization' },
            { title: 'Last Mile Delivery', subtitle: 'Door-to-door final leg' },
        ],
    },
    {
        key: 'warehouse',
        label: '창고 / 보관',
        icon: Warehouse,
        description: 'Warehousing',
        items: [
            { title: 'Bonded Warehouse', subtitle: 'Customs-cleared storage' },
            { title: 'Cross-Docking', subtitle: 'Transfer without storage' },
            { title: 'Cold Chain Storage', subtitle: 'Temperature-controlled facilities' },
        ],
    },
];

interface SegmentToggleProps {
    segments?: Segment[];
    title?: string;
}

export function SegmentToggle({ segments = defaultSegments, title = '서비스 카테고리' }: SegmentToggleProps) {
    const [activeKey, setActiveKey] = useState(segments[0]?.key);
    const activeSegment = segments.find(s => s.key === activeKey) || segments[0];

    return (
        <div className="bg-white rounded-2xl border border-[#E8E0D4] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            </div>

            <div className="flex flex-col lg:flex-row">
                {/* Tab Sidebar */}
                <div className="lg:w-48 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-[#E8E0D4]">
                    <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible p-2 gap-1">
                        {segments.map((segment) => {
                            const Icon = segment.icon;
                            const isActive = segment.key === activeKey;
                            return (
                                <button
                                    key={segment.key}
                                    onClick={() => setActiveKey(segment.key)}
                                    className={`
                                        flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all whitespace-nowrap
                                        ${isActive
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }
                                    `}
                                >
                                    <Icon size={16} className={isActive ? 'text-blue-100' : 'text-slate-400'} />
                                    <div>
                                        <div className="text-xs font-semibold">{segment.label}</div>
                                        <div className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'} hidden lg:block`}>
                                            {segment.description}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Cards */}
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {activeSegment.items.map((item, idx) => (
                            <div
                                key={idx}
                                className="group bg-slate-50 hover:bg-blue-50 rounded-xl p-4 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-800 mb-1">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-slate-500 group-hover:text-blue-600">
                                            {item.subtitle}
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={14}
                                        className="text-slate-300 group-hover:text-blue-400 mt-1 transition-colors"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
