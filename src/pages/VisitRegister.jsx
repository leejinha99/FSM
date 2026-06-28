import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../api/sheetsApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const ALERT_OPTIONS = ['끄기', '10분전', '30분전', '1시간전']
const VISIT_TYPES = ['필터교체', '점검', 'AS', '설치']

const INITIAL_NEW_EQ = { location: '', model: '', installDate: dayjs().format('YYYY-MM-DD'), filterInterval: 6 }

function formatNumber(n) {
  return Number(n || 0).toLocaleString('ko-KR')
}

// ─── 섹션 레이블 컴포넌트 ──────────────────────────────────────────────────

function SectionLabel({ children, required }) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

// ─── 입력 필드 스타일 ──────────────────────────────────────────────────────

const inputClass = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white'
const disabledClass = 'w-full px-3.5 py-2.5 border border-gray-100 rounded-xl text-gray-400 text-sm bg-gray-50'

// ─── 부품 행 ──────────────────────────────────────────────────────────────

function PartRow({ entry, parts, equipment, isContracted, onUpdate, onRemove }) {
  const [partSearch, setPartSearch] = useState(entry.partName || '')
  const [showDrop, setShowDrop] = useState(false)

  const part = parts.find(p => p.partId === entry.partId)
  const isLowStock = part && entry.qty > part.currentStock

  const filteredParts = useMemo(() => {
    if (!partSearch) return parts
    const q = partSearch.toLowerCase()
    return parts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.spec && p.spec.toLowerCase().includes(q))
    )
  }, [partSearch, parts])

  function selectPart(p) {
    const unitPrice = isContracted ? p.contractPrice : p.nonContractPrice
    onUpdate({
      ...entry,
      partId: p.partId,
      partName: p.name,
      currentStock: p.currentStock,
      warehouseId: p.warehouseId,
      unitPrice,
      priceType: isContracted ? '계약' : '비계약',
      amount: unitPrice * (entry.qty || 1),
    })
    setPartSearch(p.name)
    setShowDrop(false)
  }

  function handleQtyInput(val) {
    const n = Math.max(1, Number(val) || 1)
    onUpdate({ ...entry, qty: n, amount: (entry.unitPrice || 0) * n })
  }

  return (
    <div className={`bg-white rounded-xl border ${isLowStock ? 'border-amber-300' : 'border-gray-200'} p-3 space-y-2`}>
      {/* 부품명 검색 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={partSearch}
            onChange={e => {
              setPartSearch(e.target.value)
              setShowDrop(true)
              if (!e.target.value) onUpdate({ ...entry, partId: '', partName: '', qty: 1, unitPrice: 0, amount: 0 })
            }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="부품명 검색..."
            className={inputClass}
            autoComplete="off"
          />
          {showDrop && filteredParts.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-44 overflow-y-auto">
              {filteredParts.map(p => (
                <button
                  key={p.partId}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); selectPart(p) }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-blue-50 transition border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-800">{p.name}</span>
                  {p.spec && <span className="ml-2 text-xs text-gray-400">{p.spec}</span>}
                  <span className="ml-1 text-xs text-gray-400">(재고: {p.currentStock})</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onRemove}
          className="w-9 h-9 flex items-center justify-center text-gray-400 border border-gray-200 rounded-xl hover:bg-red-50 hover:text-red-500 transition shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 규격 / 단가 / 수량 / 합계 — 모바일 2×2, PC 1×4 */}
      {entry.partId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">규격</p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-xs text-gray-700 truncate">
              {part?.spec || '-'}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">단가</p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-xs text-gray-700 truncate">
              {formatNumber(entry.unitPrice)}원
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">수량</p>
            <input
              type="number"
              value={entry.qty}
              onChange={e => handleQtyInput(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 text-center"
              min="1"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">합계</p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-2 text-xs font-bold text-gray-900 truncate">
              {formatNumber(entry.amount)}원
            </div>
          </div>
        </div>
      )}

      {/* 장비 선택 */}
      {entry.partId && equipment.length > 0 && (
        <select
          value={entry.equipmentId}
          onChange={e => onUpdate({ ...entry, equipmentId: e.target.value })}
          className={inputClass}
        >
          <option value="">장비 선택 (선택사항)</option>
          {equipment.map(eq => (
            <option key={eq.equipmentId} value={eq.equipmentId}>{eq.location} · {eq.model}</option>
          ))}
        </select>
      )}

      {isLowStock && (
        <p className="text-amber-600 text-xs flex items-center gap-1">
          <span>⚠</span> 재고 부족 (현재고: {part.currentStock}{part.unit})
        </p>
      )}
    </div>
  )
}

