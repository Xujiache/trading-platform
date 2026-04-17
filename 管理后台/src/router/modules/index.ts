import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { marketRoutes } from './market'
import { tradeRoutes } from './trade'
import { fundRoutes } from './fund'
import { reportRoutes } from './report'
import { tradingUserRoutes } from './trading-user'
import { riskRoutes } from './risk'
import { chatRoutes } from './chat'
import { operationRoutes } from './operation'

export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  marketRoutes,
  tradeRoutes,
  tradingUserRoutes,
  fundRoutes,
  riskRoutes,
  reportRoutes,
  operationRoutes,
  chatRoutes,
  systemRoutes
]
