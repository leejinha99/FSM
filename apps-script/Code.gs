// ============================================================
//  웰라수 FSM — Google Apps Script 백엔드
//  배포: Apps Script → 배포 → 웹앱
//       실행 계정: 나(Me)
//       액세스 권한: 모든 사용자(Anonymous)
//
//  시트 ID 설정:
//    Apps Script → 프로젝트 설정 → 스크립트 속성 추가
//    속성명: SHEET_ID  / 값: 스프레드시트 ID
// ============================================================

var SHEET_ID = '1xIMF70ISC6rKMZ0kfpwnUV49IDNvYs2_IDYyaNHtMSo';

// ── 진입점 ──────────────────────────────────────────────────

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var data = params.data || {};
    var result;

    switch (action) {
      case 'login':         result = handleLogin(data);         break;
      case 'getMyVisits':   result = handleGetMyVisits(data);   break;
      case 'getMySchools':  result = handleGetMySchools(data);  break;
      case 'getEquipment':  result = handleGetEquipment(data);  break;
      case 'getMyParts':    result = handleGetMyParts(data);    break;
      case 'saveVisit':     result = handleSaveVisit(data);     break;
      case 'getAllSchools':  result = handleGetAllSchools(data); break;
      case 'getAllTechs':    result = handleGetAllTechs(data);   break;
      case 'getAllVisits':   result = handleGetAllVisits(data);  break;
      case 'getAllAS':       result = handleGetAllAS(data);      break;
      case 'saveSchool':    result = handleSaveSchool(data);    break;
      case 'saveTech':      result = handleSaveTech(data);      break;
      case 'updateAS':      result = handleUpdateAS(data);      break;
      case 'getMyAS':       result = handleGetMyAS(data);       break;
      case 'createAS':      result = handleCreateAS(data);      break;
      case 'updateVisit':    result = handleUpdateVisit(data);    break;
      case 'getWarehouses':  result = handleGetWarehouses(data);  break;
      case 'saveStockMove':  result = handleSaveStockMove(data);  break;
      case 'getStockMoves':  result = handleGetStockMoves(data);  break;
      case 'saveASPayment':  result = handleSaveASPayment(data);  break;
      case 'completeInvoice':result = handleCompleteInvoice(data);break;
      case 'getASInvoices':    result = handleGetASInvoices(data);    break;
      case 'getProductNames':  result = handleGetProductNames(data);  break;
      case 'getAllPartsInfo':  result = handleGetAllPartsInfo(data);  break;
      case 'sendEstimate':    result = handleSendEstimate(data);    break;
      case 'saveEstimate':   result = handleSaveEstimate(data);   break;
      case 'getCentralWarehouseStock': result = handleGetCentralWarehouseStock(data); break;
      case 'getDashcamPhotos':     result = handleGetDashcamPhotos(data);     break;
      case 'saveDashcamPhoto':     result = handleSaveDashcamPhoto(data);     break;
      case 'getAllEquipmentStats': result = handleGetAllEquipmentStats(data); break;
      default:
        throw new Error('알 수 없는 액션: ' + action);
    }

    return jsonOk(result);
  } catch (err) {
    return jsonErr(err.message);
  }
}

function doGet(e) {
  try {
    if (e.parameter && e.parameter.action) {
      var action = e.parameter.action;
      var data = e.parameter.data ? JSON.parse(e.parameter.data) : {};
      var result;
      switch (action) {
        case 'login':        result = handleLogin(data);          break;
        case 'getMyVisits':  result = handleGetMyVisits(data);    break;
        case 'getMySchools': result = handleGetMySchools(data);   break;
        case 'getEquipment': result = handleGetEquipment(data);   break;
        case 'getMyParts':   result = handleGetMyParts(data);     break;
        case 'saveVisit':    result = handleSaveVisit(data);      break;
        case 'getAllSchools': result = handleGetAllSchools(data);  break;
        case 'getAllTechs':   result = handleGetAllTechs(data);    break;
        case 'getAllVisits':  result = handleGetAllVisits(data);   break;
        case 'getAllAS':      result = handleGetAllAS(data);       break;
        case 'saveSchool':   result = handleSaveSchool(data);     break;
        case 'saveTech':     result = handleSaveTech(data);       break;
        case 'updateAS':     result = handleUpdateAS(data);       break;
        case 'getMyAS':      result = handleGetMyAS(data);        break;
        case 'createAS':     result = handleCreateAS(data);       break;
        case 'updateVisit':  result = handleUpdateVisit(data);    break;
        case 'getWarehouses':   result = handleGetWarehouses(data);   break;
        case 'saveStockMove':   result = handleSaveStockMove(data);   break;
        case 'getStockMoves':   result = handleGetStockMoves(data);   break;
        case 'saveASPayment':   result = handleSaveASPayment(data);   break;
        case 'completeInvoice': result = handleCompleteInvoice(data); break;
        case 'getASInvoices':   result = handleGetASInvoices(data);   break;
        case 'getProductNames': result = handleGetProductNames(data); break;
        case 'getAllPartsInfo':  result = handleGetAllPartsInfo(data); break;
        case 'sendEstimate':    result = handleSendEstimate(data);   break;
        case 'saveEstimate':   result = handleSaveEstimate(data);   break;
        case 'getCentralWarehouseStock': result = handleGetCentralWarehouseStock(data); break;
        case 'getDashcamPhotos':     result = handleGetDashcamPhotos(data);     break;
        case 'getAllEquipmentStats': result = handleGetAllEquipmentStats(data); break;
        default:
          throw new Error('알 수 없는 액션: ' + action);
      }
      return jsonOk(result);
    }
    return jsonOk({ status: 'ok', message: '웰라수 FSM API 동작 중' });
  } catch (err) {
    return jsonErr(err.message);
  }
}

// ── 응답 헬퍼 ───────────────────────────────────────────────

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonErr(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── 시트 접근 헬퍼 ─────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name);
}

// 관리년도 계산 (3월~다음해 2월 = 같은 관리년도)
function getCurrentMgmtYear() {
  var now = new Date();
  var month = now.getMonth() + 1;
  var year = now.getFullYear();
  return month >= 3 ? year : year - 1;
}

// 연도별 학교 시트 접근: 학교[2026] 없으면 학교 fallback
function getSchoolSheet(year) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var named = ss.getSheetByName('학교[' + year + ']');
  return named || ss.getSheetByName('학교');
}

// 기사ID(코드) → 기사 이름 변환. 이미 이름이거나 못 찾으면 입력값 그대로 반환.
// 학교 시트 '담당기사' 칸이 이름으로 통일되어, 로그인이 보내는 코드(T001)를 이름으로 바꿔 매칭한다.
function getTechNameById(techId) {
  var key = String(techId || '').trim();
  if (!key) return key;
  var rows = getSheet('기사').getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === key) return String(rows[i][1]).trim();
  }
  return key;
}

// 학교명 매칭용 정규화: 공백/줄바꿈 모두 제거 (학교 시트 ↔ 설치장비 시트 표기 차이 흡수)
function normName(s) {
  return String(s == null ? '' : s).replace(/\s+/g, '');
}

function sheetToObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  return values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

// ── ID 생성 ────────────────────────────────────────────────

function makeId(prefix) {
  return prefix + Date.now() + Math.floor(Math.random() * 1000);
}

