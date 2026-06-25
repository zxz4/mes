export interface PagedList<T> {
  totalCount: number,
  items: T[]
}

export interface AbpError {
  code: string;
  message: string;
  details: string;
  data: any;
  validationErrors: string;
}
