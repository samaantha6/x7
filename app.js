const grid = document.getElementById("channelGrid");
const searchInput = document.getElementById("search");
const filterContainer = document.getElementById("categoryFilters");

let allChannels = [];
let currentFilter = "all";

fetch("canales.m3u")
  .then(res => res.text())
  .then(data => {
    allChannels = parseM3U(data);
    createFilterButtons();
    renderChannels(allChannels);
  });

function parseM3U(m3u) {
  const lines = m3u.split("\n");
  const channels = [];
  let tempMetadata = null;

  lines.forEach(line => {
    line = line.trim();

    if (line.startsWith("#EXTINF")) {
      const name = line.split(",")[1]?.trim() || "Sin nombre";
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);
      
      // Detectar calidad basándose en el nombre
      let quality = "";
      if (name.includes("1080p")) quality = "1080P";
      else if (name.includes("720p")) quality = "720P";

      tempMetadata = {
        name: name.replace(/\*\*|\*/g, "").replace(/1080p|720p/gi, "").trim(),
        logo: logoMatch ? logoMatch[1] : "",
        group: groupMatch ? groupMatch[1] : "OTROS",
        quality: quality
      };
    } 
    else if (line.includes("127.0.0.1:6878") || line.startsWith("acestream://")) {
      if (tempMetadata) {
        const id = line.includes("id=") ? line.split("id=")[1].split("&")[0] : line.replace("acestream://", "");
        tempMetadata.url = `acestream://${id}`;
        channels.push(tempMetadata);
        tempMetadata = null;
      }
    }
  });
  return channels;
}

function createFilterButtons() {
  const groups = ["all", ...new Set(allChannels.map(ch => ch.group))];
  filterContainer.innerHTML = "";
  
  groups.forEach(group => {
    const btn = document.createElement("button");
    btn.className = `filter-btn ${group === 'all' ? 'active' : ''}`;
    btn.textContent = group === 'all' ? "Todos" : group;
    btn.onclick = () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = group;
      filterAndRender();
    };
    filterContainer.appendChild(btn);
  });
}

function filterAndRender() {
  const searchText = searchInput.value.toLowerCase();
  
  const filtered = allChannels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchText) || ch.group.toLowerCase().includes(searchText);
    const matchesGroup = currentFilter === "all" || ch.group === currentFilter;
    return matchesSearch && matchesGroup;
  });
  
  renderChannels(filtered);
}

function renderChannels(channels) {
  grid.innerHTML = "";
  channels.forEach(ch => {
    const card = document.createElement("div");
    card.className = "channel-card";
    
    card.innerHTML = `
      <div class="img-container">
        ${ch.quality ? `<div class="badge">${ch.quality}</div>` : ''}
        <img src="${ch.logo}" onerror="this.src='https://placehold.co/200x120/111/444?text=TV'">
      </div>
      <div class="info">
        <span>${ch.group}</span>
        <h3>${ch.name}</h3>
      </div>
    `;

    card.onclick = () => window.location.href = ch.url;
    grid.appendChild(card);
  });
}

searchInput.addEventListener("input", filterAndRender);