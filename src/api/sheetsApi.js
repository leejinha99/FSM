import dayjs from 'dayjs'

const SCRIPT_URL = import.meta.env.VITE_SCRIPT_URL
const MOCK_MODE = !SCRIPT_URL || SCRIPT_URL.includes('YOUR_DEPLOYMENT')

// ─── 세션 캐시 (정적 데이터용) ────────────────────────────────────────────

const _cache = new Map()

function cacheGet(key) {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > 5 * 60 * 1000) { _cache.delete(key); return null }
  return entry.data
}

function cacheSet(key, data) {
  _cache.set(key, { data, ts: Date.now() })
  return data
}

function cacheDeleteByPrefix(prefix) {
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) _cache.delete(key)
  }
}

// ─── 실제 API 호출 ─────────────────────────────────────────────────────────

async function callApi(action, data = {}) {
  if (!navigator.onLine) {
    throw new Error('네트워크 연결을 확인해주세요.')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, data }),
      redirect: 'follow',
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`서버 오류 (HTTP ${res.status})`)

    const json = await res.json()
    if (!json.success) throw new Error(json.error || '서버 오류가 발생했습니다.')
    return json.data
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function callApiCached(action, data = {}, cacheKey) {
  const key = cacheKey || action
  const cached = cacheGet(key)
  if (cached) return cached
  const result = await callApi(action, data)
  return cacheSet(key, result)
}

// ─── 목(Mock) 데이터 ────────────────────────────────────────────────────────

