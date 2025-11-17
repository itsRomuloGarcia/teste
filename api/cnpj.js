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

    // Fazer requisição para a API CNPJa com parâmetros para dados completos
    // Vamos tentar diferentes endpoints e parâmetros
    const apiUrls = [
      `https://open.cnpja.com/office/${cnpjLimpo}?registration=true`,
      `https://open.cnpja.com/office/${cnpjLimpo}?fields=registrations`,
      `https://open.cnpja.com/office/${cnpjLimpo}`
    ];

    let data;
    let lastError;

    for (const apiUrl of apiUrls) {
      try {
        console.log("📡 Tentando API URL:", apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📊 Status da API:", response.status);

        if (response.ok) {
          data = await response.json();
          console.log("✅ Sucesso com URL:", apiUrl);
          console.log("📍 Possui registrations?", !!data.registrations);
          break;
        } else {
          lastError = `Status ${response.status}`;
          console.log("❌ Falha com URL:", apiUrl, "-", response.status);
        }
      } catch (error) {
        lastError = error.message;
        console.log("❌ Erro com URL:", apiUrl, "-", error.message);
      }
    }

    if (!data) {
      throw new Error(lastError || "Não foi possível obter dados da API");
    }

    // LOG COMPLETO
    console.log("=".repeat(80));
    console.log("📦 DADOS RECEBIDOS DA API:");
    console.log("=".repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log("=".repeat(80));
    
    // Se ainda não tiver registrations, vamos tentar uma abordagem alternativa
    if (!data.registrations || !Array.isArray(data.registrations)) {
      console.log("⚠️ Registrations não encontrado, tentando buscar inscrição estadual alternativa...");
      
      // Tentar buscar a inscrição estadual de outras fontes
      const alternativeData = await tryAlternativeIESearch(cnpjLimpo);
      if (alternativeData) {
        data = { ...data, ...alternativeData };
      }
    }

    return res.status(200).json({
      error: false,
      data: data,
    });
  } catch (error) {
    console.error("💥 Erro:", error);
    return res.status(500).json({
      error: true,
      message: "Erro interno do servidor: " + error.message,
    });
  }
}

// Função alternativa para buscar inscrição estadual
async function tryAlternativeIESearch(cnpj) {
  try {
    console.log("🔍 Buscando IE alternativa para:", cnpj);
    
    // Tentar buscar dados adicionais que possam conter a IE
    const additionalUrls = [
      `https://open.cnpja.com/office/${cnpj}/registration`,
      `https://open.cnpja.com/office/${cnpj}/taxes`
    ];
    
    for (const url of additionalUrls) {
      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const additionalData = await response.json();
          console.log("✅ Dados adicionais de:", url);
          console.log("📍 Conteúdo:", additionalData);
          
          // Verificar se encontramos dados de inscrição estadual
          if (additionalData.registrations || additionalData.stateRegistration) {
            return additionalData;
          }
        }
      } catch (error) {
        console.log("❌ Erro em URL alternativa:", url, error.message);
      }
    }
    
    return null;
  } catch (error) {
    console.log("❌ Erro na busca alternativa:", error.message);
    return null;
  }
}
