const token = localStorage.getItem("token");
let currentLines = [];
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
}
const userPayload = parseJwt(token);
const currentUser = userPayload?.username;
if (!token) window.location.href = "/";

function showTab(tabId) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");

  if (tabId === "aboutTab") loadAboutContent();
  if (tabId === "fundingTab") loadFundingContent();
  if (tabId === "searchTab") {
    loadIntroMarkdown();
    loadDisclaimerMarkdown();
  }

  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth < 768) {
    sidebar.classList.add("hidden");
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("-translate-x-full");
}


function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

function openModal(content) {
  console.log(content);
  let parsed;
  try {
    parsed = typeof content === 'string' ? JSON.parse(content) : content;
    
  } catch (e) {
    console.error("JSON parse error in openModal:", e, content);
    alert("Error: Invalid content in modal.");
    return;
  }

  const modal = document.getElementById("modalContent");


async function loadRatios() {
  const res = await fetch("/api/ratios", {
    headers: { "Authorization": "Bearer " + token }
  });

  const data = await res.json();
  const tbody = document.querySelector("#ratiosTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td contenteditable="true" class="px-4 py-2 border">${row.Category || ""}</td>
      <td contenteditable="true" class="px-4 py-2 border">${row.Ratio || ""}</td>
      <td contenteditable="true" class="px-4 py-2 border">${row.Formula || ""}</td>
    `;
    tbody.appendChild(tr);
  });
}


document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('token')) {
    loadConfig();
  }
});


  // <h3 class="text-lg font-bold mb-2">Company Summary</h3>
  //   <p class="mb-4">${parsed.summary || "No summary provided."}</p>
  modal.innerHTML = `
    <div>
      <h4 class="font-semibold">Ratios</h4>
      <ul class="ml-4 list-disc">
        ${(parsed.ratios || []).map(r => `
          <li>
            <strong>${r.ratio}</strong>: ${r.value || 'N/A'}
            <div class="text-sm text-gray-600 ml-2">Formula: ${r.formula || ''}</div>
          </li>
        `).join('')}
      </ul>
    </div>

    <div class="mt-4">
      <h4 class="font-semibold">Raw Data</h4>
      <ul class="ml-4 list-disc">
        ${Object.entries(parsed.raw_data || {}).map(([key, val]) => `
          <li><strong>${key}</strong>: ${val}</li>
        `).join('')}
      </ul>
    </div>
  `;

  document.getElementById("resultModal").classList.remove("hidden");
}

function loadRatios() {
  fetch("/api/ratios", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
  .then(res => res.json())
  .then(data => {
    const tbody = document.querySelector("#ratiosTable tbody");
    tbody.innerHTML = "";
    data.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td contenteditable="true">${row.Category}</td>
        <td contenteditable="true">${row.Ratio}</td>
        <td contenteditable="true">${row.Formula}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

async function loadIntroMarkdown() {
  const res = await fetch("/api/intro", {
    headers: { "Authorization": "Bearer " + token }
  });

  const data = await res.json();
  const target = document.getElementById("introMarkdown");

  if (res.ok) {
    const converter = new showdown.Converter();
    target.innerHTML = converter.makeHtml(data.content);
  } else {
    target.textContent = "Failed to load intro content.";
  }
}

async function loadDisclaimerMarkdown() {
  const res = await fetch("/api/disclaimer", {
    headers: { "Authorization": "Bearer " + token }
  });

  const target = document.getElementById("disclaimerContent");
  if (res.ok) {
    const data = await res.json();
    const converter = new showdown.Converter();
    target.innerHTML = converter.makeHtml(data.content);
  } else {
    target.textContent = "Failed to load disclaimer.";
  }
}


function saveRatios() {
  const token = localStorage.getItem("token");
  const table = document.getElementById("ratiosTable");
  const rows = table.getElementsByTagName("tbody")[0].rows;

  const data = [];
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells;
    const category = cells[0].innerText.trim();
    const ratio = cells[1].innerText.trim();
    const formula = cells[2].innerText.trim();

    if (category || ratio || formula) { // skip completely empty rows
      data.push({ Category: category, Ratio: ratio, Formula: formula });
    }
  }

  fetch("/api/ratios", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }).then(res => {
    if (res.ok) {
      alert("Ratios saved successfully!");
    } else {
      alert("Failed to save ratios.");
    }
  });
}

async function loadAboutContent() {
  const res = await fetch("/api/about", {
    headers: { "Authorization": "Bearer " + token }
  });

  const data = await res.json();
  const target = document.getElementById("aboutContent");

  if (res.ok) {
    const converter = new showdown.Converter();
    target.innerHTML = converter.makeHtml(data.content);
  } else {
    target.textContent = "Failed to load about content.";
  }
}

async function loadFundingContent() {
  const res = await fetch("/api/funding", {
    headers: { "Authorization": "Bearer " + token }
  });

  const data = await res.json();
  const target = document.getElementById("fundingContent");

  if (res.ok) {
    const converter = new showdown.Converter();
    target.innerHTML = converter.makeHtml(data.content);
  } else {
    target.textContent = "Failed to load funding content.";
  }
}


function renderPromptEditor(prompts) {
  const list = document.getElementById("promptEditorList");
  list.innerHTML = "";

  Object.entries(prompts).forEach(([category, prompt], index) => {
    const container = document.createElement("div");
    container.className = "flex gap-2 items-start";

    container.innerHTML = `
      <input type="text" class="flex-1 px-2 py-1 border rounded" value="${category}" disabled />
      <textarea class="flex-1 px-2 py-1 border rounded">${prompt}</textarea>
      <button onclick="this.closest('div').remove()" class="text-red-600 text-sm">Delete</button>
    `;

    list.appendChild(container);
  });
}

function addNewPrompt() {
  const name = document.getElementById("newCategoryName").value.trim();
  const prompt = document.getElementById("newCategoryPrompt").value.trim();

  if (!name || !prompt) {
    alert("Both fields are required.");
    return;
  }

  const container = document.createElement("div");
  container.className = "flex gap-2 items-start";
  container.innerHTML = `
    <input type="text" class="flex-1 px-2 py-1 border rounded" value="${name}" disabled />
    <textarea class="flex-1 px-2 py-1 border rounded">${prompt}</textarea>
    <button onclick="this.closest('div').remove()" class="text-red-600 text-sm">Delete</button>
  `;

  document.getElementById("promptEditorList").appendChild(container);
  document.getElementById("newCategoryName").value = "";
  document.getElementById("newCategoryPrompt").value = "";
}

async function saveConfig() {
  const key = document.getElementById("openai_key").value.trim();
  const prompt = document.getElementById("default_prompt").value.trim();

  const res = await fetch("/api/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({
      openai_api_key: key,
      default_prompt: prompt
    })
  });

  if (res.ok) {
    alert("AI Settings saved successfully.");
  } else {
    alert("Failed to save AI settings.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const configForm = document.getElementById("configForm");
  if (configForm) {
    configForm.addEventListener("submit", function (e) {
      e.preventDefault();
      saveConfig();
      
    });
  }

  if (localStorage.getItem("token")) {
    loadConfig();
    loadIntroMarkdown();
    loadDisclaimerMarkdown();
  }
});

async function deleteArchive(company, year) {
  if (!confirm(`Are you sure you want to delete the archive for ${company} - ${year}?`)) return;

  const res = await fetch("/api/archive/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ company_name: company, fiscal_year: year })
  });

  if (res.ok) {
    alert("Archive deleted.");
    loadArchive();
  } else {
    alert("Failed to delete archive.");
  }
}



async function savePromptChanges() {
  const promptData = {};
  document.querySelectorAll("#promptEditorList > div").forEach(div => {
    const key = div.querySelector("input").value.trim();
    const val = div.querySelector("textarea").value.trim();
    if (key && val) promptData[key] = val;
  });

  const res = await fetch("/api/config/prompts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ prompts: promptData })
  });

  if (res.ok) {
    alert("Prompts updated successfully.");
    loadConfig();  // Reload config to reflect changes
  } else {
    alert("Failed to save prompts.");
  }
}

function closeModal() {
  document.getElementById("resultModal").classList.add("hidden");
}

document.addEventListener("click", function (e) {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.querySelector("button[onclick='toggleSidebar()']");
  if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
    sidebar.classList.add("-translate-x-full");
  }
});

window.addEventListener("resize", () => {
  const sidebar = document.getElementById("sidebar");
  if (window.innerWidth >= 768) sidebar.classList.remove("hidden");
});

const searchForm = document.getElementById("searchForm");
searchForm?.addEventListener("submit", async function (e) {

  // Hide other tabs to make sure only search result is visible
document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
document.getElementById("searchTab").classList.remove("hidden");

// Clear any previously loaded content
document.getElementById("aboutContent").innerHTML = "";

  e.preventDefault();
  const btn = this.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Loading...";

  const company = document.getElementById("company_select").value;
  const year = document.getElementById("fiscal_year").value;

  const res = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ company_name: company, fiscal_year: year })
  });

  const data = await res.json();
  const resultDiv = document.getElementById("searchResult");
  const resultJson = document.getElementById("resultJson");

  if (res.ok) {
    const converter = new showdown.Converter();
    const summaryHtml = converter.makeHtml(data.result.summary || "");
const fullName = document.querySelector(`#company_select option[value="${company}"]`)?.textContent || company;

resultJson.innerHTML = ""; // clear any previous result content
resultJson.innerHTML += `
  <div class="text-center mb-3">
    <div class="text-xl font-bold text-blue-800">${fullName} <span class="text-sm text-gray-600">(${company.toUpperCase()})</span></div>
    <div class="text-md text-gray-700">${year}</div>
  </div>
  <div class="mb-4 !bg-white !text-black">
    ${summaryHtml}
  </div>
`;


    if (data.result.category_summaries) {
      

        const preferredOrder = ["summary", "Detailed Analysis of ROE", "Detailed Analysis of ROE Drivers", "Detailed Analysis of Risk"];
        const summaries = data.result.category_summaries;
        // Sort the categories based on preferredOrder
        const sortedCategories = Object.keys(summaries).sort((a, b) => {
          const indexA = preferredOrder.indexOf(a);
          const indexB = preferredOrder.indexOf(b);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
          });
          sortedCategories.forEach(cat => {
            const text = summaries[cat];
            const verdict = typeof data.result.verdicts?.[cat] === "number" ? data.result.verdicts[cat] : null;

let badgeColor = "bg-gray-300"; // default for no score

if (typeof verdict === "number") {
  if (verdict <= 50) badgeColor = "bg-red-500";
  else if (verdict <= 80) badgeColor = "bg-yellow-400";
  else badgeColor = "bg-green-500";
}

        const section = document.createElement("details");
        if (cat.toLowerCase() === "summary") {
          section.setAttribute("open", "");
        }
section.className = "group border border-gray-200 rounded-lg mb-4 bg-white transition-shadow duration-300 shadow-sm";

const summary = document.createElement("summary");
summary.className = `
  cursor-pointer select-none px-4 py-3 text-lg font-semibold text-blue-700 
  bg-gray-100 rounded-t-lg hover:bg-gray-200 
  transition-colors duration-200 flex items-center justify-between
`;

summary.innerHTML = `
  <div class="flex justify-between items-center w-full">
    <div class="flex items-center gap-2">
      <span>📊 ${cat}</span>
      <div class="flex gap-1 items-center" title="Score: ${verdict}">
        <div class="w-3 h-3 rounded-full ${verdict <= 50 ? 'bg-red-500 ring-1 ring-gray-600' : 'bg-red-200'}"></div>
        <div class="w-3 h-3 rounded-full ${verdict > 50 && verdict <= 80 ? 'bg-yellow-400 ring-1 ring-gray-600' : 'bg-yellow-200'}"></div>
        <div class="w-3 h-3 rounded-full ${verdict > 80 ? 'bg-green-500 ring-1 ring-gray-600' : 'bg-green-200'}"></div>
      </div>
    </div>
    <svg class="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
`;
        section.appendChild(summary);

        const ratiosInCategory = (cat.toLowerCase() === "summary")
  ? (data.result.ratios || []).filter(r => r.ratio !== "summary" && r.value !== undefined)
  : (data.result.ratios || []).filter(r => r.category === cat && r.value !== undefined);

        const currentYear = document.getElementById("fiscal_year").value;
        const previousYear = parseInt(currentYear) - 1;

        // Create a table element

        let tableHtml = "";
        if (ratiosInCategory.length > 0) {
        tableHtml += `
        <div class="overflow-x-auto mb-4">
         <table class="min-w-full table-auto text-sm border border-gray-300 bg-white">
          <thead class="bg-gray-100">
           <tr>
             <th class="px-3 py-2 text-left border bg-gray-50 text-gray-800 text-left">Ratio</th>
             <th class="px-3 py-2 text-left border bg-gray-50 text-gray-800 text-center">${currentYear}</th>
             <th class="px-3 py-2 text-left border bg-gray-50 text-gray-800 text-center">${previousYear}</th>
           </tr>
         </thead>
         <tbody>
       `; 
       ratiosInCategory.forEach(r => {
        tableHtml += `
            <tr>
             <td class="px-3 py-1 border bg-white text-gray-800">${r.ratio}</td>
             <td class="px-3 py-1 border bg-white text-gray-800 text-center">
  ${(() => {
    const value = r.value;
    const before = r.value_before_year;

    if (typeof value === 'number') {
      const formatted = r.ratio.toLowerCase().includes("roe") ? (value * 100).toFixed(2) + '%' : value.toFixed(4);
      if (typeof before === 'number') {
        const isUp = value > before;
        const isDown = value < before;
        const arrow = isUp ? '▲' : isDown ? '▼' : '';
        const color = isUp ? 'text-green-600' : isDown ? 'text-red-500' : '';
        return `<span>${formatted}</span> <span class="${color}">${arrow}</span>`;
      } else {
        return formatted;
      }
    } else {
      return value ?? '-';
    }
  })()}
</td>

<td class="px-3 py-1 border bg-white text-gray-800 text-center">
  ${typeof r.value_before_year === 'number' ? 
    (r.ratio.toLowerCase().includes("roe") ? (r.value_before_year * 100).toFixed(2) + '%' : r.value_before_year.toFixed(4)) 
    : (r.value_before_year ?? '-')}
</td>
           </tr>
        `;
      });

      tableHtml += `
            </tbody>
          </table>
        </div>
    `;
        }

const body = document.createElement("div");
body.className = "p-3 text-sm";

// 🟦 Extract values for Dupont components from summary
const dupontRatios = {};
["assets turnover", "profit margin", "gearing", "roe"].forEach(key => {
  const match = (data.result.ratios || []).find(r => r.ratio.toLowerCase().includes(key));
  if (match && typeof match.value === "number") {
    dupontRatios[key] = match.value.toFixed(4);
  } else {
    dupontRatios[key] = "-";
  }
});

// 🖼️ HTML Flowchart (DuPont-style)
const flowChartHtml = `
<div id="flowContainer" class="my-6 flex justify-center relative">
  <div class="flex flex-col space-y-2 text-sm font-medium text-gray-700 items-start relative">
    <div id="assetBox" class="border p-2 rounded bg-white shadow text-left w-48">
      <strong>Assets turnover:</strong><br>
      YEAR ${year}<br>
      Value: ${dupontRatios["assets turnover"]}
    </div>
    <div class="ml-20">x</div>
    <div id="profitBox" class="border p-2 rounded bg-white shadow text-left w-48">
      <strong>Profit margin:</strong><br>
      YEAR ${year}<br>
      Value: ${dupontRatios["profit margin"]}
    </div>
    <div class="ml-20"></div>
    <div id="gearingBox" class="border p-2 rounded bg-white shadow text-left w-48">
      <strong>Gearing:</strong><br>
      YEAR ${year}<br>
      Value: ${dupontRatios["gearing"]}
    </div>
  </div>

  <div id="roeBox" class="ml-24 self-center border p-2 rounded bg-white shadow text-left w-48">
    <strong>ROE:</strong><br>
    YEAR ${year}<br>
    Value: ${dupontRatios["roe"] !== "-" ? (parseFloat(dupontRatios["roe"]) * 100).toFixed(2) + '%' : '-'}
  </div>
</div>
`;


// Final content
let contentHtml = tableHtml;

if (cat.toLowerCase() === "summary") {
  contentHtml += flowChartHtml;
}

const converter = new showdown.Converter({ tables: true });
const formatted = converter.makeHtml(text);
contentHtml += `<div class="prose prose-sm max-w-none">${formatted}</div>`;




body.innerHTML = contentHtml;


requestAnimationFrame(() => {
  if (window.LeaderLine) {
    // Clear previous arrows
    currentLines.forEach(line => line.remove());
    currentLines = [];

    // Draw and store new arrows
    currentLines.push(
      new LeaderLine(document.getElementById("assetBox"), document.getElementById("roeBox"), {
        color: "#1e3a8a",
        path: "straight",
        startPlug: "behind",
        endPlug: "arrow",
        size: 0.3
      })
    );
    currentLines.push(
      new LeaderLine(document.getElementById("profitBox"), document.getElementById("roeBox"), {
        color: "#1e3a8a",
        path: "straight",
        startPlug: "behind",
        endPlug: "arrow",
        size: 0.3
      })
    );
    currentLines.push(
      new LeaderLine(document.getElementById("gearingBox"), document.getElementById("roeBox"), {
        color: "#1e3a8a",
        path: "straight",
        startPlug: "behind",
        endPlug: "arrow",
        size: 0.3
      })
    );
  }
});





    section.appendChild(body);
    resultJson.appendChild(section);
    });
    
    

      
    }

    const CatagorieData = {};
    if (Array.isArray(data.result.ratios)) {
      data.result.ratios.forEach(r => {
        if (!CatagorieData[r.category]) CatagorieData[r.category] = [];
        CatagorieData[r.category].push(r);
      });

    }

    resultDiv.classList.remove("hidden");
    loadArchive();
  } else {
    resultJson.textContent = "Error: " + data.error;
    resultDiv.classList.remove("hidden");
  }

  btn.disabled = false;
  btn.textContent = "Search";
});


