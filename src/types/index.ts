export interface PagedList<T> {
  totalCount: number,
  items: T[]
}

export interface AbpError {
  code: string;
  message: string;
  details: string;
  data: any;
  validationErrors: Array<ValidationError>;
}


export interface ValidationError {
  members: Array<string>,
  message: string
}
