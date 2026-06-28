import { useState, useEffect, useMemo } from 'react'
import { api } from '../../api/sheetsApi.js'

const CONTRACT_BADGE = {
  '유지관리': 'bg-blue-100 text-blue-700',
  '비계약':   'bg-gray-100 text-gray-600',
}

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

function MiniSpinner() {
  return (
    <svg className="animate-spin w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function SchoolEditModal({ school, techs, schools: allSchools, onSave, onClose }) {
  const [form, setForm] = useState(school ?? {
    name: '', region: '', address: '', contact: '', contactPhone: '',
    techId: '', contractType: '유지관리', email: '', note: '', bizNumber: '',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  const techRegions = useMemo(() => {
    if (!form.techId) return []
    const set = new Set(
      allSchools
        .filter(s => s.techId === form.techId && s.region)
        .map(s => s.region)
    )
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [form.techId, allSchools])

  function handleTechChange(techId) {
    set('techId', techId)
    set('region', '')
  }

  async function handleSubmit() {
    if (!form.name.trim()) { setErr('학교명을 입력하세요.'); return }
    setSaving(true); setErr('')
    try {
      await api.saveSchool(form)
      onSave()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-800">{school?.schoolId ? '학교 수정' : '학교 추가'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <Field label="학교명 *">
            <input value={form.name} onChange={e => set('name', e.target.value)} className={INPUT} placeholder="학교명 입력" />
          </Field>
          <Field label="담당 기사">
            <select value={form.techId} onChange={e => handleTechChange(e.target.value)} className={INPUT}>
              <option value="">미배정</option>
              {techs.map(t => <option key={t.techId} value={t.techId}>{t.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="지역">
              {techRegions.length > 0 ? (
                <select value={form.region} onChange={e => set('region', e.target.value)} className={INPUT}>
                  <option value="">지역 선택</option>
                  {techRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input value={form.region} onChange={e => set('region', e.target.value)} className={INPUT} placeholder="예: 서부" />
              )}
            </Field>
            <Field label="계약구분">
              <select value={form.contractType} onChange={e => set('contractType', e.target.value)} className={INPUT}>
                <option value="유지관리">유지관리</option>
                <option value="비계약">비계약</option>
              </select>
            </Field>
          </div>
          <Field label="주소">
            <input value={form.address} onChange={e => set('address', e.target.value)} className={INPUT} placeholder="도로명 주소" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="담당자">
              <input value={form.contact} onChange={e => set('contact', e.target.value)} className={INPUT} placeholder="담당자명" />
            </Field>
            <Field label="담당자 연락처">
              <input value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} className={INPUT} placeholder="02-0000-0000" />
            </Field>
          </div>
          <Field label="이메일">
            <input value={form.email} onChange={e => set('email', e.target.value)} className={INPUT} placeholder="example@edu.kr" type="email" />
          </Field>
          <Field label="사업자번호">
            <input value={form.bizNumber || ''} onChange={e => set('bizNumber', e.target.value)} className={INPUT} placeholder="000-00-00000" />
          </Field>
          <Field label="비고">
            <textarea value={form.note} onChange={e => set('note', e.target.value)} className={INPUT} rows={2} placeholder="추가 메모" />
          </Field>
        </div>

        {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

        <button onClick={handleSubmit} disabled={saving}
          className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-700 transition">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}

function SchoolDetailModal({ school, techName, onEdit, onClose }) {
  const [equipment, setEquipment] = useState([])
  const [eqLoading, setEqLoading] = useState(true)

  useEffect(() => {
    api.getEquipment(school.schoolId)
      .then(setEquipment)
      .catch(console.error)
      .finally(() => setEqLoading(false))
  }, [school.schoolId])

  function InfoRow({ label, value }) {
    return (
      <div className="flex gap-2 py-2.5 border-b border-gray-100 last:border-0">
        <span className="text-xs text-gray-400 w-24 shrink-0 mt-0.5">{label}</span>
        <span className="text-sm text-gray-800 flex-1 break-all">{value || '-'}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">{school.name}</h2>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 ${CONTRACT_BADGE[school.contractType] || 'bg-gray-100 text-gray-600'}`}>
              {school.contractType}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onEdit}
              className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-medium active:bg-gray-200 transition"
            >
              수정
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 mb-5">
          <InfoRow label="지역" value={school.region} />
          <InfoRow label="담당기사" value={techName} />
          <InfoRow label="주소" value={school.address} />
          <InfoRow label="학교담당자" value={school.contact} />
          <InfoRow label="담당 연락처" value={school.contactPhone} />
          <InfoRow label="이메일" value={school.email} />
          <InfoRow label="사업자번호" value={school.bizNumber} />
        </div>

        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-3">설치 제품 목록</h3>
          {eqLoading ? (
            <div className="flex justify-center py-4"><MiniSpinner /></div>
          ) : equipment.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">등록된 제품이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {equipment.map(eq => (
                <div key={eq.equipmentId} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-700">{eq.location}</span>
                  <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1 font-medium">{eq.model}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AdminSchools() {
  const [schools, setSchools] = useState([])
  const [techs, setTechs] = useState([])
  const [loading, setLoading] = useState(true)
  const [regionFilter, setRegionFilter] = useState('')
  const [techFilter, setTechFilter] = useState('')
  const [detailSchool, setDetailSchool] = useState(null)
  const [editSchool, setEditSchool] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [s, t] = await Promise.all([api.getAllSchools(), api.getAllTechs()])
      setSchools(s)
      setTechs(t.filter(t => t.role === '기사' && t.active))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const techMap = useMemo(() => Object.fromEntries(techs.map(t => [t.techId, t.name])), [techs])

  const regions = useMemo(() => {
    const source = techFilter ? schools.filter(s => s.techId === techFilter) : schools
    const set = new Set(source.map(s => s.region).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
  }, [schools, techFilter])

  useEffect(() => {
    if (regionFilter && !regions.includes(regionFilter)) setRegionFilter('')
  }, [regions])

  const filtered = useMemo(() => {
    return schools.filter(s => {
      if (regionFilter && s.region !== regionFilter) return false
      if (techFilter && s.techId !== techFilter) return false
      return true
    })
  }, [schools, regionFilter, techFilter])

  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(s => {
      const region = s.region || '기타'
      if (!map[region]) map[region] = []
      map[region].push(s)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, 'ko'))
  }, [filtered])

  function handleSaved() {
    setEditSchool(null)
    setShowAdd(false)
    setDetailSchool(null)
    load()
  }

  return (
    <div>
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <select
            value={techFilter}
            onChange={e => setTechFilter(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="">담당자 전체</option>
            {techs.map(t => <option key={t.techId} value={t.techId}>{t.name}</option>)}
          </select>
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="">지역 전체</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button
            onClick={() => setShowAdd(true)}
            className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm active:bg-blue-700 transition shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400">{filtered.length}개 학교</p>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* 모바일: 카드 목록 */}
          <div className="md:hidden px-4 py-3 space-y-5">
            {grouped.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">해당하는 학교가 없습니다</p>
            ) : grouped.map(([region, list]) => (
              <div key={region}>
                <h3 className="text-xs font-semibold text-gray-500 mb-2 px-1 uppercase tracking-wide">{region}</h3>
                <div className="space-y-2">
                  {[...list].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map(s => (
                    <button
                      key={s.schoolId}
                      onClick={() => setDetailSchool(s)}
                      className="w-full bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-left active:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm truncate">{s.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {techMap[s.techId]
                              ? <span>{techMap[s.techId]}</span>
                              : <span className="text-gray-300">미배정</span>}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CONTRACT_BADGE[s.contractType] || 'bg-gray-100 text-gray-600'}`}>
                          {s.contractType}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block px-6 py-4">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">해당하는 학교가 없습니다</p>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">학교명</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">지역</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">담당기사</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">계약구분</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">담당자</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">연락처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map(s => (
                      <tr
                        key={s.schoolId}
                        onClick={() => setDetailSchool(s)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors last:border-0"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.region || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {techMap[s.techId] || <span className="text-gray-300">미배정</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONTRACT_BADGE[s.contractType] || 'bg-gray-100 text-gray-600'}`}>
                            {s.contractType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.contact || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.contactPhone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {detailSchool && !editSchool && (
        <SchoolDetailModal
          school={detailSchool}
          techName={techMap[detailSchool.techId] || '미배정'}
          onEdit={() => setEditSchool(detailSchool)}
          onClose={() => setDetailSchool(null)}
        />
      )}

      {editSchool && (
        <SchoolEditModal
          school={editSchool}
          techs={techs}
          schools={schools}
          onSave={handleSaved}
          onClose={() => setEditSchool(null)}
        />
      )}

      {showAdd && (
        <SchoolEditModal
          school={null}
          techs={techs}
          schools={schools}
          onSave={handleSaved}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}