var AllData = {}

async function loadArchive() {
  const res = await fetch("/api/archive", {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await res.json();
  const tbody = document.getElementById("archiveTable");
  tbody.innerHTML = "";

  data.archive.forEach((entry, index) => {
    const tr = document.createElement("tr");
    const summary = entry.result.summary;
    console.log(entry.result);
    
    const fullContent = {
      summary: entry.result.summary,
      ratios: entry.result.ratios,
      raw_data: entry.result.raw_data
    };
    var key = entry.company_name+entry.fiscal_year
    AllData[key] = JSON.stringify(fullContent);
    console.log(key,AllData[key]);
    var shortsumm = summary.substring(0, 50) + " ..." ;
    tr.innerHTML = `
      <td class="p-3">${entry.company_name}</td>
      <td class="p-3">${entry.fiscal_year}</td>
      <td class="p-3 flex items-center justify-between">
        ${shortsumm}
        <button class="ml-2 text-red-600 underline text-sm" onclick="deleteArchive('${entry.company_name}', '${entry.fiscal_year}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleShowResult(btn) {
  try {
    const decoded = AllData[btn.dataset.result];
    openModal(decoded);
  } catch (e) {
    console.error("Error decoding result dataset:", e);
    alert("Invalid result format.");
  }
}

async function loadCompanyDropdown() {
  const res = await fetch("/static/data/Name_Symbol.csv");
  const text = await res.text();
  const lines = text.trim().split("\n").slice(1); // skip header
  const select = document.getElementById("company_select");

  lines.forEach(line => {
    const [name, symbol] = line.split(",");
    const option = document.createElement("option");
    option.value = symbol.trim();      // this will be used to fetch years
    option.textContent = name.trim();  // shows full name to user
    select.appendChild(option);
  });

  // ADD: trigger loadYears on change
  select.addEventListener("change", async function () {
    const symbol = this.value;
    await loadFiscalYears(symbol);
  });
}

async function loadFiscalYears(symbol) {
  const yearSelect = document.getElementById("fiscal_year");
  yearSelect.innerHTML = '<option value="">Select Fiscal Year</option>';

  if (!symbol) return;

  const res = await fetch(`/api/years/${symbol}`, {
    headers: { "Authorization": "Bearer " + token }
  });

  const data = await res.json();
  if (res.ok && Array.isArray(data.years)) {
    data.years.forEach(year => {
      const opt = document.createElement("option");
      opt.value = year;
      opt.textContent = year;
      yearSelect.appendChild(opt);
    });
  }
}


window.addEventListener("load", () => {
  loadArchive();
  loadConfig();
  loadCompanyDropdown();
});

function addNewRatioRow() {
  const table = document.getElementById("ratiosTable").getElementsByTagName("tbody")[0];
  const row = table.insertRow();

  const categoryCell = row.insertCell(0);
  const ratioCell = row.insertCell(1);
  const formulaCell = row.insertCell(2);

  categoryCell.contentEditable = true;
  ratioCell.contentEditable = true;
  formulaCell.contentEditable = true;

  categoryCell.innerText = "";
  ratioCell.innerText = "";
  formulaCell.innerText = "";
}


async function loadConfig() {
  const res = await fetch("/api/config", {
    headers: { "Authorization": "Bearer " + token }
  });
  const data = await res.json();

  if (data.openai_api_key !== undefined) {
    document.getElementById("openai_key").value = data.openai_api_key || "";
    document.getElementById("default_prompt").value = data.default_prompt || "";

    if (currentUser === "admin") {
      document.getElementById("settingsTabBtn").classList.remove("hidden");
      document.getElementById("archiveTabBtn").classList.remove("hidden");
      loadRatios();
    }

    const userList = document.getElementById("userList");
    userList.innerHTML = "";
    data.users.forEach(user => {
      const li = document.createElement("li");
      li.className = "flex justify-between items-center";
      li.innerHTML = `
        <span>${user.username}</span>
        ${user.username !== "admin" ? `<button onclick="deleteUser('${user.username}')" class="text-red-500 text-sm">Delete</button>` : ""}
      `;
      userList.appendChild(li);
    });
    if (data.ratio_prompt !== undefined){
      renderPromptEditor(data.ratio_prompt || {});

    }

  }
}
