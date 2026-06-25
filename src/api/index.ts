import { request, getStorageSync, showToast } from '@tarojs/taro';
import { loadingManager } from '@/util/loadingManager';
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
        switch (res.statusCode) {
          case 200:
          case 201:
          case 204:
            resolve(<T>res.data);
            return;
          case 400:
          case 403:
            let error = res.data.error as AbpError;
            if(error.message){
              showToast({
                title: '无法访问到资源，请检查网络连接。',
                icon: 'error',
                duration: 2500
               });
              }
              reject();
              return;
          case 500:
          default:
            reject(res.data);
            return;
        }
      })
      .catch(() => {
        if (isShowLoading) {
          loadingManager.forceHide();
          showToast({
            title: '无法访问到资源，请检查网络连接。',
            icon: 'error',
            duration: 2500
          });
        }
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
