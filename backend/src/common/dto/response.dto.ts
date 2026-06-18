import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '响应码' })
  code: number;

  @ApiProperty({ description: '响应消息' })
  message: string;

  @ApiPropertyOptional({ description: '响应数据' })
  data?: T;

  @ApiPropertyOptional({ description: '时间戳' })
  timestamp?: number;

  static success<T>(data?: T, message = '操作成功'): ApiResponse<T> {
    return {
      success: true,
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    };
  }

  static error(message: string, code = 500): ApiResponse<null> {
    return {
      success: false,
      code,
      message,
      data: null,
      timestamp: Date.now(),
    };
  }
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: '数据列表' })
  list: T[];

  @ApiProperty({ description: '总数' })
  total: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页数量' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class PaginationQueryDto {
  page?: number = 1;
  pageSize?: number = 20;
  keyword?: string = '';
}