// ── 날짜 포맷 ──────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '';
  var dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return String(d);
  return Utilities.formatDate(dt, 'Asia/Seoul', 'yyyy-MM-dd');
}

function formatTime(t) {
  if (!t) return '';
  var dt = t instanceof Date ? t : new Date(t);
  if (isNaN(dt)) return String(t);
  return String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
}

// ────────────────────────────────────────────────────────────
//  핸들러
// ────────────────────────────────────────────────────────────

// 기사 시트 컬럼 순서:
// 기사ID(0) | 이름(1) | 연락처(2) | 아이디(3) | 비밀번호(4) | 직함(5) | 권한(6) | 활성여부(7)
function handleLogin(data) {
  var sheet = getSheet('기사');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var id       = String(row[3]).trim();
    var password = String(row[4]).trim();
    var active   = row[7];

    if (id === data.id && password === data.password && active) {
      return {
        techId: String(row[0]),
        name:   String(row[1]),
        phone:  String(row[2]),
        title:  String(row[5] || ''),
        role:   String(row[6]),
      };
    }
  }

  throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
}

// 방문기록 시트 컬럼 순서:
// 방문ID | 방문일 | 방문시간 | 알림설정 | 학교ID | 대상장비 | 기사ID |
// 방문유형 | 작업내용 | 다음예정일 | 출장비 | 인건비 | 공임 | 부품비 | 합계 |
// 결제방식 | 결제금액 | 발행상태 | 통장사본발송여부 | 상태 | 연결ASID
function handleGetMyVisits(data) {
  var visitSheet  = getSheet('방문기록');
  var year = data.year || getCurrentMgmtYear();
  var schoolSheet = getSchoolSheet(year);

  var schoolMap = {};
  var sRows = schoolSheet.getDataRange().getValues();
  for (var si = 1; si < sRows.length; si++) {
    var sInfo = {
      name:         String(sRows[si][5]),
      contractType: String(sRows[si][9] || ''),
    };
    schoolMap[String(sRows[si][0])] = sInfo;
    schoolMap['#' + normName(sRows[si][5])] = sInfo;
  }

  var rows = visitSheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var techId    = String(r[6]);
    var visitDate = formatDate(r[1]);

    if (getTechNameById(techId) !== getTechNameById(data.techId)) continue;
    if (visitDate < data.start || visitDate > data.end) continue;

    var schoolId   = String(r[4]);
    var schoolInfo = schoolMap[schoolId] || schoolMap['#' + normName(schoolId)] || {};
    result.push({
      visitId:      String(r[0]),
      visitDate:    visitDate,
      visitTime:    formatTime(r[2]),
      alertSetting: String(r[3]),
      schoolId:     schoolId,
      schoolName:   schoolInfo.name || schoolId,
      contractType: schoolInfo.contractType || '',
      techId:       techId,
      visitType:    String(r[7]),
      workContent:  String(r[8]),
      nextScheduledDate: formatDate(r[9]),
      status:       String(r[19]),
    });
  }

  return result;
}

// 학교 시트 컬럼 순서:
// 학교ID(0)|담당기사ID(1)|담당자(2)|계약자(3)|지역(4)|학교명(5)|주소(6)|
// 담당자연락처(7)|학교이메일(8)|계약구분(9)|사업자번호(10)|사업자등록증링크(11)|비고(12)
function handleGetMySchools(data) {
  var year = data.year || getCurrentMgmtYear();
  var techName = getTechNameById(data.techId);
  var rows = getSchoolSheet(year).getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[1]).trim() !== techName) continue;
    result.push({
      schoolId:            String(r[0]).trim() || String(r[5]).trim(),
      techId:              String(r[1]),
      contact:             String(r[2]),
      contractor:          String(r[3] || ''),
      region:              String(r[4]),
      name:                String(r[5]),
      address:             String(r[6]),
      contactPhone:        String(r[7]),
      email:               String(r[8]),
      contractType:        String(r[9]),
      bizNumber:           String(r[10] || ''),
      bizRegistrationLink: String(r[11] || ''),
      note:                String(r[12] || ''),
    });
  }
  return result;
}

// 설치장비 시트 컬럼 순서:
// 장비ID(0)|학교ID(1)|학교명(2)|설치위치(3)|모델명(4)|설치대수(5)|설치일자(6)|
// 계약구분(7)|임대/무상기간(8)|면제달(9)|필터교체주기(10)|비고(11)
function handleGetEquipment(data) {
  // 학교명(정규화)→ID 맵 구성 (설치장비 시트 B컬럼에 학교명이 저장된 경우 대비)
  var year = getCurrentMgmtYear();
  var schoolRows = getSchoolSheet(year).getDataRange().getValues();
  var nameToId = {};
  for (var si = 1; si < schoolRows.length; si++) {
    nameToId[normName(schoolRows[si][5])] = String(schoolRows[si][0]);
  }

  var key     = normName(data.schoolId);
  var keyName = data.schoolName ? normName(data.schoolName) : '';

  var rows = getSheet('설치장비').getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var rawId   = String(r[1]);
    var rawName = String(r[2] || '');
    // 학교명/ID를 정규화(공백·줄바꿈 제거)해서 매칭
    var resolvedId = nameToId[normName(rawName)] || nameToId[normName(rawId)] || rawId;

    var matches =
      normName(resolvedId) === key ||
      normName(rawId)      === key ||
      normName(rawName)    === key ||
      (keyName && (normName(rawName) === keyName || normName(rawId) === keyName));

    if (!matches) continue;
    result.push({
      equipmentId:    String(r[0]),
      schoolId:       resolvedId,
      schoolName:     rawName || rawId,
      location:       String(r[3]),
      model:          String(r[4]),
      installCount:   Number(r[5]) || 1,
      installDate:    formatDate(r[6]),
      contractType:   String(r[7] || ''),
      leasePeriod:    String(r[8] || ''),
      exemptMonth:    String(r[9] || ''),
      filterInterval: Number(r[10]) || 6,
      note:           String(r[11] || ''),
    });
  }
  return result;
}

// 학교별 설치 통계 (설치대수 합계 + 면제달)
function handleGetAllEquipmentStats(data) {
  // 학교명(정규화) 기준으로 설치대수 합산 + 면제달 집계.
  // schoolId가 비어있는 학교가 많아 ID 대신 학교명으로 매칭한다.
  var rows = getSheet('설치장비').getDataRange().getValues();
  if (rows.length < 2) return [];

  var stats = {};
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var rawName = String(r[2] || r[1] || '');
    var key = normName(rawName);
    if (!key) continue;

    var cnt         = Number(r[5]) || 1;
    var exemptMonth = String(r[9] || '');

    if (!stats[key]) {
      stats[key] = { schoolName: rawName, schoolId: String(r[1] || ''), totalInstall: 0, exemptMonth: '' };
    }
    stats[key].totalInstall += cnt;
    if (exemptMonth && !stats[key].exemptMonth) {
      stats[key].exemptMonth = exemptMonth;
    }
  }
  return Object.values(stats);
}

// 제품명 시트 컬럼 순서: 품목 | 제품명
function handleGetProductNames(data) {
  var sheet = getSheet('제품명');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[1]) continue;
    result.push({
      category: String(r[0] || ''),
      name:     String(r[1] || ''),
    });
  }
  return result;
}

