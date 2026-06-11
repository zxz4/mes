import { WorkOrderDetail } from '@/types/work-order'
const works: Array<WorkOrderDetail> = [
  {
    id: '1',
    projectCode: 'PJ_1098',
    projectName: 'SM1178D-310-R2.1_1178.496kWh_中交',
    productName: 'SM1178D-310-R2.1',
    productSap: '91070999',
    productType: 'EVE-BS-ES0726-11',
    productSpec: '2*3P198S',
    planQty: 1,
    completedQty: 0,
    unit: 'EA',
    status: 'pending_material',
    hasAnomaly: false,
    leaderName: '吴兴林',
    leaderDept: '模块产品部二组',
  },
  {
    id: 'WO002',
    projectCode: 'PJ_1076',
    projectName: 'SE5015D-628-R1.1_400MWh_宁夏中光电',
    productName: 'SE5015D-628-R1.1',
    productSap: '91070575',
    productType: 'S556H214',
    productSpec: 'S5MB56-0.25P',
    planQty: 1,
    completedQty: 0,
    unit: 'EA',
    status: 'in_production',
    hasAnomaly: true,
    leaderName: '白天宇',
    leaderDept: '电力产品一部一组'
  }, {
    id: 'WO003',
    projectCode: 'PJ_0823',
    projectName: 'SC0261-314-R2.3_1306kWh_TD_新加坡',
    productName: 'SC0261-314-R2.3',
    productSap: '91062669',
    productType: 'EVE-BS-ES0726-11',
    productSpec: '2*3P198S',
    planQty: 3,
    completedQty: 0,
    leaderName: '纪云龙',
    leaderDept: 'AC261国内产品部一组',
    unit: 'EA',
    status: 'completed',
    hasAnomaly: false
  }
];

const mockData =
{
  Workers: works
}

export default mockData;
