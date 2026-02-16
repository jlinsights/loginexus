'use client'

import React, { useState, useMemo } from 'react'
import ToolLayout from '../ToolLayout'
import { Search, Filter } from 'lucide-react'

/* ───── HS Code data (abbreviated top-level sections + popular items) ───── */

type HSItem = {
  code: string
  nameKo: string
  nameEn: string
  duty: string
  vat: string
  section: string
  note?: string
}

const HS_DATA: HSItem[] = [
  // Section I: 살아있는 동물 · 동물성 생산품
  { code: '0201', nameKo: '쇠고기 (냉장)', nameEn: 'Bovine Meat, Fresh/Chilled', duty: '40%', vat: '10%', section: '동물성 생산품' },
  { code: '0301', nameKo: '활어 (살아있는 물고기)', nameEn: 'Live Fish', duty: '10%', vat: '10%', section: '동물성 생산품' },
  { code: '0401', nameKo: '우유 및 크림', nameEn: 'Milk and Cream', duty: '36%', vat: '면제', section: '동물성 생산품' },
  // Section II: 식물성 생산품
  { code: '0901', nameKo: '커피 (원두/볶은 것)', nameEn: 'Coffee', duty: '2%', vat: '10%', section: '식물성 생산품' },
  { code: '1001', nameKo: '밀과 메슬린', nameEn: 'Wheat and Meslin', duty: '1.8%', vat: '면제', section: '식물성 생산품' },
  { code: '1006', nameKo: '쌀', nameEn: 'Rice', duty: '513%', vat: '면제', section: '식물성 생산품', note: 'TRQ 물량 5% 적용 가능' },
  // Section IV: 조제 식료품
  { code: '2203', nameKo: '맥주', nameEn: 'Beer', duty: '30%', vat: '10%', section: '조제 식료품', note: '주세 별도 부과' },
  { code: '2204', nameKo: '포도주 (와인)', nameEn: 'Wine of Fresh Grapes', duty: '15%', vat: '10%', section: '조제 식료품' },
  // Section V: 광물성 생산품
  { code: '2709', nameKo: '원유 (석유)', nameEn: 'Crude Petroleum Oils', duty: '3%', vat: '10%', section: '광물성 생산품' },
  { code: '2710', nameKo: '석유 제품 (경유/휘발유)', nameEn: 'Petroleum Oils', duty: '3%', vat: '10%', section: '광물성 생산품' },
  // Section VI: 화학
  { code: '2901', nameKo: '비순환 탄화수소', nameEn: 'Acyclic Hydrocarbons', duty: '5%', vat: '10%', section: '화학 공업품' },
  { code: '3004', nameKo: '의약품 (조제)', nameEn: 'Medicaments, Put Up', duty: '8%', vat: '면제', section: '화학 공업품' },
  { code: '3304', nameKo: '화장품', nameEn: 'Beauty/Makeup Preparations', duty: '6.5%', vat: '10%', section: '화학 공업품' },
  // Section VII: 플라스틱
  { code: '3901', nameKo: '폴리에틸렌 (PE)', nameEn: 'Polymers of Ethylene', duty: '6.5%', vat: '10%', section: '플라스틱·고무' },
  { code: '4011', nameKo: '고무 타이어 (신품)', nameEn: 'New Rubber Tires', duty: '8%', vat: '10%', section: '플라스틱·고무' },
  // Section XI: 섬유
  { code: '5208', nameKo: '면직물 (면 85% 이상)', nameEn: 'Woven Fabrics of Cotton', duty: '10%', vat: '10%', section: '섬유·의류' },
  { code: '6109', nameKo: 'T-셔츠 (편직물)', nameEn: 'T-shirts, Knitted', duty: '13%', vat: '10%', section: '섬유·의류' },
  { code: '6403', nameKo: '가죽 신발', nameEn: 'Footwear, Leather Uppers', duty: '13%', vat: '10%', section: '섬유·의류' },
  // Section XV: 비금속
  { code: '7208', nameKo: '열간 압연 강판', nameEn: 'Hot-Rolled Steel', duty: '0%', vat: '10%', section: '비금속·철강' },
  { code: '7601', nameKo: '알루미늄 괴', nameEn: 'Unwrought Aluminium', duty: '1%', vat: '10%', section: '비금속·철강' },
  // Section XVI: 기계
  { code: '8471', nameKo: '컴퓨터 (노트북/데스크탑)', nameEn: 'Automatic Data Processing Machines', duty: '0%', vat: '10%', section: '기계·전기' },
  { code: '8517', nameKo: '스마트폰 / 전화기', nameEn: 'Telephones incl. Smartphones', duty: '0%', vat: '10%', section: '기계·전기' },
  { code: '8528', nameKo: 'TV / 모니터', nameEn: 'Monitors and Projectors', duty: '8%', vat: '10%', section: '기계·전기' },
  { code: '8541', nameKo: '반도체 (디바이스)', nameEn: 'Semiconductor Devices', duty: '0%', vat: '10%', section: '기계·전기' },
  { code: '8542', nameKo: '집적 회로 (IC)', nameEn: 'Electronic Integrated Circuits', duty: '0%', vat: '10%', section: '기계·전기' },
  // Section XVII: 운송
  { code: '8703', nameKo: '승용 자동차', nameEn: 'Motor Cars, Passenger', duty: '8%', vat: '10%', section: '운송기기' },
  { code: '8711', nameKo: '오토바이', nameEn: 'Motorcycles', duty: '8%', vat: '10%', section: '운송기기' },
  // Section XVIII: 광학/의료
  { code: '9018', nameKo: '의료 기기', nameEn: 'Medical Instruments', duty: '0%', vat: '면제', section: '광학·의료' },
  { code: '9028', nameKo: '계측 장비', nameEn: 'Gas/Liquid Supply Meters', duty: '8%', vat: '10%', section: '광학·의료' },
  // Section XX: 잡품
  { code: '9401', nameKo: '좌석 (의자/소파)', nameEn: 'Seats', duty: '8%', vat: '10%', section: '잡품·가구' },
  { code: '9503', nameKo: '완구 / 장난감', nameEn: 'Toys', duty: '0%', vat: '10%', section: '잡품·가구' },
  { code: '9504', nameKo: '비디오 게임 기기', nameEn: 'Video Game Consoles', duty: '0%', vat: '10%', section: '잡품·가구' },
]

