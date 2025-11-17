// Configurações
const API_BASE_URL = "/api/cnpj";

// Elementos DOM
const cnpjInput = document.getElementById("cnpjInput");
const searchBtn = document.getElementById("searchBtn");
const errorMessage = document.getElementById("errorMessage");
const loading = document.getElementById("loading");
const result = document.getElementById("result");
const partnersCard = document.getElementById("partnersCard");
const partnersList = document.getElementById("partnersList");
const themeToggle = document.getElementById("themeToggle");
const completeData = document.getElementById("completeData");

// Elementos para exibir os dados principais
const companyName = document.getElementById("companyName");
const tradeName = document.getElementById("tradeName");
const cnpj = document.getElementById("cnpj");
const ie = document.getElementById("ie");
const status = document.getElementById("status");
const address = document.getElementById("address");
const cnae = document.getElementById("cnae");
const phones = document.getElementById("phones");
const email = document.getElementById("email");

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  searchBtn.addEventListener("click", handleSearch);
  cnpjInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });

  // Permitir apenas números no input
  cnpjInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });

  // Toggle de tema
  themeToggle.addEventListener("click", toggleTheme);

  // Tabs
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  // Focar no input ao carregar a página
  cnpjInput.focus();
  
  // Carregar tema salvo
  loadSavedTheme();
});

// Função para alternar entre tabs
function switchTab(tabName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

  document.querySelectorAll(".tab-pane").forEach((pane) => {
    pane.classList.remove("active");
  });
  document.getElementById(`tab-${tabName}`).classList.add("active");
}

// Função para alternar tema
function toggleTheme() {
  const body = document.body;
  const isDarkMode = body.classList.contains("dark-mode");

  if (isDarkMode) {
    body.classList.remove("dark-mode");
    themeToggle.querySelector(".theme-icon").textContent = "🌙";
  } else {
    body.classList.add("dark-mode");
    themeToggle.querySelector(".theme-icon").textContent = "☀️";
  }

  localStorage.setItem("theme", isDarkMode ? "light" : "dark");
}

// Função para validar o CNPJ
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) {
    return false;
  }

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) {
    return false;
  }

  return true;
}

// Função para lidar com a pesquisa
function handleSearch() {
  const cnpjValue = cnpjInput.value.replace(/\D/g, "");

  clearError();
  hideResult();

  if (!cnpjValue) {
    showError("Por favor, digite um CNPJ");
    return;
  }

  if (cnpjValue.length !== 14) {
    showError("CNPJ deve conter 14 dígitos");
    return;
  }

  if (!validateCNPJ(cnpjValue)) {
    showError("CNPJ inválido");
    return;
  }

  searchCNPJ(cnpjValue);
}

// Função para fazer a requisição à API
async function searchCNPJ(cnpj) {
  showLoading();
  disableSearchButton(true);

  try {
    console.log("🔍 Fazendo requisição para:", `${API_BASE_URL}?cnpj=${cnpj}`);

    const response = await fetch(`${API_BASE_URL}?cnpj=${cnpj}`);
    const responseText = await response.text();

    console.log("📊 Status da resposta:", response.status);

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        if (responseText.trim()) {
          errorMessage = responseText;
        }
      }
      throw new Error(errorMessage);
    }

    const result = JSON.parse(responseText);

    if (result.error) {
      throw new Error(result.message);
    }

    console.log("✅ Dados recebidos com sucesso");
    
    // DEBUG COMPLETO NO FRONTEND
    console.log("=".repeat(80));
    console.log("🖥️ DADOS RECEBIDOS NO FRONTEND:");
    console.log("=".repeat(80));
    console.log(JSON.stringify(result.data, null, 2));
    console.log("=".repeat(80));
    
    displayData(result.data);
  } catch (error) {
    console.error("💥 Erro na consulta:", error);
    showError(`Erro: ${error.message}`);
  } finally {
    hideLoading();
    disableSearchButton(false);
  }
}

