import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { api } from '../api/sheetsApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useNotification } from '../context/NotificationContext.jsx'

const STATUS_TABS = ['전체', '접수', '처리중', '수리완료', '발행대기', '완료']

const STATUS_BADGE = {
  '접수':   'bg-yellow-100 text-yellow-700',
  '처리중': 'bg-orange-100 text-orange-700',
  '수리완료':'bg-blue-100 text-blue-700',
  '발행대기':'bg-purple-100 text-purple-700',
  '완료':   'bg-green-100 text-green-600',
}

const CONTRACT_BADGE = {
  '계약':   'bg-blue-100 text-blue-700',
  '미계약': 'bg-gray-100 text-gray-500',
}

const NEXT_STATUS = { '접수': '처리중', '처리중': '수리완료' }

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white'

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

// ── 결제 처리 모달 ──────────────────────────────────────────────────────────

function FeeRow({ label, unitPrice, setUnitPrice, qty, setQty }) {
  const total = (Number(unitPrice) || 0) * (Number(qty) || 0)
  return (
    <div className="border border-gray-100 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">비용</label>
          <input
            type="number"
            value={unitPrice}
            onChange={e => setUnitPrice(e.target.value)}
            className={INPUT}
            placeholder="0"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">개수</label>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className={INPUT}
            placeholder="0"
            min="0"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-0.5 block">합계</label>
          <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700 font-medium">
            {total.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

function PartSearchRow({ idx, row, allParts, isContracted, onChange, onRemove }) {
  const [searchText, setSearchText] = useState(row.partName || '')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const filteredParts = useMemo(() => {
    if (!searchText) return allParts
    const q = searchText.toLowerCase()
    return allParts.filter(p => p.name.toLowerCase().includes(q))
  }, [searchText, allParts])

  const selectedPart = allParts.find(p => p.partId === row.partId)
  const specOptions = selectedPart?.specs?.length > 0 ? selectedPart.specs : []
  const total = (Number(row.unitPrice) || 0) * (Number(row.qty) || 0)

  function selectPart(part) {
    setSearchText(part.name)
    setShowDropdown(false)
    const firstSpec = part.specs?.[0]
    const price = isContracted
      ? (firstSpec?.contractPrice ?? part.contractPrice ?? 0)
      : (firstSpec?.nonContractPrice ?? part.nonContractPrice ?? 0)
    const qty = row.qty || 1
    onChange(idx, {
      partId: part.partId,
      partName: part.name,
      spec: firstSpec?.spec || part.spec || '',
      unitPrice: price,
      qty,
      total: price * qty,
      isFree: false,
      _userEdited: false,
    })
  }

  function handleSpecChange(specValue) {
    const specData = selectedPart?.specs?.find(s => s.spec === specValue)
    const price = specData
      ? (isContracted ? (specData.contractPrice || 0) : (specData.nonContractPrice || 0))
      : (isContracted ? (selectedPart?.contractPrice || 0) : (selectedPart?.nonContractPrice || 0))
    onChange(idx, { ...row, spec: specValue, unitPrice: price, total: price * (Number(row.qty) || 1), _userEdited: false })
  }

  function handlePriceChange(val) {
    const price = Number(val) || 0
    onChange(idx, { ...row, unitPrice: price, total: price * (Number(row.qty) || 1), _userEdited: true })
  }

  function handleQtyChange(val) {
    const qty = Number(val) || 0
    onChange(idx, { ...row, qty, total: row.isFree ? 0 : (Number(row.unitPrice) || 0) * qty })
  }

  function handleFreeToggle() {
    if (row.isFree) {
      const specData = selectedPart?.specs?.find(s => s.spec === row.spec)
      const price = specData
        ? (isContracted ? (specData.contractPrice || 0) : (specData.nonContractPrice || 0))
        : selectedPart
          ? (isContracted ? (selectedPart.contractPrice || 0) : (selectedPart.nonContractPrice || 0))
          : 0
      onChange(idx, { ...row, isFree: false, unitPrice: price, total: price * (Number(row.qty) || 1), _userEdited: false })
    } else {
      onChange(idx, { ...row, isFree: true, unitPrice: 0, total: 0 })
    }
  }

  return (
    <div className="relative border border-gray-200 rounded-xl p-3 space-y-2">
      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center z-10 transition"
      >
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-800 mb-4">작성하신 부품을 삭제하시겠습니까?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">취소</button>
              <button onClick={() => { setShowDeleteConfirm(false); onRemove(idx) }} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: 부품명 + 규격 */}
      <div className="flex gap-2">
        <div className="flex-[3] relative">
          <label className="text-xs text-gray-500 mb-0.5 block">부품명</label>
          <input
            value={searchText}
            onChange={e => {
              setSearchText(e.target.value)
              setShowDropdown(true)
              if (!e.target.value) onChange(idx, { ...row, partId: '', partName: '', spec: '', unitPrice: 0, total: 0 })
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className={INPUT}
            placeholder="부품명 검색..."
            autoComplete="off"
          />
          {showDropdown && filteredParts.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-40 overflow-y-auto">
              {filteredParts.map(p => (
                <button
                  key={p.partId}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onPointerDown={e => e.preventDefault()}
                  onClick={() => selectPart(p)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-800">{p.name}</span>
                  {p.spec && <span className="ml-2 text-xs text-gray-400">{p.spec}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-[2]">
          <label className="text-xs text-gray-500 mb-0.5 block">규격</label>
          {specOptions.length > 1 ? (
            <select
              value={row.spec}
              onChange={e => handleSpecChange(e.target.value)}
              className={INPUT}
            >
              {specOptions.map(s => <option key={s.spec} value={s.spec}>{s.spec}</option>)}
            </select>
          ) : (
            <div className="border border-gray-100 rounded-xl px-2.5 py-2.5 text-xs bg-gray-50 text-gray-700 min-h-[42px] flex items-center">
              {row.spec || '-'}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: 비용 + 수량 */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-0.5 flex items-center gap-1">
            비용
            {row.partId && !row._userEdited && !row.isFree && <span className="text-blue-400">(자동)</span>}
            <button
              type="button"
              onClick={handleFreeToggle}
              className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium border transition
                ${row.isFree
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-400 border-gray-300 hover:border-green-400 hover:text-green-500'}`}
            >
              무상
            </button>
          </label>
          <input
            type="number"
            value={row.unitPrice}
            onChange={e => handlePriceChange(e.target.value)}
            className={`${INPUT} ${row.isFree ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
            placeholder="0"
            min="0"
            disabled={row.isFree}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-0.5 block">수량</label>
          <input
            type="number"
            value={row.qty}
            onChange={e => handleQtyChange(e.target.value)}
            className={INPUT}
            placeholder="0"
            min="1"
          />
        </div>
      </div>

      {/* Row 3: 합계 */}
      <div className="flex items-center justify-between py-1 border-t border-gray-100">
        <span className="text-xs text-gray-500">합계</span>
        <div className="flex items-center gap-1.5">
          {row.isFree && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">무상</span>}
          <span className={`text-sm font-bold ${row.isFree ? 'text-green-600' : 'text-gray-800'}`}>
            {total.toLocaleString()}원
          </span>
        </div>
      </div>
    </div>
  )
}

function PaymentModal({ ticket, onSave, onClose }) {
  const isContracted = ticket.contractType === '계약' || ticket.contractType === '유지관리'
  const [repairNote, setRepairNote] = useState(ticket.note || '')
  const [hasTravelFee, setHasTravelFee] = useState(false)
  const [travelPrice, setTravelPrice] = useState('')
  const [travelQty, setTravelQty]     = useState('')
  const [laborPrice, setLaborPrice]   = useState('')
  const [laborQty, setLaborQty]       = useState('')
  const [workPrice, setWorkPrice]     = useState('')
  const [workQty, setWorkQty]         = useState('')
  const [movePrice, setMovePrice]     = useState('')
  const [moveQty, setMoveQty]         = useState('')
  const [showPayConfirm, setShowPayConfirm] = useState(false)
  const [partRows, setPartRows] = useState([{ partId: '', partName: '', spec: '', unitPrice: 0, qty: 1, total: 0, isFree: false, _userEdited: false }])
  const [allParts, setAllParts] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('카드')
  const [bizNumber, setBizNumber]   = useState(ticket.bizNumber || '')
  const [invoiceDate, setInvoiceDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [email, setEmail]           = useState(ticket.email || '')
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    api.getAllPartsInfo().then(data => setAllParts(data)).catch(() => {})
  }, [])

  const travelTotal = (Number(travelPrice) || 0) * (Number(travelQty) || 0)
  const laborTotal = (Number(laborPrice) || 0) * (Number(laborQty) || 0)
  const workTotal  = (Number(workPrice) || 0)  * (Number(workQty) || 0)
  const moveTotal  = (Number(movePrice) || 0)  * (Number(moveQty) || 0)
  const partsTotal = partRows.reduce((s, r) => s + (Number(r.total) || 0), 0)
  const grandTotal = travelTotal + laborTotal + workTotal + moveTotal + partsTotal
  const vatTotal   = Math.round(grandTotal * 1.1)

  function updatePartRow(idx, patch) {
    setPartRows(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function removePartRow(idx) {
    setPartRows(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    if (!paymentMethod) return setError('결제 방법을 선택해주세요.')
    setSaving(true)
    setError('')
    try {
      await api.saveASPayment({
        asId: ticket.asId,
        schoolId: ticket.schoolId,
        paymentMethod,
        paymentInfo: {
          repairNote,
          hasTravelFee,
          travelPrice: Number(travelPrice), travelQty: Number(travelQty), travelTotal,
          laborPrice: Number(laborPrice), laborQty: Number(laborQty), laborTotal,
          workPrice:  Number(workPrice),  workQty:  Number(workQty),  workTotal,
          movePrice:  Number(movePrice),  moveQty:  Number(moveQty),  moveTotal,
          parts: partRows.filter(r => r.partId),
          total: grandTotal,
          vatTotal,
          bizNumber, invoiceDate, email, invoiceEmail,
        },
        bizNumber,
        email,
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
        className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">결제 처리</h2>
            <p className="text-xs text-gray-400 mt-0.5">{ticket.schoolName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* 수리내역 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">수리내역</label>
            <textarea value={repairNote} onChange={e => setRepairNote(e.target.value)} className={INPUT} rows={2} placeholder="수리 내용을 입력하세요" />
          </div>

          {/* 출장비 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">출장비 유무</p>
            <div className="flex gap-2 mb-2">
              {[['있음', true], ['없음', false]].map(([label, val]) => (
                <button key={label} type="button" onClick={() => setHasTravelFee(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition
                    ${hasTravelFee === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            {hasTravelFee && (
              <FeeRow label="출장비" unitPrice={travelPrice} setUnitPrice={setTravelPrice} qty={travelQty} setQty={setTravelQty} />
            )}
          </div>

          {/* 공임비 */}
          <FeeRow label="공임비" unitPrice={workPrice} setUnitPrice={setWorkPrice} qty={workQty} setQty={setWorkQty} />

          {/* 인건비 */}
          <FeeRow label="인건비" unitPrice={laborPrice} setUnitPrice={setLaborPrice} qty={laborQty} setQty={setLaborQty} />

          {/* 이전설치 */}
          <FeeRow label="이전설치" unitPrice={movePrice} setUnitPrice={setMovePrice} qty={moveQty} setQty={setMoveQty} />

          {/* 사용한 부품 */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-700">사용한 부품</p>
            {partRows.map((row, idx) => (
              <PartSearchRow
                key={idx}
                idx={idx}
                row={row}
                allParts={allParts}
                isContracted={isContracted}
                onChange={updatePartRow}
                onRemove={removePartRow}
              />
            ))}
            <button
              type="button"
              onClick={() => setPartRows(r => [...r, { partId: '', partName: '', spec: '', unitPrice: 0, qty: 1, total: 0, isFree: false, _userEdited: false }])}
              className="w-full py-2 border border-dashed border-blue-300 rounded-xl text-xs text-blue-500 font-medium"
            >
              + 부품 추가
            </button>
          </div>

          {/* 최종 합계 + VAT */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">최종 합계 (VAT 별도)</p>
              <p className="text-sm text-gray-500">{grandTotal.toLocaleString()}원</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-700">최종 합계 (VAT 포함)</p>
              <p className="text-lg font-bold text-blue-700">{vatTotal.toLocaleString()}원</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* 결제 방법 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1.5">결제 방법</p>
            <div className="flex gap-2">
              {['카드', '세금계산서'].map(m => (
                <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition
                    ${paymentMethod === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === '카드' && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">카드 결제는 현장에서 단말기로 직접 결제됩니다. 저장 시 AS가 완료 처리됩니다.</p>
            </div>
          )}

          {paymentMethod === '세금계산서' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">학교명</label>
                <div className="border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700">{ticket.schoolName}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">사업자등록번호</label>
                <input value={bizNumber} onChange={e => setBizNumber(e.target.value)} className={INPUT} placeholder="000-00-00000" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">발행 요청일</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="담당자 이메일" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">세금계산서 이메일</label>
                <input value={invoiceEmail} onChange={e => setInvoiceEmail(e.target.value)} className={INPUT} placeholder="세금계산서 수신 이메일" />
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
        )}

        <button
          onClick={() => setShowPayConfirm(true)}
          disabled={saving}
          className="mt-5 w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 active:bg-blue-700 transition"
        >
          {saving ? '처리 중...' : paymentMethod === '카드' ? '카드 결제 완료' : '세금계산서 발행 요청'}
        </button>
      </div>

      {showPayConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={() => setShowPayConfirm(false)}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-800 mb-4">
              {paymentMethod === '카드' ? '카드결제 완료 처리 하시겠습니까?' : '세금계산서 발행을 요청하시겠습니까?'}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowPayConfirm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">취소</button>
              <button onClick={() => { setShowPayConfirm(false); handleSubmit() }} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium">확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 견적서 발송 모달 ─────────────────────────────────────────────────────────

function EstimateModal({ ticket, onSave, onClose }) {
  const [email, setEmail] = useState(ticket.email || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleSubmit() {
    if (!email.trim()) return setError('이메일을 입력해주세요.')
    setSaving(true)
    setError('')
    try {
      await api.saveEstimate({ asId: ticket.asId, schoolId: ticket.schoolId, email: email.trim() })
      onSave()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">견적서 발송</h2>
            <p className="text-xs text-gray-400 mt-0.5">{ticket.schoolName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">증상</p>
            <p className="text-sm text-gray-800">{ticket.symptom}</p>
          </div>
          {ticket.note && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">수리내역</p>
              <p className="text-sm text-gray-800">{ticket.note}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">발송 이메일 <span className="text-red-500">*</span></label>
            <input value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="이메일 주소 입력" />
            {!ticket.email && <p className="text-xs text-amber-600 mt-1">등록된 이메일이 없습니다. 직접 입력해주세요.</p>}
          </div>
        </div>

        {error && <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}

        <button
          onClick={() => setShowConfirm(true)}
          disabled={saving}
          className="mt-5 w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 active:bg-blue-700 transition"
        >
          {saving ? '처리 중...' : '견적서 발송'}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-800 mb-1">견적서 발송</p>
            <p className="text-xs text-gray-500 mb-4">{email} 로 발송하시겠습니까?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">취소</button>
              <button onClick={() => { setShowConfirm(false); handleSubmit() }} disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium">발송</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── AS 상세 모달 ────────────────────────────────────────────────────────────

function ASDetailModal({ ticket, onSave, onClose, onPayment, onEstimate }) {
  const [note, setNote] = useState(ticket.note || '')
  const [saving, setSaving] = useState(false)
  const nextStatus = NEXT_STATUS[ticket.status]
  const pi = ticket.paymentInfo || {}

  async function handleStatusChange(newStatus) {
    setSaving(true)
    try {
      await api.updateAS(ticket.asId, { status: newStatus, note })
      onSave()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNote() {
    setSaving(true)
    try {
      await api.updateAS(ticket.asId, { note })
      onSave()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">{ticket.schoolName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{ticket.reportedDate} 접수 · {ticket.asId}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">증상</p>
            <p className="text-sm text-gray-800">{ticket.symptom}</p>
          </div>

          {(ticket.location || ticket.model) && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">설치위치 / 모델명</p>
              <p className="text-sm text-gray-800">
                {[ticket.location, ticket.model].filter(Boolean).join(' / ')}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">현재 상태</p>
              <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${STATUS_BADGE[ticket.status] || 'bg-gray-100 text-gray-600'}`}>
                {ticket.status}
              </span>
            </div>
            {ticket.contractType && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">계약구분</p>
                <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${CONTRACT_BADGE[ticket.contractType] || 'bg-gray-100 text-gray-600'}`}>
                  {ticket.contractType}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">수리 내역</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className={INPUT}
              rows={3}
              placeholder="처리 내용을 입력하세요"
            />
          </div>

          {ticket.paymentMethod && Object.keys(pi).length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-700">
                {ticket.paymentMethod === '세금계산서' ? '세금계산서 요청 내역' : '결제 내역'}
              </p>
              {pi.repairNote && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">수리내역</p>
                  <p className="text-xs text-gray-800">{pi.repairNote}</p>
                </div>
              )}
              <div className="space-y-1">
                {pi.hasTravelFee && <p className="text-xs text-blue-600">출장비: 있음</p>}
                {Number(pi.workTotal) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">공임비 ({(pi.workPrice || 0).toLocaleString()} × {pi.workQty})</span>
                    <span className="font-medium text-gray-800">{(pi.workTotal || 0).toLocaleString()}원</span>
                  </div>
                )}
                {Number(pi.laborTotal) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">인건비 ({(pi.laborPrice || 0).toLocaleString()} × {pi.laborQty})</span>
                    <span className="font-medium text-gray-800">{(pi.laborTotal || 0).toLocaleString()}원</span>
                  </div>
                )}
                {Number(pi.moveTotal) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">이전설치 ({(pi.movePrice || 0).toLocaleString()} × {pi.moveQty})</span>
                    <span className="font-medium text-gray-800">{(pi.moveTotal || 0).toLocaleString()}원</span>
                  </div>
                )}
                {pi.parts && pi.parts.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">사용 부품</p>
                    {pi.parts.map((p, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-600">{p.partName}{p.spec ? ` (${p.spec})` : ''} × {p.qty}</span>
                        <span className="font-medium text-gray-800">{(p.total || 0).toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-blue-200 pt-1.5 space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">합계 (VAT 별도)</span>
                  <span className="font-medium text-gray-800">{(pi.total || 0).toLocaleString()}원</span>
                </div>
                {Number(pi.vatTotal) > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-blue-700">합계 (VAT 포함)</span>
                    <span className="text-blue-700">{(pi.vatTotal || 0).toLocaleString()}원</span>
                  </div>
                )}
              </div>
              {ticket.paymentMethod === '세금계산서' && (
                <div className="border-t border-blue-200 pt-1.5 space-y-0.5">
                  {(pi.bizNumber || ticket.bizNumber) && <p className="text-xs text-blue-600">사업자번호: {pi.bizNumber || ticket.bizNumber}</p>}
                  {(pi.email || ticket.email) && <p className="text-xs text-blue-600">담당자 이메일: {pi.email || ticket.email}</p>}
                  {pi.invoiceEmail && <p className="text-xs text-blue-600">세금계산서 이메일: {pi.invoiceEmail}</p>}
                  {pi.invoiceDate && <p className="text-xs text-blue-600">발행 요청일: {pi.invoiceDate}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 space-y-2">
          {ticket.status === '수리완료' ? (
            <>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNote}
                  disabled={saving}
                  className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-50 transition"
                >
                  메모 저장
                </button>
                <button
                  onClick={onEstimate}
                  disabled={saving}
                  className="flex-1 bg-blue-100 text-blue-700 py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-200 transition"
                >
                  견적서 발송
                </button>
              </div>
              <button
                onClick={onPayment}
                disabled={saving}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 active:bg-green-700 transition"
              >
                결제 처리
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveNote}
                disabled={saving}
                className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-50 transition"
              >
                메모 저장
              </button>
              {nextStatus && (
                <button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-700 transition"
                >
                  {saving ? '처리 중...' : `→ ${nextStatus}`}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function TechAS() {
  const { user } = useAuth()
  const { setAsUnread } = useNotification()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('전체')
  const [selected, setSelected] = useState(null)
  const [paymentTicket, setPaymentTicket] = useState(null)
  const [estimateTicket, setEstimateTicket] = useState(null)

  const currentYear = dayjs().format('YYYY')
  const [filterYear, setFilterYear]   = useState(currentYear)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDay, setFilterDay]     = useState('')
  const [sortOrder, setSortOrder]     = useState('newest')

  async function load() {
    setLoading(true)
    try {
      const data = await api.getMyAS(user.techId)
      setTickets(data)
      const unread = data.filter(a => a.status === '접수').length
      setAsUnread(unread)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user.techId])

  function handleOpen(ticket) {
    setSelected(ticket)
  }

  const filtered = useMemo(() => {
    let list = statusFilter === '전체' ? tickets : tickets.filter(a => a.status === statusFilter)
    if (filterYear) list = list.filter(a => a.reportedDate.startsWith(filterYear))
    if (filterMonth) {
      const m = filterMonth.padStart(2, '0')
      list = list.filter(a => a.reportedDate.startsWith(`${filterYear}-${m}`))
    }
    if (filterDay && filterMonth) {
      const m = filterMonth.padStart(2, '0')
      const d = filterDay.padStart(2, '0')
      list = list.filter(a => a.reportedDate === `${filterYear}-${m}-${d}`)
    }
    return [...list].sort((a, b) =>
      sortOrder === 'newest'
        ? b.reportedDate.localeCompare(a.reportedDate)
        : a.reportedDate.localeCompare(b.reportedDate)
    )
  }, [tickets, statusFilter, filterYear, filterMonth, filterDay, sortOrder])

  const counts = useMemo(() => {
    const c = { '전체': tickets.length }
    STATUS_TABS.slice(1).forEach(s => { c[s] = tickets.filter(a => a.status === s).length })
    return c
  }, [tickets])

  const years = []
  for (let y = 2024; y <= 2030; y++) years.push(String(y))

  const daysInMonth = filterYear && filterMonth
    ? dayjs(`${filterYear}-${filterMonth.padStart(2, '0')}-01`).daysInMonth()
    : 31

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white border-b border-gray-200 px-4 pt-12 md:pt-4 pb-0 sticky top-0 z-30">
        <h1 className="text-lg font-bold text-gray-900 pb-3">AS 접수함</h1>

        {/* 날짜 필터 + 정렬 */}
        <div className="flex gap-2 pb-2 flex-wrap">
          <select
            value={filterYear}
            onChange={e => { setFilterYear(e.target.value); setFilterMonth(''); setFilterDay('') }}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
          >
            {years.map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            value={filterMonth}
            onChange={e => { setFilterMonth(e.target.value); setFilterDay('') }}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="">전체 월</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}월</option>
            ))}
          </select>
          <select
            value={filterDay}
            onChange={e => setFilterDay(e.target.value)}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400"
            disabled={!filterMonth}
          >
            <option value="">전체 일</option>
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>{i + 1}일</option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400 ml-auto"
          >
            <option value="newest">최신 등록순</option>
            <option value="oldest">가장 오래된 순</option>
          </select>
        </div>

        {/* 상태 필터 탭 */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-3">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${statusFilter === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'}`}
            >
              {tab}
              {counts[tab] > 0 && (
                <span className={`ml-1 text-xs font-bold ${statusFilter === tab ? 'text-blue-100' : 'text-gray-400'}`}>
                  {counts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {loading ? <Spinner /> : (
        <div className="px-4 py-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <p className="text-sm">배정된 AS 접수 건이 없습니다</p>
            </div>
          ) : filtered.map(a => {
            const isUnread = a.status === '접수'
            return (
              <button
                key={a.asId}
                onClick={() => handleOpen(a)}
                className="w-full bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-left active:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                      <p className="font-medium text-gray-800 text-sm truncate">{a.schoolName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[a.status] || ''}`}>
                        {a.status}
                      </span>
                      {a.contractType && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CONTRACT_BADGE[a.contractType] || 'bg-gray-100 text-gray-500'}`}>
                          {a.contractType}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{a.symptom}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {a.reportedDate}
                      {a.location && <span> · {a.location}</span>}
                      {a.model && <span> ({a.model})</span>}
                    </p>
                    {a.note && <p className="text-xs text-gray-400 mt-1 truncate italic">{a.note}</p>}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && !paymentTicket && !estimateTicket && (
        <ASDetailModal
          ticket={selected}
          onSave={() => { setSelected(null); load() }}
          onClose={() => setSelected(null)}
          onPayment={() => { setPaymentTicket(selected); setSelected(null) }}
          onEstimate={() => { setEstimateTicket(selected); setSelected(null) }}
        />
      )}

      {paymentTicket && (
        <PaymentModal
          ticket={paymentTicket}
          onSave={() => { setPaymentTicket(null); load() }}
          onClose={() => setPaymentTicket(null)}
        />
      )}

      {estimateTicket && (
        <EstimateModal
          ticket={estimateTicket}
          onSave={() => { setEstimateTicket(null); load() }}
          onClose={() => setEstimateTicket(null)}
        />
      )}

    </div>
  )
}