const today = dayjs().format('YYYY-MM-DD')
const MOCK = {
  warehouses: [
    { warehouseId: 'W001', name: '본사 창고', type: '창고', techId: '' },
    { warehouseId: 'W-T001', name: '김기사 차량', type: '기사', techId: 'T001' },
    { warehouseId: 'W-T002', name: '이기사 차량', type: '기사', techId: 'T002' },
  ],
  stockMoves: [
    { logId: 'SM001', date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), partId: 'P001', partName: '세디멘트 필터', partUnit: '개', type: '입고', fromWarehouseId: 'W001', fromWarehouseName: '본사 창고', toWarehouseId: 'W-T001', toWarehouseName: '김기사 차량', qty: 10, memo: '6월 초도물량' },
    { logId: 'SM002', date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), partId: 'P002', partName: '프리카본 필터', partUnit: '개', type: '입고', fromWarehouseId: 'W001', fromWarehouseName: '본사 창고', toWarehouseId: 'W-T001', toWarehouseName: '김기사 차량', qty: 8, memo: '' },
    { logId: 'SM003', date: dayjs().subtract(10, 'day').format('YYYY-MM-DD'), partId: 'P003', partName: 'UF 멤브레인', partUnit: '개', type: '입고', fromWarehouseId: 'W001', fromWarehouseName: '본사 창고', toWarehouseId: 'W-T001', toWarehouseName: '김기사 차량', qty: 3, memo: '' },
    { logId: 'SM004', date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), partId: 'P002', partName: '프리카본 필터', partUnit: '개', type: '불량교체', fromWarehouseId: 'W-T001', fromWarehouseName: '김기사 차량', toWarehouseId: 'W001', toWarehouseName: '본사 창고', qty: 2, memo: '불량 반납' },
  ],
  techs: [
    { techId: 'T001', name: '김기사', phone: '010-1111-2222', id: 'kim01', password: '1234', role: '기사', active: true },
    { techId: 'T002', name: '이기사', phone: '010-3333-4444', id: 'lee01', password: '1234', role: '기사', active: true },
    { techId: 'ADMIN01', name: '관리자', phone: '010-0000-0001', id: 'admin', password: 'admin1234', role: '관리자', active: true },
  ],
  asTickets: [
    { asId: 'AS001', schoolId: 'S001', schoolName: '한빛초등학교', reportedDate: today, symptom: '물 맛이 이상함', assignedTechId: 'T001', status: '접수', note: '', contractType: '계약', location: '1학년 복도', model: 'WP-3000', paymentMethod: '', paymentInfo: {}, invoiceCompleted: false, schoolNameManual: '', bizNumber: '123-45-67890', email: 'hanbit@edu.kr', quoteSent: false },
    { asId: 'AS002', schoolId: 'S003', schoolName: '푸른고등학교', reportedDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), symptom: '누수 발생', assignedTechId: 'T002', status: '처리중', note: '현장 확인 완료, 부품 교체 필요', contractType: '계약', location: '교장실', model: 'WP-5000', paymentMethod: '', paymentInfo: {}, invoiceCompleted: false, schoolNameManual: '', bizNumber: '987-65-43210', email: 'pureun@edu.kr', quoteSent: false },
    { asId: 'AS003', schoolId: 'S002', schoolName: '별빛중학교', reportedDate: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), symptom: '전원 안 켜짐', assignedTechId: 'T001', status: '완료', note: '전원 케이블 교체 완료', contractType: '미계약', location: '급식실', model: 'WP-5000', paymentMethod: '카드', paymentInfo: {}, invoiceCompleted: false, schoolNameManual: '', bizNumber: '', email: '', quoteSent: false },
    { asId: 'AS004', schoolId: 'S001', schoolName: '한빛초등학교', reportedDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), symptom: '소음 발생', assignedTechId: 'T001', status: '발행대기', note: '펌프 교체 완료', contractType: '계약', location: '교무실', model: 'WP-2000', paymentMethod: '세금계산서', paymentInfo: { repairNote: '펌프 교체', travelFee: true, laborFee: 30000, parts: [], total: 80000, bizNumber: '123-45-67890', invoiceEmail: 'hanbit@edu.kr', invoiceDate: today }, invoiceCompleted: false, schoolNameManual: '', bizNumber: '123-45-67890', email: 'hanbit@edu.kr', quoteSent: true },
  ],
  schools: [
    { schoolId: 'S001', name: '한빛초등학교', region: '서부', address: '서울시 강서구 화곡로 123', contact: '박선생', contactPhone: '02-1234-5678', techId: 'T001', contractType: '유지관리', email: 'hanbit@edu.kr', note: '', bizNumber: '123-45-67890' },
    { schoolId: 'S002', name: '별빛중학교', region: '서부', address: '서울시 양천구 목동로 456', contact: '김담당', contactPhone: '02-8765-4321', techId: 'T001', contractType: '비계약', email: 'byeol@edu.kr', note: '', bizNumber: '' },
    { schoolId: 'S003', name: '푸른고등학교', region: '동부', address: '서울시 광진구 능동로 789', contact: '이선생', contactPhone: '02-5555-6666', techId: 'T002', contractType: '유지관리', email: 'pureun@edu.kr', note: '', bizNumber: '987-65-43210' },
  ],
  equipment: [
    { equipmentId: 'E001', schoolId: 'S001', location: '1학년 복도', model: 'WP-3000', installDate: '2023-03-01', filterInterval: 6, status: '정상' },
    { equipmentId: 'E002', schoolId: 'S001', location: '교무실', model: 'WP-2000', installDate: '2022-09-01', filterInterval: 6, status: '정상' },
    { equipmentId: 'E003', schoolId: 'S002', location: '급식실', model: 'WP-5000', installDate: '2024-01-15', filterInterval: 12, status: '정상' },
    { equipmentId: 'E004', schoolId: 'S003', location: '교장실', model: 'WP-5000', installDate: '2023-03-10', filterInterval: 6, status: '정상' },
    { equipmentId: 'E005', schoolId: 'S003', location: '교무실', model: 'WP-3000', installDate: '2023-03-10', filterInterval: 6, status: '정상' },
  ],
  parts: [
    { partId: 'P001', name: '세디멘트 필터', spec: '5인치', unit: '개', safetyStock: 5, contractPrice: 8000, nonContractPrice: 12000, currentStock: 10, warehouseId: 'W-T001',
      specs: [{ spec: '5인치', contractPrice: 8000, nonContractPrice: 12000 }, { spec: '10인치', contractPrice: 10000, nonContractPrice: 15000 }] },
    { partId: 'P002', name: '프리카본 필터', spec: '5인치', unit: '개', safetyStock: 5, contractPrice: 10000, nonContractPrice: 15000, currentStock: 8, warehouseId: 'W-T001',
      specs: [{ spec: '5인치', contractPrice: 10000, nonContractPrice: 15000 }, { spec: '10인치', contractPrice: 12000, nonContractPrice: 18000 }] },
    { partId: 'P003', name: 'UF 멤브레인', spec: '표준형', unit: '개', safetyStock: 2, contractPrice: 35000, nonContractPrice: 50000, currentStock: 1, warehouseId: 'W-T001',
      specs: [{ spec: '표준형', contractPrice: 35000, nonContractPrice: 50000 }, { spec: '고용량', contractPrice: 45000, nonContractPrice: 65000 }] },
    { partId: 'P004', name: '포스트카본 필터', spec: '5인치', unit: '개', safetyStock: 5, contractPrice: 8000, nonContractPrice: 12000, currentStock: 0, warehouseId: 'W-T001',
      specs: [{ spec: '5인치', contractPrice: 8000, nonContractPrice: 12000 }] },
    { partId: 'P005', name: '역삼투압 멤브레인', spec: '75GPD', unit: '개', safetyStock: 2, contractPrice: 55000, nonContractPrice: 80000, currentStock: 3, warehouseId: 'W-T001',
      specs: [{ spec: '75GPD', contractPrice: 55000, nonContractPrice: 80000 }, { spec: '100GPD', contractPrice: 65000, nonContractPrice: 95000 }] },
  ],
  productNames: [
    { category: '정수기', name: '웰라수 WP-2000' },
    { category: '정수기', name: '웰라수 WP-3000' },
    { category: '정수기', name: '웰라수 WP-5000' },
    { category: '정수기', name: '웰라수 WP-7000' },
    { category: '연수기', name: '웰라수 WS-1000' },
    { category: '연수기', name: '웰라수 WS-2000' },
    { category: '냉온수기', name: '웰라수 WH-3000' },
    { category: '냉온수기', name: '웰라수 WH-5000' },
  ],
  visits: [
    { visitId: 'V001', visitDate: today, visitTime: '09:00', alertSetting: '30분전', schoolId: 'S001', schoolName: '한빛초등학교', techId: 'T001', visitType: '필터교체', workContent: '정기 필터 교체', status: '예정' },
    { visitId: 'V002', visitDate: today, visitTime: '14:00', alertSetting: '30분전', schoolId: 'S002', schoolName: '별빛중학교', techId: 'T001', visitType: 'AS', workContent: '누수 수리', status: '예정' },
    { visitId: 'V003', visitDate: dayjs().add(2, 'day').format('YYYY-MM-DD'), visitTime: '10:00', alertSetting: '끄기', schoolId: 'S001', schoolName: '한빛초등학교', techId: 'T001', visitType: '점검', workContent: '정기 점검', status: '예정' },
    { visitId: 'V004', visitDate: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), visitTime: '09:30', alertSetting: '10분전', schoolId: 'S002', schoolName: '별빛중학교', techId: 'T001', visitType: '필터교체', workContent: '필터 교체 완료', status: '완료' },
    { visitId: 'V005', visitDate: dayjs().add(7, 'day').format('YYYY-MM-DD'), visitTime: '11:00', alertSetting: '1시간전', schoolId: 'S001', schoolName: '한빛초등학교', techId: 'T001', visitType: '설치', workContent: '신규 설치', status: '예정' },
    { visitId: 'V006', visitDate: dayjs().subtract(60, 'day').format('YYYY-MM-DD'), visitTime: '09:00', alertSetting: '끄기', schoolId: 'S001', schoolName: '한빛초등학교', techId: 'T001', visitType: '필터교체', workContent: '정기 필터 교체', status: '완료' },
    { visitId: 'V007', visitDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'), visitTime: '10:00', alertSetting: '끄기', schoolId: 'S003', schoolName: '푸른고등학교', techId: 'T002', visitType: '필터교체', workContent: '필터 교체', status: '완료' },
    { visitId: 'V008', visitDate: dayjs().add(30, 'day').format('YYYY-MM-DD'), visitTime: '09:00', alertSetting: '끄기', schoolId: 'S003', schoolName: '푸른고등학교', techId: 'T002', visitType: '점검', workContent: '정기 점검', status: '예정' },
  ],
}

