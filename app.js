"use strict";

/* ---------- Константы ---------- */
const GET_URL = "https://jsonplaceholder.typicode.com/posts?_limit=5";
const POST_URL = "https://jsonplaceholder.typicode.com/posts";

/* ---------- Элементы DOM ---------- */
const loadBtn = document.getElementById("load-btn");
const postsBox = document.getElementById("posts");
const form = document.getElementById("post-form");
const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const submitBtn = document.getElementById("submit-btn");
const messageBox = document.getElementById("message");

/* ---------- Вспомогательные функции ---------- */

// Вывод сообщения: type = info | loading | success | error
function showMessage(text, type = "info") {
  messageBox.textContent = text;
  messageBox.className = "message " + type;
}

// Понятный текст ошибки для пользователя
function describeError(error) {
  if (error.name === "TypeError") {
    return "Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте снова.";
  }
  if (error.status === 404) {
    return "Ресурс не найден (HTTP 404). Проверьте адрес запроса и попробуйте снова.";
  }
  if (error.status) {
    return "Сервер вернул ошибку (HTTP " + error.status + "). Попробуйте позже.";
  }
  return "Произошла ошибка: " + error.message;
}

// Создание карточки публикации (весь текст — через textContent)
function createPostElement(title, body, metaText, isNew = false) {
  const article = document.createElement("article");
  article.className = "post" + (isNew ? " new" : "");

  const h3 = document.createElement("h3");
  h3.textContent = title;

  const p = document.createElement("p");
  p.textContent = body;

  article.append(h3, p);

  if (metaText) {
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = metaText;
    article.append(meta);
  }
  return article;
}

// Обёртка над fetch: проверка response.ok и разбор JSON
async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error("HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/* ---------- GET: загрузка публикаций ---------- */
async function loadPosts() {
  loadBtn.disabled = true;
  showMessage("Загрузка публикаций…", "loading");

  try {
    const posts = await requestJson(GET_URL);

    postsBox.replaceChildren();
    posts.forEach((post) => {
      postsBox.append(createPostElement(post.title, post.body, "ID: " + post.id));
    });

    showMessage("Загружено публикаций: " + posts.length + ".", "success");
  } catch (error) {
    showMessage(describeError(error), "error");
  } finally {
    loadBtn.disabled = false; // можно повторить попытку
  }
}

loadBtn.addEventListener("click", loadPosts);

/* ---------- POST: создание публикации ---------- */
function clearInvalid() {
  titleInput.classList.remove("invalid");
  bodyInput.classList.remove("invalid");
}

async function createPost(event) {
  event.preventDefault();
  clearInvalid();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Валидация: поля не должны быть пустыми после удаления пробелов
  if (!title || !body) {
    if (!title) titleInput.classList.add("invalid");
    if (!body) bodyInput.classList.add("invalid");
    showMessage("Заполните поля «Заголовок» и «Текст» (одни пробелы не допускаются).", "error");
    (title ? bodyInput : titleInput).focus();
    return; // запрос не отправляется
  }

  submitBtn.disabled = true;
  showMessage("Отправка публикации…", "loading");

  try {
    const created = await requestJson(POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });

    // Выводим данные из ответа сервера
    const card = createPostElement(
      created.title,
      created.body,
      "ID: " + created.id + " · новая публикация",
      true
    );
    if (postsBox.querySelector(".placeholder")) postsBox.replaceChildren();
    postsBox.prepend(card);

    form.reset();
    showMessage(
      "Публикация успешно создана. Заголовок: «" + created.title + "», ID: " + created.id + ".",
      "success"
    );
  } catch (error) {
    showMessage(describeError(error), "error");
  } finally {
    submitBtn.disabled = false; // можно повторить попытку
  }
}

form.addEventListener("submit", createPost);
titleInput.addEventListener("input", () => titleInput.classList.remove("invalid"));
bodyInput.addEventListener("input", () => bodyInput.classList.remove("invalid"));
