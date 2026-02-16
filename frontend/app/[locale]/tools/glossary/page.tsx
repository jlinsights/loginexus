'use client'

import React, { useState, useMemo, useRef } from 'react'
import ToolLayout from '../ToolLayout'
import { Search, Tag } from 'lucide-react'

type GlossaryItem = { term: string; termKo: string; definition: string; category: string }

const G: GlossaryItem[] = [
  { term: 'AWB', termKo: '항공 화물 운송장', definition: 'Air Waybill. 항공 운송 시 사용되는 화물 운송 계약서이자 화물 수령증.', category: '운송' },
  { term: 'B/L', termKo: '선하증권', definition: 'Bill of Lading. 해상 운송 화물 수령 증명 및 유가증권. Original B/L을 제시해야 화물 인수 가능.', category: '운송' },
  { term: 'BAF', termKo: '유류 할증료', definition: 'Bunker Adjustment Factor. 연료비 변동에 따라 부과되는 해상 운임 할증료.', category: '금융' },
  { term: 'Bonded Warehouse', termKo: '보세 창고', definition: '수입 통관 전 관세 미납부 상태로 화물을 보관할 수 있는 관세청 특허 창고.', category: '통관' },
  { term: 'CBM', termKo: '세제곱미터', definition: 'Cubic Meter. LCL 화물 부피 단위. 1CBM = 1m × 1m × 1m.', category: '운송' },
  { term: 'CFS', termKo: '컨테이너 조작장', definition: 'Container Freight Station. LCL 화물을 컨테이너에 적입/분류하는 장소.', category: '운송' },
  { term: 'CIF', termKo: '운임·보험료 포함', definition: 'Cost, Insurance, Freight. 매도인이 도착항까지 운임과 보험료를 부담하는 인코텀즈 조건.', category: '금융' },
  { term: 'Customs Clearance', termKo: '통관', definition: '수출입 화물이 세관 승인을 거쳐 반입/반출되는 법적 절차.', category: '통관' },
  { term: 'DDP', termKo: '관세 포함 인도', definition: 'Delivered Duty Paid. 매도인이 수입 통관 및 관세 포함 모든 비용을 부담.', category: '금융' },
  { term: 'Demurrage', termKo: '체선료', definition: '컨테이너 FREE TIME 초과 시 항만에서 부과되는 지연 비용.', category: '금융' },
  { term: 'Detention', termKo: '지체료', definition: '컨테이너 반출 후 FREE TIME 내 미반납 시 선사가 부과하는 비용.', category: '금융' },
  { term: 'EDI', termKo: '전자 자료 교환', definition: 'Electronic Data Interchange. 물류 문서를 표준 전자 포맷으로 교환하는 시스템.', category: '기술' },
  { term: 'ETA', termKo: '도착 예정 시간', definition: 'Estimated Time of Arrival. 목적지 도착 예상 시간.', category: '운송' },
  { term: 'ETD', termKo: '출발 예정 시간', definition: 'Estimated Time of Departure. 출발 예정 일시.', category: '운송' },
  { term: 'FCL', termKo: '컨테이너 단위 화물', definition: 'Full Container Load. 한 화주의 화물로 컨테이너 전체를 사용하는 방식.', category: '운송' },
  { term: 'FOB', termKo: '본선 인도 조건', definition: 'Free On Board. 매도인이 수출항 선적까지 비용·위험 부담하는 인코텀즈 조건.', category: '금융' },
  { term: 'Forwarder', termKo: '화물 주선업자', definition: '화주 대신 화물 운송을 주선하는 물류 중개인.', category: '운송' },
  { term: 'FSC', termKo: '유류 할증료(항공)', definition: 'Fuel Surcharge. 항공 운송 시 유가 변동에 따른 추가 비용.', category: '금융' },
  { term: 'HS Code', termKo: '관세 품목 분류 코드', definition: 'Harmonized System Code. WCO가 정한 국제 통일 상품 분류 체계. 6자리 국제 공통.', category: '통관' },
  { term: 'Incoterms', termKo: '국제 상거래 조건', definition: 'ICC 제정 국제 무역 거래 조건 해석 규칙. FOB, CIF, DDP 등 11가지.', category: '금융' },
  { term: 'IoT', termKo: '사물 인터넷', definition: '컨테이너 센서로 위치·온도·습도·충격을 실시간 모니터링하는 기술.', category: '기술' },
  { term: 'LCL', termKo: '소량 혼적 화물', definition: 'Less than Container Load. 소량 화물을 다른 화주와 합적 운송.', category: '운송' },
  { term: 'L/C', termKo: '신용장', definition: 'Letter of Credit. 수입자 거래 은행이 수출상에 대금 지급을 보증하는 결제 수단.', category: '금융' },
  { term: 'NVOCC', termKo: '무선박 운송인', definition: '자체 선박 없이 선복 확보하여 자기 명의 B/L을 발행하는 운송인.', category: '운송' },
  { term: 'POD', termKo: '양하항', definition: 'Port of Discharge. 화물이 선박에서 내려지는 항구.', category: '운송' },
  { term: 'POL', termKo: '선적항', definition: 'Port of Loading. 화물이 선박에 적재되는 항구.', category: '운송' },
  { term: 'Smart Contract', termKo: '스마트 컨트랙트', definition: '블록체인 위에서 자동 실행되는 계약. 화물 도착 확인 시 자동 결제 등에 활용.', category: '기술' },
  { term: 'TEU', termKo: '20피트 컨테이너 단위', definition: 'Twenty-foot Equivalent Unit. 컨테이너 물동량 표준 단위. 40ft = 2TEU.', category: '운송' },
  { term: 'THC', termKo: '터미널 화물 처리비', definition: 'Terminal Handling Charge. 항만에서 컨테이너 처리 비용.', category: '금융' },
  { term: 'TMS', termKo: '운송 관리 시스템', definition: 'Transportation Management System. 운송 계획·실행·최적화 관리 소프트웨어.', category: '기술' },
  { term: 'T/S', termKo: '환적', definition: 'Transshipment. 중간 항구에서 다른 선박으로 옮겨 실어 최종 목적지로 운송.', category: '운송' },
  { term: 'WMS', termKo: '창고 관리 시스템', definition: 'Warehouse Management System. 창고 내 재고 입출고·보관 위치·피킹 관리 시스템.', category: '기술' },
  { term: 'AIS', termKo: '선박 자동 식별', definition: 'Automatic Identification System. 선박 위치·속도·항로를 실시간 추적하는 해상 시스템.', category: '기술' },
  { term: 'API', termKo: '응용 프로그래밍 인터페이스', definition: '시스템 간 데이터를 자동으로 주고받는 소프트웨어 연결 규격.', category: '기술' },
  { term: 'Carbon Offset', termKo: '탄소 상쇄', definition: '운송 탄소 배출량을 재생 에너지·조림 등의 프로젝트 투자로 상쇄하는 제도.', category: '기타' },
  { term: 'Escrow', termKo: '에스크로', definition: '제3자가 거래 대금을 보관, 조건 충족 시 지급하는 안전 결제 방식.', category: '기술' },
  { term: 'R/T', termKo: '레비뉴톤', definition: 'Revenue Ton. 중량과 부피 중 큰 쪽을 적용하는 운임 산정 단위.', category: '금융' },
]

