const API_TOKEN =
  "6c62a7ba-5128-4f3c-864b-01876e7a1832-eda921d0-26e0-4d99-9668-f9cf1c4c8aaa";

// Função para mapear dados da API para estrutura esperada pelo frontend
function mapDataToFrontendStructure(apiData) {
  return {
    taxId: apiData.taxId,
    alias: apiData.alias,
    founded: apiData.founded,
    updated: apiData.updated,
    status: {
      text: apiData.status?.text || "Não informado",
    },
    statusDate: apiData.statusDate,
    head: apiData.head,

    // Dados da empresa
    company: {
      name: apiData.name,
      nature: apiData.nature,
      size: apiData.size,
      equity: apiData.equity,
      simples: apiData.simples,
      simei: apiData.simei,
      members:
        apiData.partners?.map((partner) => ({
          person: {
            name: partner.name,
            age: partner.age,
          },
          role: {
            text: partner.role,
          },
          since: partner.since,
        })) || [],
    },

    // Endereço
    address: {
      street: apiData.address?.street,
      number: apiData.address?.number,
      details: apiData.address?.details,
      district: apiData.address?.district,
      city: apiData.address?.city,
      state: apiData.address?.state,
      zip: apiData.address?.zip,
      country: apiData.address?.country,
      municipality: apiData.address?.municipality,
    },

    // Contatos
    phones: apiData.phones || [],
    emails: apiData.emails || [],

    // Atividades econômicas
    mainActivity: apiData.primaryActivity,
    sideActivities: apiData.secondaryActivities || [],

    // Inscrições estaduais - CORREÇÃO PRINCIPAL
    registrations: apiData.stateRegistration
      ? [
          {
            type: { id: 1, text: "Normal" },
            number: apiData.stateRegistration,
            state: apiData.address?.state,
            enabled: true,
            status: { text: "Ativa" },
          },
        ]
      : [],

    // SUFRAMA
    suframa: apiData.suframa || [],
  };
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Lidar com preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Verificar se é método GET
  if (req.method !== "GET") {
    return res.status(405).json({
      error: true,
      message: "Método não permitido",
    });
  }

  try {
    const { cnpj } = req.query;

    console.log("🔍 Consultando CNPJ:", cnpj);

    // Validar CNPJ
    if (!cnpj) {
      return res.status(400).json({
        error: true,
        message: "CNPJ não informado",
      });
    }

    const cnpjLimpo = cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      return res.status(400).json({
        error: true,
        message: "CNPJ deve conter 14 dígitos",
      });
    }

    // Fazer requisição para a API CNPJa
    const apiUrl = `https://open.cnpja.com/office/${cnpjLimpo}`;
    console.log("📡 Chamando API:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📊 Status da API:", response.status);

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          error: true,
          message: "Empresa não encontrada",
        });
      }
      if (response.status === 401) {
        return res.status(401).json({
          error: true,
          message: "Token de API inválido",
        });
      }

      const errorText = await response.text();
      return res.status(response.status).json({
        error: true,
        message: `Erro na API: ${response.status} - ${errorText}`,
      });
    }

    const apiData = await response.json();
    console.log("✅ Dados recebidos da API");

    // Mapear dados para estrutura esperada pelo frontend
    const mappedData = mapDataToFrontendStructure(apiData);

    return res.status(200).json({
      error: false,
      data: mappedData,
    });
  } catch (error) {
    console.error("💥 Erro:", error);
    return res.status(500).json({
      error: true,
      message: "Erro interno do servidor: " + error.message,
    });
  }
}
