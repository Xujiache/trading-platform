import request from '../utils/request';

export function getDashboard() { return request.get('/report/dashboard'); }
export function getOperationReport(params?: Record<string, unknown>) { return request.get('/report/operation', { params }); }
export function getRiskReport() { return request.get('/report/risk'); }
export function getUserAnalysis() { return request.get('/report/user-analysis'); }
