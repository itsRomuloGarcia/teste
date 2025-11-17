// Configurações
const API_BASE_URL = '/api/cnpj';

// Elementos DOM
const cnpjInput = document.getElementById('cnpjInput');
const searchBtn = document.getElementById('searchBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const partnersCard = document.getElementById('partnersCard');
const partnersList = document.getElementById('partnersList');

// Elementos para exibir os dados
const companyName = document.getElementById('companyName');
const tradeName = document.getElementById('tradeName');
const cnpj = document.getElementById('cnpj');
const status = document.getElementById('status');
const address = document.getElementById('address');
const cnae = document.getElementById('cnae');
const phones = document.getElementById('phones');
const email = document.getElementById('email');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    searchBtn.addEventListener('click', handleSearch);
    cnpjInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Permitir apenas números no input
    cnpjInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
    
    // Focar no input ao carregar a página
    cnpjInput.focus();
});

// Função para validar o CNPJ
function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    
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
    const cnpjValue = cnpjInput.value.replace(/\D/g, '');
    
    // Limpar mensagens de erro e resultados anteriores
    clearError();
    hideResult();
    
    // Validar CNPJ
    if (!cnpjValue) {
        showError('Por favor, digite um CNPJ');
        return;
    }
    
    if (cnpjValue.length !== 14) {
        showError('CNPJ deve conter 14 dígitos');
        return;
    }
    
    if (!validateCNPJ(cnpjValue)) {
        showError('CNPJ inválido');
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
        console.log('🔍 Fazendo requisição para:', `${API_BASE_URL}?cnpj=${cnpj}`);
        
        const response = await fetch(`${API_BASE_URL}?cnpj=${cnpj}`);
        
        console.log('📊 Status da resposta:', response.status);
        console.log('✅ Response OK:', response.ok);

        // Primeiro, ler a resposta como texto
        const responseText = await response.text();
        console.log('📄 Resposta (texto):', responseText.substring(0, 200));

        if (!response.ok) {
            // Se não é OK, tentar parsear como JSON para obter mensagem de erro
            let errorMessage = `Erro ${response.status}`;
            
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Se não é JSON, usar o texto direto
                if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
                    errorMessage = 'Servidor retornou página HTML inesperada';
                } else if (responseText.trim()) {
                    errorMessage = responseText;
                }
            }
            
            throw new Error(errorMessage);
        }

        // Se response.ok é true, tentar parsear como JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('❌ Erro ao parsear JSON:', e);
            throw new Error('Resposta da API inválida (não é JSON)');
        }
        
        if (result.error) {
            throw new Error(result.message);
        }
        
        console.log('✅ Dados recebidos com sucesso');
        displayData(result.data);
        
    } catch (error) {
        console.error('💥 Erro na consulta:', error);
        showError(`Erro: ${error.message}`);
    } finally {
        hideLoading();
        disableSearchButton(false);
    }
}

// Função para exibir os dados no HTML
function displayData(data) {
    // Verificar se os dados básicos existem
    if (!data || !data.taxId) {
        showError('Dados da empresa não encontrados ou inválidos');
        return;
    }
    
    console.log('📦 Estrutura completa dos dados:', data);
    
    // Dados básicos da empresa
    companyName.textContent = data.company?.name || 'Não informado';
    tradeName.textContent = data.alias || data.company?.name || 'Não informado';
    cnpj.textContent = formatCNPJString(data.taxId) || 'Não informado';
    
    // Situação cadastral com cor
    const statusText = data.status?.text || 'Não informado';
    status.textContent = statusText;
    status.className = 'value ' + (statusText.toLowerCase().includes('ativa') ? 'status-active' : '');
    
    // Endereço
    const addressParts = [
        data.address?.street,
        data.address?.number,
        data.address?.district,
        data.address?.city,
        data.address?.state
    ].filter(part => part).join(', ');
    
    const zipCode = data.address?.zip ? ` - CEP: ${formatCEP(data.address.zip)}` : '';
    address.textContent = addressParts + zipCode || 'Não informado';
    
    // CNAE Principal
    cnae.textContent = data.mainActivity?.text || 'Não informado';
    
    // Telefones
    const phoneNumbers = data.phones?.map(phone => {
        if (phone.area && phone.number) {
            return formatPhone(`${phone.area}${phone.number}`);
        }
        return phone.number;
    }).join(', ') || 'Não informado';
    phones.textContent = phoneNumbers;
    
    // E-mail
    const primaryEmail = data.emails?.find(email => email.ownership === 'CORPORATE') || data.emails?.[0];
    email.textContent = primaryEmail?.address || 'Não informado';
    
    // Sócios e Administradores
    displayPartners(data.company?.members);
    
    // Exibir resultados
    showResult();
}

// Função para exibir os sócios
function displayPartners(members) {
    partnersList.innerHTML = '';
    
    if (!members || members.length === 0) {
        partnersCard.classList.add('hidden');
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const sortedMembers = [...members].sort((a, b) => 
        new Date(b.since) - new Date(a.since)
    );
    
    sortedMembers.forEach(member => {
        const partnerItem = document.createElement('div');
        partnerItem.className = 'partner-item';
        
        const partnerName = document.createElement('div');
        partnerName.className = 'partner-name';
        partnerName.textContent = member.person?.name || 'Não informado';
        
        const partnerRole = document.createElement('div');
        partnerRole.className = 'partner-document';
        partnerRole.textContent = `Cargo: ${member.role?.text || 'Não informado'}`;
        
        const partnerSince = document.createElement('div');
        partnerSince.className = 'partner-qualification';
        partnerSince.textContent = `Desde: ${formatDate(member.since) || 'Não informado'}`;
        
        const partnerAge = document.createElement('div');
        partnerAge.className = 'partner-qualification';
        partnerAge.textContent = `Faixa Etária: ${member.person?.age || 'Não informada'}`;
        
        partnerItem.appendChild(partnerName);
        partnerItem.appendChild(partnerRole);
        partnerItem.appendChild(partnerSince);
        partnerItem.appendChild(partnerAge);
        
        partnersList.appendChild(partnerItem);
    });
    
    partnersCard.classList.remove('hidden');
}

// Função para formatar CNPJ como string
function formatCNPJString(cnpj) {
    if (!cnpj) return '';
    cnpj = cnpj.replace(/\D/g, '');
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// Função para formatar CEP
function formatCEP(cep) {
    if (!cep) return '';
    cep = cep.replace(/\D/g, '');
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Função para formatar telefone
function formatPhone(phone) {
    if (!phone) return '';
    phone = phone.replace(/\D/g, '');
    if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 8) {
        return phone.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    return phone;
}

// Função para formatar data
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return dateString;
    }
}

// Funções auxiliares para exibir/ocultar elementos
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showResult() {
    result.classList.remove('hidden');
}

function hideResult() {
    result.classList.add('hidden');
    partnersCard.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

function clearError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
}

function disableSearchButton(disabled) {
    searchBtn.disabled = disabled;
    const buttonText = searchBtn.querySelector('.button-text');
    const buttonLoading = searchBtn.querySelector('.button-loading');
    
    if (disabled) {
        buttonText.classList.add('hidden');
        buttonLoading.classList.remove('hidden');
    } else {
        buttonText.classList.remove('hidden');
        buttonLoading.classList.add('hidden');
    }
}
