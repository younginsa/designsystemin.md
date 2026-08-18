// DS 요청 리포터 — Jira DES(Product Design) 보드로 티켓 생성
// 사용법: node --use-system-ca scripts/ds-jira.mjs "<제목>" "<본문>" [--type 추가|수정|버그]
// (--use-system-ca: 사내 TLS 검사 대응, Node 22.15+ 필요)
// 필요 환경변수: JIRA_EMAIL(본인 Atlassian 이메일), JIRA_API_TOKEN(본인 API 토큰 —
//   https://id.atlassian.com/manage-profile/security/api-tokens 에서 발급)
// 대상 프로젝트는 아래에 고정한다 — 개인 환경변수의 기본 프로젝트와 무관하게
// 모든 DS 요청은 디자인 보드로 모인다.

import { execSync } from 'node:child_process';

const BASE = 'https://avikus.atlassian.net';
const PROJECT = 'DES';

const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_API_TOKEN;
if (!email || !token) {
  console.log('[DS 요청] 환경변수 미설정 — 최초 1회 설정이 필요합니다:');
  console.log('  1. https://id.atlassian.com/manage-profile/security/api-tokens 에서 API 토큰 발급');
  console.log('  2. 셸 프로필(~/.zshrc)에 본인 Atlassian 이메일과 토큰을 JIRA_EMAIL / JIRA_API_TOKEN 으로 등록');
  console.log('  3. 터미널 재시작 후 다시 시도');
  process.exit(1);
}

const args = process.argv.slice(2);
const typeIdx = args.indexOf('--type');
const reqType = typeIdx >= 0 ? args.splice(typeIdx, 2)[1] : '추가';
const [title, body] = args;
if (!title) {
  console.log('사용법: node --use-system-ca scripts/ds-jira.mjs "<제목>" "<본문>" [--type 추가|수정|버그]');
  process.exit(1);
}

const issueType = reqType === '버그' ? 'Bug' : 'Task';
const typeLabel = { 추가: 'ds-add', 수정: 'ds-update', 버그: 'ds-bug' }[reqType] || 'ds-add';

const sh = (cmd) => { try { return execSync(cmd, { encoding: 'utf8' }).trim(); } catch { return ''; } };
const requester = sh('git config user.name') || '(unknown)';
const dsCommit = sh('git rev-parse --short HEAD') || '?';
const dsDate = sh('git log -1 --format=%cd --date=format:%y.%m.%d') || '?';

const para = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] });
const description = {
  type: 'doc',
  version: 1,
  content: [
    ...(body ? body.split('\n').filter(Boolean).map(para) : [para('(본문 없음)')]),
    para('—'),
    para(`요청자: ${requester} · 유형: ${reqType} · DS 버전: ${dsDate}판 (${dsCommit})`),
    para('생성 경로: 365 DS 세션 리포터 (scripts/ds-jira.mjs)'),
  ],
};

const payload = {
  fields: {
    project: { key: PROJECT },
    issuetype: { name: issueType },
    summary: '[DS] ' + title,
    description,
    labels: ['ds-request', typeLabel],
  },
};

try {
  const r = await fetch(BASE + '/rest/api/3/issue', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(email + ':' + token).toString('base64'),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.log('[DS 요청] 실패:', r.status, JSON.stringify(j.errors || j.errorMessages || j));
    if (r.status === 401) console.log('  → JIRA_EMAIL / JIRA_API_TOKEN 자격증명을 확인하세요.');
    process.exit(1);
  }
  console.log('[DS 요청] 접수 완료 ✓');
  console.log('  티켓: ' + j.key);
  console.log('  링크: ' + BASE + '/browse/' + j.key);
} catch (e) {
  const code = e.cause && e.cause.code;
  if (code === 'SELF_SIGNED_CERT_IN_CHAIN' || code === 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY') {
    console.log('[DS 요청] TLS 오류 — node --use-system-ca 로 실행했는지 확인하세요 (Node 22.15+).');
  } else {
    console.log('[DS 요청] 네트워크 오류:', code || e.message);
    console.log('  → 사내 네트워크에서 차단된 경우 IT 보안팀에 문의하세요.');
  }
  process.exit(1);
}
