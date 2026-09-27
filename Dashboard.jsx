// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { LayoutDashboard, FileText, MessageSquare, Database, Activity, Upload, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { label: 'Documents', value: '0', icon: FileText, color: 'primary' },
    { label: 'Knowledge Chunks', value: '0', icon: Database, color: 'success' },
    { label: 'Questions Answered', value: '0', icon: MessageSquare, color: 'warning' },
    { label: 'Processing Health', value: '0%', icon: Activity, color: 'info' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted">Your knowledge base at a glance.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors inline-flex items-center gap-2">
          <Upload size={18} />
          Upload Document
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-surface-elevated border border-border rounded-xl p-6 hover:border-primary/30 transition-all">
              <div className={`p-3 rounded-xl bg-${stat.color}/10 inline-block`}>
                <Icon className={`text-${stat.color}`} size={24} />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-sm text-text-muted">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Welcome Section */}
      <div className="bg-surface-elevated border border-border rounded-xl p-8 text-center">
        <Sparkles className="text-primary mx-auto mb-4" size={48} />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Welcome to Veridoc AI</h2>
        <p className="text-text-muted mb-4">Upload your documents to start asking questions and building your knowledge base.</p>
        <button className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors inline-flex items-center gap-2">
          <Upload size={18} />
          Upload Documents
        </button>
      </div>
    </div>
  );
};

export default Dashboard;