const CATS = ['전체', '운송', '통관', '금융', '기술', '기타']

export default function GlossaryPage() {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('전체')
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  const sorted = useMemo(() => [...G].sort((a, b) => a.term.localeCompare(b.term)), [])

  const filtered = useMemo(() => {
    let r = sorted
    if (cat !== '전체') r = r.filter(g => g.category === cat)
    if (query.trim()) {
      const q = query.toLowerCase()
      r = r.filter(g => g.term.toLowerCase().includes(q) || g.termKo.includes(q) || g.definition.includes(q))
    }
    return r
  }, [sorted, query, cat])

  const grouped = useMemo(() => {
    const m: Record<string, GlossaryItem[]> = {}
    for (const i of filtered) {
      const l = i.term[0].toUpperCase()
      if (!m[l]) m[l] = []
      m[l].push(i)
    }
    return m
  }, [filtered])

  const letters = Object.keys(grouped).sort()
  const az = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  return (
    <ToolLayout title="물류 용어 사전" description="국제 물류에서 사용되는 핵심 용어와 약어를 검색하고 학습하세요">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 -mt-20 relative z-10">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="용어 검색 (예: B/L, FCL, 통관...)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${cat === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {c === '전체' && <Tag size={12} />}{c}
            </button>
          ))}
        </div>
      </div>

      <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 mt-6">
        <div className="flex items-center justify-center gap-0.5 py-2 overflow-x-auto">
          {az.map(l => (
            <button key={l} disabled={!grouped[l]} onClick={() => refs.current[l]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${grouped[l] ? 'text-blue-600 hover:bg-blue-50 cursor-pointer' : 'text-slate-300 cursor-default'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {letters.map(letter => (
          <div key={letter} ref={el => { refs.current[letter] = el }} className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg">{letter}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid gap-3">
              {grouped[letter].map(item => (
                <div key={item.term} className="bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-blue-600">{item.term}</span>
                    <span className="text-sm text-slate-500">({item.termKo})</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      item.category === '운송' ? 'bg-blue-100 text-blue-600' :
                      item.category === '통관' ? 'bg-amber-100 text-amber-600' :
                      item.category === '금융' ? 'bg-emerald-100 text-emerald-600' :
                      item.category === '기술' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                    }`}>{item.category}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{item.definition}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {letters.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
      <p className="mt-8 text-center text-sm text-slate-500">총 <strong className="text-slate-700">{filtered.length}</strong>개 용어</p>
    </ToolLayout>
  )
}
