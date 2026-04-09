/** 统一 API 响应格式 */
interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}

/** 分页请求参数 */
interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** 分页响应数据 */
interface PaginatedData<T> {
  list: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
