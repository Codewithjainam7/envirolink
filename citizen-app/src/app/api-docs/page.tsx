'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Code, Terminal, Key, Book } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const endpoints = [
    { method: 'POST', path: '/api/reports', desc: 'Create a new waste report' },
    { method: 'GET', path: '/api/reports', desc: 'List all reports' },
    { method: 'GET', path: '/api/reports/:id', desc: 'Get report by ID' },
    { method: 'PUT', path: '/api/reports/:id', desc: 'Update report status' },
    { method: 'POST', path: '/api/analyze-image', desc: 'Analyze waste image with AI' },
];

export default function ApiDocsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
            <FloatingBlobs />
            <div className="bg-emerald-600 text-white py-16 lg:py-24">
                <div className="max-w-6xl mx-auto px-4 lg:px-8">
                    <Link href="/home" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <Code size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">API Documentation</h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Integrate ENVIROLINK into your applications with our REST API.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
                <div className="grid md:grid-cols-2 gap-6 mb-16">
                    <div className="bg-white p-6 rounded-2xl">
                        <Key size={32} className="text-emerald-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Authentication</h3>
                        <p className="text-gray-600 text-sm">All API requests require an API key passed in the Authorization header.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl">
                        <Terminal size={32} className="text-emerald-600 mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Rate Limits</h3>
                        <p className="text-gray-600 text-sm">Free tier: 100 requests/hour. Pro tier: 10,000 requests/hour.</p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints</h2>
                <div className="space-y-3 mb-16">
                    {endpoints.map((endpoint, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl flex items-center gap-4">
                            <span className={`px-3 py-1 rounded text-xs font-mono font-bold ${endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                                endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                {endpoint.method}
                            </span>
                            <code className="text-sm text-gray-700 font-mono">{endpoint.path}</code>
                            <span className="text-gray-500 text-sm ml-auto">{endpoint.desc}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-900 text-white p-6 rounded-2xl">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Terminal size={20} /> Example Request</h3>
                    <pre className="text-sm overflow-x-auto">
                        {`curl -X POST https://api.envirolink.in/v1/reports \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"location": {"lat": 19.076, "lng": 72.877}, "type": "garbage"}'`}
                    </pre>
                </div>

                <div className="mt-8 bg-emerald-50 p-6 rounded-2xl text-center">
                    <h3 className="font-bold text-gray-900 mb-2">Need an API Key?</h3>
                    <p className="text-gray-600 mb-4">Contact us to get started with the ENVIROLINK API.</p>
                    <a href="mailto:api@envirolink.in" className="text-emerald-600 font-semibold hover:underline">
                        api@envirolink.in
                    </a>
                </div>
            </div>
        </div>
    );
}
