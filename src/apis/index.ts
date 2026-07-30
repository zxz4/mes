import { request, getStorageSync, showToast } from '@tarojs/taro';
import { loadingManager } from '../utils/loadingManager';
import { AbpError } from '../types';

export const customHeader: Record<string, string> = {
  'Authorization': getStorageSync<string>('token') ?? '',
};

let fetchFlag = '';
let requestQueue: string[] = [];

export async function ajax<T = any>(
  url: string,
  method: 'OPTIONS' | 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'TRACE' | 'CONNECT' = 'GET',
  data: object = {},
  isShowLoading: boolean,
): Promise<T> {
  for (let key in data) {
    if (data[key] === undefined || data[key] === null) delete data[key];
  }

  let tempFetchFlag = `${url}${method}${JSON.stringify(data)}`;
  // 防止重复提交处理
  if (tempFetchFlag === fetchFlag) {
    fetchFlag = '';
    throw new Error('请不要重复点击提交');
  } else {
    fetchFlag = tempFetchFlag;
    // 600ms后可重新提交
    setTimeout(() => {
      fetchFlag = '';
    }, 600);
  }
  requestQueue.push(tempFetchFlag);
  if (!customHeader.Authorization) delete customHeader.Authorization;

  if (isShowLoading) {
    loadingManager.show();
  }

  // if (url.startsWith('/')) {
  //   url = `https://localhost:51243${url}`;
  // }

  return new Promise((resolve, reject) => {
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === null || data[key] === '')
        delete data[key];
      else if (Array.isArray(data[key]) && data[key].length == 0)
        delete data[key];
    });
    let requestOptions = {
      url: url,
      method,
      data,
      header: {
        ...customHeader,
        'content-type': 'application/json',
      }
    };
    request(requestOptions)
      .then(res => {
        if (isShowLoading) {
          loadingManager.hide();
        }
        const toastPara = { title: '参数错误。', duration: 2500 };
        switch (res.statusCode) {
          case 200:
            resolve(<T>res.data);
            return;
          case 201:
          case 204:
            resolve(null as T);
            return;
          case 404:
          case 403:
          case 400:
            let error: AbpError | undefined = res.data.error as AbpError;
            if (error && error.validationErrors && error.validationErrors.length > 0) {
              toastPara.title = error.validationErrors[0].message;
            } else if (error && error.message) {
              toastPara.title = error.message;
            }
            break;
          case 500:
            toastPara.title = '服务器出现了一个异常。';
            break;
          default:
            toastPara.title = '未知错误代码。';
            break;
        }
        showToast({ ...toastPara, icon: 'none' });
        reject();
      })
      .catch(() => {
        if (isShowLoading) {
          loadingManager.forceHide();
        }
        showToast({
          title: '无法访问到资源，请检查网络连接。',
          icon: 'error',
          duration: 2500
        });
        reject();
      }).finally(() => {
        requestQueue = requestQueue.filter(z => z !== tempFetchFlag);
      });
  });
}

export async function ajaxGet<T = any>(url: string, data: object = {}, isShowLoading = true) {
  return ajax<T>(url, 'GET', data, isShowLoading);
}

export async function ajaxPost<T = any>(url: string, data: object = {}, isShowLoading = true) {
  return ajax<T>(url, 'POST', data, isShowLoading);
}

export async function ajaxPut<T = any>(url: string, data: object = {}, isShowLoading = true) {
  return ajax<T>(url, 'PUT', data, isShowLoading);
}
