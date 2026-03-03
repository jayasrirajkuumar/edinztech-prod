import { useState } from 'react';
import ProgramCard from '../ProgramCard';
import { Icons } from '../icons';

export default function ProgramGrid({ title, programs = [], emptyMessage, type }) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPrograms = programs.filter(p =>
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-secondary">{title}</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-50 text-text-light">
                        <Icons.Filter size={16} />
                        Filter
                    </button>
                </div>
            </div>

            {filteredPrograms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map(p => (
                        <div key={p.id} className="relative h-full group">
                            <ProgramCard program={p} />
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm border border-orange-100 z-10 flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
                                <span className="capitalize">{p.status || 'Active'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Icons.Search className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                        {searchQuery ? 'No Results Found' : `No ${type} Found`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {searchQuery ? `We couldn't find anything matching "${searchQuery}"` : emptyMessage}
                    </p>
                </div>
            )}
        </div>
    );
}