// 부품 시트: 부품ID | 부품명 | 규격 | 단위 | 안전재고 | 계약단가 | 비계약단가
// 창고 시트: 창고ID | 창고명 | 종류 | 연결기사ID
// 재고이동 시트: 로그ID | 일자 | 부품ID | 구분 | 출발창고 | 도착창고 | 수량 | 메모
// 부품사용 시트: 로그ID | 방문ID | 장비ID | 부품ID | 수량 | 출고창고 | 적용단가구분 | 적용단가 | 금액
function handleGetMyParts(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  // 1. 기사 차량 창고 ID 찾기
  var warehouseRows = ss.getSheetByName('창고').getDataRange().getValues();
  var warehouseId = null;
  for (var i = 1; i < warehouseRows.length; i++) {
    var wr = warehouseRows[i];
    if (String(wr[2]) === '기사' && String(wr[3]) === data.techId) {
      warehouseId = String(wr[0]);
      break;
    }
  }

  if (!warehouseId) return [];

  // 2. 재고이동 집계
  var stockMap = {};
  var moveRows = ss.getSheetByName('재고이동').getDataRange().getValues();
  for (var i = 1; i < moveRows.length; i++) {
    var mr = moveRows[i];
    var partId = String(mr[2]);
    var from   = String(mr[4]);
    var to     = String(mr[5]);
    var qty    = Number(mr[6]) || 0;
    if (!stockMap[partId]) stockMap[partId] = 0;
    if (to   === warehouseId) stockMap[partId] += qty;
    if (from === warehouseId) stockMap[partId] -= qty;
  }

  // 3. 부품사용 집계
  var useRows = ss.getSheetByName('부품사용').getDataRange().getValues();
  for (var i = 1; i < useRows.length; i++) {
    var ur = useRows[i];
    var partId = String(ur[3]);
    var from   = String(ur[5]);
    var qty    = Number(ur[4]) || 0;
    if (!stockMap[partId]) stockMap[partId] = 0;
    if (from === warehouseId) stockMap[partId] -= qty;
  }

  // 4. 부품 목록 반환 — 부품ID 빈 경우 행 번호로 대체, 병합 셀 부품명 이어받기
  var partSheet = ss.getSheetByName('부품');
  var partRows = partSheet.getDataRange().getValues();
  if (partRows.length < 2) return [];

  var headers = partRows[0];
  var col = {};
  headers.forEach(function(h, i) { col[String(h).trim()] = i; });

  var result = [];
  var lastName = '';

  for (var i = 1; i < partRows.length; i++) {
    var r = partRows[i];

    var pid = String(r[col['부품ID']] || '').trim();
    if (!pid) pid = 'ROW' + i;

    var name = String(r[col['부품명']] || '').trim();
    if (name) lastName = name;
    else name = lastName;
    if (!name) continue;

    result.push({
      partId:           pid,
      name:             name,
      spec:             String(r[col['규격']]        || '').trim(),
      unit:             String(r[col['단위']]        || '').trim(),
      safetyStock:      Number(r[col['안전재고']])   || 0,
      contractPrice:    Number(r[col['계약단가']])   || 0,
      nonContractPrice: Number(r[col['비계약단가']]) || 0,
      currentStock:     stockMap[pid] || 0,
      warehouseId:      warehouseId,
    });
  }

  return result;
}

// 부품 전체 목록 조회 (재고 무관, 결제 처리 시 사용)
// 부품ID가 비어 있으면 행 번호로 대체, 병합 셀(부품명 공백)은 마지막 부품명 이어받기
function handleGetAllPartsInfo(data) {
  var sheet = getSheet('부품');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  var headers = rows[0];
  var col = {};
  headers.forEach(function(h, i) { col[String(h).trim()] = i; });

  var result = [];
  var lastName = '';

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];

    var pid = String(r[col['부품ID']] || '').trim();
    if (!pid) pid = 'ROW' + i;

    var name = String(r[col['부품명']] || '').trim();
    if (name) lastName = name;
    else name = lastName;
    if (!name) continue;

    var spec             = String(r[col['규격']]       || '').trim();
    var contractPrice    = Number(r[col['계약단가']])  || 0;
    var nonContractPrice = Number(r[col['비계약단가']]) || 0;

    result.push({
      partId:           pid,
      name:             name,
      spec:             spec,
      unit:             String(r[col['단위']] || '').trim(),
      contractPrice:    contractPrice,
      nonContractPrice: nonContractPrice,
      specs: [{ spec: spec, contractPrice: contractPrice, nonContractPrice: nonContractPrice }],
    });
  }
  return result;
}

