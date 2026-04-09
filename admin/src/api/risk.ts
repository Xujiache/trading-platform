import request from '../utils/request';

export function getRiskConfig() { return request.get('/risk/config'); }
export function updateRiskConfig(data: Record<string, unknown>[]) { return request.put('/risk/config', data); }
export function getRiskAlerts(params: Record<string, unknown>) { return request.get('/risk/alerts', { params }); }
export function processAlert(id: number, data: Record<string, unknown>) { return request.put(`/risk/alerts/${id}/process`, data); }
export function getForceCloseRecords(params: Record<string, unknown>) { return request.get('/risk/force-close', { params }); }
export function getHighRiskAccounts() { return request.get('/risk/high-risk'); }
export function getAmlAlerts(params?: Record<string, unknown>) { return request.get('/risk/aml', { params }); }
