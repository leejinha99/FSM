import { useState, useEffect, useMemo, useRef } from 'react'
import dayjs from 'dayjs'
import { api } from '../api/sheetsApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white'
const MOVE_TYPES = ['입고', '이동', '불량교체']
const TYPE_BADGE = {
  '입고':   'bg-green-100 text-green-700',
  '이동':   'bg-blue-100 text-blue-700',
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

function StockMoveModal({ myWarehouseId, allParts, warehouses, onSave, onClose }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    partId: '',
    type: '입고',
    fromWarehouseId: '',
    toWarehouseId: myWarehouseId || '',
    qty: '',
    memo: '',
  })
  const [partSearch, setPartSearch] = useState('')
  const [showPartDrop, setShowPartDrop] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dropRef = useRef(null)

  function update(patch) { setForm(f => ({ ...f, ...patch })) }

  function handleTypeChange(t) {
    if (t === '입고') {
      update({ type: t, toWarehouseId: myWarehouseId, fromWarehouseId: '' })
    } else if (t === '불량교체') {
      update({ type: t, fromWarehouseId: myWarehouseId, toWarehouseId: myWarehouseId })
    } else {
      update({ type: t, fromWarehouseId: myWarehouseId, toWarehouseId: '' })
    }
  }

  function selectPart(part) {
    setPartSearch(part.name)
    update({ partId: part.partId })
    setShowPartDrop(false)
  }

  const filteredParts = useMemo(() => {
    if (!partSearch) return allParts
    const q = partSearch.toLowerCase()
    return allParts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.spec && p.spec.toLowerCase().includes(q))
    )
  }, [partSearch, allParts])

  const selectedPart = allParts.find(p => p.partId === form.partId)
  const myWarehouse = warehouses.find(w => w.warehouseId === myWarehouseId)
  const otherWarehouses = warehouses.filter(w => w.warehouseId !== myWarehouseId)

  const effectiveFrom = form.type === '입고' ? form.fromWarehouseId : myWarehouseId
  const effectiveTo   = form.type === '불량교체' ? myWarehouseId
    : form.type === '입고' ? myWarehouseId
    : form.toWarehouseId

  async function handleSubmit() {
    if (!form.partId)                       return setError('부품을 선택해주세요.')
    if (form.type === '입고' && !effectiveFrom) return setError('출발창고를 선택해주세요.')
    if (form.type === '이동' && !effectiveTo)   return setError('도착창고를 선택해주세요.')
    if (!form.qty || Number(form.qty) <= 0) return setError('수량을 입력해주세요.')
    setSaving(true)
    setError('')
    try {
      await api.saveStockMove({
        date: form.date,
        partId: form.partId,
        type: form.type,
        fromWarehouseId: effectiveFrom,
        toWarehouseId:   effectiveTo,
        qty: Number(form.qty),
        memo: form.memo,
        techId: user.techId,
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
          {/* 날짜 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">날짜</label>
            <input type="date" value={form.date} onChange={e => update({ date: e.target.value })} className={INPUT} />
          </div>

          {/* 부품명 검색 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">부품명 <span className="text-red-500">*</span></label>
            <div className="relative" ref={dropRef}>
              <input
                value={partSearch}
                onChange={e => {
                  setPartSearch(e.target.value)
                  setShowPartDrop(true)
                  if (!e.target.value) update({ partId: '' })
                }}
                onFocus={() => setShowPartDrop(true)}
                onBlur={() => setTimeout(() => setShowPartDrop(false), 200)}
                className={INPUT}
                placeholder="부품명 검색..."
                autoComplete="off"
              />
              {showPartDrop && filteredParts.length > 0 && (
                <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-44 overflow-y-auto">
                  {filteredParts.map(p => (
                    <button
                      key={p.partId}
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onPointerDown={e => e.preventDefault()}
                      onClick={() => selectPart(p)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition border-b border-gray-50 last:border-0"
                    >
                      <span className="font-medium text-gray-800">{p.name}</span>
                      {p.spec && <span className="ml-2 text-xs text-gray-400">{p.spec}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 규격 + 수량 */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">규격</label>
              <div className="border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                {selectedPart?.spec || selectedPart?.unit || '-'}
              </div>
            </div>
            <div className="flex-1">
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
          </div>

          {/* 구분 */}
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

          {/* 불량교체: 안내 문구만 표시 */}
          {form.type === '불량교체' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-red-700 font-medium">본사에서 받는 불량 교체 부품</p>
              <p className="text-xs text-red-600 mt-0.5">출발·도착 창고 모두 내 차량({myWarehouse?.name || '내 차량'})으로 자동 설정됩니다.</p>
            </div>
          )}

          {/* 입고/이동: 창고 선택 */}
          {form.type !== '불량교체' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">출발창고 <span className="text-red-500">*</span></label>
                {form.type !== '입고' ? (
                  <div className="border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                    {myWarehouse?.name || '내 차량'}
                  </div>
                ) : (
                  <select value={form.fromWarehouseId} onChange={e => update({ fromWarehouseId: e.target.value })} className={INPUT}>
                    <option value="">창고 선택</option>
                    {otherWarehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">도착창고 <span className="text-red-500">*</span></label>
                {form.type === '입고' ? (
                  <div className="border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                    {myWarehouse?.name || '내 차량'}
                  </div>
                ) : (
                  <select value={form.toWarehouseId} onChange={e => update({ toWarehouseId: e.target.value })} className={INPUT}>
                    <option value="">창고 선택</option>
                    {otherWarehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)}
                  </select>
                )}
              </div>
            </>
          )}

          {/* 메모 */}
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

export default function TechStock() {
  const { user } = useAuth()
  const [tab, setTab] = useState('stock')
  const [parts, setParts] = useState([])
  const [allPartsInfo, setAllPartsInfo] = useState([])
  const [moves, setMoves] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [myWarehouseId, setMyWarehouseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [movesLoading, setMovesLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const currentYear = dayjs().format('YYYY')
  const [filterYear, setFilterYear]   = useState(currentYear)
  const [filterMonth, setFilterMonth] = useState(String(dayjs().month() + 1))
  const [stockSort, setStockSort]     = useState('registered-desc')
  const [moveSort, setMoveSort]       = useState('date-desc')

  async function loadStock() {
    setLoading(true)
    try {
      const [partsData, warehousesData, allPartsData] = await Promise.all([
        api.getMyParts(user.techId),
        api.getWarehouses(),
        api.getAllPartsInfo(),
      ])
      setParts(partsData.map((p, i) => ({ ...p, _idx: i })))
      setAllPartsInfo(allPartsData)
      setWarehouses(warehousesData)
      const myWH = warehousesData.find(w => w.type === '기사' && w.techId === user.techId)
      if (myWH) setMyWarehouseId(myWH.warehouseId)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMoves() {
    setMovesLoading(true)
    try {
      const data = await api.getStockMoves({
        techId: user.techId,
        year: filterYear,
        month: filterMonth ? Number(filterMonth) : undefined,
      })
      setMoves(data)
    } catch (e) {
      console.error(e)
    } finally {
      setMovesLoading(false)
    }
  }

  useEffect(() => { loadStock() }, [user.techId])

  useEffect(() => {
    if (tab === 'history') loadMoves()
  }, [tab, filterYear, filterMonth])

  const stockedParts = useMemo(() => {
    const filtered = parts.filter(p => p.currentStock > 0)
    return [...filtered].sort((a, b) => {
      if (stockSort === 'registered-desc') return (b._idx ?? 0) - (a._idx ?? 0)
      if (stockSort === 'name-asc')  return a.name.localeCompare(b.name, 'ko')
      if (stockSort === 'name-desc') return b.name.localeCompare(a.name, 'ko')
      if (stockSort === 'qty-desc')  return b.currentStock - a.currentStock
      if (stockSort === 'qty-asc')   return a.currentStock - b.currentStock
      return 0
    })
  }, [parts, stockSort])

  const sortedMoves = useMemo(() => {
    return [...moves].sort((a, b) => {
      if (moveSort === 'name-asc')  return a.partName.localeCompare(b.partName, 'ko')
      if (moveSort === 'name-desc') return b.partName.localeCompare(a.partName, 'ko')
      if (moveSort === 'qty-desc')  return b.qty - a.qty
      if (moveSort === 'qty-asc')   return a.qty - b.qty
      return b.date.localeCompare(a.date)
    })
  }, [moves, moveSort])
  const lowStockCount = stockedParts.filter(p => p.currentStock < p.safetyStock).length

  const years = []
  for (let y = 2024; y <= 2030; y++) years.push(String(y))
  const months = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}월` }))

  function handleSaved() {
    setShowModal(false)
    loadStock()
    if (tab === 'history') loadMoves()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white border-b border-gray-200 px-4 pt-12 md:pt-4 pb-0 sticky top-0 z-30">
        <div className="flex items-center justify-between pb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">내 재고</h1>
            {lowStockCount > 0 && (
              <p className="text-xs text-amber-600 mt-0.5">재고 부족 {lowStockCount}종</p>
            )}
          </div>
        </div>

        {tab === 'stock' && (
          <div className="flex gap-2 pb-2">
            <select
              value={stockSort}
              onChange={e => setStockSort(e.target.value)}
              className="ml-auto border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="registered-desc">최신 등록순</option>
              <option value="name-asc">ㄱㄴㄷ 오름차순</option>
              <option value="name-desc">ㄱㄴㄷ 내림차순</option>
              <option value="qty-desc">수량 많은 순</option>
              <option value="qty-asc">수량 적은 순</option>
            </select>
          </div>
        )}
        {tab === 'history' && (
          <div className="flex gap-2 pb-2 flex-wrap">
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="">전체</option>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select
              value={moveSort}
              onChange={e => setMoveSort(e.target.value)}
              className="ml-auto border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="date-desc">최신순</option>
              <option value="name-asc">ㄱㄴㄷ 오름차순</option>
              <option value="name-desc">ㄱㄴㄷ 내림차순</option>
              <option value="qty-desc">수량 많은 순</option>
              <option value="qty-asc">수량 적은 순</option>
            </select>
          </div>
        )}

        <div className="flex -mx-4 px-4">
          {[['stock', '내 재고'], ['history', '이동 내역']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {loading ? <Spinner /> : error ? (
        <div className="p-4 text-sm text-red-500">{error}</div>
      ) : tab === 'stock' ? (
        stockedParts.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <p className="text-sm">차량에 보유 중인 재고가 없습니다</p>
          </div>
        ) : (
          <div className="px-4 py-2 space-y-2">
            {stockedParts.map(p => {
              const isLow = p.currentStock < p.safetyStock
              const ratio = p.safetyStock > 0 ? Math.min(1, p.currentStock / (p.safetyStock * 2)) : 1
              return (
                <div
                  key={p.partId}
                  className={`bg-white rounded-xl px-4 py-3.5 shadow-sm border ${isLow ? 'border-amber-200' : 'border-gray-100'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">안전재고 {p.safetyStock}{p.unit}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-lg font-bold ${isLow ? 'text-amber-500' : 'text-gray-800'}`}>
                        {p.currentStock}
                        <span className="text-sm font-normal text-gray-400 ml-0.5">{p.unit}</span>
                      </p>
                      {isLow && <p className="text-xs text-amber-500">부족</p>}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-amber-400' : 'bg-green-400'}`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
          {movesLoading ? <Spinner /> : (
            <div className="px-4 py-2 space-y-2">
              {sortedMoves.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-gray-400">
                  <p className="text-sm">이동 내역이 없습니다</p>
                </div>
              ) : sortedMoves.map(m => (
                <div key={m.logId} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 text-sm">{m.partName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TYPE_BADGE[m.type] || 'bg-gray-100 text-gray-600'}`}>
                          {m.type}
                        </span>
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
              ))}
            </div>
          )}
        </>
      )}

      {!showModal && (
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-20 right-4 bg-blue-600 text-white rounded-full shadow-lg px-5 py-3 flex items-center gap-1.5 text-sm font-semibold active:bg-blue-700 transition z-30"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          재고 등록
        </button>
      )}

      {showModal && (
        <StockMoveModal
          myWarehouseId={myWarehouseId}
          allParts={allPartsInfo}
          warehouses={warehouses}
          onSave={handleSaved}
          onClose={() => setShowModal(false)}
        />
      )}

    </div>
  )
}