// 방문기록 + 부품사용 + (선택) 설치장비 동시 저장
function handleSaveVisit(data) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (e) {
    throw new Error('다른 저장 요청 처리 중입니다. 잠시 후 다시 시도해주세요.');
  }

  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var visitId = makeId('V');
    var today   = formatDate(new Date());

    // ── 미계약 설치: 학교명 직접입력이면 학교 신규 생성 ──────
    // 학교 시트 컬럼: 학교ID(0)|담당기사ID(1)|담당자(2)|계약자(3)|지역(4)|학교명(5)|주소(6)|담당자연락처(7)|학교이메일(8)|계약구분(9)|사업자번호(10)|사업자등록증링크(11)|비고(12)
    var resolvedSchoolId = data.schoolId || '';
    if (data.visitType === '설치' && !resolvedSchoolId && data.schoolNameManual) {
      var schoolSheet2 = getSchoolSheet(getCurrentMgmtYear());
      var newSchoolId = makeId('S');
      schoolSheet2.appendRow([
        newSchoolId,
        data.techId || '',
        '', '',
        data.regionManual || '',
        data.schoolNameManual,
        '', '', '',
        '비계약',
        '', '', '',
      ]);
      resolvedSchoolId = newSchoolId;
    }

    // ── 설치 유형이면 장비 먼저 등록 ──────────────────────
    if (data.visitType === '설치' && data.newEquipment) {
      var eqSheet = ss.getSheetByName('설치장비');
      var eqId = makeId('E');
      var schoolNameForEq = data.newEquipment.schoolName || data.schoolNameManual || '';
      if (!schoolNameForEq && resolvedSchoolId) {
        var schoolSheet = getSchoolSheet(getCurrentMgmtYear());
        var sRows = schoolSheet.getDataRange().getValues();
        for (var si = 1; si < sRows.length; si++) {
          if (String(sRows[si][0]) === resolvedSchoolId) { schoolNameForEq = String(sRows[si][5]); break; }
        }
      }
      // 설치장비 시트: 장비ID(0)|학교ID(1)|학교명(2)|설치위치(3)|모델명(4)|설치대수(5)|설치일자(6)|계약구분(7)|임대/무상기간(8)|면제달(9)|필터교체주기(10)|비고(11)
      eqSheet.appendRow([
        eqId,                                      // 0: 장비ID
        resolvedSchoolId,                          // 1: 학교ID
        schoolNameForEq,                           // 2: 학교명
        data.newEquipment.location || '',          // 3: 설치위치
        data.newEquipment.model    || '',          // 4: 모델명
        1,                                         // 5: 설치대수
        data.newEquipment.installDate || today,    // 6: 설치일자
        '',                                        // 7: 계약구분
        '',                                        // 8: 임대/무상기간
        '',                                        // 9: 면제달
        data.newEquipment.filterInterval || 6,     // 10: 필터교체주기
        '',                                        // 11: 비고
      ]);
    }

    // ── 방문기록 저장 ──────────────────────────────────────
    var visitSheet = ss.getSheetByName('방문기록');
    var eqStr = Array.isArray(data.selectedEquipment)
      ? data.selectedEquipment.join(',')
      : '전체';

    visitSheet.appendRow([
      visitId,                          // 방문ID
      data.visitDate,                   // 방문일
      data.visitTime,                   // 방문시간
      data.alertSetting || '끄기',      // 알림설정
      resolvedSchoolId,                 // 학교ID
      eqStr,                            // 대상장비
      data.techId,                      // 기사ID
      data.visitType,                   // 방문유형
      data.workContent || '',           // 작업내용
      data.nextScheduledDate || '',     // 다음예정일
      Number(data.travelFee) || 0,      // 출장비
      Number(data.laborFee)  || 0,      // 인건비
      Number(data.workFee)   || 0,      // 공임
      Number(data.partsFee)  || 0,      // 부품비
      Number(data.total)     || 0,      // 합계
      data.paymentMethod || '',         // 결제방식
      Number(data.paymentAmount) || 0,  // 결제금액
      data.invoiceStatus || '',         // 발행상태
      false,                            // 통장사본발송여부
      '예정',                            // 상태
      data.asId || '',                  // 연결ASID
    ]);

    // ── 부품사용 저장 ──────────────────────────────────────
    var puSheet = ss.getSheetByName('부품사용');
    var partsUsed = data.partsUsed || [];
    for (var i = 0; i < partsUsed.length; i++) {
      var p = partsUsed[i];
      if (!p.partId) continue;
      puSheet.appendRow([
        makeId('PU'),       // 로그ID
        visitId,            // 방문ID
        p.equipmentId || '',// 장비ID
        p.partId,           // 부품ID
        Number(p.qty) || 1, // 수량
        p.warehouseId || '',// 출고창고
        p.priceType || '',  // 적용단가구분
        Number(p.unitPrice) || 0, // 적용단가
        Number(p.amount)   || 0,  // 금액
      ]);
    }

    // ── 기사별관리일정 시트에 관리년도 기록 ─────────────────────
    var visitDate = data.visitDate ? new Date(data.visitDate) : new Date();
    var vMonth   = visitDate.getMonth() + 1;
    var vYear    = visitDate.getFullYear();
    var mgmtYear = (vMonth >= 3) ? vYear : vYear - 1;

    var schedSheet = ss.getSheetByName('기사별관리일정');
    if (!schedSheet) {
      schedSheet = ss.insertSheet('기사별관리일정');
    }
    var schedVals = schedSheet.getLastRow() > 0
      ? schedSheet.getRange(1, 1, schedSheet.getLastRow(), 1).getValues()
      : [];
    var yearExists = false;
    for (var yi = 0; yi < schedVals.length; yi++) {
      if (String(schedVals[yi][0]) === String(mgmtYear)) { yearExists = true; break; }
    }
    if (!yearExists) {
      schedSheet.appendRow([mgmtYear]);
    }

    return { visitId: visitId };
  } finally {
    lock.releaseLock();
  }
}

// ────────────────────────────────────────────────────────────
//  관리자 핸들러
// ────────────────────────────────────────────────────────────

// 학교 전체 조회
// 학교 시트: 학교ID(0)|담당기사ID(1)|담당자(2)|계약자(3)|지역(4)|학교명(5)|주소(6)|담당자연락처(7)|학교이메일(8)|계약구분(9)|사업자번호(10)|사업자등록증링크(11)|비고(12)
function handleGetAllSchools(data) {
  var year = data.year || getCurrentMgmtYear();
  var rows = getSchoolSheet(year).getDataRange().getValues();
  if (rows.length < 2) return [];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    result.push({
      schoolId:            String(r[0]).trim() || String(r[5]).trim(),
      techId:              String(r[1]),
      contact:             String(r[2]),
      contractor:          String(r[3] || ''),
      region:              String(r[4]),
      name:                String(r[5]),
      address:             String(r[6]),
      contactPhone:        String(r[7]),
      email:               String(r[8]),
      contractType:        String(r[9]),
      bizNumber:           String(r[10] || ''),
      bizRegistrationLink: String(r[11] || ''),
      note:                String(r[12] || ''),
    });
  }
  return result;
}

// 기사 전체 조회
// 기사ID(0)|이름(1)|연락처(2)|아이디(3)|비밀번호(4)|직함(5)|권한(6)|활성여부(7)
function handleGetAllTechs(data) {
  var rows = getSheet('기사').getDataRange().getValues();
  if (rows.length < 2) return [];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    result.push({
      techId: String(r[0]),
      name:   String(r[1]),
      phone:  String(r[2]),
      id:     String(r[3]),
      title:  String(r[5] || ''),
      role:   String(r[6]),
      active: Boolean(r[7]),
    });
  }
  return result;
}

// 방문기록 전체 조회 (관리자용)
function handleGetAllVisits(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var year = data.year || getCurrentMgmtYear();
  var schoolMap = {};
  sheetToObjects(getSchoolSheet(year)).forEach(function(s) {
    schoolMap[s['학교ID']] = s['학교명'];
    schoolMap['#' + normName(s['학교명'])] = s['학교명'];
  });
  var techMap = {};
  sheetToObjects(ss.getSheetByName('기사')).forEach(function(t) {
    techMap[t['기사ID']] = t['이름'];
  });

  var rows = ss.getSheetByName('방문기록').getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var visitDate = formatDate(r[1]);
    var techId    = String(r[6]);

    if (visitDate < data.start || visitDate > data.end) continue;
    if (data.techId && getTechNameById(techId) !== getTechNameById(data.techId)) continue;

    result.push({
      visitId:     String(r[0]),
      visitDate:   visitDate,
      visitTime:   formatTime(r[2]),
      schoolId:    String(r[4]),
      schoolName:  schoolMap[String(r[4])] || schoolMap['#' + normName(String(r[4]))] || String(r[4]),
      techId:      techId,
      techName:    techMap[techId] || techId,
      visitType:   String(r[7]),
      workContent: String(r[8]),
      nextScheduledDate: formatDate(r[9]),
      status:      String(r[19]),
    });
  }
  return result;
}

// AS접수 전체 조회
function handleGetAllAS(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var year = data.year || getCurrentMgmtYear();
  var schoolMap = {};
  sheetToObjects(getSchoolSheet(year)).forEach(function(s) {
    var sInfo = { name: s['학교명'], bizNumber: s['사업자번호'] || '', email: s['학교이메일'] || '' };
    schoolMap[s['학교ID']] = sInfo;
    schoolMap['#' + normName(s['학교명'])] = sInfo;
  });
  var techMap = {};
  sheetToObjects(ss.getSheetByName('기사')).forEach(function(t) {
    techMap[t['기사ID']] = t['이름'];
  });

  var asSheet = ss.getSheetByName('AS접수');
  var rows = asSheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var assignedTechId = String(r[4]);
    var schoolId = String(r[1]);
    var schoolInfo = schoolMap[schoolId] || schoolMap['#' + normName(schoolId)] || {};
    var schoolNameManual = String(r[13] || '');
    var paymentInfoRaw = String(r[11] || '');
    var paymentInfo = {};
    try { if (paymentInfoRaw) paymentInfo = JSON.parse(paymentInfoRaw); } catch(e) {}
    result.push({
      asId:              String(r[0]),
      schoolId:          schoolId,
      schoolName:        schoolNameManual || schoolInfo.name || schoolId,
      reportedDate:      formatDate(r[2]),
      symptom:           String(r[3]),
      assignedTechId:    assignedTechId,
      assignedTechName:  techMap[assignedTechId] || assignedTechId,
      status:            String(r[5]),
      note:              String(r[6] || ''),
      contractType:      String(r[7] || ''),
      location:          String(r[8] || ''),
      model:             String(r[9] || ''),
      paymentMethod:     String(r[10] || ''),
      paymentInfo:       paymentInfo,
      invoiceCompleted:  Boolean(r[12]),
      schoolNameManual:  schoolNameManual,
      bizNumber:         schoolInfo.bizNumber || '',
      email:             schoolInfo.email || '',
      quoteSent:         Boolean(r[14]),
    });
  }
  return result;
}

