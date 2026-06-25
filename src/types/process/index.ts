export interface RouteStep {
  id:string
  stepOrder: number
  operationCode: string
  operationName: string
}

export interface Process {
  id: string
  routeName: string
  routeSteps: RouteStep[]
}
