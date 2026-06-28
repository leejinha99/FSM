import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { api } from '../../api/sheetsApi.js'

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white'
const MOVE_TYPES = ['입고', '이동', '불량교체']
const TYPE_BADGE = {
  '입고':     'bg-green-100 text-green-700',
  '이동':     'bg-blue-100 text-blue-700',
  '불량교체': 'bg-red-100 text-red-700',
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <svg className="animate-spin w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  )
}

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
      <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

function StockMoveModal({ techs, warehouses, parts, onSave, onClose }) {
  const [selectedTechId, setSelectedTechId] = useState('')
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    partId: '',
    type: '입고',
    fromWarehouseId: '',
    toWarehouseId: '',
    qty: '',
    memo: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(patch) { setForm(f => ({ ...f, ...patch })) }

  const techWarehouse = useMemo(
    () => warehouses.find(w => w.type === '기사' && w.techId === selectedTechId),
    [warehouses, selectedTechId]
  )

  function handleTypeChange(t) {
    if (t === '입고') {
      update({ type: t, toWarehouseId: techWarehouse?.warehouseId || '', fromWarehouseId: '' })
    } else {
      update({ type: t, fromWarehouseId: techWarehouse?.warehouseId || '', toWarehouseId: '' })
    }
  }

  function handleTechChange(techId) {
    setSelectedTechId(techId)
    const wh = warehouses.find(w => w.type === '기사' && w.techId === techId)
    if (form.type === '입고') {
      update({ toWarehouseId: wh?.warehouseId || '', fromWarehouseId: '' })
    } else {
      update({ fromWarehouseId: wh?.warehouseId || '', toWarehouseId: '' })
    }
  }

  const effectiveFrom = form.type === '입고' ? form.fromWarehouseId : (techWarehouse?.warehouseId || form.fromWarehouseId)
  const effectiveTo   = form.type === '입고' ? (techWarehouse?.warehouseId || form.toWarehouseId) : form.toWarehouseId

  const otherWarehouses = warehouses.filter(w => w.warehouseId !== techWarehouse?.warehouseId)

  async function handleSubmit() {
    if (!form.partId)                        return setError('부품을 선택해주세요.')
    if (!effectiveFrom)                      return setError('출발창고를 선택해주세요.')
    if (!effectiveTo)                        return setError('도착창고를 선택해주세요.')
    if (!form.qty || Number(form.qty) <= 0)  return setError('수량을 입력해주세요.')
    setSaving(true)
    setError('')
    try {
      await api.saveStockMove({
        date: form.date,
        partId: form.partId,
        type: form.type,
        fromWarehouseId: effectiveFrom,
        toWarehouseId: effectiveTo,
        qty: Number(form.qty),
        memo: form.memo,
      })
      onSave()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">재고 이동 등록</h2>
          <CloseBtn onClick={onClose} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">대상 기사</label>
            <select value={selectedTechId} onChange={e => handleTechChange(e.target.value)} className={INPUT}>
              <option value="">기사 선택 (없으면 창고 직접 선택)</option>
              {techs.map(t => <option key={t.techId} value={t.techId}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">날짜</label>
            <input type="date" value={form.date} onChange={e => update({ date: e.target.value })} className={INPUT} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">부품명 <span className="text-red-500">*</span></label>
            <select value={form.partId} onChange={e => update({ partId: e.target.value })} className={INPUT}>
              <option value="">부품 선택</option>
              {parts.map(p => <option key={p.partId} value={p.partId}>{p.name} ({p.unit})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">구분 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {MOVE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition
                    ${form.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">출발창고 <span className="text-red-500">*</span></label>
            {selectedTechId && form.type !== '입고' ? (
              <div className="border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                {techWarehouse?.name || '기사 차량'}
              </div>
            ) : (
              <select value={form.fromWarehouseId} onChange={e => update({ fromWarehouseId: e.target.value })} className={INPUT}>
                <option value="">창고 선택</option>
                {(selectedTechId ? otherWarehouses : warehouses).map(w => (
                  <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">도착창고 <span className="text-red-500">*</span></label>
            {selectedTechId && form.type === '입고' ? (
              <div className="border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                {techWarehouse?.name || '기사 차량'}
              </div>
            ) : (
              <select value={form.toWarehouseId} onChange={e => update({ toWarehouseId: e.target.value })} className={INPUT}>
                <option value="">창고 선택</option>
                {(selectedTechId ? otherWarehouses : warehouses).map(w => (
                  <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">수량 <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={form.qty}
              onChange={e => update({ qty: e.target.value })}
              className={INPUT}
              placeholder="0"
              min="1"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
            <input
              type="text"
              value={form.memo}
              onChange={e => update({ memo: e.target.value })}
              className={INPUT}
              placeholder="메모 (선택사항)"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-5 w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 active:bg-blue-700 transition"
        >
          {saving ? '저장 중...' : '등록'}
        </button>
      </div>
    </div>
  )
}

export default function AdminStock() {
  const [moves, setMoves]         = useState([])
  const [techs, setTechs]         = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [parts, setParts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)

  const currentYear = dayjs().format('YYYY')
  const [filterWarehouseId, setFilterWarehouseId] = useState('')
  const [filterYear, setFilterYear]               = useState(currentYear)
  const [filterMonth, setFilterMonth]             = useState(String(dayjs().month() + 1))

  async function loadMeta() {
    try {
      const [t, w] = await Promise.all([api.getAllTechs(), api.getWarehouses()])
      const activeTechs = t.filter(x => x.role === '기사' && x.active)
      setTechs(activeTechs)
      setWarehouses(w)
      // 부품 목록 — 임의 기사의 parts로 대체 (API에 getAllParts 없으므로)
      if (activeTechs.length > 0) {
        const p = await api.getMyParts(activeTechs[0].techId)
        setParts(p)
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function loadMoves() {
    setLoading(true)
    try {
      const data = await api.getStockMoves({
        warehouseId: filterWarehouseId || undefined,
        year: filterYear,
        month: filterMonth ? Number(filterMonth) : undefined,
      })
      setMoves(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMeta() }, [])
  useEffect(() => {
    if (warehouses.length > 0) loadMoves()
  }, [warehouses, filterWarehouseId, filterYear, filterMonth])

  const techMap = useMemo(
    () => Object.fromEntries(techs.map(t => [t.techId, t.name])),
    [techs]
  )

  const years = []
  for (let y = 2024; y <= parseInt(currentYear) + 1; y++) years.push(String(y))

  function getTechName(move) {
    const wh = warehouses.find(w => w.warehouseId === move.fromWarehouseId || w.warehouseId === move.toWarehouseId)
    if (!wh) return ''
    const techWH = warehouses.find(w => (w.warehouseId === move.fromWarehouseId || w.warehouseId === move.toWarehouseId) && w.type === '기사')
    return techWH ? (techMap[techWH.techId] || '') : ''
  }

  return (
    <div>
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex gap-2 mb-3">
          <select
            value={filterWarehouseId}
            onChange={e => setFilterWarehouseId(e.target.value)}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="">전체 창고</option>
            {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
          </select>
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setFilterMonth('') }}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
          >
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="">전체 월</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="ml-auto shrink-0 flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full active:bg-blue-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            등록
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* 모바일: 카드 목록 */}
          <div className="md:hidden px-4 py-3 space-y-2">
          {moves.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <p className="text-sm">재고 이동 내역이 없습니다</p>
            </div>
          ) : moves.map(m => {
            const techName = getTechName(m)
            return (
              <div key={m.logId} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-800 text-sm">{m.partName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_BADGE[m.type] || 'bg-gray-100 text-gray-600'}`}>
                        {m.type}
                      </span>
                      {techName && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
                          {techName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{m.fromWarehouseName} → {m.toWarehouseName}</p>
                    {m.memo && <p className="text-xs text-gray-400 mt-0.5 italic">{m.memo}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-800 text-sm">{m.qty}{m.partUnit}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{m.date}</p>
                  </div>
                </div>
              </div>
            )
          })}
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block px-6 py-4">
            {moves.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <p className="text-sm">재고 이동 내역이 없습니다</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">날짜</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">부품명</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">구분</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">기사</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">출발창고</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">도착창고</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">수량</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moves.map(m => {
                      const techName = getTechName(m)
                      return (
                        <tr key={m.logId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{m.date}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.partName}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGE[m.type] || 'bg-gray-100 text-gray-600'}`}>
                              {m.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{techName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{m.fromWarehouseName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{m.toWarehouseName}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-800">{m.qty}{m.partUnit}</td>
                          <td className="px-4 py-3 text-sm text-gray-400 italic">{m.memo || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showModal && (
        <StockMoveModal
          techs={techs}
          warehouses={warehouses}
          parts={parts}
          onSave={() => { setShowModal(false); loadMoves() }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