// Função para exibir os dados no HTML
function displayData(data) {
  if (!data || !data.taxId) {
    showError("Dados da empresa não encontrados ou inválidos");
    return;
  }

  console.log("🔍 ANALISANDO DADOS PARA EXIBIÇÃO:");
  console.log("📍 Dados completos:", data);
  console.log("📍 Campo registrations:", data.registrations);
  console.log("📍 Tipo de registrations:", typeof data.registrations);
  console.log("📍 É array?", Array.isArray(data.registrations));

  // Dados básicos da empresa
  companyName.textContent = data.company?.name || "Não informado";
  tradeName.textContent = data.alias || data.company?.name || "Não informado";
  cnpj.textContent = formatCNPJString(data.taxId) || "Não informado";

  // BUSCA AVANÇADA POR INSCRIÇÃO ESTADUAL
  console.log("🔍 BUSCA AVANÇADA POR INSCRIÇÃO ESTADUAL:");
  let ieEncontrada = null;
  
  // Tentativa 1: Array registrations
  if (data.registrations && Array.isArray(data.registrations) && data.registrations.length > 0) {
    console.log("✅ Encontrado array registrations com", data.registrations.length, "itens");
    const primeiraIE = data.registrations[0];
    ieEncontrada = `${primeiraIE.number} (${primeiraIE.state})`;
    console.log("📍 IE encontrada em registrations:", ieEncontrada);
  }
  // Tentativa 2: Campo direto stateRegistration
  else if (data.stateRegistration) {
    console.log("✅ Encontrado stateRegistration:", data.stateRegistration);
    ieEncontrada = data.stateRegistration;
  }
  // Tentativa 3: Campo direto inscricaoEstadual
  else if (data.inscricaoEstadual) {
    console.log("✅ Encontrado inscricaoEstadual:", data.inscricaoEstadual);
    ieEncontrada = data.inscricaoEstadual;
  }
  // Tentativa 4: Campo direto ie
  else if (data.ie) {
    console.log("✅ Encontrado ie:", data.ie);
    ieEncontrada = data.ie;
  }
  // Tentativa 5: Buscar em qualquer campo que contenha "inscricao" ou "estadual"
  else {
    console.log("🔍 Buscando em todos os campos...");
    Object.keys(data).forEach(key => {
      if (key.toLowerCase().includes('inscricao') || key.toLowerCase().includes('estadual') || key.toLowerCase().includes('registration')) {
        console.log(`📍 Campo ${key}:`, data[key]);
        if (data[key] && !ieEncontrada) {
          ieEncontrada = data[key];
        }
      }
    });
  }

  console.log("🎯 IE FINAL:", ieEncontrada);
  ie.textContent = ieEncontrada || "Não informado";

  // Situação cadastral
  const statusText = data.status?.text || "Não informado";
  status.textContent = statusText;
  status.className = "value " + (statusText.toLowerCase().includes("ativa") ? "status-active" : "");

  // Endereço
  const addressParts = [
    data.address?.street,
    data.address?.number,
    data.address?.details,
    data.address?.district,
    data.address?.city,
    data.address?.state,
  ].filter((part) => part).join(", ");

  const zipCode = data.address?.zip ? ` - CEP: ${formatCEP(data.address.zip)}` : "";
  address.textContent = addressParts + zipCode || "Não informado";

  // CNAE Principal
  cnae.textContent = data.mainActivity?.text || "Não informado";

  // Telefones
  const phoneNumbers = data.phones?.map((phone) => {
    if (phone.area && phone.number) {
      return formatPhone(`${phone.area}${phone.number}`);
    }
    return phone.number;
  }).join(", ") || "Não informado";
  phones.textContent = phoneNumbers;

  // E-mail
  const primaryEmail = data.emails?.find((email) => email.ownership === "CORPORATE") || data.emails?.[0];
  email.textContent = primaryEmail?.address || "Não informado";

  // Sócios e Administradores
  displayPartners(data.company?.members);

  // Dados completos
  displayCompleteData(data);

  // Exibir resultados
  showResult();
}

// [Restante das funções permanecem iguais...]
// Função para exibir dados completos, displayPartners, formatações, etc.

