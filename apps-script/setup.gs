// ============================================================
//  웰라수 FSM — 시트 초기 세팅 스크립트
//  실행 방법: 이 파일을 Apps Script에 붙여넣고
//             상단 함수 선택 드롭다운에서 "setupAllSheets" 선택 후 ▶ 실행
//  ※ 한 번만 실행하면 됩니다. 중복 실행해도 기존 데이터는 지워지지 않습니다.
// ============================================================

// ★ 여기에 구글 시트 ID를 붙여넣으세요 ★
// 시트 URL: https://docs.google.com/spreadsheets/d/【여기가 ID】/edit
var MY_SHEET_ID = '1xIMF70ISC6rKMZ0kfpwnUV49IDNvYs2_IDYyaNHtMSo';

// ============================================================
//  웹푸시 알림용 스크립트 속성 설정
//  실행 방법: 함수 선택 드롭다운에서 "setupPushProperties" 선택 후 ▶ 실행
//  ※ 한 번만 실행하면 됩니다.
// ============================================================
function setupPushProperties() {
  PropertiesService.getScriptProperties().setProperties({
    PUSH_ENDPOINT: 'https://wellasu-fsm.vercel.app/api/send-push',
    PUSH_API_SECRET: '1923e8d8df7458f34cc06f471eb27f4b8c760f092f273fd5',
  });
}

// ============================================================
//  1회성 정리: AS접수/방문기록에 남아있는 학교ID·기사ID 코드를 이름으로 치환
//  (예전에 코드로 저장된 기존 데이터를 최신 방식인 학교명/담당기사 이름으로 정리)
//  실행 방법: 함수 선택 드롭다운에서 "cleanupLegacyCodes" 선택 후 ▶ 실행
//  ※ 실행 로그(보기 → 실행 로그)에서 어떤 셀이 바뀌었는지 확인 가능
// ============================================================
function cleanupLegacyCodes() {
  var year = getCurrentMgmtYear();

  var schoolRows = getSchoolSheet(year).getDataRange().getValues();
  var schoolIdToName = {};
  for (var i = 1; i < schoolRows.length; i++) {
    var sid = String(schoolRows[i][0]).trim();
    if (sid) schoolIdToName[sid] = String(schoolRows[i][5]).trim();
  }

  var techRows = getSheet('기사').getDataRange().getValues();
  var techIdToName = {};
  for (var j = 1; j < techRows.length; j++) {
    var tid = String(techRows[j][0]).trim();
    if (tid) techIdToName[tid] = String(techRows[j][1]).trim();
  }

  var changes = [];

  var asSheet = getSheet('AS접수');
  var asRows = asSheet.getDataRange().getValues();
  if (asRows.length > 1) {
    var asCols = colIndexMap(asRows[0]);
    for (var a = 1; a < asRows.length; a++) {
      var schoolCell = String(asRows[a][asCols['학교']] || '').trim();
      if (schoolIdToName[schoolCell]) {
        asSheet.getRange(a + 1, asCols['학교'] + 1).setValue(schoolIdToName[schoolCell]);
        changes.push('AS접수 ' + asRows[a][asCols['ASID']] + ' 학교: ' + schoolCell + ' → ' + schoolIdToName[schoolCell]);
      }
    }
  }

  var visitSheet = getSheet('방문기록');
  var visitRows = visitSheet.getDataRange().getValues();
  if (visitRows.length > 1) {
    var visitCols = colIndexMap(visitRows[0]);
    for (var v = 1; v < visitRows.length; v++) {
      if (visitCols['학교명'] != null) {
        var vSchoolCell = String(visitRows[v][visitCols['학교명']] || '').trim();
        if (schoolIdToName[vSchoolCell]) {
          visitSheet.getRange(v + 1, visitCols['학교명'] + 1).setValue(schoolIdToName[vSchoolCell]);
          changes.push('방문기록 ' + visitRows[v][visitCols['방문ID']] + ' 학교명: ' + vSchoolCell + ' → ' + schoolIdToName[vSchoolCell]);
        }
      }
      if (visitCols['담당기사'] != null) {
        var vTechCell = String(visitRows[v][visitCols['담당기사']] || '').trim();
        if (techIdToName[vTechCell]) {
          visitSheet.getRange(v + 1, visitCols['담당기사'] + 1).setValue(techIdToName[vTechCell]);
          changes.push('방문기록 ' + visitRows[v][visitCols['방문ID']] + ' 담당기사: ' + vTechCell + ' → ' + techIdToName[vTechCell]);
        }
      }
    }
  }

  Logger.log(changes.length ? changes.join('\n') : '변경할 데이터가 없습니다.');
  return changes;
}

