import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api/sheetsApi.js'

const STATUS_TABS = ['전체', '접수', '처리중', '수리완료', '발행대기', '완료']

const STATUS_BADGE = {
  '접수':    'bg-yellow-100 text-yellow-700',
  '처리중':  'bg-orange-100 text-orange-700',
  '수리완료':'bg-blue-100 text-blue-700',
  '발행대기':'bg-purple-100 text-purple-700',
  '완료':    'bg-green-100 text-green-600',
}

const CONTRACT_BADGE = {
  '계약':   'bg-blue-100 text-blue-700',
  '미계약': 'bg-gray-100 text-gray-500',
}

const NEXT_STATUS = { '접수': '처리중', '처리중': '수리완료', '수리완료': '발행대기' }

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

// ── AS 상세/수정 모달 ────────────────────────────────────────────────────────

function ASDetailModal({ ticket, techs, onSave, onClose }) {
  const [editMode, setEditMode] = useState(false)
  const [note, setNote] = useState(ticket.note || '')
  const [assignedTechId, setAssignedTechId] = useState(ticket.assignedTechId || '')
  const [symptom, setSymptom] = useState(ticket.symptom || '')
  const [location, setLocation] = useState(ticket.location || '')
  const [model, setModel] = useState(ticket.model || '')
  const [visitDate, setVisitDate] = useState(ticket.visitDate || '')
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [sendingEstimate, setSendingEstimate] = useState(false)
  const [quoteSent, setQuoteSent] = useState(Boolean(ticket.quoteSent))

  const nextStatus = NEXT_STATUS[ticket.status]

  async function handleStatusChange(newStatus) {
    setSaving(true)
    try {
      await api.updateAS(ticket.asId, { status: newStatus, note, assignedTechId, visitDate })
      onSave()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveEdit() {
    setSaving(true)
    try {
      await api.updateAS(ticket.asId, { note, assignedTechId, symptom, location, model, visitDate })
      onSave()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteInvoice() {
    setCompleting(true)
    try {
      await api.completeInvoice(ticket.asId)
      onSave()
    } catch (e) {
      console.error(e)
    } finally {
      setCompleting(false)
    }
  }

  async function handleSendEstimate() {
    setSendingEstimate(true)
    try {
      await api.sendEstimate(ticket.asId)
      setQuoteSent(true)
      onSave()
    } catch (e) {
      console.error(e)
    } finally {
      setSendingEstimate(false)
    }
  }

  const pi = ticket.paymentInfo || {}

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">{ticket.schoolName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{ticket.reportedDate} 접수 · {ticket.asId}</p>
          </div>
          <div className="flex items-center gap-2">
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full"
              >
                수정
              </button>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* 증상 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">증상</label>
            {editMode ? (
              <textarea value={symptom} onChange={e => setSymptom(e.target.value)} className={INPUT} rows={2} />
            ) : (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-800">{ticket.symptom}</p>
              </div>
            )}
          </div>

          {/* 설치위치 / 모델명 */}
          {editMode ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">설치위치</label>
                <input value={location} onChange={e => setLocation(e.target.value)} className={INPUT} placeholder="설치위치" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">모델명</label>
                <input value={model} onChange={e => setModel(e.target.value)} className={INPUT} placeholder="모델명" />
              </div>
            </div>
          ) : (ticket.location || ticket.model) && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">설치위치 / 모델명</p>
              <p className="text-sm text-gray-800">{[ticket.location, ticket.model].filter(Boolean).join(' / ')}</p>
            </div>
          )}

          {/* 상태 + 계약구분 */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">현재 상태</p>
              <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${STATUS_BADGE[ticket.status] || ''}`}>
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

          {/* 방문일 / 완료일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">방문일</label>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">완료일</label>
              <div className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700">
                {ticket.completedDate || '-'}
              </div>
            </div>
          </div>

          {/* 배정 기사 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">배정 기사</label>
            <select value={assignedTechId} onChange={e => setAssignedTechId(e.target.value)} className={INPUT}>
              <option value="">미배정</option>
              {techs.map(t => <option key={t.techId} value={t.techId}>{t.name}</option>)}
            </select>
          </div>

          {/* 수리 내역 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">수리 내역</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} className={INPUT} rows={3} placeholder="처리 내용 메모" />
          </div>

          {/* 결제/발행 내역 */}
          {ticket.paymentMethod && Object.keys(pi).length > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-purple-700">
                {ticket.paymentMethod === '세금계산서' ? '세금계산서 발행 정보' : '결제 정보'}
              </p>
              {pi.repairNote && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">수리내역</p>
                  <p className="text-xs text-gray-800">{pi.repairNote}</p>
                </div>
              )}
              <div className="space-y-1">
                {pi.hasTravelFee && <p className="text-xs text-purple-600">출장비: 있음</p>}
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
              <div className="border-t border-purple-200 pt-1.5 space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">합계 (VAT 별도)</span>
                  <span className="font-medium text-gray-800">{(pi.total || 0).toLocaleString()}원</span>
                </div>
                {Number(pi.vatTotal) > 0 && (
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-purple-700">합계 (VAT 포함)</span>
                    <span className="text-purple-700">{(pi.vatTotal || 0).toLocaleString()}원</span>
                  </div>
                )}
              </div>
              {ticket.paymentMethod === '세금계산서' && (
                <div className="border-t border-purple-200 pt-1.5 space-y-0.5">
                  {(pi.bizNumber || ticket.bizNumber) && <p className="text-xs text-purple-600">사업자번호: {pi.bizNumber || ticket.bizNumber}</p>}
                  {(pi.email || ticket.email) && <p className="text-xs text-purple-600">담당자 이메일: {pi.email || ticket.email}</p>}
                  {pi.invoiceEmail && <p className="text-xs text-purple-600">세금계산서 이메일: {pi.invoiceEmail}</p>}
                  {pi.invoiceDate && <p className="text-xs text-purple-600">발행 요청일: {pi.invoiceDate}</p>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2 flex-wrap">
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl font-medium">
                취소
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-700 transition">
                {saving ? '저장 중...' : '저장'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => api.updateAS(ticket.asId, { note, assignedTechId, visitDate }).then(onSave)} disabled={saving}
                className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-50 transition">
                메모 저장
              </button>
              {nextStatus && (
                <button onClick={() => handleStatusChange(nextStatus)} disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-700 transition">
                  {saving ? '처리 중...' : `→ ${nextStatus}`}
                </button>
              )}
              {ticket.status === '발행대기' && (
                <button onClick={handleCompleteInvoice} disabled={completing}
                  className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 active:bg-purple-700 transition">
                  {completing ? '처리 중...' : '세금계산서 발행 완료'}
                </button>
              )}
              <button
                onClick={handleSendEstimate}
                disabled={sendingEstimate || quoteSent}
                className={`w-full py-3 rounded-xl font-medium transition ${
                  quoteSent
                    ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                    : 'bg-teal-600 text-white disabled:opacity-50 active:bg-teal-700'
                }`}
              >
                {sendingEstimate ? '발송 중...' : quoteSent ? '✓ 견적서 발송됨' : '견적서 발송하기'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 새 AS 접수 모달 ──────────────────────────────────────────────────────────

function CreateASModal({ schools, techs, onSave, onClose }) {
  const [contractType, setContractType] = useState('')
  const [region, setRegion] = useState('')
  const [form, setForm] = useState({
    schoolId: '',
    schoolNameManual: '',
    reportedDate: dayjs().format('YYYY-MM-DD'),
    symptom: '',
    assignedTechId: '',
    note: '',
    location: '',
    model: '',
  })
  const [equipment, setEquipment] = useState([])
  const [eqLoading, setEqLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [productNames, setProductNames] = useState([])
  const [productCategory, setProductCategory] = useState('')

  const isContract = contractType === '계약'

  useEffect(() => {
    api.getProductNames().then(setProductNames).catch(() => {})
  }, [])

  const pnCategories = useMemo(() => [...new Set(productNames.map(p => p.category))], [productNames])

  const regions = useMemo(() => {
    const set = new Set(schools.filter(s => s.contractType === '유지관리').map(s => s.region).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [schools])

  const schoolsByRegion = useMemo(() => {
    if (!region) return []
    return schools
      .filter(s => s.region === region && s.contractType === '유지관리')
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }, [schools, region])

  const locations = useMemo(() => {
    const set = new Set(equipment.map(e => e.location).filter(Boolean))
    return [...set]
  }, [equipment])

  const models = useMemo(() => {
    if (!form.location) return []
    return [...new Set(equipment.filter(e => e.location === form.location).map(e => e.model).filter(Boolean))]
  }, [equipment, form.location])

  // 설치위치에 모델이 1종만 설치돼 있으면 자동 선택
  useEffect(() => {
    if (models.length === 1) {
      setForm(f => f.model === models[0] ? f : { ...f, model: models[0] })
    }
  }, [models])

  function update(patch) { setForm(f => ({ ...f, ...patch })) }

  function handleContractTypeChange(ct) {
    setContractType(ct)
    setRegion('')
    setEquipment([])
    setProductCategory('')
    setForm(f => ({ ...f, schoolId: '', schoolNameManual: '', location: '', model: '' }))
  }

  function handleRegionChange(r) {
    setRegion(r)
    setEquipment([])
    update({ schoolId: '', location: '', model: '' })
  }

  async function handleSchoolChange(schoolId) {
    update({ schoolId, location: '', model: '' })
    if (schoolId) {
      setEqLoading(true)
      try {
        const eq = await api.getEquipment(schoolId)
        setEquipment(eq)
      } catch (e) {
        console.error(e)
      } finally {
        setEqLoading(false)
      }
    } else {
      setEquipment([])
    }
  }

  async function handleSubmit() {
    if (!contractType) return setError('계약구분을 선택해주세요.')
    if (isContract && !form.schoolId) return setError('학교를 선택해주세요.')
    if (!isContract && !form.schoolNameManual.trim()) return setError('학교명을 입력해주세요.')
    if (!form.symptom.trim()) return setError('증상을 입력해주세요.')
    setSaving(true)
    setError('')
    try {
      await api.createAS({ ...form, contractType })
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
          <h2 className="text-base font-bold text-gray-800">새 AS 접수</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* 1. 계약구분 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">계약구분 <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {['계약', '미계약'].map(ct => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => handleContractTypeChange(ct)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition
                    ${contractType === ct
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 active:bg-gray-50'}`}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 지역 */}
          {contractType && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">지역 <span className="text-red-500">*</span></label>
              {isContract ? (
                <select value={region} onChange={e => handleRegionChange(e.target.value)} className={INPUT}>
                  <option value="">지역 선택</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <select value={region} onChange={e => setRegion(e.target.value)} className={INPUT}>
                  <option value="">지역 선택 (선택사항)</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              )}
            </div>
          )}

          {/* 3. 학교(업체명) */}
          {contractType && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {isContract ? '학교명' : '학교(업체명)'} <span className="text-red-500">*</span>
              </label>
              {isContract ? (
                <select
                  value={form.schoolId}
                  onChange={e => handleSchoolChange(e.target.value)}
                  className={INPUT}
                  disabled={!region}
                >
                  <option value="">{region ? '학교 선택' : '지역을 먼저 선택하세요'}</option>
                  {schoolsByRegion.map(s => <option key={s.schoolId} value={s.schoolId}>{s.name}</option>)}
                </select>
              ) : (
                <input
                  value={form.schoolNameManual}
                  onChange={e => update({ schoolNameManual: e.target.value })}
                  className={INPUT}
                  placeholder="학교(업체명) 직접 입력"
                />
              )}
            </div>
          )}

          {/* 4. 설치위치 */}
          {contractType && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">설치위치</label>
              {isContract ? (
                eqLoading ? (
                  <div className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-400">장비 불러오는 중...</div>
                ) : (
                  <select
                    value={form.location}
                    onChange={e => update({ location: e.target.value, model: '' })}
                    className={INPUT}
                    disabled={!form.schoolId}
                  >
                    <option value="">{form.schoolId ? (locations.length ? '설치위치 선택' : '등록된 장비 없음') : '학교를 먼저 선택하세요'}</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                )
              ) : (
                <input
                  value={form.location}
                  onChange={e => update({ location: e.target.value })}
                  className={INPUT}
                  placeholder="설치위치 직접 입력"
                />
              )}
            </div>
          )}

          {/* 5. 모델명 */}
          {contractType && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">모델명</label>
              {isContract ? (
                <select
                  value={form.model}
                  onChange={e => update({ model: e.target.value })}
                  className={INPUT}
                  disabled={!form.location}
                >
                  <option value="">{form.location ? '모델 선택' : '설치위치를 먼저 선택하세요'}</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <div className="space-y-2">
                  <select
                    value={productCategory}
                    onChange={e => { setProductCategory(e.target.value); update({ model: '' }) }}
                    className={INPUT}
                  >
                    <option value="">품목 선택</option>
                    {pnCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={form.model}
                    onChange={e => update({ model: e.target.value })}
                    className={INPUT}
                    disabled={!productCategory}
                  >
                    <option value="">{productCategory ? '제품명 선택' : '품목을 먼저 선택하세요'}</option>
                    {productNames.filter(p => p.category === productCategory).map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 6. 접수일 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">접수일</label>
            <input type="date" value={form.reportedDate} onChange={e => update({ reportedDate: e.target.value })} className={`${INPUT} max-w-full`} />
          </div>

          {/* 7. 증상 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">증상 <span className="text-red-500">*</span></label>
            <textarea
              value={form.symptom}
              onChange={e => update({ symptom: e.target.value })}
              className={INPUT}
              rows={3}
              placeholder="증상을 입력하세요"
            />
          </div>

          {/* 8. 배정 기사 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">배정 기사</label>
            <select value={form.assignedTechId} onChange={e => update({ assignedTechId: e.target.value })} className={INPUT}>
              <option value="">미배정</option>
              {techs.map(t => <option key={t.techId} value={t.techId}>{t.name}</option>)}
            </select>
          </div>

          {/* 9. 메모 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
            <textarea value={form.note} onChange={e => update({ note: e.target.value })} className={INPUT} rows={2} placeholder="메모 (선택사항)" />
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
          {saving ? '저장 중...' : 'AS 접수 등록'}
        </button>
      </div>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function AdminAS() {
  const [searchParams] = useSearchParams()
  const initialStatus = STATUS_TABS.includes(searchParams.get('status')) ? searchParams.get('status') : '전체'
  const openNew = searchParams.get('new') === '1'

  const [tickets, setTickets] = useState([])
  const [techs, setTechs]     = useState([])
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(openNew)

  const currentYear = dayjs().format('YYYY')
  const [filterYear, setFilterYear]     = useState(currentYear)
  const [filterMonth, setFilterMonth]   = useState('')
  const [contractFilter, setContractFilter] = useState('')   // '' | '계약' | '미계약'
  const [schoolSearch, setSchoolSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [a, t, s] = await Promise.all([api.getAllAS(), api.getAllTechs(), api.getAllSchools()])
      setTickets(a)
      setTechs(t.filter(t => t.role === '기사' && t.active))
      setSchools(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const years = []
  for (let y = 2024; y <= 2030; y++) years.push(String(y))

  const filtered = useMemo(() => {
    let list = statusFilter === '전체' ? tickets : tickets.filter(a => a.status === statusFilter)
    if (filterYear) list = list.filter(a => a.reportedDate.startsWith(filterYear))
    if (filterMonth) {
      const m = filterMonth.padStart(2, '0')
      list = list.filter(a => a.reportedDate.startsWith(`${filterYear}-${m}`))
    }
    if (contractFilter === '견적서발송') {
      list = list.filter(a => a.quoteSent)
    } else if (contractFilter) {
      list = list.filter(a => a.contractType === contractFilter)
    }
    if (schoolSearch.trim()) {
      const q = schoolSearch.trim().toLowerCase()
      list = list.filter(a => a.schoolName.toLowerCase().includes(q))
    }
    return list
  }, [tickets, statusFilter, filterYear, filterMonth, contractFilter, schoolSearch])

  const counts = useMemo(() => {
    const c = { '전체': tickets.length }
    STATUS_TABS.slice(1).forEach(s => { c[s] = tickets.filter(a => a.status === s).length })
    return c
  }, [tickets])

  function handleSaved() {
    setSelected(null)
    setShowCreate(false)
    load()
  }

  return (
    <div>
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-0 border-b border-gray-100">
        {/* 날짜 필터 */}
        <div className="flex gap-2 mb-3">
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
        </div>

        {/* 계약구분 필터 + 학교명 검색 */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            {['', '계약', '미계약', '견적서발송'].map(v => (
              <button
                key={v}
                onClick={() => setContractFilter(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                  ${contractFilter === v
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {v === '' ? '전체' : v}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px]">
            <input
              value={schoolSearch}
              onChange={e => setSchoolSearch(e.target.value)}
              placeholder="학교명 검색..."
              className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400 pr-7"
            />
            {schoolSearch && (
              <button
                onClick={() => setSchoolSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
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
          <button
            onClick={() => setShowCreate(true)}
            className="ml-2 shrink-0 flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full active:bg-blue-700 transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            새 접수
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* 모바일: 카드 목록 */}
          <div className="md:hidden px-4 py-3 space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <p className="text-sm">AS 접수 건이 없습니다</p>
              </div>
            ) : filtered.map(a => (
              <button
                key={a.asId}
                onClick={() => setSelected(a)}
                className="w-full bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-left active:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {a.assignedTechName && <span> · {a.assignedTechName}</span>}
                      {a.location && <span> · {a.location}</span>}
                      {a.model && <span> ({a.model})</span>}
                    </p>
                    {a.note && <p className="text-xs text-gray-400 mt-1 truncate italic">{a.note}</p>}
                    {a.status === '발행대기' && (
                      <p className="text-xs text-purple-600 mt-1 font-medium">세금계산서 발행 대기</p>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block px-6 py-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-gray-400">
                <p className="text-sm">AS 접수 건이 없습니다</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">접수일</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">학교명</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">계약</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">증상</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">설치위치</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">배정기사</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">결제방식</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => (
                      <tr
                        key={a.asId}
                        onClick={() => setSelected(a)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{a.reportedDate}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{a.schoolName}</td>
                        <td className="px-4 py-3">
                          {a.contractType && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONTRACT_BADGE[a.contractType] || 'bg-gray-100 text-gray-500'}`}>
                              {a.contractType}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{a.symptom}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{a.location || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{a.assignedTechName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{a.paymentMethod || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status] || ''}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {selected && (
        <ASDetailModal
          ticket={selected}
          techs={techs}
          onSave={handleSaved}
          onClose={() => setSelected(null)}
        />
      )}

      {showCreate && (
        <CreateASModal
          schools={schools}
          techs={techs}
          onSave={handleSaved}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