function displayCompleteData(data) {
  completeData.innerHTML = "";
  if (!data) return;

  const createInfoItem = (label, value) => {
    if (value === undefined || value === null || value === "" || value === "Não informado") return null;

    const item = document.createElement("div");
    item.className = "info-item";

    const labelSpan = document.createElement("span");
    labelSpan.className = "label";
    labelSpan.textContent = label;

    const valueSpan = document.createElement("span");
    valueSpan.className = "value";

    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      valueSpan.innerHTML = value.map((item) => `• ${item}`).join("<br>");
    } else {
      valueSpan.textContent = String(value);
    }

    item.appendChild(labelSpan);
    item.appendChild(valueSpan);
    return item;
  };

  // [Restante da função displayCompleteData...]
}

function displayPartners(members) {
  partnersList.innerHTML = "";
  if (!members || members.length === 0) {
    partnersCard.classList.add("hidden");
    return;
  }

  const sortedMembers = [...members].sort((a, b) => new Date(b.since) - new Date(a.since));
  const displayedMembers = sortedMembers.slice(0, 6);

  displayedMembers.forEach((member) => {
    const partnerItem = document.createElement("div");
    partnerItem.className = "partner-item";

    const partnerName = document.createElement("div");
    partnerName.className = "partner-name";
    partnerName.textContent = member.person?.name || "Não informado";

    const partnerRole = document.createElement("div");
    partnerRole.className = "partner-document";
    partnerRole.textContent = `Cargo: ${member.role?.text || "Não informado"}`;

    const partnerSince = document.createElement("div");
    partnerSince.className = "partner-qualification";
    partnerSince.textContent = `Desde: ${formatDate(member.since) || "Não informado"}`;

    const partnerAge = document.createElement("div");
    partnerAge.className = "partner-qualification";
    partnerAge.textContent = `Faixa Etária: ${member.person?.age || "Não informada"}`;

    partnerItem.appendChild(partnerName);
    partnerItem.appendChild(partnerRole);
    partnerItem.appendChild(partnerSince);
    partnerItem.appendChild(partnerAge);

    partnersList.appendChild(partnerItem);
  });

  if (sortedMembers.length > 6) {
    const morePartners = document.createElement("div");
    morePartners.className = "partner-more";
    morePartners.textContent = `+ ${sortedMembers.length - 6} outros sócios...`;
    morePartners.style.textAlign = "center";
    morePartners.style.padding = "10px";
    morePartners.style.color = "var(--text-secondary)";
    morePartners.style.fontStyle = "italic";
    partnersList.appendChild(morePartners);
  }

  partnersCard.classList.remove("hidden");
}

// [Funções de formatação...]
function formatCNPJString(cnpj) {
  if (!cnpj) return "";
  cnpj = cnpj.replace(/\D/g, "");
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function formatCEP(cep) {
  if (!cep) return "";
  cep = cep.replace(/\D/g, "");
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

function formatPhone(phone) {
  if (!phone) return "";
  phone = phone.replace(/\D/g, "");
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  } catch (e) {
    return dateString;
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "";
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString("pt-BR");
  } catch (e) {
    return dateTimeString;
  }
}

function formatCurrency(value) {
  if (!value) return "0,00";
  return parseFloat(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function showLoading() {
  loading.classList.remove("hidden");
}

function hideLoading() {
  loading.classList.add("hidden");
}

function showResult() {
  result.classList.remove("hidden");
}

function hideResult() {
  result.classList.add("hidden");
  partnersCard.classList.add("hidden");
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

function disableSearchButton(disabled) {
  searchBtn.disabled = disabled;
  const buttonText = searchBtn.querySelector(".button-text");
  const buttonLoading = searchBtn.querySelector(".button-loading");

  if (disabled) {
    buttonText.classList.add("hidden");
    buttonLoading.classList.remove("hidden");
  } else {
    buttonText.classList.remove("hidden");
    buttonLoading.classList.add("hidden");
  }
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.remove("dark-mode");
    themeToggle.querySelector(".theme-icon").textContent = "☀️";
  } else {
    document.body.classList.add("dark-mode");
    themeToggle.querySelector(".theme-icon").textContent = "🌙";
  }
}
