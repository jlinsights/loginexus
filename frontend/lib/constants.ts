import { Ship, Plane, Truck } from 'lucide-react'

export const PORTS = [
  { code: 'KRPUS', name: '부산', country: '🇰🇷' },
  { code: 'KRINC', name: '인천', country: '🇰🇷' },
  { code: 'CNSHA', name: '상하이', country: '🇨🇳' },
  { code: 'CNNGB', name: '닝보', country: '🇨🇳' },
  { code: 'CNSHE', name: '선전', country: '🇨🇳' },
  { code: 'JPTYO', name: '도쿄', country: '🇯🇵' },
  { code: 'JPOSA', name: '오사카', country: '🇯🇵' },
  { code: 'SGSIN', name: '싱가포르', country: '🇸🇬' },
  { code: 'HKHKG', name: '홍콩', country: '🇭🇰' },
  { code: 'THBKK', name: '방콕', country: '🇹🇭' },
  { code: 'VNSGN', name: '호치민', country: '🇻🇳' },
  { code: 'VNHPH', name: '하이퐁', country: '🇻🇳' },
  { code: 'USNYC', name: '뉴욕', country: '🇺🇸' },
  { code: 'USLAX', name: 'LA/롱비치', country: '🇺🇸' },
  { code: 'USSEA', name: '시애틀', country: '🇺🇸' },
  { code: 'DEHAM', name: '함부르크', country: '🇩🇪' },
  { code: 'NLRTM', name: '로테르담', country: '🇳🇱' },
  { code: 'GBFXT', name: '펠릭스토', country: '🇬🇧' },
  { code: 'AEJEA', name: '제벨알리', country: '🇦🇪' },
  { code: 'INMUN', name: '뭄바이', country: '🇮🇳' },
]

export type Mode = 'ocean_fcl' | 'ocean_lcl' | 'air' | 'trucking'

export const MODES = [
  { id: 'ocean_fcl', label: '해상 FCL', icon: Ship, unit: '/20ft' },
  { id: 'ocean_lcl', label: '해상 LCL', icon: Ship, unit: '/CBM' },
  { id: 'air', label: '항공', icon: Plane, unit: '/kg' },
  { id: 'trucking', label: '내륙 트럭', icon: Truck, unit: '/대' },
]
