// frontend/src/pages/Settings.jsx
import React, { useState } from 'react';
import { Settings as SettingsIcon, Sparkles, Moon, Sun, Check, X, ExternalLink, Github, Trash2 } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    notifications: true,
    showSources: true,
    autoSave: true,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-muted">Configure your application preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-surface-elevated border border-border rounded-xl p-2">
            {['General', 'AI & Model', 'Documents', 'Privacy', 'About'].map((tab, i) => (
              <button
                key={i}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  i === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <div className="bg-surface-elevated border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-6">General Settings</h2>
            
            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className="text-sm font-medium text-text-secondary block mb-2">Theme</label>
                <div className="flex gap-2">
                  <button className={`px-4 py-2 rounded-lg text-sm transition-colors ${settings.theme === 'dark' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-surface-hover'}`}>
                    <Moon size={16} className="inline mr-2" />
                    Dark
                  </button>
                  <button className={`px-4 py-2 rounded-lg text-sm transition-colors ${settings.theme === 'light' ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-surface-hover'}`}>
                    <Sun size={16} className="inline mr-2" />
                    Light
                  </button>
                </div>
              </div>

              {/* Show Sources */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <div className="font-medium text-text-primary">Show Sources</div>
                  <div className="text-sm text-text-muted">Display source references in answers</div>
                </div>
                <button
                  onClick={() => toggleSetting('showSources')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${settings.showSources ? 'bg-success/20 text-success' : 'bg-surface text-text-muted'}`}
                >
                  {settings.showSources ? <Check size={18} className="inline" /> : <X size={18} className="inline" />}
                  {settings.showSources ? ' Enabled' : ' Disabled'}
                </button>
              </div>

              {/* Auto-Save */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <div className="font-medium text-text-primary">Auto-Save</div>
                  <div className="text-sm text-text-muted">Automatically save chat history</div>
                </div>
                <button
                  onClick={() => toggleSetting('autoSave')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${settings.autoSave ? 'bg-success/20 text-success' : 'bg-surface text-text-muted'}`}
                >
                  {settings.autoSave ? <Check size={18} className="inline" /> : <X size={18} className="inline" />}
                  {settings.autoSave ? ' Enabled' : ' Disabled'}
                </button>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <div className="font-medium text-text-primary">Notifications</div>
                  <div className="text-sm text-text-muted">Show desktop notifications</div>
                </div>
                <button
                  onClick={() => toggleSetting('notifications')}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${settings.notifications ? 'bg-success/20 text-success' : 'bg-surface text-text-muted'}`}
                >
                  {settings.notifications ? <Check size={18} className="inline" /> : <X size={18} className="inline" />}
                  {settings.notifications ? ' Enabled' : ' Disabled'}
                </button>
              </div>

              {/* About Section */}
              <div className="pt-4">
                <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Sparkles size={32} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">Veridoc AI</h4>
                    <span className="text-sm text-text-muted">Version 1.0.0</span>
                    <p className="text-sm text-text-muted">Ask your documents. Trust the answer.</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-border">
                <button className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors inline-flex items-center gap-2">
                  <Check size={18} />
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;