// 학교 저장 (추가/수정)
// 새 컬럼: 학교ID(0)|담당기사ID(1)|담당자(2)|계약자(3)|지역(4)|학교명(5)|주소(6)|담당자연락처(7)|학교이메일(8)|계약구분(9)|사업자번호(10)|사업자등록증링크(11)|비고(12)
function handleSaveSchool(data) {
  var year = data.year || getCurrentMgmtYear();
  var sheet = getSchoolSheet(year);
  var rows = sheet.getDataRange().getValues();

  if (data.schoolId) {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === data.schoolId || normName(rows[i][5]) === normName(data.schoolId)) {
        sheet.getRange(i + 1, 1, 1, 13).setValues([[
          rows[i][0],
          data.techId       || '',
          data.contact      || '',
          rows[i][3],
          data.region       || '',
          data.name         || '',
          data.address      || '',
          data.contactPhone || '',
          data.email        || '',
          data.contractType || '',
          data.bizNumber    || '',
          rows[i][11],
          data.note         || '',
        ]]);
        return { schoolId: data.schoolId };
      }
    }
  }

  var schoolId = makeId('S');
  sheet.appendRow([
    schoolId,
    data.techId       || '',
    data.contact      || '',
    '',
    data.region       || '',
    data.name         || '',
    data.address      || '',
    data.contactPhone || '',
    data.email        || '',
    data.contractType || '유지관리',
    data.bizNumber    || '',
    '',
    data.note         || '',
  ]);
  return { schoolId: schoolId };
}

// 기사 저장 (추가/수정)
// col: ID(1) 이름(2) 연락처(3) 아이디(4) 비밀번호(5) 직함(6) 권한(7) 활성여부(8)
function handleSaveTech(data) {
  var sheet = getSheet('기사');
  var rows = sheet.getDataRange().getValues();

  if (data.techId) {
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === data.techId) {
        var row = i + 1;
        sheet.getRange(row, 2).setValue(data.name  || rows[i][1]);
        sheet.getRange(row, 3).setValue(data.phone || rows[i][2]);
        if (data.id)                                  sheet.getRange(row, 4).setValue(data.id);
        if (data.password)                            sheet.getRange(row, 5).setValue(data.password);
        if (typeof data.title !== 'undefined')        sheet.getRange(row, 6).setValue(data.title);
        if (data.role)                                sheet.getRange(row, 7).setValue(data.role);
        if (typeof data.active !== 'undefined')       sheet.getRange(row, 8).setValue(data.active);
        return { techId: data.techId };
      }
    }
  }

  var techId = makeId('T');
  sheet.appendRow([
    techId,
    data.name     || '',
    data.phone    || '',
    data.id       || '',
    data.password || '',
    data.title    || '',
    data.role     || '기사',
    true,
  ]);
  return { techId: techId };
}

// 기사 배정 AS 조회
// AS접수 시트 컬럼:
// AS접수ID(0)|학교ID(1)|접수일(2)|증상(3)|배정기사ID(4)|상태(5)|메모(6)|계약구분(7)|설치위치(8)|모델명(9)
// |결제방법(10)|결제정보JSON(11)|발행완료여부(12)|학교명직접입력(13)
function handleGetMyAS(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var year = data.year || getCurrentMgmtYear();
  var schoolMap = {};
  sheetToObjects(getSchoolSheet(year)).forEach(function(s) {
    var sInfo = { name: s['학교명'], bizNumber: s['사업자번호'] || '', email: s['학교이메일'] || '' };
    schoolMap[s['학교ID']] = sInfo;
    schoolMap['#' + normName(s['학교명'])] = sInfo;
  });

  var rows = ss.getSheetByName('AS접수').getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (getTechNameById(String(r[4])) !== getTechNameById(data.techId)) continue;
    var schoolId = String(r[1]);
    var schoolInfo = schoolMap[schoolId] || schoolMap['#' + normName(schoolId)] || {};
    var schoolNameManual = String(r[13] || '');
    var paymentInfoRaw = String(r[11] || '');
    var paymentInfo = {};
    try { if (paymentInfoRaw) paymentInfo = JSON.parse(paymentInfoRaw); } catch(e) {}
    result.push({
      asId:              String(r[0]),
      schoolId:          schoolId,
      schoolName:        schoolNameManual || schoolInfo.name || schoolId,
      reportedDate:      formatDate(r[2]),
      symptom:           String(r[3]),
      assignedTechId:    String(r[4]),
      status:            String(r[5]),
      note:              String(r[6] || ''),
      contractType:      String(r[7] || ''),
      location:          String(r[8] || ''),
      model:             String(r[9] || ''),
      paymentMethod:     String(r[10] || ''),
      paymentInfo:       paymentInfo,
      invoiceCompleted:  Boolean(r[12]),
      schoolNameManual:  schoolNameManual,
      bizNumber:         schoolInfo.bizNumber || '',
      email:             schoolInfo.email || '',
      quoteSent:         Boolean(r[14]),
    });
  }
  return result;
}

// AS 신규 접수 (관리자)
function handleCreateAS(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(e) { throw new Error('잠시 후 다시 시도해주세요.'); }
  try {
    var sheet = getSheet('AS접수');
    var asId = makeId('AS');
    sheet.appendRow([
      asId,                           // 0: AS접수ID
      data.schoolId       || '',      // 1: 학교ID
      data.reportedDate   || formatDate(new Date()), // 2: 접수일
      data.symptom        || '',      // 3: 증상
      data.assignedTechId || '',      // 4: 배정기사ID
      '접수',                          // 5: 상태
      data.note           || '',      // 6: 메모
      data.contractType   || '',      // 7: 계약구분
      data.location       || '',      // 8: 설치위치
      data.model          || '',      // 9: 모델명
      '',                             // 10: 결제방법
      '',                             // 11: 결제정보JSON
      false,                          // 12: 발행완료여부
      data.schoolNameManual || '',    // 13: 학교명직접입력
      false,                          // 14: 견적서발송여부
    ]);
    return { asId: asId };
  } finally {
    lock.releaseLock();
  }
}

// 견적서 발송 처리
function handleSendEstimate(data) {
  var sheet = getSheet('AS접수');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === data.asId) {
      sheet.getRange(i + 1, 15).setValue(true);
      return { asId: data.asId };
    }
  }
  throw new Error('AS 접수 건을 찾을 수 없습니다: ' + data.asId);
}

