import { MAPPING, LESSON_1 } from "./mapping.js";

const shiftKeyState = {
  isPressed: false,
};

const lessonLetterPointerState = {
  pointer: 0,
  incorrect: false,
};

const lessonContainer = document.getElementById("lesson-container");
const rows = LESSON_1.content;

for (let char of rows.split("_")) {
  const mappedChar = getMapping(char);
  console.log("Mapped Char:", mappedChar, "", char);
  if (mappedChar === undefined) {
    continue;
  }
  let spaceStyle = "";
  if (mappedChar === "Space") {
    spaceStyle = 'space-letter';
  }
  let singleElement = `<span class="letter ${spaceStyle}" >${mappedChar}</span>`;
  lessonContainer.innerHTML += singleElement;
}

document
  .getElementById("main-container")
  .addEventListener("keydown", (event) => {
    event.preventDefault();
    let currentCharacter =
      LESSON_1.content.split("_")[lessonLetterPointerState.pointer];
    console.log("Current Character:", currentCharacter);
    console.log("Event key:", event.key);

    updateShiftPressed(event.key === "Shift");

    const letterElements = document.getElementsByClassName("letter");
    if (lessonLetterPointerState.incorrect && event.key === currentCharacter) {
      lessonLetterPointerState.incorrect = false;
      lessonLetterPointerState.pointer += 1;
    } else if (
      !lessonLetterPointerState.incorrect &&
      event.key === currentCharacter
    ) {
      letterElements[lessonLetterPointerState.pointer].classList.add("correct");
      lessonLetterPointerState.pointer += 1;
      letterElements[lessonLetterPointerState.pointer].classList.remove("current");
    } else {
      lessonLetterPointerState.incorrect = true;
      letterElements[lessonLetterPointerState.pointer].classList.add(
        "in-correct"
      );
      letterElements[lessonLetterPointerState.pointer].classList.remove("current");
    }
    if (lessonLetterPointerState.pointer >= letterElements.length) {
      setTimeout(() => {
        lessonLetterPointerState.pointer = 0;
        Array.from(letterElements).forEach((el) =>
          el.classList.remove("correct", "in-correct","current")
        );
      }, 200);

      return;
    }
  });

document.getElementById("main-container").addEventListener("keyup", (event) => {
  if (event.key === "Shift") {
    updateShiftPressed(false);
  }
});

function updateShiftPressed(value) {
  shiftKeyState.isPressed = value;
}

function getMapping(key) {
  if (key.length !== 1) {
    return;
  }
  const mappedChar = MAPPING[key];
  if (mappedChar) {
    return mappedChar;
  }
  return "";
}

 export function toggleTheme() {
  const moonElement = document.getElementById("moon-icon");
  const sunElement = document.getElementById("sun-icon");

  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    moonElement.style.display = "block";
    sunElement.style.display = "none";
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    moonElement.style.display = "none";
    sunElement.style.display = "block";
    document.documentElement.setAttribute("data-theme", "dark");
  }
}
window.toggleTheme = toggleTheme;