const SECTIONS = Array.from(new Set(HS_DATA.map(h => h.section)))

/* ───── component ───── */

export default function HSCodesPage() {
  const [query, setQuery] = useState('')
  const [section, setSection] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let items = HS_DATA
    if (section) items = items.filter(h => h.section === section)
    if (query.trim()) {
      const q = query.toLowerCase().trim()
      items = items.filter(
        h =>
          h.code.includes(q) ||
          h.nameKo.toLowerCase().includes(q) ||
          h.nameEn.toLowerCase().includes(q)
      )
    }
    return items
  }, [query, section])

  return (
    <ToolLayout title="HS Code 조회" description="품목명 또는 HS 코드로 검색하면 관세율, 부가세, 특이사항을 확인할 수 있습니다">
      {/* ─── Search ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 -mt-20 relative z-10">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="품목명(예: 스마트폰) 또는 HS 코드(예: 8517) 검색..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Section Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSection(null)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              !section ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter size={12} /> 전체
          </button>
          {SECTIONS.map(s => (
            <button
              key={s}
              onClick={() => setSection(section === s ? null : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                section === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Results Table ─── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">{filtered.length}건 검색 결과</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-5 py-3 font-medium">HS Code</th>
                <th className="px-5 py-3 font-medium">품목 (한)</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">품목 (영)</th>
                <th className="px-5 py-3 font-medium">관세</th>
                <th className="px-5 py-3 font-medium">부가세</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(h => (
                <tr key={h.code} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-mono font-semibold text-blue-600">{h.code}</span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{h.nameKo}</td>
                  <td className="px-5 py-3.5 text-slate-500 hidden md:table-cell">{h.nameEn}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-semibold ${
                      h.duty === '0%' ? 'text-emerald-600' : parseFloat(h.duty) >= 30 ? 'text-red-600' : 'text-slate-900'
                    }`}>
                      {h.duty}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{h.vat}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs hidden lg:table-cell">{h.note || '—'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    검색 결과가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          ※ 본 자료는 참고용이며 실제 관세율은 관세청 확인이 필요합니다. 정확한 통관 컨설팅은{' '}
          <a href="/register" className="text-blue-600 underline">LogiNexus 가입</a> 후 이용하세요.
        </p>
      </div>
    </ToolLayout>
  )
}
