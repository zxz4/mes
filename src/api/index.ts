import {
  showLoading,
  hideLoading,
  request,
  getStorageSync
} from '@tarojs/taro';

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
    hideLoading();
    throw new Error('请不要重复点击提交');
  } else {
    fetchFlag = tempFetchFlag;
    // 600ms后可重新提交
    setTimeout(() => {
      fetchFlag = '';
    }, 600);
  }
  requestQueue.push(tempFetchFlag);
  console.log('requestQueue==>', requestQueue);
  if (!customHeader.Authorization) delete customHeader.Authorization;

  if (isShowLoading) {
    showLoading({
      title: '加载中',
      mask: true
    });
  }

  if (url.startsWith('/')) {
    url = `https://localhost:51243${url}`;
  }

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
      .then(async res => {
        switch (res.statusCode) {
          case 200:
          case 201:
          case 204:
            resolve(<T>res.data);
            break;
          case 400:
            break;
          case 500:
          default:
            reject(res.data)
            break;
        }
      })
      .catch(err => {
        console.log(err);
        reject(err);
      }).finally(() => {
        if (isShowLoading) {
          hideLoading();
        }
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
