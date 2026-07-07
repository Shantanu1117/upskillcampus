
const heading = document.querySelector(".heading");

const head = heading.textContent;
heading.textContent = "";

let type = "";
let index = 0;

function typeffect() {
    if (index < head.length) {
        type = type + head[index];

        heading.textContent = type;

        index++;

        setTimeout(typeffect,100);
    }
}

typeffect();