// 방문기록 수정 (기사용)
// 수정 가능 필드: 방문일(col2), 방문시간(col3), 알림설정(col4), 작업내용(col9), 다음예정일(col10)
function handleUpdateVisit(data) {
  var sheet = getSheet('방문기록');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === data.visitId) {
      var row = i + 1;
      if (data.visitDate)         sheet.getRange(row, 2).setValue(data.visitDate);
      if (data.visitTime)         sheet.getRange(row, 3).setValue(data.visitTime);
      if (data.alertSetting)      sheet.getRange(row, 4).setValue(data.alertSetting);
      if (typeof data.workContent !== 'undefined') {
        sheet.getRange(row, 9).setValue(data.workContent);
      }
      if (typeof data.nextScheduledDate !== 'undefined') {
        sheet.getRange(row, 10).setValue(data.nextScheduledDate);
      }
      return { visitId: data.visitId };
    }
  }

  throw new Error('방문 기록을 찾을 수 없습니다: ' + data.visitId);
}

// AS 상태/메모/접수내용 업데이트
function handleUpdateAS(data) {
  var sheet = getSheet('AS접수');
  var rows = sheet.getDataRange().getValues();

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === data.asId) {
      var row = i + 1;
      if (data.status)                          sheet.getRange(row, 6).setValue(data.status);
      if (typeof data.assignedTechId !== 'undefined') sheet.getRange(row, 5).setValue(data.assignedTechId);
      if (typeof data.note !== 'undefined')     sheet.getRange(row, 7).setValue(data.note);
      // 접수 내용 수정
      if (typeof data.symptom !== 'undefined')  sheet.getRange(row, 4).setValue(data.symptom);
      if (typeof data.location !== 'undefined') sheet.getRange(row, 9).setValue(data.location);
      if (typeof data.model !== 'undefined')    sheet.getRange(row, 10).setValue(data.model);
      if (typeof data.contractType !== 'undefined') sheet.getRange(row, 8).setValue(data.contractType);
      if (typeof data.schoolNameManual !== 'undefined') sheet.getRange(row, 14).setValue(data.schoolNameManual);
      if (typeof data.reportedDate !== 'undefined') sheet.getRange(row, 3).setValue(data.reportedDate);
      return { asId: data.asId };
    }
  }

  throw new Error('AS 접수 건을 찾을 수 없습니다: ' + data.asId);
}

// AS 결제 처리 (기사)
function handleSaveASPayment(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(e) { throw new Error('잠시 후 다시 시도해주세요.'); }
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName('AS접수');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) !== data.asId) continue;
      var row = i + 1;
      var newStatus = data.paymentMethod === '카드' ? '완료' : '발행대기';
      sheet.getRange(row, 6).setValue(newStatus);
      sheet.getRange(row, 11).setValue(data.paymentMethod || '');
      sheet.getRange(row, 12).setValue(JSON.stringify(data.paymentInfo || {}));
      sheet.getRange(row, 13).setValue(false);

      // 세금계산서 이메일/사업자번호 학교 시트에도 저장
      // 사업자번호=col10(0-based)=col11(1-based), 이메일=col8(0-based)=col9(1-based)
      if (data.schoolId && data.paymentMethod === '세금계산서') {
        var schoolSheet = getSchoolSheet(getCurrentMgmtYear());
        var sRows = schoolSheet.getDataRange().getValues();
        for (var j = 1; j < sRows.length; j++) {
          if (String(sRows[j][0]) !== data.schoolId && normName(sRows[j][5]) !== normName(data.schoolId)) continue;
          if (data.bizNumber) schoolSheet.getRange(j + 1, 11).setValue(data.bizNumber);
          if (data.email)     schoolSheet.getRange(j + 1, 9).setValue(data.email);
          break;
        }
      }

      // 결제내역 시트 저장
      var paymentSheet = ss.getSheetByName('결제내역');
      if (paymentSheet) {
        var pi = data.paymentInfo || {};
        var asRow = rows[i];
        var schoolSheet3 = getSchoolSheet(getCurrentMgmtYear());
        var sRows3 = schoolSheet3.getDataRange().getValues();
        var schoolName3 = String(asRow[13] || '');
        if (!schoolName3) {
          for (var k = 1; k < sRows3.length; k++) {
            if (String(sRows3[k][0]) === String(asRow[1])) { schoolName3 = String(sRows3[k][5]); break; }
          }
        }
        var repairDesc = pi.repairNote || String(asRow[6] || '');
        if (pi.parts && pi.parts.length > 0) {
          var partStr = pi.parts.map(function(p) { return p.partName + ' x' + p.qty; }).join(', ');
          repairDesc = repairDesc ? repairDesc + ' / ' + partStr : partStr;
        }
        var grandTotal = pi.vatTotal || pi.total || 0;
        paymentSheet.appendRow([
          schoolName3,
          formatDate(asRow[2]),
          String(asRow[3] || ''),
          String(asRow[8] || ''),
          String(asRow[9] || ''),
          newStatus,
          String(asRow[7] || ''),
          repairDesc,
          data.paymentMethod || '',
          grandTotal,
        ]);
      }

      return { asId: data.asId, status: newStatus };
    }
    throw new Error('AS 접수 건을 찾을 수 없습니다: ' + data.asId);
  } finally {
    lock.releaseLock();
  }
}

// 세금계산서 발행 완료 처리 (관리자)
function handleCompleteInvoice(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(e) { throw new Error('잠시 후 다시 시도해주세요.'); }
  try {
    var sheet = getSheet('AS접수');
    var rows = sheet.getDataRange().getValues();

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) !== data.asId) continue;
      var row = i + 1;
      sheet.getRange(row, 13).setValue(true);
      sheet.getRange(row, 6).setValue('완료');
      return { asId: data.asId };
    }
    throw new Error('AS 접수 건을 찾을 수 없습니다: ' + data.asId);
  } finally {
    lock.releaseLock();
  }
}

// 세금계산서 발행 대기 목록 조회 (관리자)
function handleGetASInvoices(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var year = data.year || getCurrentMgmtYear();
  var schoolMap = {};
  sheetToObjects(getSchoolSheet(year)).forEach(function(s) {
    var sInfo = { name: s['학교명'], bizNumber: s['사업자번호'] || '', email: s['학교이메일'] || '' };
    schoolMap[s['학교ID']] = sInfo;
    schoolMap['#' + normName(s['학교명'])] = sInfo;
  });
  var techMap = {};
  sheetToObjects(ss.getSheetByName('기사')).forEach(function(t) {
    techMap[t['기사ID']] = t['이름'];
  });

  var rows = ss.getSheetByName('AS접수').getDataRange().getValues();
  if (rows.length < 2) return [];

  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (String(r[5]) !== '발행대기') continue;
    var schoolId = String(r[1]);
    var schoolInfo = schoolMap[schoolId] || schoolMap['#' + normName(schoolId)] || {};
    var schoolNameManual = String(r[13] || '');
    var paymentInfoRaw = String(r[11] || '');
    var paymentInfo = {};
    try { if (paymentInfoRaw) paymentInfo = JSON.parse(paymentInfoRaw); } catch(e) {}
    result.push({
      asId:             String(r[0]),
      schoolId:         schoolId,
      schoolName:       schoolNameManual || schoolInfo.name || schoolId,
      reportedDate:     formatDate(r[2]),
      symptom:          String(r[3]),
      assignedTechId:   String(r[4]),
      assignedTechName: techMap[String(r[4])] || String(r[4]),
      status:           String(r[5]),
      note:             String(r[6] || ''),
      contractType:     String(r[7] || ''),
      location:         String(r[8] || ''),
      model:            String(r[9] || ''),
      paymentMethod:    String(r[10] || ''),
      paymentInfo:      paymentInfo,
      invoiceCompleted: false,
      bizNumber:        schoolInfo.bizNumber || '',
      email:            schoolInfo.email || '',
    });
  }
  return result;
}

