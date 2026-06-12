import { ajaxGet } from "..";
import { ProcessRoute } from "@/types/process";

export async function getAllProcess() {
  console.log('获取工艺列表');
  return ajaxGet<Array<ProcessRoute>>('/api/mes/process-route/get-all');
}
