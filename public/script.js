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

// Elementos para exibir os dados
const companyName = document.getElementById("companyName");
const tradeName = document.getElementById("tradeName");
const cnpj = document.getElementById("cnpj");
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

  // Focar no input ao carregar a página
  cnpjInput.focus();
});

// Função para validar o CNPJ
function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) {
    return false;
  }

  // Elimina CNPJs com valores inválidos conhecidos
  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  // Validação dos dígitos verificadores
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

  // Limpar mensagens de erro e resultados anteriores
  clearError();
  hideResult();

  // Validar CNPJ
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

  // Fazer a consulta
  searchCNPJ(cnpjValue);
}

// Função para fazer a requisição à API
async function searchCNPJ(cnpj) {
  showLoading();
  disableSearchButton(true);

  try {
    const response = await fetch(`${API_BASE_URL}?cnpj=${cnpj}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.message || `Erro ${response.status} na consulta`);
    }

    console.log("Dados recebidos:", result.data);
    displayData(result.data);
  } catch (error) {
    console.error("Erro na consulta:", error);
    showError(error.message);
  } finally {
    hideLoading();
    disableSearchButton(false);
  }
}

// Função para exibir os dados no HTML
function displayData(data) {
  // Verificar se os dados básicos existem
  if (!data || !data.taxId) {
    showError("Dados da empresa não encontrados ou inválidos");
    return;
  }

  // Dados básicos da empresa
  companyName.textContent = data.name || "Não informado";
  tradeName.textContent = data.tradeName || "Não informado";
  cnpj.textContent = formatCNPJString(data.taxId) || "Não informado";

  // Situação cadastral com cor
  const statusText = data.status?.text || "Não informado";
  status.textContent = statusText;
  status.className =
    "value " +
    (statusText.toLowerCase().includes("ativa") ? "status-active" : "");

  // Endereço
  const addressParts = [
    data.address?.street,
    data.address?.number,
    data.address?.complement,
    data.address?.district,
    data.address?.city?.name,
    data.address?.state?.code,
  ]
    .filter((part) => part)
    .join(", ");

  const zipCode = data.address?.zip
    ? ` - CEP: ${formatCEP(data.address.zip)}`
    : "";
  address.textContent = addressParts + zipCode || "Não informado";

  // CNAE
  cnae.textContent = data.mainActivity?.text || "Não informado";

  // Telefones
  const phoneNumbers =
    data.phones?.map((phone) => formatPhone(phone.number)).join(", ") ||
    "Não informado";
  phones.textContent = phoneNumbers;

  // E-mail
  email.textContent = data.emails?.[0]?.address || "Não informado";

  // Sócios
  displayPartners(data.partners);

  // Exibir resultados
  showResult();
}

// Função para exibir os sócios
function displayPartners(partners) {
  partnersList.innerHTML = "";

  if (!partners || partners.length === 0) {
    partnersCard.classList.add("hidden");
    return;
  }

  partners.forEach((partner) => {
    const partnerItem = document.createElement("div");
    partnerItem.className = "partner-item";

    const partnerName = document.createElement("div");
    partnerName.className = "partner-name";
    partnerName.textContent = partner.name || "Não informado";

    const partnerDocument = document.createElement("div");
    partnerDocument.className = "partner-document";
    const documentType = partner.taxId?.length === 11 ? "CPF" : "CNPJ";
    partnerDocument.textContent = `${documentType}: ${
      formatDocument(partner.taxId) || "Não informado"
    }`;

    const partnerQualification = document.createElement("div");
    partnerQualification.className = "partner-qualification";
    partnerQualification.textContent = `Qualificação: ${
      partner.qualification?.text || "Não informada"
    }`;

    partnerItem.appendChild(partnerName);
    partnerItem.appendChild(partnerDocument);
    partnerItem.appendChild(partnerQualification);

    partnersList.appendChild(partnerItem);
  });

  partnersCard.classList.remove("hidden");
}

// Função para formatar CNPJ como string
function formatCNPJString(cnpj) {
  if (!cnpj) return "";
  cnpj = cnpj.replace(/\D/g, "");
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

// Função para formatar CEP
function formatCEP(cep) {
  if (!cep) return "";
  cep = cep.replace(/\D/g, "");
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// Função para formatar CPF/CNPJ de sócios
function formatDocument(doc) {
  if (!doc) return "";
  doc = doc.replace(/\D/g, "");
  if (doc.length === 11) {
    return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else if (doc.length === 14) {
    return formatCNPJString(doc);
  }
  return doc;
}

// Função para formatar telefone
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

// Funções auxiliares para exibir/ocultar elementos
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
