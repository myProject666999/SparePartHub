import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  constructor(private message: NzMessageService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const apiReq = request.clone({
      url: request.url.startsWith('http') ? request.url : `/api${request.url}`,
      setHeaders: {
        'Content-Type': 'application/json',
      },
    });

    return next.handle(apiReq).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '请求失败，请稍后重试';
        if (error.error?.message) {
          errorMessage = Array.isArray(error.error.message)
            ? error.error.message.join('; ')
            : error.error.message;
        } else if (error.status === 404) {
          errorMessage = '接口不存在';
        } else if (error.status === 500) {
          errorMessage = '服务器内部错误';
        } else if (error.status === 401) {
          errorMessage = '请先登录';
        }
        this.message.error(errorMessage);
        return throwError(() => error);
      })
    );
  }
}
