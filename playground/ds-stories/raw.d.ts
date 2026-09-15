// Vite `?raw` 임포트 타입 — layout/*.md 를 문자열로 읽는다(Templates 스토리)
declare module "*.md?raw" {
  const text: string
  export default text
}
