import { useState, useEffect } from 'react'
import { api } from '../../api/sheetsApi.js'

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

function TechModal({ tech, onSave, onClose }) {
  const isEdit = Boolean(tech?.techId)
  const [form, setForm] = useState(tech ?? {
    name: '', phone: '', id: '', password: '', active: true,
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit() {
    if (!form.name.trim()) { setErr('이름을 입력하세요.'); return }
    if (!isEdit && !form.id.trim()) { setErr('아이디를 입력하세요.'); return }
    if (!isEdit && !form.password.trim()) { setErr('비밀번호를 입력하세요.'); return }
    setSaving(true); setErr('')
    try {
      await api.saveTech(form)
      onSave()
    } catch (e) {
      setErr(e.message)
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
          <h2 className="text-base font-bold text-gray-800">
            {isEdit ? '기사 수정' : '기사 추가'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="이름 *">
              <input value={form.name} onChange={e => set('name', e.target.value)}
                className={INPUT} placeholder="홍길동" />
            </Field>
            <Field label="연락처">
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className={INPUT} placeholder="010-0000-0000" />
            </Field>
          </div>
          <Field label={`아이디 ${isEdit ? '' : '*'}`}>
            <input value={form.id} onChange={e => set('id', e.target.value)}
              className={INPUT} placeholder="로그인 아이디" disabled={isEdit} />
          </Field>
          <Field label={`비밀번호 ${isEdit ? '(변경 시 입력)' : '*'}`}>
            <input value={form.password} onChange={e => set('password', e.target.value)}
              className={INPUT} placeholder={isEdit ? '변경하지 않으면 비워두세요' : '비밀번호'} type="password" />
          </Field>
          {isEdit && (
            <Field label="활성 상태">
              <div className="flex gap-3 pt-1">
                {[true, false].map(val => (
                  <label key={String(val)} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.active === val}
                      onChange={() => set('active', val)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{val ? '활성' : '비활성'}</span>
                  </label>
                ))}
              </div>
            </Field>
          )}
        </div>

        {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 active:bg-blue-700 transition"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
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

export default function AdminTechs() {
  const [techs, setTechs] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const all = await api.getAllTechs()
      setTechs(all.filter(t => t.role === '기사'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleSaved() { setModal(null); load() }

  const active   = techs.filter(t => t.active)
  const inactive = techs.filter(t => !t.active)

  return (
    <div>
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">{active.length}명 활성 / {inactive.length}명 비활성</p>
          <button
            onClick={() => setModal({})}
            className="flex items-center gap-1 bg-blue-600 text-white text-sm px-4 py-2 rounded-xl shadow-sm active:bg-blue-700 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            기사 추가
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* 모바일: 카드 목록 */}
          <div className="md:hidden px-4 py-3 space-y-2">
            {techs.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-10">등록된 기사가 없습니다</p>
            )}
            {active.map(t => <TechCard key={t.techId} tech={t} onClick={() => setModal(t)} />)}
            {inactive.length > 0 && (
              <>
                <p className="text-xs text-gray-400 pt-2 pb-1 font-medium">비활성</p>
                {inactive.map(t => <TechCard key={t.techId} tech={t} onClick={() => setModal(t)} />)}
              </>
            )}
          </div>

          {/* 데스크탑: 테이블 */}
          <div className="hidden md:block px-6 py-4">
            {techs.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-10">등록된 기사가 없습니다</p>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">이름</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">연락처</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">아이디</th>
                      <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techs.map(t => (
                      <tr
                        key={t.techId}
                        onClick={() => setModal(t)}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors last:border-0 ${!t.active ? 'opacity-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">{t.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.id}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {t.active ? '활성' : '비활성'}
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

      {modal !== null && (
        <TechModal
          tech={modal.techId ? modal : null}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function TechCard({ tech, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 text-left active:bg-gray-50 transition ${!tech.active ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium text-gray-800 text-sm">{tech.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{tech.phone || '연락처 없음'} · {tech.id}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tech.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {tech.active ? '활성' : '비활성'}
        </span>
      </div>
    </button>
  )
}
