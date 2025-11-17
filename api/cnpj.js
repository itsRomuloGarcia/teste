const API_TOKEN = "6c62a7ba-5128-4f3c-864b-01876e7a1832-eda921d0-26e0-4d99-9668-f9cf1c4c8aaa";

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
      if (response.status === 429) {
        return res.status(429).json({
          error: true,
          message: "Limite de requisições excedido",
        });
      }
      return res.status(response.status).json({
        error: true,
        message: `Erro na API: ${response.status}`,
      });
    }

    const data = await response.json();

    // LOG COMPLETO DE TODOS OS DADOS
    console.log("=".repeat(80));
    console.log("📦 DADOS COMPLETOS DA RESPOSTA DA API CNPJa:");
    console.log("=".repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log("=".repeat(80));
    
    // Análise específica do campo registrations
    console.log("🔍 ANÁLISE DO CAMPO REGISTRATIONS:");
    console.log("📍 data.registrations:", data.registrations);
    console.log("📍 Tipo:", typeof data.registrations);
    console.log("📍 É array?", Array.isArray(data.registrations));
    console.log("📍 Quantidade de registros:", data.registrations?.length || 0);
    
    if (data.registrations && Array.isArray(data.registrations)) {
      console.log("📍 Conteúdo do array registrations:");
      data.registrations.forEach((reg, index) => {
        console.log(`  [${index}] number: ${reg.number}, state: ${reg.state}, type: ${reg.type?.text}`);
      });
    }
    
    // Buscar por outros campos possíveis de IE
    console.log("🔍 BUSCA POR OUTROS CAMPOS DE INSCRIÇÃO ESTADUAL:");
    console.log("📍 data.stateRegistration:", data.stateRegistration);
    console.log("📍 data.inscricaoEstadual:", data.inscricaoEstadual);
    console.log("📍 data.ie:", data.ie);
    
    // Listar todas as chaves do objeto data
    console.log("🔍 TODAS AS CHAVES DISPONÍVEIS:");
    console.log("📍 Object.keys(data):", Object.keys(data));

    return res.status(200).json({
      error: false,
      data: data,
    });
  } catch (error) {
    console.error("💥 Erro:", error);
    return res.status(500).json({
      error: true,
      message: "Erro interno do servidor",
    });
  }
}
