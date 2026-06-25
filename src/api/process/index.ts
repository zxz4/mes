import { ajaxGet } from "..";
import { Process } from "@/types/process";

export async function getAllProcess() {
  console.log('获取工艺列表');
  return ajaxGet<Array<Process>>('/api/mes/process/get-all');
}
