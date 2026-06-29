# 웰라수 FSM 프로젝트 운영 규칙

## 배포 프로토콜 (필수)

수정 요청이 들어오면 코드 수정 후 **반드시** 아래 절차를 따를 것.

### Case A — Code.gs / Setup.gs 수정이 필요한 경우

1. 프론트엔드 코드 수정
2. 사용자에게 **Code.gs / Setup.gs 수정 항목을 명시**하며 GAS 에디터에서 직접 수정·배포 요청
3. 사용자가 "수정했어" / "완료" 확인 후
4. `git add` → `git commit` → `git push` → `npx vercel --prod`
5. "배포 완료" 보고

### Case B — Code.gs / Setup.gs 수정이 없는 경우

1. 프론트엔드 코드 수정
2. `npm run build` 빌드 성공 확인
3. `git add` → `git commit` → `git push` → `npx vercel --prod`
4. "배포 완료" 보고

### 배포 커맨드

```bash
cd "/Users/mainpc/Desktop/옵시디언(업무)/Obsidian_macbook_local/◈Obsidian_웰라수◈/wellasu_maintenance_FSM"
git add [수정 파일들]
git commit -m "feat/fix: 수정 내용 요약"
git push
npx vercel --prod
```

### GAS 수정 주의사항

- Code.gs / Setup.gs 변경 시 GAS 에디터에서 **기존 배포의 새 버전**으로 업데이트 (새 배포 누르면 URL 변경됨)
- 매 작업 후 Code.gs / Setup.gs 변경 여부를 반드시 명시

## 프로젝트 핵심 정보

- **운영 URL**: https://wellasu-fsm.vercel.app
- **GitHub**: https://github.com/leejinha99/FSM
- **Google 시트 ID**: `1xIMF70ISC6rKMZ0kfpwnUV49IDNvYs2_IDYyaNHtMSo`
- **GAS URL**: `.env`에 저장된 값 참조
- **로컬 개발**: `npm run dev` → http://localhost:5173