// ─── 장비 멀티선택 드롭다운 ───────────────────────────────────────────────────

function EquipmentMultiSelect({ equipment, selectedIds, onChange, hint }) {
  const [open, setOpen] = useState(false)
  const allSelected = equipment.length > 0 && selectedIds.length === equipment.length

  const displayText = allSelected
    ? '전체 선택됨'
    : selectedIds.length === 0
      ? '선택 없음'
      : `${selectedIds.length}개 선택됨`

  function toggleAll() {
    onChange(allSelected ? [] : equipment.map(e => e.equipmentId))
  }

  function toggle(id) {
    const has = selectedIds.includes(id)
    onChange(has ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }

  return (
    <div>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 border rounded-xl text-sm transition bg-white
          ${open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200'}`}
      >
        <span className={selectedIds.length === 0 ? 'text-gray-400' : 'text-gray-800 font-medium'}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <button
            type="button"
            onClick={toggleAll}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition"
          >
            <span className="text-sm font-semibold text-gray-700">전체</span>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
              ${allSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
              {allSelected && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
          {equipment.map((eq, i) => {
            const checked = selectedIds.includes(eq.equipmentId)
            return (
              <button
                key={eq.equipmentId}
                type="button"
                onClick={() => toggle(eq.equipmentId)}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition
                  ${i < equipment.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="text-left">
                  <div className="text-sm text-gray-800">{eq.location}</div>
                  <div className="text-xs text-gray-400">{eq.model}</div>
                </div>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                  ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 메인 폼 ──────────────────────────────────────────────────────────────

export default function VisitRegister() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [schools, setSchools] = useState([])
  const [equipment, setEquipment] = useState([])
  const [parts, setParts] = useState([])
  const [productNames, setProductNames] = useState([])
  const [newEqCategory, setNewEqCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // 학교 3단계 선택 상태
  const [contractFilter, setContractFilter] = useState('')  // '계약' | '미계약'
  const [regionFilter, setRegionFilter] = useState('')

  const [form, setForm] = useState({
    visitDate: dayjs().format('YYYY-MM-DD'),
    visitTime: '09:00',
    alertSetting: '30분전',
    schoolId: location.state?.schoolId || '',
    visitType: '',
    selectedEquipmentIds: [],
    newEquipment: { ...INITIAL_NEW_EQ },
    workContent: '',
    partsUsed: [],
    travelFee: '',
    laborFee: '',
    workFee: '',
    nextScheduledDate: '',
    paymentMethod: '',
    paymentAmount: '',
    invoiceEmail: '',
    invoiceAmount: '',
    regionManual: '',
    schoolNameManual: '',
  })

  const school = schools.find(s => s.schoolId === form.schoolId)
  const isContracted = school?.contractType === '유지관리'

  const partsFee = form.partsUsed.reduce((s, p) => s + (p.amount || 0), 0)
  const total = isContracted
    ? partsFee
    : (Number(form.travelFee || 0) + Number(form.laborFee || 0) + Number(form.workFee || 0) + partsFee)

  const hasStockIssue = form.partsUsed.some(entry => {
    const p = parts.find(x => x.partId === entry.partId)
    return p && entry.qty > p.currentStock
  })

  // 초기 데이터 로드
  useEffect(() => {
    async function loadInitial() {
      try {
        const [schoolData, partData, pnData] = await Promise.all([
          api.getMySchools(user.techId),
          api.getMyParts(user.techId),
          api.getProductNames(),
        ])
        setSchools(schoolData)
        setParts(partData)
        setProductNames(pnData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [user.techId])

  // 학교 변경 시 장비 로드
  useEffect(() => {
    if (!form.schoolId) {
      setEquipment([])
      return
    }
    api.getEquipment(form.schoolId).then(setEquipment).catch(() => setEquipment([]))
  }, [form.schoolId])

  // 학교 변경 시 장비 선택 초기화
  useEffect(() => {
    setForm(f => ({ ...f, selectedEquipmentIds: [] }))
  }, [form.schoolId])

  // 장비 로드 후 필터교체/점검은 전체 자동 선택
  useEffect(() => {
    if (equipment.length > 0 && (form.visitType === '필터교체' || form.visitType === '점검')) {
      setForm(f => ({ ...f, selectedEquipmentIds: equipment.map(e => e.equipmentId) }))
    }
  }, [equipment, form.visitType])

  // 학교 변경 시 세금계산서 이메일 자동 설정
  useEffect(() => {
    if (school?.email) {
      setForm(f => ({ ...f, invoiceEmail: school.email }))
    }
  }, [school])

  function updateForm(patch) {
    setForm(f => ({ ...f, ...patch }))
  }

  function addPartRow() {
    setForm(f => ({
      ...f,
      partsUsed: [...f.partsUsed, {
        id: Date.now(),
        partId: '',
        partName: '',
        equipmentId: '',
        qty: 1,
        currentStock: 0,
        warehouseId: '',
        priceType: isContracted ? '계약' : '비계약',
        unitPrice: 0,
        amount: 0,
      }],
    }))
  }

  function updatePartRow(id, updated) {
    setForm(f => ({
      ...f,
      partsUsed: f.partsUsed.map(p => p.id === id ? { ...p, ...updated } : p),
    }))
  }

  function removePartRow(id) {
    setForm(f => ({ ...f, partsUsed: f.partsUsed.filter(p => p.id !== id) }))
  }

  async function handleSubmit() {
    // 유효성 검사
    if (!form.visitDate) return setError('방문일을 입력해주세요.')
    if (!form.visitTime) return setError('방문 시간을 입력해주세요.')
    if (contractFilter !== '미계약' && !form.schoolId) return setError('학교를 선택해주세요.')
    if (contractFilter === '미계약' && !form.schoolNameManual.trim()) return setError('학교(업체명)을 입력해주세요.')
    if (!form.visitType) return setError('방문 유형을 선택해주세요.')
    if (!isContracted && !form.paymentMethod) return setError('결제 방식을 선택해주세요.')
    if (form.paymentMethod === '카드' && !form.paymentAmount) return setError('결제 금액을 입력해주세요.')
    if (form.paymentMethod === '세금계산서' && !form.invoiceEmail) return setError('발행 이메일을 입력해주세요.')
    if (hasStockIssue) return setError('재고가 부족한 부품이 있습니다. 확인 후 수량을 조정해주세요.')

    const targetEqIds =
      form.visitType === '설치' ? [] :
      form.selectedEquipmentIds

    const payload = {
      techId: user.techId,
      visitDate: form.visitDate,
      visitTime: form.visitTime,
      alertSetting: form.alertSetting,
      schoolId: contractFilter === '미계약' ? '' : form.schoolId,
      schoolNameManual: form.schoolNameManual || '',
      regionManual: form.regionManual || '',
      visitType: form.visitType,
      selectedEquipment: targetEqIds.length > 0 ? targetEqIds : ['전체'],
      workContent: form.workContent,
      partsUsed: form.partsUsed.filter(p => p.partId).map(p => ({
        partId: p.partId,
        partName: p.partName,
        equipmentId: p.equipmentId,
        qty: p.qty,
        warehouseId: p.warehouseId,
        priceType: p.priceType,
        unitPrice: p.unitPrice,
        amount: p.amount,
      })),
      travelFee: Number(form.travelFee || 0),
      laborFee: Number(form.laborFee || 0),
      workFee: Number(form.workFee || 0),
      partsFee,
      total,
      paymentMethod: form.paymentMethod,
      paymentAmount: Number(form.paymentAmount || 0),
      invoiceEmail: form.invoiceEmail,
      invoiceAmount: isContracted ? 0 : total,
      invoiceStatus: form.paymentMethod === '세금계산서' ? '요청' : '',
      nextScheduledDate: form.nextScheduledDate,
      newEquipment: form.visitType === '설치' ? form.newEquipment : null,
    }

    setSubmitting(true)
    setError('')

    try {
      await api.saveVisit(payload)
      setSuccess(true)
      setTimeout(() => navigate('/calendar'), 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-9 h-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-800">저장 완료!</p>
        <p className="text-sm text-gray-400">캘린더로 이동합니다...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 pt-12 pb-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">방문 등록</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 py-4 space-y-5">

          {/* ── 기본 정보 ── */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">기본 정보</h2>

            {/* 방문일 + 시간 */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <SectionLabel required>방문일</SectionLabel>
                <input
                  type="date"
                  value={form.visitDate}
                  onChange={e => updateForm({ visitDate: e.target.value })}
                  className={`${inputClass} w-full max-w-full`}
                />
              </div>
              <div>
                <SectionLabel required>시간</SectionLabel>
                <input
                  type="time"
                  value={form.visitTime}
                  onChange={e => updateForm({ visitTime: e.target.value })}
                  className={`${inputClass} w-full max-w-full`}
                />
              </div>
            </div>

            {/* 알림 */}
            <div>
              <SectionLabel>알림 설정</SectionLabel>
              <div className="grid grid-cols-4 gap-1.5">
                {ALERT_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => updateForm({ alertSetting: opt })}
                    className={`py-2 text-xs rounded-xl border transition font-medium
                      ${form.alertSetting === opt
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* 학교 선택 — 3단계 */}
            <div className="space-y-3">
              <SectionLabel required>학교</SectionLabel>

              {/* 1단계: 계약 구분 */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">① 계약 구분</p>
                <div className="grid grid-cols-2 gap-2">
                  {['계약', '미계약'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setContractFilter(opt)
                        setRegionFilter('')
                        updateForm({ schoolId: '', visitType: '', partsUsed: [], regionManual: '', schoolNameManual: '' })
                      }}
                      className={`py-2.5 text-sm rounded-xl border font-medium transition
                        ${contractFilter === opt
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2단계: 지역 (계약) */}
              {contractFilter === '계약' && (() => {
                const regions = [...new Set(
                  schools.filter(s => s.contractType === '유지관리').map(s => s.region).filter(Boolean)
                )].sort((a, b) => a.localeCompare(b, 'ko'))
                if (regions.length === 0) return null
                return (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">② 지역</p>
                    <div className="flex flex-wrap gap-1.5">
                      {regions.map(r => (
                        <button
                          key={r}
                          onClick={() => {
                            setRegionFilter(r)
                            updateForm({ schoolId: '', visitType: '', partsUsed: [] })
                          }}
                          className={`px-3 py-1.5 text-sm rounded-xl border font-medium transition
                            ${regionFilter === r
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* 2단계: 지역 직접입력 (미계약) */}
              {contractFilter === '미계약' && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">② 지역</p>
                  <input
                    value={form.regionManual}
                    onChange={e => updateForm({ regionManual: e.target.value })}
                    placeholder="지역 입력 (예: 서울)"
                    className={inputClass}
                  />
                </div>
              )}

              {/* 3단계: 학교명 드롭다운 (계약) */}
              {contractFilter === '계약' && regionFilter && (() => {
                const schoolList = schools
                  .filter(s => s.contractType === '유지관리' && s.region === regionFilter)
                  .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                if (schoolList.length === 0) return null
                return (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">③ 학교명</p>
                    <select
                      value={form.schoolId}
                      onChange={e => updateForm({ schoolId: e.target.value, visitType: '', partsUsed: [] })}
                      className={inputClass}
                    >
                      <option value="">학교를 선택하세요</option>
                      {schoolList.map(s => (
                        <option key={s.schoolId} value={s.schoolId}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )
              })()}

              {/* 3단계: 학교(업체명) 직접입력 (미계약) */}
              {contractFilter === '미계약' && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">③ 학교(업체명)</p>
                  <input
                    value={form.schoolNameManual}
                    onChange={e => updateForm({ schoolNameManual: e.target.value })}
                    placeholder="학교(업체명) 입력"
                    className={inputClass}
                  />
                </div>
              )}

              {/* 선택된 학교 뱃지 */}
              {school && (
                <div className={`text-xs px-3 py-1.5 rounded-lg inline-block
                  ${isContracted ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                  {isContracted ? '유지관리 계약' : '비계약 고객 · 청구 필요'}
                </div>
              )}
            </div>

            {/* 방문 유형 */}
            <div>
              <SectionLabel required>방문 유형</SectionLabel>
              {(() => {
                const availableTypes = contractFilter === '미계약' ? ['설치'] : contractFilter === '계약' ? ['필터교체', '점검', 'AS'] : VISIT_TYPES
                const isReady = contractFilter === '미계약' ? true : !!form.schoolId
                return (
                  <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${availableTypes.length}, 1fr)` }}>
                    {availableTypes.map(t => (
                      <button
                        key={t}
                        onClick={() => updateForm({ visitType: t, partsUsed: [], selectedEquipmentIds: [] })}
                        disabled={!isReady}
                        className={`py-2.5 text-xs rounded-xl border transition font-medium
                          ${form.visitType === t
                            ? 'bg-blue-600 text-white border-blue-600'
                            : isReady
                              ? 'bg-white text-gray-600 border-gray-200'
                              : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </section>

          {/* ── 대상 장비 ── */}
          {form.visitType && form.visitType !== '설치' && (
            <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">대상 장비</h2>

              {equipment.length === 0 ? (
                <p className="text-sm text-gray-400">등록된 장비가 없습니다.</p>
              ) : (
                <EquipmentMultiSelect
                  equipment={equipment}
                  selectedIds={form.selectedEquipmentIds}
                  onChange={ids => updateForm({ selectedEquipmentIds: ids })}
                  hint={
                    (form.visitType === '필터교체' || form.visitType === '점검')
                      ? '전체 자동 선택됩니다. 드롭다운에서 제외할 장비를 선택 해제하세요.'
                      : 'AS 대상 장비를 선택하세요 (복수 선택 가능).'
                  }
                />
              )}
            </section>
          )}

          {/* ── 신규 설치 장비 정보 ── */}
          {form.visitType === '설치' && (
            <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">신규 장비 정보</h2>
              <div>
                <SectionLabel required>설치 위치</SectionLabel>
                <input
                  type="text"
                  value={form.newEquipment.location}
                  onChange={e => updateForm({ newEquipment: { ...form.newEquipment, location: e.target.value } })}
                  placeholder="예: 2학년 복도"
                  className={inputClass}
                />
              </div>
              <div>
                <SectionLabel required>품목</SectionLabel>
                <select
                  value={newEqCategory}
                  onChange={e => {
                    setNewEqCategory(e.target.value)
                    updateForm({ newEquipment: { ...form.newEquipment, model: '' } })
                  }}
                  className={inputClass}
                >
                  <option value="">품목 선택</option>
                  {[...new Set(productNames.map(p => p.category))].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <SectionLabel required>제품명</SectionLabel>
                <select
                  value={form.newEquipment.model}
                  onChange={e => updateForm({ newEquipment: { ...form.newEquipment, model: e.target.value } })}
                  className={inputClass}
                  disabled={!newEqCategory}
                >
                  <option value="">{newEqCategory ? '제품명 선택' : '품목을 먼저 선택하세요'}</option>
                  {productNames.filter(p => p.category === newEqCategory).map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <SectionLabel>설치일</SectionLabel>
                  <input
                    type="date"
                    value={form.newEquipment.installDate}
                    onChange={e => updateForm({ newEquipment: { ...form.newEquipment, installDate: e.target.value } })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <SectionLabel>필터 주기(개월)</SectionLabel>
                  <input
                    type="number"
                    value={form.newEquipment.filterInterval}
                    onChange={e => updateForm({ newEquipment: { ...form.newEquipment, filterInterval: Number(e.target.value) } })}
                    min="1"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── 작업 내용 ── */}
          {form.visitType && (
            <section className="bg-white rounded-2xl p-4 shadow-sm">
              <SectionLabel>작업 내용</SectionLabel>
              <textarea
                value={form.workContent}
                onChange={e => updateForm({ workContent: e.target.value })}
                rows={3}
                placeholder="작업 내용을 입력하세요"
                className={`${inputClass} resize-none`}
              />
            </section>
          )}

          {/* ── 사용 부품 ── */}
          {form.visitType && (
            <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">사용 부품</h2>
                {partsFee > 0 && (
                  <span className="text-sm font-bold text-gray-800">부품비 {formatNumber(partsFee)}원</span>
                )}
              </div>

              {form.partsUsed.map(entry => (
                <PartRow
                  key={entry.id}
                  entry={entry}
                  parts={parts}
                  equipment={equipment}
                  isContracted={isContracted}
                  onUpdate={updated => updatePartRow(entry.id, updated)}
                  onRemove={() => removePartRow(entry.id)}
                />
              ))}

              <button onClick={addPartRow}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-blue-600 font-medium
                  hover:border-blue-300 hover:bg-blue-50 transition flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                부품 추가
              </button>
            </section>
          )}

          {/* ── 청구 (비계약 전용) ── */}
          {form.visitType && !isContracted && (
            <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">청구 금액</h2>

              <div className="grid grid-cols-3 gap-2">
                {[['출장비', 'travelFee'], ['인건비', 'laborFee'], ['공임', 'workFee']].map(([label, key]) => (
                  <div key={key}>
                    <SectionLabel>{label}</SectionLabel>
                    <input
                      type="number"
                      value={form[key]}
                      onChange={e => updateForm({ [key]: e.target.value })}
                      placeholder="0"
                      min="0"
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                {[
                  ['출장비', Number(form.travelFee || 0)],
                  ['인건비', Number(form.laborFee || 0)],
                  ['공임', Number(form.workFee || 0)],
                  ['부품비', partsFee],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between text-sm text-gray-600">
                    <span>{label}</span>
                    <span>{formatNumber(val)}원</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-1.5 flex justify-between text-base font-bold text-gray-900">
                  <span>합계</span>
                  <span>{formatNumber(total)}원</span>
                </div>
              </div>
            </section>
          )}

          {/* ── 다음 예정일 + 결제 ── */}
          {form.visitType && (
            <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
              <div>
                <SectionLabel>다음 예정일</SectionLabel>
                <input
                  type="date"
                  value={form.nextScheduledDate}
                  onChange={e => updateForm({ nextScheduledDate: e.target.value })}
                  className={inputClass}
                />
              </div>

              {!isContracted && (
                <>
                  <div>
                    <SectionLabel required>결제 방식</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {['카드', '세금계산서'].map(method => (
                        <button key={method}
                          onClick={() => updateForm({ paymentMethod: method })}
                          className={`py-3 rounded-xl border text-sm font-semibold transition
                            ${form.paymentMethod === method
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-200'}`}>
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.paymentMethod === '카드' && (
                    <div>
                      <SectionLabel required>결제 금액</SectionLabel>
                      <input
                        type="number"
                        value={form.paymentAmount}
                        onChange={e => updateForm({ paymentAmount: e.target.value })}
                        placeholder={String(total)}
                        min="0"
                        className={inputClass}
                      />
                    </div>
                  )}

                  {form.paymentMethod === '세금계산서' && (
                    <div className="space-y-3">
                      <div>
                        <SectionLabel required>발행 이메일</SectionLabel>
                        <input
                          type="email"
                          value={form.invoiceEmail}
                          onChange={e => updateForm({ invoiceEmail: e.target.value })}
                          placeholder="학교 이메일"
                          className={inputClass}
                        />
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <p className="text-xs text-blue-700 font-medium">발행 금액: {formatNumber(total)}원</p>
                        <p className="text-xs text-blue-600 mt-0.5">저장 시 Make.com으로 발행 요청이 전송됩니다.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-200 p-4 pb-safe z-30">
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !form.visitType}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base
            hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              저장 중...
            </>
          ) : '방문 저장'}
        </button>
      </div>
    </div>
  )
}