function setupAllSheets() {
  var ss = MY_SHEET_ID === 'YOUR_SHEET_ID_HERE'
    ? SpreadsheetApp.getActiveSpreadsheet()
    : SpreadsheetApp.openById(MY_SHEET_ID);
  if (!ss) throw new Error('시트에 연결할 수 없습니다. MY_SHEET_ID를 확인하세요.');

  setupSheet(ss, '기사', [
    ['기사ID', '이름', '연락처', '아이디', '비밀번호', '권한', '활성여부'],
    ['T001', '김기사', '010-1111-2222', 'kim01', '1234', '기사', true],
    ['T002', '이기사', '010-3333-4444', 'lee01', '1234', '기사', true],
    ['T003', '박기사', '010-5555-6666', 'park01', '1234', '기사', true],
    ['ADMIN01', '관리자', '010-0000-0001', 'admin', 'admin1234', '관리자', true],
  ]);

  setupSheet(ss, '학교', [
    ['학교ID', '학교명', '지역', '주소', '담당자', '담당자연락처', '담당기사ID', '계약구분', '학교이메일', '사업자등록증링크', '비고'],
    ['S001', '한빛초등학교', '서부', '서울시 강서구 화곡로 123', '박선생', '02-1234-5678', 'T001', '유지관리', 'hanbit@edu.kr', '', ''],
    ['S002', '별빛중학교',   '서부', '서울시 양천구 목동로 456', '김담당', '02-8765-4321', 'T001', '비계약',   'byeol@edu.kr',  '', ''],
    ['S003', '푸른고등학교', '동부', '서울시 광진구 능동로 789', '이선생', '02-5555-6666', 'T002', '유지관리', 'pureun@edu.kr', '', ''],
  ]);

  setupSheet(ss, '설치장비', [
    ['장비ID', '학교ID', '설치위치', '모델명', '설치일', '필터교체주기(개월)', '상태'],
    ['E001', 'S001', '1학년 복도', 'WP-3000', '2023-03-01', 6, '정상'],
    ['E002', 'S001', '교무실',     'WP-2000', '2022-09-01', 6, '정상'],
    ['E003', 'S002', '급식실',     'WP-5000', '2024-01-15', 12, '정상'],
  ]);

  setupSheet(ss, '방문기록', [
    ['방문ID', '방문일', '방문시간', '알림설정', '학교ID', '대상장비', '기사ID',
     '방문유형', '작업내용', '다음예정일', '출장비', '인건비', '공임', '부품비', '합계',
     '결제방식', '결제금액', '발행상태', '통장사본발송여부', '상태', '연결ASID'],
  ]);

  setupSheet(ss, '부품', [
    ['부품ID', '부품명', '단위', '안전재고', '계약단가', '비계약단가'],
    ['P001', '세디멘트 필터', '개', 5,  8000,  12000],
    ['P002', '프리카본 필터', '개', 5,  10000, 15000],
    ['P003', 'UF 멤브레인',   '개', 2,  35000, 50000],
    ['P004', '포스트카본 필터','개', 5,  8000,  12000],
    ['P005', '미네랄 필터',   '개', 3,  15000, 22000],
  ]);

  setupSheet(ss, '창고', [
    ['창고ID', '창고명', '종류', '연결기사ID'],
    ['W-CENTER', '중앙창고',   '중앙', ''],
    ['W-T001',   '김기사 차량', '기사', 'T001'],
    ['W-T002',   '이기사 차량', '기사', 'T002'],
    ['W-T003',   '박기사 차량', '기사', 'T003'],
  ]);

  setupSheet(ss, '재고이동', [
    ['로그ID', '일자', '부품ID', '구분', '출발창고', '도착창고', '수량', '메모'],
    // 중앙창고 초기 입고
    ['LOG001', '2026-01-01', 'P001', '입고', '', 'W-CENTER', 30, '초기 재고'],
    ['LOG002', '2026-01-01', 'P002', '입고', '', 'W-CENTER', 30, '초기 재고'],
    ['LOG003', '2026-01-01', 'P003', '입고', '', 'W-CENTER', 10, '초기 재고'],
    ['LOG004', '2026-01-01', 'P004', '입고', '', 'W-CENTER', 30, '초기 재고'],
    ['LOG005', '2026-01-01', 'P005', '입고', '', 'W-CENTER', 15, '초기 재고'],
    // 김기사 차량 배분
    ['LOG006', '2026-01-02', 'P001', '이동', 'W-CENTER', 'W-T001', 10, '차량 배분'],
    ['LOG007', '2026-01-02', 'P002', '이동', 'W-CENTER', 'W-T001', 8,  '차량 배분'],
    ['LOG008', '2026-01-02', 'P003', '이동', 'W-CENTER', 'W-T001', 3,  '차량 배분'],
    ['LOG009', '2026-01-02', 'P004', '이동', 'W-CENTER', 'W-T001', 10, '차량 배분'],
    // 이기사 차량 배분
    ['LOG010', '2026-01-02', 'P001', '이동', 'W-CENTER', 'W-T002', 8,  '차량 배분'],
    ['LOG011', '2026-01-02', 'P002', '이동', 'W-CENTER', 'W-T002', 6,  '차량 배분'],
    ['LOG012', '2026-01-02', 'P004', '이동', 'W-CENTER', 'W-T002', 8,  '차량 배분'],
  ]);

  setupSheet(ss, '부품사용', [
    ['로그ID', '방문ID', '장비ID', '부품ID', '수량', '출고창고', '적용단가구분', '적용단가', '금액'],
  ]);

  setupSheet(ss, 'AS접수', [
    ['ASID', '접수일', '학교ID', '담당기사ID', 'AS내용', '긴급도', '상태', '연결방문ID'],
  ]);

  // 헤더 행 서식 적용 (굵게 + 배경색)
  styleAllHeaders(ss);

  SpreadsheetApp.getUi().alert('✅ 세팅 완료!\n\n모든 시트가 생성되었습니다.\n이제 Code.gs를 열어 웹앱으로 배포하세요.');
}

