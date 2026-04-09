import request from '../utils/request';

export function getDeposits(params: Record<string, unknown>) { return request.get('/fund/deposits', { params }); }
export function reviewDeposit(id: number, data: Record<string, unknown>) { return request.put(`/fund/deposits/${id}/review`, data); }
export function getWithdraws(params: Record<string, unknown>) { return request.get('/fund/withdraws', { params }); }
export function reviewWithdraw(id: number, data: Record<string, unknown>) { return request.put(`/fund/withdraws/${id}/review`, data); }
export function processWithdraw(id: number) { return request.put(`/fund/withdraws/${id}/process`, { status: 'completed' }); }
export function getFundFlows(params: Record<string, unknown>) { return request.get('/fund/flows', { params }); }
export function getFinancialStats() { return request.get('/fund/statistics'); }
