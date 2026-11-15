
document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const loginScreen = $("adminLogin");
  const adminApp = $("adminApp");
  const loginForm = $("adminLoginForm");
  const passwordInput = $("adminPassword");
  const loginButton = $("adminLoginButton");

  const loginMessage = $("loginMessage");
  const adminMessage = $("adminMessage");

  const apiUrl = window.SUPABASE_URL
    ? window.SUPABASE_URL + "/functions/v1/admin-api"
    : "";

  let adminToken = "";
  let initialized = false;

  // ---------------------------------
  // 메시지
  // ---------------------------------

  function showLoginMessage(message, success = false) {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.style.color = success ? "#16845b" : "#d96c7a";
  }

  function showMessage(message, success = false) {
    if (!adminMessage) return;

    adminMessage.textContent = message;
    adminMessage.style.color = success ? "#16845b" : "#d96c7a";
  }

  // ---------------------------------
  // API 요청
  // ---------------------------------

  async function adminRequest(body) {
    if (!apiUrl || !window.SUPABASE_ANON_KEY) {
      throw new Error("Supabase 설정을 확인해 주세요.");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: window.SUPABASE_ANON_KEY,
        "x-admin-token": adminToken
      },
      body: JSON.stringify(body)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "요청 처리에 실패했습니다.");
    }

    return result;
  }

  async function uploadRequest(formData) {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        apikey: window.SUPABASE_ANON_KEY,
        "x-admin-token": adminToken
      },
      body: formData
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "사진 업로드에 실패했습니다.");
    }

    return result;
  }

  // ---------------------------------
  // 공통 기능
  // ---------------------------------

  function getItems(result, key) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result[key])) return result[key];
    if (Array.isArray(result.data)) return result.data;
    return [];
  }

  function setLoading(container) {
    if (!container) return;

    container.replaceChildren();

    const p = document.createElement("p");
    p.textContent = "불러오는 중...";
    container.appendChild(p);
  }

  function setEmpty(container, message) {
    if (!container) return;

    container.replaceChildren();

    const p = document.createElement("p");
    p.textContent = message;
    p.style.color = "#8aa8bf";

    container.appendChild(p);
  }

  function createItem(container, title, content) {
    const item = document.createElement("article");
    item.className = "admin-item";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const body = document.createElement("div");
    body.className = "admin-item-content";
    body.textContent = content || "";

    item.append(heading, body);
    container.appendChild(item);

    return item;
  }

  function createButton(text, className, callback) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = text;
    button.className = className;

    button.addEventListener("click", callback);

    return button;
  }

  async function runAction(action, successMessage, reloadFunction) {
    try {
      await action();
      showMessage(successMessage, true);

      if (reloadFunction) {
        await reloadFunction();
      }
    } catch (error) {
      showMessage(error.message || "작업에 실패했습니다.");
    }
  }

  // ---------------------------------
  // 로그인
  // ---------------------------------

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const password = passwordInput.value.trim();

      if (!password) {
        showLoginMessage("관리자 비밀번호를 입력해 주세요.");
        return;
      }

      if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
        showLoginMessage("Supabase 설정을 확인해 주세요.");
        return;
      }

      adminToken = password;

      loginButton.disabled = true;
      loginButton.textContent = "로그인 확인 중...";
      showLoginMessage("");

      try {
        // 서버에서 관리자 토큰 확인
        await adminRequest({ action: "photo_list" });

        loginScreen.style.display = "none";
        adminApp.style.display = "flex";

        passwordInput.value = "";

        showMessage("관리자 로그인에 성공했습니다.", true);

        if (!initialized) {
          initialized = true;
          await loadAllData();
        }
      } catch (error) {
        adminToken = "";
        showLoginMessage(error.message || "비밀번호를 확인해 주세요.");
      } finally {
        loginButton.disabled = false;
        loginButton.textContent = "관리자 로그인";
      }
    });
  }

  // ---------------------------------
  // 사진 목록
  // ---------------------------------

  async function loadPhotos() {
    const container = $("photoList");
    if (!container) return;

    setLoading(container);

    try {
      const result = await adminRequest({
        action: "photo_list"
      });

      const photos = getItems(result, "photos");

      container.replaceChildren();

      if (photos.length === 0) {
        setEmpty(container, "등록된 사진이 없습니다.");
        return;
      }

      photos.forEach((photo) => {
        const item = document.createElement("article");
        item.className = "admin-item";

        const image = document.createElement("img");
        image.src = photo.image_url || "";
        image.alt = photo.caption || "박제 사진";
        image.loading = "lazy";

        const caption = document.createElement("div");
        caption.className = "admin-item-content";
        caption.textContent = photo.caption || "설명 없음";

        const editButton = createButton(
          "설명 수정",
          "secondary-button",
          async () => {
            const captionText = prompt(
              "새로운 사진 설명을 입력해 주세요.",
              photo.caption || ""
            );

            if (captionText === null) return;

            await runAction(
              () => adminRequest({
                action: "photo_update",
                id: photo.id,
                caption: captionText
              }),
              "사진 설명을 수정했습니다.",
              loadPhotos
            );
          }
        );

        const deleteButton = createButton(
          "삭제",
          "danger-button",
          async () => {
            if (!confirm("이 사진을 삭제하시겠습니까?")) return;

            await runAction(
              () => adminRequest({
                action: "photo_delete",
                id: photo.id
              }),
              "사진을 삭제했습니다.",
              loadPhotos
            );
          }
        );

        item.append(image, caption, editButton, deleteButton);
        container.appendChild(item);
      });
    } catch (error) {
      setEmpty(container, "사진을 불러오지 못했습니다.");
      showMessage(error.message);
    }
  }

  // 사진 업로드
  const uploadButton = $("uploadPhoto");

  if (uploadButton) {
    uploadButton.addEventListener("click", async () => {
      const fileInput = $("photoFile");
      const captionInput = $("photoCaption");

      const file = fileInput.files[0];
      const caption = captionInput.value.trim();

      if (!file) {
        showMessage("업로드할 사진을 선택해 주세요.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        showMessage("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        showMessage("사진 용량은 8MB 이하로 선택해 주세요.");
        return;
      }

      const formData = new FormData();

      formData.append("action", "photo_upload");
      formData.append("file", file);
      formData.append("caption", caption);

      uploadButton.disabled = true;
      uploadButton.textContent = "업로드 중...";

      await runAction(
        async () => {
          await uploadRequest(formData);

          fileInput.value = "";
          captionInput.value = "";
        },
        "사진을 업로드했습니다.",
        loadPhotos
      );

      uploadButton.disabled = false;
      uploadButton.textContent = "+ 사진 업로드";
    });
  }

  // ---------------------------------
  // 공지사항
  // ---------------------------------

  async function loadNotices() {
    const container = $("noticeList");
    if (!container) return;

    setLoading(container);

    try {
      const result = await adminRequest({
        action: "notice_list"
      });

      const notices = getItems(result, "notices");

      container.replaceChildren();

      if (notices.length === 0) {
        setEmpty(container, "등록된 공지사항이 없습니다.");
        return;
      }

      notices.forEach((notice) => {
        const item = createItem(
          container,
          notice.title || "제목 없음",
          notice.content || ""
        );

        const editButton = createButton(
          "수정",
          "secondary-button",
          async () => {
            const title = prompt(
              "공지사항 제목을 입력해 주세요.",
              notice.title || ""
            );

            if (title === null) return;

            const content = prompt(
              "공지사항 내용을 입력해 주세요.",
              notice.content || ""
            );

            if (content === null) return;

            await runAction(
              () => adminRequest({
                action: "notice_update",
                id: notice.id,
                title,
                content
              }),
              "공지사항을 수정했습니다.",
              loadNotices
            );
          }
        );

        const deleteButton = createButton(
          "삭제",
          "danger-button",
          async () => {
            if (!confirm("공지사항을 삭제하시겠습니까?")) return;

            await runAction(
              () => adminRequest({
                action: "notice_delete",
                id: notice.id
              }),
              "공지사항을 삭제했습니다.",
              loadNotices
            );
          }
        );

        item.append(editButton, deleteButton);
      });
    } catch (error) {
      setEmpty(container, "공지사항을 불러오지 못했습니다.");
      showMessage(error.message);
    }
  }

  const saveNoticeButton = $("saveNotice");

  if (saveNoticeButton) {
    saveNoticeButton.addEventListener("click", async () => {
      const title = $("noticeTitle").value.trim();
      const content = $("noticeContent").value.trim();

      if (!title || !content) {
        showMessage("공지 제목과 내용을 입력해 주세요.");
        return;
      }

      await runAction(
        async () => {
          await adminRequest({
            action: "notice_create",
            title,
            content
          });

          $("noticeTitle").value = "";
          $("noticeContent").value = "";
        },
        "공지사항을 등록했습니다.",
        loadNotices
      );
    });
  }

  // ---------------------------------
  // 달력 일정
  // ---------------------------------

  async function loadCalendar() {
    const container = $("calendarList");
    if (!container) return;

    setLoading(container);

    try {
      const result = await adminRequest({
        action: "calendar_list"
      });

      const events = getItems(result, "events");

      container.replaceChildren();

      if (events.length === 0) {
        setEmpty(container, "등록된 일정이 없습니다.");
        return;
      }

      events.forEach((event) => {
        const date = event.event_date || event.date || "";

        const item = createItem(
          container,
          event.title || "제목 없음",
          `${date}\n${event.content || ""}`
        );

        const editButton = createButton(
          "수정",
          "secondary-button",
          async () => {
            const newDate = prompt(
              "일정 날짜 (YYYY-MM-DD)",
              date
            );

            if (newDate === null) return;

            const newTitle = prompt(
              "일정 제목",
              event.title || ""
            );

            if (newTitle === null) return;

            const newContent = prompt(
              "일정 내용",
              event.content || ""
            );

            if (newContent === null) return;

            await runAction(
              () => adminRequest({
                action: "calendar_update",
                id: event.id,
                event_date: newDate,
                title: newTitle,
                content: newContent
              }),
              "일정을 수정했습니다.",
              loadCalendar
            );
          }
        );

        const deleteButton = createButton(
          "삭제",
          "danger-button",
          async () => {
            if (!confirm("이 일정을 삭제하시겠습니까?")) return;

            await runAction(
              () => adminRequest({
                action: "calendar_delete",
                id: event.id
              }),
              "일정을 삭제했습니다.",
              loadCalendar
            );
          }
        );

        item.append(editButton, deleteButton);
      });
    } catch (error) {
      setEmpty(container, "일정을 불러오지 못했습니다.");
      showMessage(error.message);
    }
  }

  const saveEventButton = $("saveEvent");

  if (saveEventButton) {
    saveEventButton.addEventListener("click", async () => {
      const date = $("eventDate").value;
      const title = $("eventTitle").value.trim();
      const content = $("eventContent").value.trim();

      if (!date || !title) {
        showMessage("일정 날짜와 제목을 입력해 주세요.");
        return;
      }

      await runAction(
        async () => {
          await adminRequest({
            action: "calendar_create",
            event_date: date,
            title,
            content
          });

          $("eventDate").value = "";
          $("eventTitle").value = "";
          $("eventContent").value = "";
        },
        "일정을 등록했습니다.",
        loadCalendar
      );
    });
  }

  // ---------------------------------
  // 하트왕 · 스푼왕 · 채팅왕
  // ---------------------------------

  async function loadAwards() {
    const container = $("awardList");
    if (!container) return;

    setLoading(container);

    try {
      const result = await adminRequest({
        action: "daily_award_list"
      });

      const awards = getItems(result, "awards");

      container.replaceChildren();

      if (awards.length === 0) {
        setEmpty(container, "등록된 왕 기록이 없습니다.");
        return;
      }

      awards.forEach((award) => {
        const recordDate = award.record_date || award.date || "";

        const content = [
          `🩷 하트왕: ${award.heart_name || "-"} (${award.heart_value || "-"})`,
          `🥄 스푼왕: ${award.spoon_name || "-"} (${award.spoon_value || "-"})`,
          `💬 채팅왕: ${award.chat_name || "-"} (${award.chat_value || "-"})`
        ].join("\n");

        const item = createItem(
          container,
          `📅 ${recordDate}`,
          content
        );

        const deleteButton = createButton(
          "삭제",
          "danger-button",
          async () => {
            if (!confirm(`${recordDate} 왕 기록을 삭제하시겠습니까?`)) {
              return;
            }

            await runAction(
              () => adminRequest({
                action: "daily_award_delete",
                record_date: recordDate
              }),
              "왕 기록을 삭제했습니다.",
              loadAwards
            );
          }
        );

        item.appendChild(deleteButton);
      });
    } catch (error) {
      setEmpty(container, "왕 기록을 불러오지 못했습니다.");
      showMessage(error.message);
    }
  }

  const saveAwardButton = $("saveAward");

  if (saveAwardButton) {
    saveAwardButton.addEventListener("click", async () => {
      const recordDate = $("awardDate").value;

      if (!recordDate) {
        showMessage("기록 날짜를 선택해 주세요.");
        return;
      }

      const data = {
        action: "daily_award_save",
        record_date: recordDate,
        heart_name: $("heartName").value.trim(),
        heart_value: $("heartValue").value.trim(),
        spoon_name: $("spoonName").value.trim(),
        spoon_value: $("spoonValue").value.trim(),
        chat_name: $("chatName").value.trim(),
        chat_value: $("chatValue").value.trim()
      };

      await runAction(
        async () => {
          await adminRequest(data);

          [
            "awardDate",
            "heartName",
            "heartValue",
            "spoonName",
            "spoonValue",
            "chatName",
            "chatValue"
          ].forEach((id) => {
            $(id).value = "";
          });
        },
        "왕 기록을 저장했습니다.",
        loadAwards
      );
    });
  }

  // ---------------------------------
  // 전체 데이터 불러오기
  // ---------------------------------

  async function loadAllData() {
    await Promise.allSettled([
      loadPhotos(),
      loadNotices(),
      loadCalendar(),
      loadAwards()
    ]);
  }
});
