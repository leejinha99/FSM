# 웰라수 FSM 프로젝트 운영 규칙

## 작업 지시 이해 원칙 (필수)

기능/수정 지시 중 화면 흐름·데이터 구조·동작 방식이 명확하지 않으면 **추측해서 구현하지 말고**, 인터뷰 형식으로 하나씩 질문해서 명확히 한 뒤 구현할 것.

## 배포 프로토콜 (필수)

수정 요청이 들어오면 코드 수정 후 **반드시** 아래 절차를 따를 것.

### Case A — Code.gs / Setup.gs 수정이 필요한 경우

1. 프론트엔드 + Code.gs / Setup.gs 코드 수정
2. `npm run gas:deploy` (clasp push + redeploy) 실행해 GAS에 자동 반영 — 사용자의 수동 GAS 에디터 작업 불필요
3. `git add` → `git commit` → `git push` → `npx vercel --prod`
4. "배포 완료" 보고 (Code.gs / Setup.gs 변경 항목 요약 포함)

### Case B — Code.gs / Setup.gs 수정이 없는 경우

1. 프론트엔드 코드 수정
2. `npm run build` 빌드 성공 확인
3. `git add` → `git commit` → `git push` → `npx vercel --prod`
4. "배포 완료" 보고

### 배포 커맨드

```bash
cd "/Users/mainpc/Desktop/업무 자동화(맥미니)/Obsidian_맥미니/◈Obsidian_웰라수◈/wellasu_maintenance_FSM"
npm run gas:deploy   # Code.gs / Setup.gs 수정이 있을 때만
git add [수정 파일들]
git commit -m "feat/fix: 수정 내용 요약"
git push
npx vercel --prod
```

### GAS 수정 주의사항

- `npm run gas:deploy`는 **기존 배포의 새 버전**으로 업데이트하므로 URL은 유지됨 (clasp redeploy가 새 배포를 만들지 않도록 주의 — 현재 gas:redeploy 스크립트는 기존 배포 ID를 지정해 실행함)
- clasp 인증 만료 등으로 자동배포가 실패하면, 실패 사실을 알리고 수동 GAS 에디터 반영으로 폴백
- 매 작업 후 Code.gs / Setup.gs 변경 여부를 반드시 명시

## 프로젝트 핵심 정보

- **운영 URL**: https://wellasu-fsm.vercel.app
- **GitHub**: https://github.com/leejinha99/FSM
- **Google 시트 ID**: `1xIMF70ISC6rKMZ0kfpwnUV49IDNvYs2_IDYyaNHtMSo`
- **GAS URL**: `.env`에 저장된 값 참조
- **로컬 개발**: `npm run dev` → http://localhost:5173
