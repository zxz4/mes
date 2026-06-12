export interface RouteStep {
  id:string
  stepOrder: number
  operationCode: string
  operationName: string
}

export interface ProcessRoute {
  id: string
  routeName: string
  routeSteps: RouteStep[]
}