// ────────────────────────────────────────────────────────────
//  창고 / 재고이동 핸들러
// ────────────────────────────────────────────────────────────

// 창고 시트: 창고ID(0) | 창고명(1) | 종류(2) | 연결기사ID(3)
function handleGetWarehouses(data) {
  var rows = getSheet('창고').getDataRange().getValues();
  if (rows.length < 2) return [];
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    result.push({
      warehouseId: String(r[0]),
      name:        String(r[1]),
      type:        String(r[2]),
      techId:      String(r[3] || ''),
    });
  }
  return result;
}

// 재고이동 시트: 로그ID(0)|일자(1)|부품ID(2)|구분(3)|출발창고(4)|도착창고(5)|수량(6)|메모(7)
function handleSaveStockMove(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(e) { throw new Error('잠시 후 다시 시도해주세요.'); }
  try {
    var sheet = getSheet('재고이동');
    var logId = makeId('SM');
    sheet.appendRow([
      logId,
      data.date || formatDate(new Date()),
      data.partId           || '',
      data.type             || '',
      data.fromWarehouseId  || '',
      data.toWarehouseId    || '',
      Number(data.qty)      || 0,
      data.memo             || '',
    ]);
    return { logId: logId };
  } finally {
    lock.releaseLock();
  }
}

// 재고이동 조회 (기사 창고 기준 또는 전체)
function handleGetStockMoves(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  var warehouseMap = {};
  var wRows = ss.getSheetByName('창고').getDataRange().getValues();
  for (var i = 1; i < wRows.length; i++) {
    var wr = wRows[i];
    warehouseMap[String(wr[0])] = { name: String(wr[1]), type: String(wr[2]), techId: String(wr[3] || '') };
  }

  var partMap = {};
  var pRows = ss.getSheetByName('부품').getDataRange().getValues();
  if (pRows.length > 1) {
    var pHeaders = pRows[0];
    var pCol = {};
    pHeaders.forEach(function(h, i) { pCol[String(h).trim()] = i; });
    var pLastName = '';
    for (var i = 1; i < pRows.length; i++) {
      var pr = pRows[i];
      var pPid = String(pr[pCol['부품ID']] || '').trim();
      if (!pPid) pPid = 'ROW' + i;
      var pName = String(pr[pCol['부품명']] || '').trim();
      if (pName) pLastName = pName;
      else pName = pLastName;
      partMap[pPid] = {
        name: pName,
        unit: String(pr[pCol['단위']] || '').trim(),
      };
    }
  }

  // 기사 techId로 창고 ID 찾기
  var filterWarehouseId = data.warehouseId || null;
  if (!filterWarehouseId && data.techId) {
    for (var wid in warehouseMap) {
      if (warehouseMap[wid].type === '기사' && warehouseMap[wid].techId === data.techId) {
        filterWarehouseId = wid;
        break;
      }
    }
  }

  var moveRows = ss.getSheetByName('재고이동').getDataRange().getValues();
  if (moveRows.length < 2) return [];

  var result = [];
  for (var i = 1; i < moveRows.length; i++) {
    var mr = moveRows[i];
    var moveDate = formatDate(mr[1]);
    var from     = String(mr[4]);
    var to       = String(mr[5]);

    if (filterWarehouseId && from !== filterWarehouseId && to !== filterWarehouseId) continue;

    if (data.year) {
      if (!moveDate.startsWith(String(data.year))) continue;
    }
    if (data.month) {
      var pad = String(data.month).length === 1 ? '0' + data.month : String(data.month);
      if (!moveDate.startsWith(String(data.year) + '-' + pad)) continue;
    }

    var partId = String(mr[2]);
    result.push({
      logId:             String(mr[0]),
      date:              moveDate,
      partId:            partId,
      partName:          partMap[partId] ? partMap[partId].name : '',
      partUnit:          partMap[partId] ? partMap[partId].unit : '',
      type:              String(mr[3]),
      fromWarehouseId:   from,
      fromWarehouseName: warehouseMap[from] ? warehouseMap[from].name : from,
      toWarehouseId:     to,
      toWarehouseName:   warehouseMap[to] ? warehouseMap[to].name : to,
      qty:               Number(mr[6]) || 0,
      memo:              String(mr[7] || ''),
    });
  }

  result.sort(function(a, b) { return b.date.localeCompare(a.date); });
  return result;
}

// 견적서 저장 (견적서내역 시트에 저장 + AS접수 quoteSent = true)
function handleSaveEstimate(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(10000); } catch(e) { throw new Error('잠시 후 다시 시도해주세요.'); }
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);

    // AS접수 시트에서 quoteSent 업데이트
    var asSheet = ss.getSheetByName('AS접수');
    var asRows = asSheet.getDataRange().getValues();
    for (var i = 1; i < asRows.length; i++) {
      if (String(asRows[i][0]) !== data.asId) continue;
      asSheet.getRange(i + 1, 15).setValue(true);
      // 학교 이메일 업데이트 (없었다가 새로 입력한 경우)
      if (data.schoolId && data.schoolEmail) {
        var schoolSheet = getSchoolSheet(getCurrentMgmtYear());
        var sRows = schoolSheet.getDataRange().getValues();
        for (var j = 1; j < sRows.length; j++) {
          if (String(sRows[j][0]) === data.schoolId || normName(sRows[j][5]) === normName(data.schoolId)) {
            schoolSheet.getRange(j + 1, 9).setValue(data.schoolEmail);
            break;
          }
        }
      }
      break;
    }

    // 견적서내역 시트 저장 (없으면 스킵)
    var estimateSheet = ss.getSheetByName('견적서내역');
    if (estimateSheet) {
      var pi = data.estimateInfo || {};
      var repairDesc = pi.repairNote || '';
      if (pi.parts && pi.parts.length > 0) {
        var partStr = pi.parts.map(function(p) { return p.partName + ' x' + p.qty; }).join(', ');
        repairDesc = repairDesc ? repairDesc + ' / ' + partStr : partStr;
      }
      estimateSheet.appendRow([
        makeId('EST'),
        data.asId || '',
        data.schoolName || '',
        data.reportedDate || '',
        data.symptom || '',
        data.schoolEmail || '',
        repairDesc,
        pi.vatTotal || pi.total || 0,
        formatDate(new Date()),
      ]);
    }

    return { asId: data.asId };
  } finally {
    lock.releaseLock();
  }
}

// ── 차량계기판 핸들러 ──────────────────────────────────────────────────────

var DASHCAM_FOLDER_IDS = {
  '박정현': '1LQT_vJIBDtpFq-vEjrkhWYMXwivOv7kR',
  '김성준': '1LpGxSOYGZoW31z7-Eg9Q4bB79AinJncS',
  '박경록': '10nOKb0LJfB7kRHeKjMdKHMjsTK47EXkB',
};