// ── Keep-warm 트리거 설정 (Method C) ─────────────────────────────────────
// Apps Script 에디터에서 이 함수를 한 번 실행하면 5분마다 자동으로 pingKeepWarm이 호출됩니다.
// 이렇게 하면 콜드 스타트 없이 빠른 응답이 유지됩니다.

function setupKeepWarmTrigger() {
  // 기존 keepWarm 트리거 삭제 (중복 방지)
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'pingKeepWarm') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 5분마다 실행되는 트리거 생성
  ScriptApp.newTrigger('pingKeepWarm')
    .timeBased()
    .everyMinutes(5)
    .create();

  console.log('Keep-warm 트리거 설정 완료 — 5분마다 자동 활성화');
}

function pingKeepWarm() {
  // 최소 작업으로 스크립트 인스턴스를 활성 상태로 유지
  SpreadsheetApp.openById(MY_SHEET_ID).getName();
}

// ── 헬퍼: 시트 생성 + 헤더/초기 데이터 입력 ──────────────────────────────

function setupSheet(ss, name, rows) {
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // 헤더가 없을 때만 채움 (기존 데이터 보호)
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  } else if (sheet.getLastRow() === 1) {
    // 헤더만 있으면 초기 데이터 추가
    if (rows.length > 1) {
      sheet.getRange(2, 1, rows.length - 1, rows[0].length)
        .setValues(rows.slice(1));
    }
  }
}

// ── 헬퍼: 모든 시트 헤더 행 서식 ─────────────────────────────────────────

function styleAllHeaders(ss) {
  var sheetNames = ['기사', '학교', '설치장비', '방문기록', '부품', '창고', '재고이동', '부품사용', 'AS접수'];
  sheetNames.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;
    var headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange
      .setBackground('#1a73e8')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  // 불필요한 기본 시트 숨기기 (Sheet1 이름인 경우)
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
  if (defaultSheet && ss.getSheets().length > 1) {
    defaultSheet.hideSheet();
  }
}
