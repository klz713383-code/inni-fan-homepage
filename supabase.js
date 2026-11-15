
const SUPABASE_URL = "https://dvhachoupbzzlkzcdtao.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2aGFjaG91cGJ6emxremNkdGFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDY2MTUxNSwiZXhwIjoyMTEwMjM3NTE1fQ.uus7byy-kU_UDYQc9QsQhU-Ce-mg2zqhDC_hBRzah34";

// 다른 JavaScript 파일에서도 사용할 수 있도록 설정
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

if (!window.supabase) {
  console.error("Supabase 라이브러리를 불러오지 못했습니다.");
} else {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY 
  );

  console.log("Supabase 연결 준비 완료!");
}