var DASHCAM_TECHS = ['박정현', '김성준', '박경록'];

function ensureDashcamSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('차량계기판');
  if (!sheet) {
    sheet = ss.insertSheet('차량계기판');
    var headers = ['날짜'];
    DASHCAM_TECHS.forEach(function(name) {
      headers.push(name + ' 출근');
      headers.push(name + ' 퇴근');
    });
    sheet.appendRow(headers);
  }
  return sheet;
}

function getDashcamColMap(sheet, targetYear) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};

  var hasYearSection = headers.some(function(h) {
    return /^\d{4}년도$/.test(String(h || '').trim());
  });

  if (!hasYearSection) {
    headers.forEach(function(h, i) { if (h) map[String(h).trim()] = i; });
    map['_dateCol'] = map['날짜'] !== undefined ? map['날짜'] : 0;
    return map;
  }

  var inSection = false;
  headers.forEach(function(h, i) {
    var hStr = String(h || '').trim();
    if (!hStr) return;
    if (/^\d{4}년도$/.test(hStr)) {
      inSection = !targetYear || (hStr === targetYear + '년도');
      if (inSection) map['_dateCol'] = i;
      return;
    }
    if (inSection && !map.hasOwnProperty(hStr)) map[hStr] = i;
  });

  if (map['_dateCol'] === undefined) map['_dateCol'] = 0;
  return map;
}

function handleGetDashcamPhotos(data) {
  var sheet = ensureDashcamSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var techName = String(data.techName || '');
  var year     = data.year  ? String(data.year)  : null;
  var month    = data.month ? String(data.month).padStart(2, '0') : null;

  var colMap     = getDashcamColMap(sheet, year);
  var dateCol    = colMap['_dateCol'] !== undefined ? colMap['_dateCol'] : 0;
  var commuteCol = colMap[techName + ' 출근'];
  var leaveCol   = colMap[techName + ' 퇴근'];

  var rows = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) {
    var row     = rows[i];
    var rawDate = row[dateCol];
    var dateStr = rawDate instanceof Date
      ? Utilities.formatDate(rawDate, 'Asia/Seoul', 'yyyy-MM-dd')
      : String(rawDate || '');
    if (!dateStr) continue;
    if (year  && !dateStr.startsWith(year)) continue;
    if (year && month && !dateStr.startsWith(year + '-' + month)) continue;

    result.push({
      date:    dateStr,
      commute: (typeof commuteCol !== 'undefined' ? String(row[commuteCol] || '') : ''),
      leave:   (typeof leaveCol   !== 'undefined' ? String(row[leaveCol]   || '') : ''),
    });
  }
  return result;
}

function handleSaveDashcamPhoto(data) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(15000); } catch(e) { throw new Error('잠시 후 다시 시도해주세요.'); }
  try {
    var techName = String(data.techName || '');
    var folderId = DASHCAM_FOLDER_IDS[techName];
    if (!folderId) throw new Error('폴더를 찾을 수 없습니다: ' + techName);

    // 이미지 → Drive 저장
    var decoded  = Utilities.base64Decode(data.base64Image);
    var blob     = Utilities.newBlob(decoded, data.mimeType || 'image/jpeg', data.timestamp + '.jpg');
    var folder   = DriveApp.getFolderById(folderId);
    var file     = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileUrl  = 'https://drive.google.com/file/d/' + file.getId() + '/view';

    // 차량계기판 시트에 URL 기록
    var sheet = ensureDashcamSheet();

    // data.timestamp 예시: '2026.06.29 14:30' → '2026-06-29'
    var tsParts = String(data.timestamp || '').split(' ')[0].split('.');
    var date    = (tsParts.length === 3)
      ? tsParts[0] + '-' + tsParts[1] + '-' + tsParts[2]
      : formatDate(new Date());
    var year = date.substring(0, 4);

    var colMap    = getDashcamColMap(sheet, year);
    var dateColIndex = colMap['_dateCol'] !== undefined ? colMap['_dateCol'] : 0;
    var colKey    = techName + ' ' + String(data.type || '출근');
    var targetCol = colMap[colKey];
    if (typeof targetCol === 'undefined') throw new Error('컬럼을 찾을 수 없습니다: ' + colKey);

    var lastRow = sheet.getLastRow();
    var rowIndex = -1;

    if (lastRow > 1) {
      var dateVals = sheet.getRange(2, dateColIndex + 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < dateVals.length; i++) {
        var cellVal = dateVals[i][0];
        var cellStr = cellVal instanceof Date
          ? Utilities.formatDate(cellVal, 'Asia/Seoul', 'yyyy-MM-dd')
          : String(cellVal || '');
        if (cellStr === date) { rowIndex = i + 2; break; }
      }
    }

    if (rowIndex === -1) {
      var nextRowNum = lastRow + 1;
      sheet.getRange(nextRowNum, dateColIndex + 1).setFormula('="' + date + '"');
      sheet.getRange(nextRowNum, targetCol + 1).setValue(fileUrl);
    } else {
      sheet.getRange(rowIndex, targetCol + 1).setValue(fileUrl);
    }

    return { url: fileUrl };
  } finally {
    lock.releaseLock();
  }
}

// 웰라수 창고(중앙 창고) 재고 조회
function handleGetCentralWarehouseStock(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);

  // 중앙 창고 ID 목록 (type='창고')
  var warehouseRows = ss.getSheetByName('창고').getDataRange().getValues();
  var centralIds = [];
  for (var i = 1; i < warehouseRows.length; i++) {
    if (String(warehouseRows[i][2]) === '창고') {
      centralIds.push(String(warehouseRows[i][0]));
    }
  }
  if (centralIds.length === 0) return [];

  // 재고이동 집계
  var stockMap = {};
  var moveRows = ss.getSheetByName('재고이동').getDataRange().getValues();
  for (var i = 1; i < moveRows.length; i++) {
    var mr = moveRows[i];
    var partId = String(mr[2]);
    var from   = String(mr[4]);
    var to     = String(mr[5]);
    var qty    = Number(mr[6]) || 0;
    if (!stockMap[partId]) stockMap[partId] = 0;
    for (var ci = 0; ci < centralIds.length; ci++) {
      if (to   === centralIds[ci]) stockMap[partId] += qty;
      if (from === centralIds[ci]) stockMap[partId] -= qty;
    }
  }

  // 부품 목록과 합산
  var partSheet = ss.getSheetByName('부품');
  var partRows = partSheet.getDataRange().getValues();
  if (partRows.length < 2) return [];

  var headers = partRows[0];
  var col = {};
  headers.forEach(function(h, i) { col[String(h).trim()] = i; });

  var result = [];
  var lastName = '';
  for (var i = 1; i < partRows.length; i++) {
    var r = partRows[i];
    var pid = String(r[col['부품ID']] || '').trim();
    if (!pid) pid = 'ROW' + i;
    var name = String(r[col['부품명']] || '').trim();
    if (name) lastName = name;
    else name = lastName;
    if (!name) continue;

    var currentStock = stockMap[pid] || 0;
    if (currentStock <= 0) continue;

    result.push({
      partId:        pid,
      name:          name,
      spec:          String(r[col['규격']] || '').trim(),
      unit:          String(r[col['단위']] || '').trim(),
      safetyStock:   Number(r[col['안전재고']]) || 0,
      currentStock:  currentStock,
    });
  }
  return result;
}
