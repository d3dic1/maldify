import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UploadCloud, CheckCircle, XCircle, FileSpreadsheet, AlertTriangle, Loader2 } from 'lucide-react';

const StatusCard = ({ title, status }) => (
    <div className="bg-primary border border-border rounded-xl p-4 flex items-center justify-between">
        <span className="font-semibold text-text">{title}</span>
        <div className="flex items-center">
            {status === 'Configured' ? (
                <CheckCircle size={20} className="text-success" />
            ) : (
                <XCircle size={20} className="text-danger" />
            )}
            <span className={`ml-2 text-sm ${status === 'Configured' ? 'text-success' : 'text-danger'}`}>{status}</span>
        </div>
    </div>
);

const AIPacingEditor = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [status, setStatus] = useState(null);
    const [processingResult, setProcessingResult] = useState(null);
    const [spreadsheetUrl, setSpreadsheetUrl] = useState('');

    useEffect(() => {
        const checkPacingStatus = async () => {
            try {
                const response = await api.get('/pacing/status');
                setStatus(response.data);
            } catch (error) {
                console.error('Error fetching pacing status:', error);
                setStatus({ configured: false });
            }
        };
        const getSpreadsheet = async () => {
            try {
                const response = await api.get('/pacing/spreadsheet-url');
                setSpreadsheetUrl(response.data.url);
            } catch (error) {
                console.error('Error getting spreadsheet URL:', error);
            }
        };
        checkPacingStatus();
        getSpreadsheet();
    }, []);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'text/csv') {
            setSelectedFile(file);
            setError(null);
            setSuccess(null);
        } else {
            setError('Please select a valid CSV file.');
            setSelectedFile(null);
        }
    };
    
    const handleUpload = async () => {
        if (!selectedFile) return;
        setLoading(true);
        setError(null);
        setSuccess(null);
        const formData = new FormData();
        formData.append('csvFile', selectedFile);

        try {
            const response = await api.post('/pacing/upload-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccess(response.data.message || 'CSV processed successfully!');
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading CSV:', error);
            setError('Failed to upload CSV file');
        } finally {
            setLoading(false);
        }
    };

    const handleTestCSV = async () => {
        if (!selectedFile) {
            setError('Please select a CSV file first');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('csvFile', selectedFile);

            const response = await api.post('/pacing/test-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setProcessingResult(response.data);
            setSuccess('CSV test successful! File structure analyzed.');

        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const openSpreadsheet = () => {
        if (spreadsheetUrl) {
            window.open(spreadsheetUrl, '_blank');
        }
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
                <p className="text-text-secondary">AI Pacing Editor is not fully configured. Please set the required environment variables in your backend.</p>
                {/* ... display required variables ... */}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-text">AI Pacing Editor</h1>
                <p className="text-text-secondary">Upload Shopify Partner Portal CSVs and let AI organize them in Google Sheets.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard title="Google Sheets" status={status?.googleSheets} />
                <StatusCard title="Credentials" status={status?.credentials} />
                <StatusCard title="AI Service" status={status?.aiService} />
            </div>

            <div className="bg-primary border-2 border-dashed border-border rounded-xl p-8 text-center">
                <UploadCloud size={48} className="mx-auto text-accent mb-4" />
                <h2 className="text-xl font-bold text-text mb-2">Upload CSV File</h2>
                <p className="text-text-secondary mb-4">Drag and drop your file here or click to browse.</p>
                <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer bg-accent text-background font-semibold px-6 py-2 rounded-lg hover:bg-accent-hover transition-colors">
                    Browse File
                </label>
                {selectedFile && <p className="mt-4 text-sm text-success">Selected: {selectedFile.name}</p>}
            </div>

            <div className="flex justify-end items-center gap-4">
                <button
                    onClick={() => window.open(spreadsheetUrl, '_blank')}
                    disabled={!spreadsheetUrl}
                    className="flex items-center px-6 py-3 font-semibold rounded-lg bg-primary border border-border text-text hover:bg-border disabled:opacity-50"
                >
                    <FileSpreadsheet size={20} className="mr-2" />
                    View Sheet
                </button>
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || loading}
                    className="flex items-center justify-center px-6 py-3 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} className="mr-2" />}
                    {loading ? 'Processing...' : 'Upload & Process'}
                </button>
            </div>
            
            {success && <div className="p-4 bg-success/10 text-success text-sm rounded-lg border border-success/20">{success}</div>}
            {error && <div className="p-4 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">{error}</div>}

            {/* Processing Results */}
            {processingResult && (
                <div className="bg-card rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
                    <h2 className="text-xl font-bold text-text mb-6">Processing Results</h2>
                    <div className="space-y-4">
                        {processingResult.rows && (
                            <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                                <span className="text-sm font-semibold text-text">Rows Processed:</span>
                                <span className="text-sm text-text">{processingResult.rows}</span>
                            </div>
                        )}
                        {processingResult.columns && (
                            <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                                <span className="text-sm font-semibold text-text">Columns Identified:</span>
                                <span className="text-sm text-text">{processingResult.columns}</span>
                            </div>
                        )}
                        {processingResult.sheets && (
                            <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                                <span className="text-sm font-semibold text-text">Sheets Created:</span>
                                <span className="text-sm text-text">{processingResult.sheets}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIPacingEditor; 