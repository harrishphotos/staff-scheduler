const base = "/api";

async function fetchList(path, renderFn) {
  const res = await fetch(`${base}/${path}`);
  const data = await res.json();
  renderFn(data);
}

async function postItem(path, item) {
  await fetch(`${base}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item)
  });
}

async function deleteItem(path, id) {
  await fetch(`${base}/${path}/${id}`, { method: "DELETE" });
}

function renderList(data, listId, deletePath, key = "id") {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  data.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.description || ""}`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = async () => {
      await deleteItem(deletePath, item[`${deletePath.slice(0, -1)}_id`]);
      init(); // reload all
    };
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// Forms

document.getElementById("service-form").onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("service-name").value;
  const description = document.getElementById("service-desc").value;
  await postItem("services", { name, description });
  init();
};

document.getElementById("category-form").onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("category-name").value;
  const description = document.getElementById("category-desc").value;
  await postItem("categories", { name, description });
  init();
};

document.getElementById("package-form").onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById("package-name").value;
  const description = document.getElementById("package-desc").value;
  const price = parseFloat(document.getElementById("package-price").value);
  await postItem("packages", { name, description, price });
  init();
};

// Init all

function init() {
  fetchList("services", data => renderList(data, "service-list", "services"));
  fetchList("categories", data => renderList(data, "category-list", "categories"));
  fetchList("packages", data => renderList(data, "package-list", "packages"));
}

init();
