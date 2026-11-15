
document.addEventListener("DOMContentLoaded", () => {
  const client = window.supabaseClient;

  if (!client) {
    console.error("Supabase 연결을 확인해 주세요.");
    return;
  }

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 1. 달력 및 일정
  let currentDate = new Date();
  let calendarEvents = [];

  const calendarTitle = document.getElementById("calendarTitle");
  const calendarGrid = document.getElementById("calendarGrid");
  const prevMonth = document.getElementById("prevMonth");
  const nextMonth = document.getElementById("nextMonth");

  let eventDetail = document.getElementById("calendarEventDetail");

  if (calendarGrid && !eventDetail) {
    eventDetail = document.createElement("div");
    eventDetail.id = "calendarEventDetail";
    calendarGrid.insertAdjacentElement("afterend", eventDetail);
  }

  function showEvents(date) {
    if (!eventDetail) return;

    const selectedDate = formatDate(date);
    const events = calendarEvents.filter(
      event => event.event_date === selectedDate
    );

    eventDetail.innerHTML = "";

    const heading = document.createElement("h3");
    heading.textContent = `${selectedDate} 일정`;
    eventDetail.appendChild(heading);

    if (!events.length) {
      const empty = document.createElement("p");
      empty.textContent = "등록된 일정이 없습니다.";
      eventDetail.appendChild(empty);
      return;
    }

    events.forEach(event => {
      const item = document.createElement("article");
      item.className = "calendar-event-item";

      const title = document.createElement("h4");
      title.textContent = event.title;

      const content = document.createElement("p");
      content.textContent = event.content || "";

      item.append(title, content);
      eventDetail.appendChild(item);
    });
  }

  function renderCalendar() {
    if (!calendarGrid || !calendarTitle) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    calendarTitle.textContent = `${year}년 ${month + 1}월`;
    calendarGrid.innerHTML = "";

    ["일", "월", "화", "수", "목", "금", "토"].forEach(day => {
      const el = document.createElement("div");
      el.className = "day-name";
      el.textContent = day;
      calendarGrid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      calendarGrid.appendChild(document.createElement("div"));
    }

    for (let day = 1; day <= lastDate; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDate(date);

      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "calendar-day";
      cell.textContent = day;

      if (dateString === formatDate(new Date())) {
        cell.classList.add("today");
      }

      const events = calendarEvents.filter(
        event => event.event_date === dateString
      );

      if (events.length) {
        cell.classList.add("has-event");

        const marker = document.createElement("span");
        marker.className = "calendar-event-marker";
        marker.textContent = "●";
        cell.appendChild(marker);
      }

      cell.addEventListener("click", () => showEvents(date));
      calendarGrid.appendChild(cell);
    }
  }

  async function loadCalendarEvents() {
    const { data, error } = await client
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("달력 일정 오류:", error);
      if (eventDetail) {
        eventDetail.textContent = "일정을 불러오지 못했습니다.";
      }
      return;
    }

    calendarEvents = data || [];
    renderCalendar();
    showEvents(currentDate);
  }

  prevMonth?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    showEvents(currentDate);
  });

  nextMonth?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    showEvents(currentDate);
  });

  // 2. 공지사항
  async function loadNotices() {
    const list = document.getElementById("noticeList");
    if (!list) return;

    const { data, error } = await client
      .from("notices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.textContent = "공지사항을 불러오지 못했습니다.";
      console.error(error);
      return;
    }

    list.innerHTML = "";

    if (!data?.length) {
      list.textContent = "아직 등록된 공지사항이 없습니다.";
      return;
    }

    data.forEach(notice => {
      const article = document.createElement("article");
      article.className = "notice-item";

      const title = document.createElement("h3");
      title.textContent = notice.title;

      const content = document.createElement("p");
      content.textContent = notice.content;

      article.append(title, content);
      list.appendChild(article);
    });
  }

  // 3. 사진 확대 보기
  const gallery = document.getElementById("photoGallery");

  const lightbox = document.createElement("div");
  lightbox.id = "photoLightbox";
  lightbox.innerHTML = `
    <button id="closeLightbox" type="button" aria-label="닫기">✕</button>
    <img id="lightboxImage" alt="확대된 박제 사진">
    <p id="lightboxCaption"></p>
  `;
  document.body.appendChild(lightbox);

  function closeLightbox() {
    lightbox.classList.remove("active");
  }

  gallery?.addEventListener("click", event => {
    const image = event.target.closest(".photo-card img");
    if (!image) return;

    document.getElementById("lightboxImage").src = image.src;
    document.getElementById("lightboxImage").alt = image.alt;

    document.getElementById("lightboxCaption").textContent =
      image.closest(".photo-card")?.querySelector("p")?.textContent || "";

    lightbox.classList.add("active");
  });

  document.getElementById("closeLightbox").addEventListener(
    "click",
    closeLightbox
  );

  lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeLightbox();
  });

  // 사진 목록
  async function loadPhotos() {
    if (!gallery) return;

    const { data, error } = await client
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      gallery.textContent = "사진을 불러오지 못했습니다.";
      console.error(error);
      return;
    }

    gallery.innerHTML = "";
    gallery.classList.remove("scrolling");

    if (!data?.length) {
      gallery.textContent = "아직 등록된 사진이 없습니다.";
      return;
    }

    gallery.classList.add("photo-auto-scroll");

    const track = document.createElement("div");
    track.className = "photo-scroll-track";

    data.forEach(photo => {
      const card = document.createElement("div");
      card.className = "photo-card";

      const img = document.createElement("img");
      img.src = photo.image_url;
      img.alt = photo.caption || "이니와 인즈들의 추억";
      img.loading = "lazy";
      img.style.cursor = "zoom-in";

      const caption = document.createElement("p");
      caption.textContent = photo.caption || "";

      card.append(img, caption);
      track.appendChild(card);
    });

    gallery.appendChild(track);

    if (data.length > 1) {
      const copy = track.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      gallery.appendChild(copy);
      gallery.classList.add("scrolling");
    }
  }

  // 4. 일별 왕 기록
  async function loadDailyAwards() {
    const { data, error } = await client
      .from("daily_awards")
      .select("*")
      .order("record_date", { ascending: false });

    if (error) {
      console.error("일별 왕 기록 오류:", error);
      return;
    }

    const heart = document.getElementById("heartWinner");
    const spoon = document.getElementById("spoonWinner");
    const chat = document.getElementById("chatWinner");

    const records = data || [];

    function displayWinner(element, name, value) {
      if (!element) return;
      element.textContent = name ? `${name} (${value || "-"})` : "미등록";
    }

    const latest = records[0];

    displayWinner(heart, latest?.heart_name, latest?.heart_value);
    displayWinner(spoon, latest?.spoon_name, latest?.spoon_value);
    displayWinner(chat, latest?.chat_name, latest?.chat_value);

    let history = document.getElementById("dailyAwardHistory");

    if (!history) {
      history = document.createElement("div");
      history.id = "dailyAwardHistory";

      const section =
        heart?.closest("section") ||
        spoon?.closest("section") ||
        chat?.closest("section");

      section?.appendChild(history);
    }

    if (!history) return;

    history.innerHTML = "<h3>📅 날짜별 왕 기록</h3>";

    if (!records.length) {
      history.innerHTML += "<p>아직 등록된 기록이 없습니다.</p>";
      return;
    }

    records.forEach(record => {
      const card = document.createElement("article");
      card.className = "daily-award-card";

      const date = document.createElement("h4");
      date.textContent = record.record_date;

      const details = document.createElement("p");
      details.textContent =
        `💗 하트왕: ${record.heart_name || "미등록"} (${record.heart_value || "-"})\n` +
        `🥄 스푼왕: ${record.spoon_name || "미등록"} (${record.spoon_value || "-"})\n` +
        `💬 채팅왕: ${record.chat_name || "미등록"} (${record.chat_value || "-"})`;

      card.append(date, details);
      history.appendChild(card);
    });
  }

  // 5. 화면 스타일
  const style = document.createElement("style");

  style.textContent = `
    .calendar-day {
      position: relative;
      min-height: 48px;
      border: 1px solid #dcecff;
      border-radius: 10px;
      background: white;
      color: #315477;
      cursor: pointer;
    }

    .calendar-day.today {
      background: #dff2ff;
      font-weight: bold;
      border: 2px solid #78bfff;
    }

    .calendar-day.has-event {
      background: #eff8ff;
    }

    .calendar-event-marker {
      display: block;
      color: #63aaff;
      font-size: 9px;
    }

    #calendarEventDetail {
      margin-top: 16px;
      padding: 15px;
      border-radius: 14px;
      background: #f0f8ff;
    }

    .calendar-event-item,
    .daily-award-card {
      margin: 10px 0;
      padding: 12px;
      border-radius: 12px;
      background: #fff;
      border: 1px solid #dcecff;
    }

    .photo-auto-scroll {
      display: flex;
      overflow: hidden;
      width: 100%;
    }

    .photo-scroll-track {
      display: flex;
      flex-shrink: 0;
      gap: 16px;
      width: max-content;
      animation: photoMove 35s linear infinite;
    }

    .photo-auto-scroll.scrolling:hover .photo-scroll-track {
      animation-play-state: paused;
    }

    .photo-card {
      width: 220px;
      flex-shrink: 0;
    }

    .photo-card img {
      display: block;
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 14px;
    }

    .photo-card p {
      text-align: center;
    }

    .daily-award-card p {
      white-space: pre-line;
      line-height: 1.8;
    }

    #photoLightbox {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(10, 20, 45, 0.92);
      justify-content: center;
      align-items: center;
      flex-direction: column;
      padding: 20px;
      box-sizing: border-box;
    }

    #photoLightbox.active {
      display: flex;
    }

    #lightboxImage {
      max-width: 90%;
      max-height: 78vh;
      object-fit: contain;
      border-radius: 15px;
      box-shadow: 0 0 30px rgba(150, 210, 255, 0.35);
    }

    #lightboxCaption {
      color: white;
      margin-top: 15px;
      text-align: center;
    }

    #closeLightbox {
      position: absolute;
      top: 20px;
      right: 25px;
      border: none;
      border-radius: 50%;
      width: 42px;
      height: 42px;
      font-size: 22px;
      cursor: pointer;
      background: white;
      color: #315477;
    }

    @keyframes photoMove {
      from { transform: translateX(0); }
      to { transform: translateX(-100%); }
    }

    @media (max-width: 600px) {
      .photo-card { width: 170px; }
      .photo-card img { height: 145px; }
    }
  `;

  document.head.appendChild(style);

  // 6. 데이터 불러오기
  loadCalendarEvents();
  loadNotices();
  loadPhotos();
  loadDailyAwards();
});