async function mockDelay(ms = 400) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── API 공개 인터페이스 ────────────────────────────────────────────────────

export const api = {
  async login(id, password) {
    if (MOCK_MODE) {
      await mockDelay()
      const tech = MOCK.techs.find(t => t.id === id && t.password === password && t.active)
      if (!tech) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.')
      return { techId: tech.techId, name: tech.name, phone: tech.phone, role: tech.role }
    }
    return callApi('login', { id, password })
  },

  async getMyVisits(techId, start, end) {
    if (MOCK_MODE) {
      await mockDelay(300)
      return MOCK.visits.filter(v =>
        v.techId === techId && v.visitDate >= start && v.visitDate <= end
      )
    }
    return callApiCached('getMyVisits', { techId, start, end }, `getMyVisits_${techId}_${start}_${end}`)
  },

  async getMySchools(techId, year) {
    if (MOCK_MODE) {
      await mockDelay(200)
      return MOCK.schools.filter(s => s.techId === techId)
    }
    return callApiCached('getMySchools', { techId, year }, `getMySchools_${techId}_${year || ''}`)
  },

  async getEquipment(schoolId) {
    if (MOCK_MODE) {
      await mockDelay(200)
      return MOCK.equipment.filter(e => e.schoolId === schoolId)
    }
    return callApiCached('getEquipment', { schoolId }, `getEquipment_${schoolId}`)
  },

  async getMyParts(techId) {
    if (MOCK_MODE) {
      await mockDelay(200)
      return MOCK.parts
    }
    return callApiCached('getMyParts', { techId }, `getMyParts_${techId}`)
  },

  async getProductNames() {
    if (MOCK_MODE) {
      await mockDelay(100)
      return [...MOCK.productNames]
    }
    return callApiCached('getProductNames', {}, 'getProductNames')
  },

  async getAllPartsInfo() {
    if (MOCK_MODE) {
      await mockDelay(150)
      return MOCK.parts.map(p => ({
        partId:          p.partId,
        name:            p.name,
        spec:            p.specs?.[0]?.spec || p.spec || '',
        unit:            p.unit,
        contractPrice:   p.contractPrice,
        nonContractPrice:p.nonContractPrice,
        specs:           p.specs || [],
      }))
    }
    return callApiCached('getAllPartsInfo', {}, 'getAllPartsInfo')
  },

  async saveVisit(payload) {
    if (MOCK_MODE) {
      await mockDelay(600)
      const visitId = 'V' + Date.now()
      const school = MOCK.schools.find(s => s.schoolId === payload.schoolId)
      MOCK.visits.push({
        visitId,
        visitDate: payload.visitDate,
        visitTime: payload.visitTime,
        alertSetting: payload.alertSetting,
        schoolId: payload.schoolId,
        schoolName: school?.name || '',
        techId: payload.techId,
        visitType: payload.visitType,
        workContent: payload.workContent,
        status: '예정',
      })
      return { visitId }
    }
    const result = await callApi('saveVisit', payload)
    cacheDeleteByPrefix('getMyVisits_')
    cacheDeleteByPrefix('getAllVisits_')
    return result
  },

  // ─── 관리자 전용 ────────────────────────────────────────────────────────────

  async getAllSchools(year) {
    if (MOCK_MODE) { await mockDelay(); return [...MOCK.schools] }
    return callApiCached('getAllSchools', { year }, `getAllSchools_${year || ''}`)
  },

  async getAllTechs() {
    if (MOCK_MODE) { await mockDelay(); return [...MOCK.techs] }
    return callApiCached('getAllTechs', {}, 'getAllTechs')
  },

  async getAllVisits(start, end, techId = null) {
    if (MOCK_MODE) {
      await mockDelay(300)
      const techMap = Object.fromEntries(MOCK.techs.map(t => [t.techId, t.name]))
      let result = MOCK.visits.filter(v => v.visitDate >= start && v.visitDate <= end)
      if (techId) result = result.filter(v => v.techId === techId)
      return result.map(v => ({ ...v, techName: techMap[v.techId] || '' }))
    }
    return callApiCached('getAllVisits', { start, end, techId }, `getAllVisits_${start}_${end}_${techId || ''}`)
  },

  async getAllAS() {
    if (MOCK_MODE) {
      await mockDelay(200)
      const techMap = Object.fromEntries(MOCK.techs.map(t => [t.techId, t.name]))
      return MOCK.asTickets.map(a => ({ ...a, assignedTechName: techMap[a.assignedTechId] || '' }))
    }
    return callApiCached('getAllAS', {}, 'getAllAS')
  },

  async saveSchool(data) {
    if (MOCK_MODE) {
      await mockDelay(500)
      if (data.schoolId) {
        const idx = MOCK.schools.findIndex(s => s.schoolId === data.schoolId)
        if (idx !== -1) MOCK.schools[idx] = { ...MOCK.schools[idx], ...data }
      } else {
        const schoolId = 'S' + String(MOCK.schools.length + 1).padStart(3, '0')
        MOCK.schools.push({ ...data, schoolId })
      }
      return { success: true }
    }
    const result = await callApi('saveSchool', data)
    cacheDeleteByPrefix('getAllSchools_')
    cacheDeleteByPrefix('getMySchools_')
    return result
  },

  async saveTech(data) {
    if (MOCK_MODE) {
      await mockDelay(500)
      if (data.techId) {
        const idx = MOCK.techs.findIndex(t => t.techId === data.techId)
        if (idx !== -1) MOCK.techs[idx] = { ...MOCK.techs[idx], ...data }
      } else {
        const techId = 'T' + String(MOCK.techs.filter(t => t.role === '기사').length + 1).padStart(3, '0')
        MOCK.techs.push({ ...data, techId, role: '기사', active: true })
      }
      return { success: true }
    }
    const result = await callApi('saveTech', data)
    _cache.delete('getAllTechs')
    return result
  },

  async updateAS(asId, updates) {
    if (MOCK_MODE) {
      await mockDelay(300)
      const idx = MOCK.asTickets.findIndex(a => a.asId === asId)
      if (idx !== -1) MOCK.asTickets[idx] = { ...MOCK.asTickets[idx], ...updates }
      return { success: true }
    }
    const result = await callApi('updateAS', { asId, ...updates })
    _cache.delete('getAllAS')
    cacheDeleteByPrefix('getMyAS_')
    _cache.delete('getASInvoices')
    return result
  },

  async getMyAS(techId) {
    if (MOCK_MODE) {
      await mockDelay(200)
      const schoolMap = Object.fromEntries(MOCK.schools.map(s => [s.schoolId, s.name]))
      return MOCK.asTickets
        .filter(a => a.assignedTechId === techId)
        .map(a => ({ ...a, schoolName: schoolMap[a.schoolId] || '' }))
    }
    return callApiCached('getMyAS', { techId }, `getMyAS_${techId}`)
  },

  async updateVisit(visitId, data) {
    if (MOCK_MODE) {
      await mockDelay(500)
      const idx = MOCK.visits.findIndex(v => v.visitId === visitId)
      if (idx !== -1) MOCK.visits[idx] = { ...MOCK.visits[idx], ...data }
      return { visitId }
    }
    const result = await callApi('updateVisit', { visitId, ...data })
    cacheDeleteByPrefix('getMyVisits_')
    cacheDeleteByPrefix('getAllVisits_')
    return result
  },

  async createAS(data) {
    if (MOCK_MODE) {
      await mockDelay(500)
      const asId = 'AS' + String(MOCK.asTickets.length + 1).padStart(3, '0')
      const school = MOCK.schools.find(s => s.schoolId === data.schoolId)
      MOCK.asTickets.push({
        asId,
        schoolId: data.schoolId || '',
        schoolName: data.schoolNameManual || school?.name || '',
        reportedDate: data.reportedDate,
        symptom: data.symptom,
        assignedTechId: data.assignedTechId || '',
        status: '접수',
        note: data.note || '',
        contractType: data.contractType || '',
        location: data.location || '',
        model: data.model || '',
        paymentMethod: '',
        paymentInfo: {},
        invoiceCompleted: false,
        schoolNameManual: data.schoolNameManual || '',
        bizNumber: school?.bizNumber || '',
        email: school?.email || '',
        quoteSent: false,
      })
      return { asId }
    }
    const result = await callApi('createAS', data)
    _cache.delete('getAllAS')
    cacheDeleteByPrefix('getMyAS_')
    return result
  },

  async sendEstimate(asId) {
    if (MOCK_MODE) {
      await mockDelay(300)
      const idx = MOCK.asTickets.findIndex(a => a.asId === asId)
      if (idx !== -1) MOCK.asTickets[idx] = { ...MOCK.asTickets[idx], quoteSent: true }
      return { success: true }
    }
    const result = await callApi('sendEstimate', { asId })
    _cache.delete('getAllAS')
    cacheDeleteByPrefix('getMyAS_')
    return result
  },

  async saveASPayment(data) {
    if (MOCK_MODE) {
      await mockDelay(400)
      const idx = MOCK.asTickets.findIndex(a => a.asId === data.asId)
      if (idx !== -1) {
        const newStatus = data.paymentMethod === '카드' ? '완료' : '발행대기'
        MOCK.asTickets[idx] = { ...MOCK.asTickets[idx], status: newStatus, paymentMethod: data.paymentMethod, paymentInfo: data.paymentInfo || {}, invoiceCompleted: false }
        if (data.bizNumber) MOCK.asTickets[idx].bizNumber = data.bizNumber
        if (data.email) MOCK.asTickets[idx].email = data.email
      }
      return { success: true }
    }
    const result = await callApi('saveASPayment', data)
    _cache.delete('getAllAS')
    cacheDeleteByPrefix('getMyAS_')
    _cache.delete('getASInvoices')
    return result
  },

  async getCentralWarehouseStock() {
    if (MOCK_MODE) {
      await mockDelay(200)
      return MOCK.parts
        .filter(p => p.currentStock > 0)
        .map(p => ({
          partId: p.partId,
          name: p.name,
          spec: p.spec,
          unit: p.unit,
          safetyStock: p.safetyStock,
          currentStock: p.currentStock,
        }))
    }
    return callApiCached('getCentralWarehouseStock', {}, 'getCentralWarehouseStock')
  },

  async saveEstimate(data) {
    if (MOCK_MODE) {
      await mockDelay(400)
      const idx = MOCK.asTickets.findIndex(a => a.asId === data.asId)
      if (idx !== -1) MOCK.asTickets[idx] = { ...MOCK.asTickets[idx], quoteSent: true }
      return { success: true }
    }
    const result = await callApi('saveEstimate', data)
    _cache.delete('getAllAS')
    cacheDeleteByPrefix('getMyAS_')
    return result
  },

  async completeInvoice(asId) {
    if (MOCK_MODE) {
      await mockDelay(400)
      const idx = MOCK.asTickets.findIndex(a => a.asId === asId)
      if (idx !== -1) MOCK.asTickets[idx] = { ...MOCK.asTickets[idx], status: '완료', invoiceCompleted: true }
      return { success: true }
    }
    const result = await callApi('completeInvoice', { asId })
    _cache.delete('getAllAS')
    _cache.delete('getASInvoices')
    return result
  },

  async getASInvoices() {
    if (MOCK_MODE) {
      await mockDelay(200)
      const techMap = Object.fromEntries(MOCK.techs.map(t => [t.techId, t.name]))
      return MOCK.asTickets
        .filter(a => a.status === '발행대기')
        .map(a => ({ ...a, assignedTechName: techMap[a.assignedTechId] || '' }))
    }
    return callApiCached('getASInvoices', {}, 'getASInvoices')
  },

  async getWarehouses() {
    if (MOCK_MODE) {
      await mockDelay(200)
      return [...MOCK.warehouses]
    }
    return callApiCached('getWarehouses', {}, 'getWarehouses')
  },

  async saveStockMove(data) {
    if (MOCK_MODE) {
      await mockDelay(400)
      const logId = 'SM' + Date.now()
      const part = MOCK.parts.find(p => p.partId === data.partId)
      const fromWH = MOCK.warehouses.find(w => w.warehouseId === data.fromWarehouseId)
      const toWH = MOCK.warehouses.find(w => w.warehouseId === data.toWarehouseId)
      MOCK.stockMoves.unshift({
        logId,
        date: data.date,
        partId: data.partId,
        partName: part?.name || '',
        partUnit: part?.unit || '',
        type: data.type,
        fromWarehouseId: data.fromWarehouseId,
        fromWarehouseName: fromWH?.name || '',
        toWarehouseId: data.toWarehouseId,
        toWarehouseName: toWH?.name || '',
        qty: Number(data.qty) || 0,
        memo: data.memo || '',
      })
      // 목업 재고 반영
      const partIdx = MOCK.parts.findIndex(p => p.partId === data.partId)
      if (partIdx !== -1) {
        if (toWH?.type === '기사') MOCK.parts[partIdx].currentStock += Number(data.qty) || 0
        if (fromWH?.type === '기사') MOCK.parts[partIdx].currentStock -= Number(data.qty) || 0
      }
      return { logId }
    }
    const result = await callApi('saveStockMove', data)
    cacheDeleteByPrefix('getMyParts_')
    cacheDeleteByPrefix('getStockMoves_')
    _cache.delete('getCentralWarehouseStock')
    return result
  },

  async getStockMoves({ techId, warehouseId, year, month } = {}) {
    if (MOCK_MODE) {
      await mockDelay(300)
      let moves = [...MOCK.stockMoves]
      if (warehouseId) {
        moves = moves.filter(m => m.fromWarehouseId === warehouseId || m.toWarehouseId === warehouseId)
      } else if (techId) {
        const wh = MOCK.warehouses.find(w => w.type === '기사' && w.techId === techId)
        moves = wh ? moves.filter(m => m.fromWarehouseId === wh.warehouseId || m.toWarehouseId === wh.warehouseId) : []
      }
      if (year) moves = moves.filter(m => m.date.startsWith(String(year)))
      if (month) {
        const pad = String(month).padStart(2, '0')
        moves = moves.filter(m => m.date.startsWith(String(year) + '-' + pad))
      }
      return moves
    }
    return callApiCached('getStockMoves', { techId, warehouseId, year, month }, `getStockMoves_${techId || ''}_${warehouseId || ''}_${year || ''}_${month || ''}`)
  },
}

export const isMockMode = MOCK_MODE

// ─── 로그인 직후 백그라운드 프리패치 (Method B) ──────────────────────────────
export function prefetchForUser(user) {
  if (MOCK_MODE || !navigator.onLine) return
  const start = dayjs().startOf('month').format('YYYY-MM-DD')
  const end = dayjs().endOf('month').format('YYYY-MM-DD')

  if (user.role === '기사') {
    callApiCached('getMyVisits', { techId: user.techId, start, end }, `getMyVisits_${user.techId}_${start}_${end}`)
    const defaultYear = (new Date().getMonth() + 1) >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1
    callApiCached('getMySchools', { techId: user.techId, year: defaultYear }, `getMySchools_${user.techId}_${defaultYear}`)
    callApiCached('getMyParts', { techId: user.techId }, `getMyParts_${user.techId}`)
    callApiCached('getMyAS', { techId: user.techId }, `getMyAS_${user.techId}`)
  } else {
    callApiCached('getAllSchools', {}, 'getAllSchools_')
    callApiCached('getAllTechs', {}, 'getAllTechs')
    callApiCached('getAllAS', {}, 'getAllAS')
    callApiCached('getAllVisits', { start, end, techId: null }, `getAllVisits_${start}_${end}_`)
  }
}
