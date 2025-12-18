import React, { useState } from 'react';
import { UserCheck, Clock, CheckCircle } from 'lucide-react';
import AgentDetailsView from './AgentDetailsView';

// Style constants
const styles = {
    glassPanel: {
        background: 'var(--panel-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        backdropFilter: 'blur(10px)',
        color: 'var(--text-primary)',
        boxShadow: 'var(--glass-shadow)'
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: 0
    },
    selectInput: {
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '0.5rem 1rem',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '0.9rem',
        cursor: 'pointer'
    },
    agentsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem'
    },
    agentCard: {
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        padding: '1.25rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    statsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--glass-bg)',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.85rem'
    }
};

const AgentCard = ({ agent, onClick }) => (
    <div
        style={styles.agentCard}
        onClick={onClick}
        onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${agent.color || '#3b82f6'}, #1e293b)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold'
            }}>
                {agent.name.charAt(0)}
            </div>
            <div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{agent.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{agent.username}</div>
            </div>
            <div style={{
                marginLeft: 'auto',
                padding: '4px 8px',
                borderRadius: '12px',
                background: agent.status === 'online' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                color: agent.status === 'online' ? '#34d399' : '#94a3b8',
                fontSize: '0.75rem'
            }}>
                {agent.status === 'online' ? 'متصل' : 'غائب'}
            </div>
        </div>

        <div style={styles.statsRow}>
            <div style={{ color: 'var(--text-secondary)' }}>إجمالي المكالمات</div>
            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{agent.totalCalls}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div style={{ ...styles.statsRow, justifyContent: 'center', flexDirection: 'column', gap: '0.25rem' }}>
                <CheckCircle size={14} color="#10b981" />
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{agent.resolutionRate}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>نسبة الحل</span>
            </div>
            <div style={{ ...styles.statsRow, justifyContent: 'center', flexDirection: 'column', gap: '0.25rem' }}>
                <Clock size={14} color="#f59e0b" />
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{agent.avgDuration}</span>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>متوسط المدة</span>
            </div>
        </div>
    </div>
);

const AgentPerformanceView = ({ users, calls }) => {
    const [selectedTimeRange, setSelectedTimeRange] = useState('today');
    const [selectedAgent, setSelectedAgent] = useState(null);

    const getAgentStats = () => {
        return users
            .filter(u => u.role !== 'ADMIN')
            .map(agent => {
                const agentCalls = calls.filter(c => c.agentId === agent.id || c.agent_id === agent.id);
                // Filter by time range if needed (omitted for brevity, assume full list or pre-filtered)

                const successfulCalls = agentCalls.filter(call => call.status === 'Successful').length;

                return {
                    ...agent,
                    totalCalls: agentCalls.length,
                    successfulCalls: successfulCalls,
                    resolutionRate: agentCalls.length > 0 ? `${Math.round((successfulCalls / agentCalls.length) * 100)}%` : '0%',
                    avgDuration: agentCalls.length > 0 ?
                        `${Math.floor(agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / agentCalls.length / 60)}:${(Math.floor(agentCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / agentCalls.length) % 60).toString().padStart(2, '0')}` : '0:00',
                    // status: 'online' // Mock status mechanism if needed
                };
            });
    };

    if (selectedAgent) {
        return (
            <AgentDetailsView
                agent={selectedAgent}
                calls={calls.filter(c => c.agentId === selectedAgent.id || c.agent_id === selectedAgent.id)}
                onBack={() => setSelectedAgent(null)}
            />
        );
    }

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={styles.glassPanel}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>أداء الموظفين</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            style={styles.selectInput}
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                        >
                            <option value="today" style={{ color: 'black' }}>اليوم</option>
                            <option value="week" style={{ color: 'black' }}>هذا الأسبوع</option>
                            <option value="month" style={{ color: 'black' }}>هذا الشهر</option>
                        </select>
                    </div>
                </div>

                <div style={styles.agentsGrid}>
                    {getAgentStats().map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            onClick={() => setSelectedAgent(agent)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AgentPerformanceView;
